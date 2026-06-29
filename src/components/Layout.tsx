import { ReactNode, useState, useEffect } from 'react'
import { Settings, ChevronLeft } from 'lucide-react'
import type { Settings as SettingsType } from '../types'

interface Props {
  currentView: 'list' | 'workspace' | 'settings'
  onBack: () => void
  onNavigateSettings: () => void
  projectName?: string
  settings: SettingsType | null
  children: ReactNode
}

export default function Layout({ currentView, onBack, onNavigateSettings, projectName, settings, children }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* 顶栏 */}
      <header style={{
        height: 44,
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 8px 0 4px',
        flexShrink: 0,
        borderBottom: '0.5px solid var(--ios-separator)',
        zIndex: 100,
      } as React.CSSProperties}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 } as React.CSSProperties}>
          {currentView !== 'list' && (
            <button onClick={onBack} className="btn-ghost"
              style={{ padding: '4px 8px', fontSize: 13, color: 'var(--ios-blue)' }}>
              <ChevronLeft size={18} />
            </button>
          )}
          <span style={{
            fontWeight: 590, fontSize: 15, color: 'var(--ios-text)',
            letterSpacing: '-0.02em', marginLeft: currentView === 'list' ? 16 : 4,
          }}>
            知维图谱
          </span>
          {projectName && (
            <>
              <span style={{ color: 'var(--ios-text-tertiary)', fontSize: 13, margin: '0 4px' }}>/</span>
              <span style={{ color: 'var(--ios-text-secondary)', fontSize: 14, fontWeight: 500 }}>{projectName}</span>
            </>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 2 } as React.CSSProperties}>
          {currentView !== 'settings' && (
            <button onClick={onNavigateSettings} className="btn-ghost"
              style={{ padding: '6px 8px', color: 'var(--ios-text-secondary)' }} title="设置">
              <Settings size={15} />
            </button>
          )}

          {/* 窗口控件 — Edge / Windows 风格 */}
          <WinControl icon="─" onClick={() => window.electronAPI?.minimizeWindow()} title="最小化" />
          <WinControl icon="□" onClick={() => window.electronAPI?.maximizeWindow()} title="最大化" />
          <WinControl icon="✕" onClick={() => window.electronAPI?.closeWindow()} title="关闭" close />
        </div>
      </header>

      {/* 内容 */}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </div>
  )
}

// Edge 风格窗口按钮
function WinControl({ icon, onClick, title, close }: { icon: string; onClick: () => void; title: string; close?: boolean }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={title}
      style={{
        width: 38,
        height: 28,
        border: 'none',
        borderRadius: 0,
        background: close && hover ? '#e81123' : hover ? 'rgba(0,0,0,0.06)' : 'transparent',
        color: close && hover ? '#fff' : 'var(--ios-text-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: 11,
        fontFamily: 'inherit',
        transition: 'background 0.1s, color 0.1s',
        padding: 0,
      }}
    >
      {icon}
    </button>
  )
}
