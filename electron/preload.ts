import { contextBridge, ipcRenderer } from 'electron'

const electronAPI = {
  // 项目管理
  listProjects: () => ipcRenderer.invoke('project:list'),
  createProject: (data: any) => ipcRenderer.invoke('project:create', data),
  readProject: (id: string) => ipcRenderer.invoke('project:read', id),
  updateProject: (id: string, data: any) => ipcRenderer.invoke('project:update', id, data),
  deleteProject: (id: string) => ipcRenderer.invoke('project:delete', id),
  exportProject: (id: string) => ipcRenderer.invoke('project:export', id),
  importProject: () => ipcRenderer.invoke('project:import'),

  // 设置
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (data: any) => ipcRenderer.invoke('settings:save', data),

  // LLM 模拟
  runSimulation: (concepts: any[], relationships: any[], newConcept: any, settings: any) =>
    ipcRenderer.invoke('llm:simulate', concepts, relationships, newConcept, settings),
  generateConceptSkeleton: (domain: string, topic: string, settings: any) =>
    ipcRenderer.invoke('llm:generateSkeleton', domain, topic, settings),

  // 对话智能体（流式）
  chatWithAgentStream: (messages: any[], projectContext: any, settings: any, callback: any) => {
    const channel = 'llm:chat-chunk'
    const handler = (_event: any, data: any) => callback(data)
    ipcRenderer.on(channel, handler)
    ipcRenderer.send('llm:chat-stream', messages, projectContext, settings)
    return () => ipcRenderer.removeListener(channel, handler)
  },
  // 对话智能体（非流式回退）
  chatWithAgent: (messages: any[], projectContext: any, settings: any) =>
    ipcRenderer.invoke('llm:chat', messages, projectContext, settings),

  // 窗口控制
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  onMaximizedChange: (callback: (maximized: boolean) => void) => {
    const handler = (_event: any, maximized: boolean) => callback(maximized)
    ipcRenderer.on('window:maximized', handler)
    return () => ipcRenderer.removeListener('window:maximized', handler)
  },
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
