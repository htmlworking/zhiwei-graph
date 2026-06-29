import { IpcMain } from 'electron'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { app } from 'electron'

function uuidv4(): string {
  return crypto.randomUUID()
}

function getDataDir(): string {
  const userDataPath = app.getPath('documents')
  const dir = path.join(userDataPath, 'ConceptEcology', 'projects')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

export function registerProjectHandlers(ipcMain: IpcMain) {
  // 列出所有项目
  ipcMain.handle('project:list', async () => {
    const dir = getDataDir()
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'))
    const projects = files.map(f => {
      const raw = fs.readFileSync(path.join(dir, f), 'utf-8')
      const p = JSON.parse(raw)
      return {
        id: p.id,
        name: p.name,
        subjectDomain: p.subjectDomain || '',
        targetAudience: p.targetAudience || '',
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        conceptCount: (p.existingConcepts || []).length,
      }
    })
    return projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  })

  // 创建项目
  ipcMain.handle('project:create', async (_event, data: any) => {
    const dir = getDataDir()
    const project = {
      id: uuidv4(),
      name: data.name || '未命名项目',
      subjectDomain: data.subjectDomain || '',
      targetAudience: data.targetAudience || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      existingConcepts: [],
      relationships: [],
      newConcept: null,
      simulationHistory: [],
    }
    const filePath = path.join(dir, `${project.id}.json`)
    fs.writeFileSync(filePath, JSON.stringify(project, null, 2), 'utf-8')
    return project
  })

  // 读取项目
  ipcMain.handle('project:read', async (_event, id: string) => {
    const dir = getDataDir()
    const filePath = path.join(dir, `${id}.json`)
    if (!fs.existsSync(filePath)) throw new Error('项目不存在')
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  })

  // 更新项目
  ipcMain.handle('project:update', async (_event, id: string, data: any) => {
    const dir = getDataDir()
    const filePath = path.join(dir, `${id}.json`)
    if (!fs.existsSync(filePath)) throw new Error('项目不存在')
    const project = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    const updated = { ...project, ...data, id, updatedAt: new Date().toISOString() }
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8')
    return updated
  })

  // 删除项目
  ipcMain.handle('project:delete', async (_event, id: string) => {
    const dir = getDataDir()
    const filePath = path.join(dir, `${id}.json`)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
    return { success: true }
  })

  // 导出项目
  ipcMain.handle('project:export', async (_event, id: string) => {
    const dir = getDataDir()
    const filePath = path.join(dir, `${id}.json`)
    if (!fs.existsSync(filePath)) throw new Error('项目不存在')
    const { dialog } = await import('electron')
    const result = await dialog.showSaveDialog({
      title: '导出项目',
      defaultPath: `concept-ecology-export.json`,
      filters: [{ name: 'JSON 文件', extensions: ['json'] }],
    })
    if (!result.canceled && result.filePath) {
      const content = fs.readFileSync(filePath, 'utf-8')
      fs.writeFileSync(result.filePath, content, 'utf-8')
      return { success: true, path: result.filePath }
    }
    return { success: false }
  })

  // 导入项目
  ipcMain.handle('project:import', async () => {
    const { dialog } = await import('electron')
    const result = await dialog.showOpenDialog({
      title: '导入项目',
      filters: [{ name: 'JSON 文件', extensions: ['json'] }],
      properties: ['openFile'],
    })
    if (!result.canceled && result.filePaths[0]) {
      const content = fs.readFileSync(result.filePaths[0], 'utf-8')
      const project = JSON.parse(content)
      // 生成新 ID
      project.id = uuidv4()
      project.createdAt = new Date().toISOString()
      project.updatedAt = new Date().toISOString()
      const dir = getDataDir()
      const filePath = path.join(dir, `${project.id}.json`)
      fs.writeFileSync(filePath, JSON.stringify(project, null, 2), 'utf-8')
      return project
    }
    return null
  })
}
