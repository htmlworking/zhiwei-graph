import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'
import type { ChatMessage, Settings, Project } from '../types'
import { api } from '../services/bridge'

interface Props {
  project: Project
  settings: Settings
  onProjectUpdate: (p: Project) => void
}

export default function AgentChat({ project, settings, onProjectUpdate }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: '你好！我是小知，你的知识图谱助手。我可以直接帮你操作概念知识库。\n\n试试说：\n• "帮我生成初中物理力学的核心概念"\n• "删除冗余的概念"\n• "给速度和加速度建立关系"' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEnd = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMsg: ChatMessage = { role: 'user', content: input.trim() }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    const ctx = {
      projectId: project.id,
      subjectDomain: project.subjectDomain,
      targetAudience: project.targetAudience,
      existingConcepts: project.existingConcepts,
      relationships: project.relationships,
    }

    const msgList = updatedMessages.map(m => ({ role: m.role, content: m.content }))
    let accumulated = ''

    api.chatWithAgentStream(
      msgList, ctx, settings,
      async (data: { text: string; done: boolean; error?: boolean }) => {
        if (data.done) {
          // 流式结束
          const finalText = data.text || accumulated

          if (finalText.startsWith('错误：') || finalText.startsWith('API 错误')) {
            setMessages(prev => prev.slice(0, -1).concat([{ role: 'assistant', content: finalText }]))
          } else if (finalText.trim()) {
            setMessages(prev => prev.slice(0, -1).concat([{ role: 'assistant', content: finalText }]))
          } else {
            setMessages(prev => prev.slice(0, -1).concat([{
              role: 'assistant',
              content: accumulated.trim() || '模型未返回有效内容。请检查 API 设置。',
            }]))
          }

          setLoading(false)

          // 重新加载项目（工具可能已经修改了数据）
          try {
            const refreshed = await api.readProject(project.id)
            onProjectUpdate(refreshed)
          } catch {
            // 加载失败，保持当前显示
          }
        } else {
          // 逐字流式
          accumulated += data.text
          setMessages(prev => {
            const rest = prev.slice(0, -1)
            const last = prev[prev.length - 1]
            return [...rest, { role: 'assistant', content: last.content + data.text }]
          })
        }
      }
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* 悬浮按钮 */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            padding: '10px 20px',
            borderRadius: 24,
            background: 'var(--ios-blue)',
            border: 'none',
            boxShadow: '0 4px 24px rgba(0,122,255,0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            zIndex: 500,
            color: '#fff',
            fontSize: 14,
            fontWeight: 590,
            letterSpacing: '-0.01em',
            animation: 'pulse 2.5s ease-in-out infinite',
          }}
        >
          <MessageCircle size={18} />
          小知
        </button>
      )}

      {/* 聊天面板 */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          width: 440, height: 580,
          background: 'var(--ios-bg-elevated)',
          borderRadius: 'var(--ios-radius-lg)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
          display: 'flex', flexDirection: 'column',
          zIndex: 500,
          border: '0.5px solid var(--ios-separator)',
          overflow: 'hidden',
          animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          {/* 标题栏 */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '0.5px solid var(--ios-separator)',
            background: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(20px)',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageCircle size={16} style={{ color: 'var(--ios-blue)' }} />
              <span style={{ fontWeight: 590, fontSize: 14 }}>小知</span>
              <span style={{ fontSize: 10, color: 'var(--ios-text-tertiary)', background: 'var(--ios-bg)', padding: '1px 6px', borderRadius: 10 }}>
                Function Calling
              </span>
            </div>
            <button onClick={() => setOpen(false)} style={{
              width: 26, height: 26, borderRadius: '50%', background: 'var(--ios-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', border: 'none', color: 'var(--ios-text-secondary)',
            }}>
              <X size={13} />
            </button>
          </div>

          {/* 消息列表 */}
          <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '88%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user'
                    ? 'var(--ios-radius) var(--ios-radius) 4px var(--ios-radius)'
                    : 'var(--ios-radius) var(--ios-radius) var(--ios-radius) 4px',
                  background: msg.role === 'user' ? 'var(--ios-blue)' : 'var(--ios-bg)',
                  color: msg.role === 'user' ? 'white' : 'var(--ios-text)',
                  fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word', letterSpacing: '-0.01em',
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px' }}>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', color: 'var(--ios-text-tertiary)' }} />
                <span style={{ fontSize: 12, color: 'var(--ios-text-tertiary)' }}>思考中...</span>
              </div>
            )}
            <div ref={messagesEnd} />
          </div>

          {/* 输入区 */}
          <div style={{
            padding: '10px 12px', borderTop: '0.5px solid var(--ios-separator)',
            display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0,
          }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息，如：帮我列出所有概念"
              rows={1}
              disabled={loading}
              style={{
                flex: 1, resize: 'none', borderRadius: 'var(--ios-radius)',
                padding: '8px 12px', border: '1px solid var(--ios-separator)',
                fontSize: 13, fontFamily: 'inherit', outline: 'none',
                maxHeight: 80, background: 'var(--ios-bg)',
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: input.trim() ? 'var(--ios-blue)' : 'var(--ios-bg)',
                color: input.trim() ? 'white' : 'var(--ios-text-tertiary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: input.trim() ? 'pointer' : 'default',
                border: 'none', flexShrink: 0,
              }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
