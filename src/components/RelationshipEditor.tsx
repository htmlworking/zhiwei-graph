import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { Concept, Relationship, RelationshipType } from '../types'

interface Props {
  concepts: Concept[]
  relationships: Relationship[]
  onChange: (rels: Relationship[]) => void
}

const TYPE_LABELS: Record<RelationshipType, string> = {
  prerequisite: '前提关系',
  subsumes: '上下位关系',
  conflicts: '冲突关系',
  analogy: '类比关系',
  related: '相关关系',
}

const TYPE_COLORS: Record<RelationshipType, string> = {
  prerequisite: '#0984e3',
  subsumes: '#6c5ce7',
  conflicts: '#e17055',
  analogy: '#00b894',
  related: '#636e72',
}

export default function RelationshipEditor({ concepts, relationships, onChange }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ source: '', target: '', type: 'prerequisite' as RelationshipType, strength: 0.8, description: '' })

  const handleAdd = () => {
    if (!form.source || !form.target || form.source === form.target) return
    onChange([...relationships, { ...form }])
    setShowAdd(false)
    setForm({ source: '', target: '', type: 'prerequisite', strength: 0.8, description: '' })
  }

  const handleDelete = (idx: number) => {
    onChange(relationships.filter((_, i) => i !== idx))
  }

  const getConceptName = (id: string) => concepts.find(c => c.id === id)?.name || id

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn-primary" onClick={() => setShowAdd(true)} disabled={concepts.length < 2}>
            <Plus size={14} /> 添加关系
          </button>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            共 {relationships.length} 条关系
          </span>
          {concepts.length < 2 && (
            <span style={{ fontSize: 11, color: '#e17055' }}>（需要至少 2 个概念）</span>
          )}
        </div>
      </div>

      {/* 添加表单 */}
      {showAdd && (
        <div className="card" style={{ marginBottom: 12, padding: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label>源概念</label>
              <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
                <option value="">选择...</option>
                {concepts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label>目标概念</label>
              <select value={form.target} onChange={e => setForm({ ...form, target: e.target.value })}>
                <option value="">选择...</option>
                {concepts.filter(c => c.id !== form.source).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label>关系类型</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as RelationshipType })}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label>强度 ({Math.round(form.strength * 100)}%)</label>
              <input type="range" min="0" max="1" step="0.05" value={form.strength}
                onChange={e => setForm({ ...form, strength: parseFloat(e.target.value) })} />
            </div>
            <div style={{ gridColumn: '2 / -1' }}>
              <label>描述</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="关系描述..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={() => setShowAdd(false)} style={{ fontSize: 12 }}>取消</button>
            <button className="btn-primary" onClick={handleAdd} style={{ fontSize: 12 }}
              disabled={!form.source || !form.target}>添加</button>
          </div>
        </div>
      )}

      {/* 关系列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {relationships.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>
            还没有概念关系。添加关系来描述概念间的联系。
          </p>
        ) : (
          relationships.map((r, i) => (
            <div key={i} className="card" style={{
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderLeft: `4px solid ${TYPE_COLORS[r.type]}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <strong>{getConceptName(r.source)}</strong>
                <span style={{
                  fontSize: 11,
                  background: TYPE_COLORS[r.type] + '18',
                  color: TYPE_COLORS[r.type],
                  padding: '2px 8px',
                  borderRadius: 10,
                }}>
                  {TYPE_LABELS[r.type]}
                </span>
                <strong>{getConceptName(r.target)}</strong>
                {r.description && (
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>— {r.description}</span>
                )}
              </div>
              <button className="btn-danger" onClick={() => handleDelete(i)} style={{ padding: '2px 6px' }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
