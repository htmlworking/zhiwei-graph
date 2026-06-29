import { useState, useEffect } from 'react'
import { Moon, Sun, Monitor, Key, Globe, Info, ArrowRight, Trash2 } from 'lucide-react'
import type { Settings as SettingsType } from '../types'
import { api } from '../services/bridge'

interface Props {
  settings: SettingsType
  onSettingsUpdated: (s: SettingsType) => void
  onDarkModeChange: (dark: boolean) => void
}

export default function SettingsPage({ settings, onSettingsUpdated, onDarkModeChange }: Props) {
  const [form, setForm] = useState<SettingsType>({ ...settings })
  const [saved, setSaved] = useState(false)
  const [darkMode, setDarkMode] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark')

  const toggleDarkMode = () => {
    const next = !darkMode
    setDarkMode(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : '')
    onDarkModeChange(next)
    localStorage.setItem('concept-ecology-dark-mode', next ? '1' : '0')
  }

  useEffect(() => {
    const stored = localStorage.getItem('concept-ecology-dark-mode')
    if (stored === '1') {
      setDarkMode(true)
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  }, [])

  const handleSave = async () => {
    const updated = await api.saveSettings(form)
    onSettingsUpdated(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const providers = [
    { value: 'anthropic', label: 'Anthropic (Claude)', desc: 'api.anthropic.com' },
    { value: 'openai', label: 'OpenAI / DeepSeek 兼容', desc: '兼容 OpenAI 格式的 API' },
    { value: 'custom', label: '自定义端点', desc: '任意兼容端点' },
  ]

  return (
    <div style={{
      maxWidth: 650, margin: '0 auto', padding: '32px 24px',
      height: '100%', overflow: 'auto',
    }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 32 }}>设置</h1>

      {/* ===== 外观 ===== */}
      <Section title="外观" icon={<Sun size={16} />}>
        <div className="card" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 18px', borderRadius: 'var(--ios-radius)',
        }}>
          <div>
            <div style={{ fontWeight: 500, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              {darkMode ? <Moon size={15} /> : <Sun size={15} />}
              {darkMode ? '深色模式' : '浅色模式'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ios-text-tertiary)', marginTop: 2 }}>
              {darkMode ? '已启用深色主题' : '已启用浅色主题'}
            </div>
          </div>
          <Toggle checked={darkMode} onChange={toggleDarkMode} />
        </div>
      </Section>

      {/* ===== API 配置 ===== */}
      <Section title="大模型 API" icon={<Key size={16} />}>
        <div className="card" style={{ padding: '18px 20px', borderRadius: 'var(--ios-radius)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Provider */}
          <div>
            <label>提供商</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {providers.map(p => (
                <div key={p.value} onClick={() => setForm({ ...form, llmProvider: p.value as any })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 'var(--ios-radius-sm)',
                    border: form.llmProvider === p.value ? '2px solid var(--ios-blue)' : '1.5px solid var(--ios-separator)',
                    background: form.llmProvider === p.value ? 'var(--ios-blue-light)' : 'var(--ios-bg-elevated)',
                    cursor: 'pointer', transition: 'var(--ios-transition)',
                  }}>
                  <Radio selected={form.llmProvider === p.value} />
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{p.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--ios-text-tertiary)' }}>{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label>模型名称</label>
            <input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })}
              placeholder="deepseek-chat" />
          </div>

          <div>
            <label>API 端点 URL</label>
            <input value={form.apiEndpoint} onChange={e => setForm({ ...form, apiEndpoint: e.target.value })}
              placeholder="https://api.deepseek.com/v1/chat/completions" />
          </div>

          <div>
            <label>API Key</label>
            <input type="password" value={form.apiKey} onChange={e => setForm({ ...form, apiKey: e.target.value })}
              placeholder="sk-..." style={{ fontFamily: 'SF Mono, Menlo, monospace', fontSize: 13 }} />
            <p style={{ fontSize: 11, color: 'var(--ios-text-tertiary)', marginTop: 5 }}>
              仅保存在本地 Documents/ConceptEcology/settings.json
            </p>
          </div>

          <button className="btn-primary" onClick={handleSave}
            style={{ alignSelf: 'flex-start', padding: '10px 24px' }}>
            {saved ? '✓ 已保存' : '保存 API 配置'}
          </button>
        </div>
      </Section>

      {/* ===== 数据 ===== */}
      <Section title="数据管理" icon={<Trash2 size={16} />}>
        <div className="card" style={{ padding: '16px 18px', borderRadius: 'var(--ios-radius)' }}>
          <p style={{ fontSize: 13, color: 'var(--ios-text-secondary)', marginBottom: 8 }}>
            所有项目数据保存在本地 <code style={{
              background: 'var(--ios-bg)', padding: '2px 6px', borderRadius: 4, fontSize: 12,
            }}>Documents\ConceptEcology\projects\</code>
          </p>
          <p style={{ fontSize: 12, color: 'var(--ios-text-tertiary)' }}>
            如需迁移数据，直接复制该文件夹即可。
          </p>
        </div>
      </Section>

      {/* ===== 关于 ===== */}
      <Section title="关于" icon={<Info size={16} />}>
        <div className="card" style={{ padding: '16px 18px', borderRadius: 'var(--ios-radius)' }}>
          <p style={{ fontSize: 14, fontWeight: 500 }}>知维图谱 v1.0</p>
          <p style={{ fontSize: 13, color: 'var(--ios-text-secondary)', marginTop: 4 }}>
            基于大模型的概念生态分析工具，帮助教师预判新概念教学中的认知锚点、冲突与重构。
          </p>
          <p style={{ fontSize: 12, color: 'var(--ios-text-tertiary)', marginTop: 8 }}>
            技术栈：Electron + React + TypeScript + D3.js
          </p>
        </div>
      </Section>

      <div style={{ height: 40 }} />
    </div>
  )
}

// 分组
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        marginBottom: 10, color: 'var(--ios-text-secondary)',
        fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
      }}>
        {icon} {title}
      </div>
      {children}
    </div>
  )
}

// 开关
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange} style={{
      width: 44, height: 26, borderRadius: 13,
      background: checked ? 'var(--ios-green)' : '#e5e5ea',
      cursor: 'pointer', position: 'relative',
      transition: 'background 0.25s',
      flexShrink: 0,
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        background: '#fff', position: 'absolute',
        top: 2, left: checked ? 20 : 2,
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'left 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      }} />
    </div>
  )
}

// 单选框
function Radio({ selected }: { selected: boolean }) {
  return (
    <div style={{
      width: 18, height: 18, borderRadius: '50%',
      border: selected ? '5px solid var(--ios-blue)' : '2px solid var(--ios-separator)',
      background: 'white', flexShrink: 0,
      transition: 'var(--ios-transition)',
    }} />
  )
}
