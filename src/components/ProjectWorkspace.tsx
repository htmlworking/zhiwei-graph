import { useState, useRef, useCallback, useEffect } from 'react'
import { Save, PanelRightClose, PanelRight } from 'lucide-react'
import type { Project, Settings } from '../types'
import { api } from '../services/bridge'
import ConceptEditor from './ConceptEditor'
import RelationshipEditor from './RelationshipEditor'
import SimulationPanel from './SimulationPanel'
import EcologyGraph from './EcologyGraph'
import SimulationResults from './SimulationResults'
import ReportView from './ReportView'
import AgentChat from './AgentChat'

interface Props {
  project: Project
  onUpdate: (p: Project) => void
  onRefresh: () => void
  settings: Settings
}

type Tab = 'concepts' | 'relationships' | 'simulation' | 'report'

export default function ProjectWorkspace({ project, onUpdate, onRefresh, settings }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('concepts')
  const [saving, setSaving] = useState(false)
  const [graphWidth, setGraphWidth] = useState(420)
  const [showGraph, setShowGraph] = useState(true)
  const isDragging = useRef(false)

  const saveProject = async (data: Partial<Project>) => {
    setSaving(true)
    try {
      // 如果更新了概念列表，自动清理引用已删除概念的孤立关系
      let finalData = { ...data }
      if (data.existingConcepts) {
        const validIds = new Set(data.existingConcepts.map(c => c.id))
        const currentRels = data.relationships ?? project.relationships
        const cleanedRels = currentRels.filter(r => validIds.has(r.source) && validIds.has(r.target))
        finalData = { ...data, relationships: cleanedRels }
      }
      const updated = await api.updateProject(project.id, finalData)
      onUpdate(updated)
    } finally {
      setSaving(false)
    }
  }

  const hasSimulation = project.newConcept?.simulationResults != null

  const tabs: { key: Tab; label: string; icon: string; badge?: number }[] = [
    { key: 'concepts', label: '概念知识库', icon: '📚', badge: project.existingConcepts.length },
    { key: 'relationships', label: '概念关系', icon: '🔗', badge: project.relationships.length },
    { key: 'simulation', label: '生态模拟', icon: '🧠' },
    { key: 'report', label: '教学报告', icon: '📄' },
  ]

  // 拖拽调节图谱宽度
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      const newWidth = window.innerWidth - e.clientX
      if (newWidth >= 280 && newWidth <= 700) {
        setGraphWidth(newWidth)
      }
    }
    const handleMouseUp = () => {
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const actualGraphWidth = showGraph ? graphWidth : 0

  return (
    <div style={{ display: 'flex', height: '100%', flex: 1 }}>
      {/* 左侧工作区 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Tab 栏 — iOS 分段控制器风格 */}
        <div className="tab-bar" style={{ flexShrink: 0 }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`tab-item${activeTab === t.key ? ' active' : ''}`}
            >
              <span style={{ marginRight: 4 }}>{t.icon}</span>
              {t.label}
              {t.badge ? (
                <span style={{
                  marginLeft: 5,
                  background: activeTab === t.key ? 'var(--ios-blue-light)' : 'var(--ios-bg)',
                  color: activeTab === t.key ? 'var(--ios-blue)' : 'var(--ios-text-tertiary)',
                  borderRadius: 100,
                  padding: '1px 7px',
                  fontSize: 11,
                  fontWeight: 600,
                }}>{t.badge}</span>
              ) : null}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button
            className="btn-ghost"
            onClick={() => saveProject({})}
            disabled={saving}
            style={{ alignSelf: 'center', fontSize: 12, marginRight: 4 }}
          >
            <Save size={13} />
            {saving ? '保存中...' : '保存'}
          </button>
          <button
            className="btn-ghost"
            onClick={() => setShowGraph(!showGraph)}
            style={{ alignSelf: 'center', fontSize: 12 }}
            title={showGraph ? '隐藏图谱' : '显示图谱'}
          >
            {showGraph ? <PanelRightClose size={14} /> : <PanelRight size={14} />}
          </button>
        </div>

        {/* Tab 内容 */}
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          <div className="animate-fade-in" key={activeTab}>
            {activeTab === 'concepts' && (
              <ConceptEditor
                concepts={project.existingConcepts}
                onChange={concepts => saveProject({ existingConcepts: concepts })}
                settings={settings}
                domain={project.subjectDomain}
              />
            )}
            {activeTab === 'relationships' && (
              <RelationshipEditor
                concepts={project.existingConcepts}
                relationships={project.relationships}
                onChange={rels => saveProject({ relationships: rels })}
              />
            )}
            {activeTab === 'simulation' && (
              <div>
                <SimulationPanel
                  project={project}
                  settings={settings}
                  onSimulationComplete={(newConcept) => saveProject({
                    newConcept,
                    simulationHistory: [
                      ...project.simulationHistory,
                      {
                        timestamp: new Date().toISOString(),
                        newConceptName: newConcept.name,
                        newConceptDescription: newConcept.description,
                        difficultyPrediction: newConcept.simulationResults?.difficultyPrediction || 0,
                        summary: newConcept.simulationResults?.teachingSuggestions?.slice(0, 100) || '',
                      },
                    ],
                  })}
                />
                {hasSimulation && <SimulationResults results={project.newConcept!.simulationResults!} concepts={project.existingConcepts} />}
              </div>
            )}
            {activeTab === 'report' && (
              <ReportView project={project} />
            )}
          </div>
        </div>
      </div>

      {/* 可拖拽分隔条 */}
      {showGraph && (
        <div
          className="resize-handle"
          onMouseDown={handleMouseDown}
        />
      )}

      {/* 右侧可视化面板 */}
      <div style={{
        width: actualGraphWidth,
        borderLeft: showGraph ? '0.5px solid var(--ios-separator)' : 'none',
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: isDragging.current ? 'none' : 'width 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
        flexShrink: 0,
      }}>
        <div style={{
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ios-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            概念生态图谱
          </span>
          <span style={{
            fontSize: 10, color: 'var(--ios-text-tertiary)',
            background: 'var(--ios-bg)', borderRadius: 100, padding: '1px 8px',
          }}>
            拖拽边界调节大小
          </span>
        </div>
        <div style={{ flex: 1, minHeight: 300, position: 'relative' }}>
          <EcologyGraph
            concepts={project.existingConcepts}
            relationships={project.relationships}
            newConcept={project.newConcept}
          />
        </div>
      </div>

      {/* 小知 */}
      <AgentChat
        project={project}
        settings={settings}
        onProjectUpdate={onUpdate}
      />
    </div>
  )
}
