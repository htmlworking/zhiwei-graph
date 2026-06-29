import { useState } from 'react'
import { Plus, Trash2, Edit3, Sparkles } from 'lucide-react'
import type { Concept, Settings, GeneratedSkeleton } from '../types'
import { api } from '../services/bridge'

interface Props {
  concepts: Concept[]
  onChange: (concepts: Concept[]) => void
  settings: Settings
  domain: string
}

export default function ConceptEditor({ concepts, onChange, settings, domain }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genTopic, setGenTopic] = useState('')

  // 新增/编辑表单
  const [form, setForm] = useState<Partial<Concept>>({})

  const startAdd = () => {
    setForm({ name: '', description: '', category: '核心概念', masteryLevel: 0.7, tags: [] })
    setEditingId('__new__')
    setShowAdd(true)
  }

  const startEdit = (c: Concept) => {
    setForm({ ...c })
    setEditingId(c.id)
  }

  const handleSave = () => {
    if (!form.name?.trim()) return
    if (editingId === '__new__') {
      const newConcept: Concept = {
        id: 'c_' + Date.now(),
        name: form.name.trim(),
        description: form.description || '',
        category: form.category as Concept['category'],
        masteryLevel: form.masteryLevel || 0.7,
        tags: form.tags || [],
      }
      onChange([...concepts, newConcept])
      setShowAdd(false)
    } else if (editingId) {
      onChange(concepts.map(c => c.id === editingId ? { ...c, ...form } as Concept : c))
    }
    setEditingId(null)
    setForm({})
  }

  const handleDelete = (id: string) => {
    onChange(concepts.filter(c => c.id !== id))
  }

  const handleGenerateSkeleton = async () => {
    if (!genTopic.trim()) return
    setGenerating(true)
    try {
      const result: GeneratedSkeleton = await api.generateConceptSkeleton(domain || '通用', genTopic.trim(), settings)
      const newConcepts: Concept[] = [
        ...concepts,
        ...result.concepts.map(c => ({
          id: 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          name: c.name,
          description: c.description,
          category: c.category,
          masteryLevel: c.masteryLevel,
          tags: c.tags || [],
        })),
      ]
      onChange(newConcepts)
      setGenTopic('')
    } catch (err: any) {
      alert('生成失败：' + err.message)
    } finally {
      setGenerating(false)
    }
  }

  const tagStr = (tags: string[]) => tags.join(', ')

  return (
    <div>
      {/* 工具栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn-primary" onClick={startAdd}>
            <Plus size={14} /> 添加概念
          </button>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            共 {concepts.length} 个概念
          </span>
        </div>

        {/* AI 生成 */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            value={genTopic}
            onChange={e => setGenTopic(e.target.value)}
            placeholder="输入主题，AI 生成概念图谱…"
            style={{ width: 220, padding: '4px 8px', fontSize: 12 }}
            onKeyDown={e => e.key === 'Enter' && handleGenerateSkeleton()}
          />
          <button
            className="btn-secondary"
            onClick={handleGenerateSkeleton}
            disabled={generating || !genTopic.trim()}
            style={{ padding: '4px 10px', fontSize: 12, whiteSpace: 'nowrap' }}
          >
            <Sparkles size={12} />
            {generating ? '生成中...' : 'AI 生成'}
          </button>
        </div>
      </div>

      {/* 添加表单 */}
      {showAdd && (
        <div className="card" style={{ marginBottom: 12, padding: 14 }}>
          <ConceptForm form={form} onChange={setForm} />
          <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={() => setShowAdd(false)} style={{ fontSize: 12 }}>取消</button>
            <button className="btn-primary" onClick={handleSave} style={{ fontSize: 12 }}>添加</button>
          </div>
        </div>
      )}

      {/* 概念列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {concepts.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>
            还没有概念。手动添加或使用「AI 生成」基于主题自动创建概念图谱骨架。
          </p>
        ) : (
          concepts.map(c => (
            <div key={c.id} className="card" style={{ padding: '10px 14px' }}>
              {editingId === c.id ? (
                <div>
                  <ConceptForm form={form} onChange={setForm} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                    <button className="btn-secondary" onClick={() => setEditingId(null)} style={{ fontSize: 12 }}>取消</button>
                    <button className="btn-primary" onClick={handleSave} style={{ fontSize: 12 }}>保存</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong>{c.name}</strong>
                      <span className="tag" style={{
                        background: c.category === '核心概念' ? '#e8f5e9' : c.category === '基础概念' ? '#e3f2fd' : '#fff3e0',
                        color: c.category === '核心概念' ? '#2e7d32' : c.category === '基础概念' ? '#1565c0' : '#e65100',
                      }}>{c.category}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        掌握度: {Math.round(c.masteryLevel * 100)}%
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{c.description}</p>
                    {c.tags.length > 0 && (
                      <div style={{ marginTop: 4 }}>
                        {c.tags.map(t => <span key={t} className="tag">{t}</span>)}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginLeft: 12 }}>
                    <button className="btn-secondary" onClick={() => startEdit(c)} style={{ padding: '4px 8px' }}>
                      <Edit3 size={12} />
                    </button>
                    <button className="btn-danger" onClick={() => handleDelete(c.id)} style={{ padding: '4px 8px' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// 概念表单子组件
function ConceptForm({ form, onChange }: { form: Partial<Concept>; onChange: (f: Partial<Concept>) => void }) {
  const set = (key: string, value: any) => onChange({ ...form, [key]: value })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      <div>
        <label>名称 *</label>
        <input value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="概念名称" />
      </div>
      <div>
        <label>类别</label>
        <select value={form.category || '核心概念'} onChange={e => set('category', e.target.value)}>
          <option>核心概念</option>
          <option>基础概念</option>
          <option>辅助概念</option>
          <option>迷思概念</option>
        </select>
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <label>描述</label>
        <textarea value={form.description || ''} onChange={e => set('description', e.target.value)}
          rows={2} placeholder="概念描述..." />
      </div>
      <div>
        <label>掌握度 ({Math.round((form.masteryLevel || 0.7) * 100)}%)</label>
        <input type="range" min="0" max="1" step="0.05"
          value={form.masteryLevel || 0.7}
          onChange={e => set('masteryLevel', parseFloat(e.target.value))}
          style={{ width: '100%' }} />
      </div>
      <div>
        <label>标签（逗号分隔）</label>
        <input
          value={(form.tags || []).join(', ')}
          onChange={e => set('tags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
          placeholder="运动学, 基础"
        />
      </div>
    </div>
  )
}
