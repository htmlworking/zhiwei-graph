import { useState } from 'react'
import { Plus, FolderOpen, Trash2, Download, Upload, RefreshCw } from 'lucide-react'
import type { ProjectListItem, Settings } from '../types'
import { api } from '../services/bridge'

interface Props {
  projects: ProjectListItem[]
  onOpen: (id: string) => void
  onRefresh: () => void
  settings: Settings
}

export default function ProjectList({ projects, onOpen, onRefresh, settings }: Props) {
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDomain, setNewDomain] = useState('')
  const [newAudience, setNewAudience] = useState('')

  const handleCreate = async () => {
    if (!newName.trim()) return
    const project = await api.createProject({
      name: newName.trim(),
      subjectDomain: newDomain.trim(),
      targetAudience: newAudience.trim(),
    })
    setShowCreate(false)
    setNewName('')
    setNewDomain('')
    setNewAudience('')
    onRefresh()
    onOpen(project.id)
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`确定删除项目「${name}」？此操作不可恢复。`)) {
      await api.deleteProject(id)
      onRefresh()
    }
  }

  const handleExport = async (id: string) => {
    await api.exportProject(id)
  }

  const handleImport = async () => {
    const result = await api.importProject()
    if (result) {
      onRefresh()
      onOpen(result.id)
    }
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (mins < 1) return '刚刚'
    if (mins < 60) return `${mins} 分钟前`
    if (hours < 24) return `${hours} 小时前`
    if (days < 7) return `${days} 天前`
    return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`
  }

  return (
    <div style={{
      maxWidth: 820, margin: '0 auto', padding: '40px 24px',
      animation: 'fadeIn 0.4s ease',
    }}>
      {/* 页头 */}
      <div style={{ marginBottom: 36 }}>
        <p style={{
          color: 'var(--ios-text-secondary)', fontSize: 13, fontWeight: 500,
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4,
        }}>
          知维图谱
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 6 }}>
          我的项目
        </h1>
        <p style={{ color: 'var(--ios-text-tertiary)', fontSize: 14, lineHeight: 1.6 }}>
          基于认知心理学理论，利用大模型分析新概念进入学生已有知识体系后的生态演化
        </p>
      </div>

      {/* 操作栏 */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 28,
      }}>
        <button className="btn-secondary" onClick={handleImport} style={{ fontSize: 13 }}>
          <Upload size={15} /> 导入项目
        </button>
        <button className="btn-secondary" onClick={onRefresh} style={{ fontSize: 13 }}>
          <RefreshCw size={15} /> 刷新
        </button>
        <button className="btn-primary" onClick={() => setShowCreate(true)} style={{ fontSize: 14, padding: '10px 22px' }}>
          <Plus size={16} /> 新建项目
        </button>
      </div>

      {/* 创建表单 */}
      {showCreate && (
        <div className="card" style={{
          marginBottom: 24, padding: 24,
          borderRadius: 'var(--ios-radius-lg)',
          animation: 'slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 590, marginBottom: 18 }}>新建项目</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div>
              <label>项目名称 *</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="例：初中物理—力学单元" />
            </div>
            <div>
              <label>学科领域</label>
              <input value={newDomain} onChange={e => setNewDomain(e.target.value)} placeholder="例：物理" />
            </div>
            <div>
              <label>目标学生</label>
              <input value={newAudience} onChange={e => setNewAudience(e.target.value)} placeholder="例：初中二年级" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 18, justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={() => setShowCreate(false)}>取消</button>
            <button className="btn-primary" onClick={handleCreate} disabled={!newName.trim()}>创建项目</button>
          </div>
        </div>
      )}

      {/* 空状态 */}
      {projects.length === 0 ? (
        <div className="card" style={{
          textAlign: 'center', padding: '64px 24px',
          borderRadius: 'var(--ios-radius-lg)',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--ios-bg)', margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FolderOpen size={28} style={{ color: 'var(--ios-text-tertiary)' }} />
          </div>
          <p style={{ fontSize: 16, color: 'var(--ios-text-secondary)', fontWeight: 500 }}>
            还没有项目
          </p>
          <p style={{ fontSize: 13, color: 'var(--ios-text-tertiary)', marginTop: 4 }}>
            点击上方「新建项目」创建第一个概念生态模拟
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {projects.map(p => (
            <div key={p.id} className="card card-tappable" style={{
              padding: '16px 20px',
              borderRadius: 'var(--ios-radius)',
              cursor: 'pointer',
            }} onClick={() => onOpen(p.id)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 590, letterSpacing: '-0.02em' }}>{p.name}</h3>
                    {p.subjectDomain && (
                      <span style={{
                        fontSize: 11, fontWeight: 500,
                        background: 'var(--ios-blue-light)', color: 'var(--ios-blue)',
                        padding: '2px 8px', borderRadius: 100,
                      }}>{p.subjectDomain}</span>
                    )}
                    {p.targetAudience && (
                      <span style={{
                        fontSize: 11, fontWeight: 500,
                        background: 'var(--ios-bg)', color: 'var(--ios-text-secondary)',
                        padding: '2px 8px', borderRadius: 100,
                      }}>{p.targetAudience}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ios-text-tertiary)', marginTop: 4 }}>
                    {p.conceptCount} 个概念 · {formatDate(p.updatedAt)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 2 }} onClick={e => e.stopPropagation()}>
                  <button
                    className="btn-ghost"
                    onClick={() => handleExport(p.id)}
                    style={{ padding: '6px 8px' }}
                    title="导出"
                  >
                    <Download size={14} />
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={() => handleDelete(p.id, p.name)}
                    style={{ padding: '6px 8px', color: 'var(--ios-red)' }}
                    title="删除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 底部 */}
      <p style={{
        textAlign: 'center', marginTop: 32,
        fontSize: 11, color: 'var(--ios-text-tertiary)',
      }}>
        数据存储于本地 · 不上传至任何服务器
      </p>
    </div>
  )
}
