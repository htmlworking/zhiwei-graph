import { app, BrowserWindow, ipcMain, Menu } from 'electron'
import path from 'path'
import { registerProjectHandlers } from './ipc/project'
import { registerSettingsHandlers } from './ipc/settings'
import { registerLLMHandlers } from './ipc/llm'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    title: '知维图谱',
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    backgroundColor: '#f2f2f7',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // 彻底移除菜单栏 (File, Edit, View 等)
  Menu.setApplicationMenu(null)

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  registerProjectHandlers(ipcMain)
  registerSettingsHandlers(ipcMain)
  registerLLMHandlers(ipcMain)

  // 窗口控制
  ipcMain.on('window:minimize', () => mainWindow?.minimize())
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })
  ipcMain.on('window:close', () => mainWindow?.close())
  // 监听最大化状态变化，通知渲染进程
  mainWindow?.on('maximize', () => mainWindow?.webContents.send('window:maximized', true))
  mainWindow?.on('unmaximize', () => mainWindow?.webContents.send('window:maximized', false))

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
