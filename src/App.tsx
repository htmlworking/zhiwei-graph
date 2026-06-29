import { useState, useEffect, useCallback } from 'react'
import type { Project, ProjectListItem, Settings } from './types'
import { api } from './services/bridge'
import Layout from './components/Layout'
import ProjectList from './components/ProjectList'
import ProjectWorkspace from './components/ProjectWorkspace'
import SettingsPage from './components/SettingsPage'

type View = 'list' | 'workspace' | 'settings'

export default function App() {
  const [view, setView] = useState<View>('list')
  const [prevView, setPrevView] = useState<View>('list')
  const [projects, setProjects] = useState<ProjectListItem[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      try {
        const [settingsData, projectList] = await Promise.all([
          api.getSettings(),
          api.listProjects(),
        ])
        setSettings(settingsData)
        setProjects(projectList)
        // 恢复深色模式
        if (localStorage.getItem('concept-ecology-dark-mode') === '1') {
          document.documentElement.setAttribute('data-theme', 'dark')
        }
      } catch (err) {
        console.error('初始化失败:', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const openProject = useCallback(async (id: string) => {
    const project = await api.readProject(id)
    setCurrentProject(project)
    setPrevView('workspace')
    setView('workspace')
  }, [])

  const backToList = useCallback(async () => {
    setCurrentProject(null)
    setPrevView('list')
    setView('list')
    const list = await api.listProjects()
    setProjects(list)
  }, [])

  const refreshProject = useCallback(async () => {
    if (currentProject) {
      const updated = await api.readProject(currentProject.id)
      setCurrentProject(updated)
    }
  }, [currentProject])

  const navigateToSettings = useCallback(() => {
    setPrevView(view)
    setView('settings')
  }, [view])

  const backFromSettings = useCallback(() => {
    setView(prevView)
  }, [prevView])

  const handleDarkModeChange = useCallback((dark: boolean) => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : '')
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 18 }}>加载中...</p>
      </div>
    )
  }

  return (
    <Layout
      currentView={view}
      onBack={view === 'settings' ? backFromSettings : backToList}
      onNavigateSettings={navigateToSettings}
      projectName={currentProject?.name}
      settings={settings}
    >
      {view === 'list' ? (
        <ProjectList
          projects={projects}
          onOpen={openProject}
          onRefresh={() => api.listProjects().then(setProjects)}
          settings={settings!}
        />
      ) : view === 'settings' ? (
        <SettingsPage
          settings={settings!}
          onSettingsUpdated={setSettings}
          onDarkModeChange={handleDarkModeChange}
        />
      ) : currentProject ? (
        <ProjectWorkspace
          project={currentProject}
          onUpdate={setCurrentProject}
          onRefresh={refreshProject}
          settings={settings!}
        />
      ) : null}
    </Layout>
  )
}
