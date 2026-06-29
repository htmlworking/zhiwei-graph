import { useState } from 'react'
import { X, Check } from 'lucide-react'
import type { Settings } from '../types'

interface Props {
  settings: Settings
  onSave: (s: Settings) => void
  onClose: () => void
}

export default function SettingsDialog({ settings, onSave, onClose }: Props) {
  const [form, setForm] = useState<Settings>({ ...settings })

  const handleSave = () => {
    onSave(form)
  }

  const providers = [
    { value: 'anthropic', label: 'Anthropic (Claude)', desc: 'api.anthropic.com' },
    { value: 'openai', label: 'OpenAI / 兼容接口', desc: '兼容 OpenAI 格式的 API' },
    { value: 'custom', label: '自定义端点', desc: '任意兼容端点' },
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.35)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
      animation: 'fadeIn 0.2s ease',
    }}>
      <div className="card" style={{
        width: 500, maxHeight: '82vh', overflow: 'auto',
        padding: 0, borderRadius: 'var(--ios-radius-lg)',
        boxShadow: 'var(--ios-shadow-lg)',
        animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* 标题栏 */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 20px',
          borderBottom: '0.5px solid var(--ios-separator)',
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 590, letterSpacing: '-0.02em' }}>API 设置</h2>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--ios-bg)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--ios-text-secondary)',
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* 表单 */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label>大模型提供商</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {providers.map(p => (
                <div
                  key={p.value}
                  onClick={() => setForm({ ...form, llmProvider: p.value as Settings['llmProvider'] })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px',
                    borderRadius: 'var(--ios-radius-sm)',
                    border: form.llmProvider === p.value
                      ? '2px solid var(--ios-blue)'
                      : '1.5px solid var(--ios-separator)',
                    background: form.llmProvider === p.value ? 'var(--ios-blue-light)' : 'var(--ios-bg-elevated)',
                    cursor: 'pointer',
                    fontWeight: 400,
                    textTransform: 'none',
                    letterSpacing: '-0.01em',
                    fontSize: 13,
                    color: 'var(--ios-text)',
                    transition: 'var(--ios-transition)',
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    border: form.llmProvider === p.value ? '6px solid var(--ios-blue)' : '2px solid var(--ios-separator)',
                    background: 'white',
                    flexShrink: 0,
                    transition: 'var(--ios-transition)',
                  }} />
                  <div>
                    <div style={{ fontWeight: 500 }}>{p.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--ios-text-tertiary)' }}>{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label>模型</label>
            <input
              value={form.model}
              onChange={e => setForm({ ...form, model: e.target.value })}
              placeholder="claude-sonnet-4-6-20250514"
            />
          </div>

          <div>
            <label>API 端点</label>
            <input
              value={form.apiEndpoint}
              onChange={e => setForm({ ...form, apiEndpoint: e.target.value })}
              placeholder="https://api.anthropic.com/v1/messages"
            />
          </div>

          <div>
            <label>API Key</label>
            <input
              type="password"
              value={form.apiKey}
              onChange={e => setForm({ ...form, apiKey: e.target.value })}
              placeholder="sk-..."
              style={{ fontFamily: 'SF Mono, Menlo, monospace', fontSize: 13 }}
            />
            <p style={{ fontSize: 11, color: 'var(--ios-text-tertiary)', marginTop: 5 }}>
              Key 仅保存在本地 <code style={{ background:'var(--ios-bg)',padding:'1px 5px',borderRadius:4 }}>Documents/ConceptEcology/settings.json</code>，不上传至任何服务器
            </p>
          </div>
        </div>

        {/* 底部按钮 */}
        <div style={{
          display: 'flex', gap: 8, padding: '14px 20px',
          borderTop: '0.5px solid var(--ios-separator)',
          justifyContent: 'flex-end',
        }}>
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button className="btn-primary" onClick={handleSave}>
            <Check size={15} /> 保存
          </button>
        </div>
      </div>
    </div>
  )
}
