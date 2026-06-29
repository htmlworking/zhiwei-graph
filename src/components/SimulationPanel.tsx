import { useState } from 'react'
import { Play, Loader2 } from 'lucide-react'
import type { Project, Settings, SimulationResults, NewConceptInput } from '../types'
import { api } from '../services/bridge'

interface Props {
  project: Project
  settings: Settings
  onSimulationComplete: (newConcept: { name: string; description: string; simulationResults: SimulationResults }) => void
}

export default function SimulationPanel({ project, settings, onSimulationComplete }: Props) {
  const [name, setName] = useState(project.newConcept?.name || '')
  const [description, setDescription] = useState(project.newConcept?.description || '')
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')

  const hasResults = project.newConcept?.simulationResults != null

  const handleRun = async () => {
    if (!name.trim()) return
    setError('')
    setRunning(true)
    try {
      const results = await api.runSimulation(
        project.existingConcepts,
        project.relationships,
        { name: name.trim(), description: description.trim() },
        settings
      )
      onSimulationComplete({ name: name.trim(), description: description.trim(), simulationResults: results })
    } catch (err: any) {
      setError(err.message || '模拟失败')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div>
      <h3 style={{ fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        🧠 概念生态模拟
        {hasResults && (
          <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 400 }}>
            ✓ 已完成模拟
          </span>
        )}
      </h3>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          输入一个待教学的"新概念"，AI 将分析该概念进入学生已有知识体系后：
          哪些旧概念助力学习（锚点）、哪些引发冲突、哪些需要认知重构。
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label>新概念名称 *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="如：加速度"
              disabled={running}
            />
          </div>
          <div>
            <label>概念描述</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="如：加速度是描述速度变化快慢的物理量，是矢量..."
              disabled={running}
            />
          </div>

          {error && (
            <div style={{ background: '#ffeaa7', padding: '8px 12px', borderRadius: 6, fontSize: 13, color: '#d63031' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              已有 {project.existingConcepts.length} 个概念 · {project.relationships.length} 条关系
            </span>
            <button
              className="btn-primary"
              onClick={handleRun}
              disabled={running || !name.trim() || project.existingConcepts.length === 0}
              style={{ padding: '10px 24px', fontSize: 15 }}
            >
              {running ? (
                <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> 分析中...</>
              ) : (
                <><Play size={18} /> 运行模拟</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
