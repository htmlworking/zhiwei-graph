// Electron API 桥接封装
// 开发模式下如果 electronAPI 不可用，使用 mock 数据

import type { ElectronAPI } from '../types'

function getAPI(): ElectronAPI {
  if (window.electronAPI) {
    return window.electronAPI
  }
  // 开发模式下浏览器直接访问时，返回 mock
  console.warn('electronAPI 不可用，使用开发模式 mock')
  return createMockAPI()
}

function createMockAPI(): ElectronAPI {
  const store: Record<string, any> = {}
  return {
    listProjects: async () => [],
    createProject: async (data: any) => ({
      id: 'mock-' + Date.now(),
      name: data.name || 'Mock 项目',
      subjectDomain: '',
      targetAudience: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      existingConcepts: [],
      relationships: [],
      newConcept: null,
      simulationHistory: [],
    }),
    readProject: async () => { throw new Error('Mock: 项目不存在') },
    updateProject: async (id, data) => ({ ...store[id], ...data }),
    deleteProject: async () => ({ success: true }),
    exportProject: async () => ({ success: false }),
    importProject: async () => null,
    getSettings: async () => ({
      llmProvider: 'anthropic' as const,
      apiKey: '',
      apiEndpoint: 'https://api.anthropic.com/v1/messages',
      model: 'claude-sonnet-4-6-20250514',
      language: 'zh-CN',
    }),
    saveSettings: async (data: any) => data,
    runSimulation: async () => ({
      activatedConcepts: [],
      anchorConcepts: [],
      conflictConcepts: [],
      restructuringRequired: [],
      difficultyPrediction: 0.5,
      difficultyReason: 'Mock 结果',
      teachingSuggestions: 'Mock 教学建议',
    }),
    generateConceptSkeleton: async () => ({
      concepts: [],
      relationships: [],
      commonMisconceptions: [],
    }),
    chatWithAgent: async () => 'Mock: 小知回复',
    chatWithAgentStream: (_messages, _ctx, _settings, callback) => {
      const mockText = 'Mock: 这是小知的流式回复。'
      let i = 0
      const timer = setInterval(() => {
        if (i < mockText.length) {
          callback({ text: mockText[i], done: false })
          i++
        } else {
          callback({ text: mockText, done: true })
          clearInterval(timer)
        }
      }, 50)
      return () => clearInterval(timer)
    },
    minimizeWindow: () => {},
    maximizeWindow: () => {},
    closeWindow: () => {},
    onMaximizedChange: () => () => {},
  }
}

export const api = getAPI()
