import { IpcMain, app } from 'electron'
import fs from 'fs'
import path from 'path'

function getSettingsPath(): string {
  const userDataPath = app.getPath('documents')
  const dir = path.join(userDataPath, 'ConceptEcology')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return path.join(dir, 'settings.json')
}

const defaultSettings = {
  llmProvider: 'anthropic',
  apiKey: '',
  apiEndpoint: 'https://api.anthropic.com/v1/messages',
  model: 'claude-sonnet-4-6-20250514',
  language: 'zh-CN',
}

export function registerSettingsHandlers(ipcMain: IpcMain) {
  ipcMain.handle('settings:get', async () => {
    const filePath = getSettingsPath()
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultSettings, null, 2), 'utf-8')
      return defaultSettings
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  })

  ipcMain.handle('settings:save', async (_event, data: any) => {
    const filePath = getSettingsPath()
    const current = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      : defaultSettings
    const updated = { ...current, ...data }
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8')
    return updated
  })
}
