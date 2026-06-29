import { useState } from 'react'
import { Copy, Check, Download } from 'lucide-react'
import type { Project } from '../types'

interface Props {
  project: Project
}

export default function ReportView({ project }: Props) {
  const [copied, setCopied] = useState(false)
  const results = project.newConcept?.simulationResults

  const generateMarkdown = () => {
    const lines: string[] = []

    lines.push(`# ${project.name} — 概念生态模拟报告`)
    lines.push('')
    lines.push(`- **学科领域**：${project.subjectDomain || '未指定'}`)
    lines.push(`- **目标学生**：${project.targetAudience || '未指定'}`)
    lines.push(`- **生成时间**：${new Date().toLocaleString('zh-CN')}`)
    lines.push(`- **已有概念数**：${project.existingConcepts.length}`)
    lines.push(`- **概念关系数**：${project.relationships.length}`)
    lines.push('')

    // 已有概念表
    if (project.existingConcepts.length > 0) {
      lines.push('## 已有概念知识库')
      lines.push('')
      lines.push('| 概念 | 类别 | 掌握度 | 描述 |')
      lines.push('|------|------|--------|------|')
      project.existingConcepts.forEach(c => {
        lines.push(`| ${c.name} | ${c.category} | ${Math.round(c.masteryLevel * 100)}% | ${c.description} |`)
      })
      lines.push('')
    }

    // 新概念
    if (project.newConcept) {
      lines.push('## 待引入新概念')
      lines.push('')
      lines.push(`**${project.newConcept.name}**：${project.newConcept.description}`)
      lines.push('')
    }

    // 模拟结果
    if (results) {
      lines.push('## 模拟结果')
      lines.push('')
      lines.push(`### 📊 学习难度预测：**${Math.round(results.difficultyPrediction * 100)}%**`)
      if (results.difficultyReason) {
        lines.push(`> ${results.difficultyReason}`)
      }
      lines.push('')

      if (results.anchorConcepts.length > 0) {
        lines.push('### 🟢 同化锚点')
        lines.push('')
        results.anchorConcepts.forEach(a => {
          const c = project.existingConcepts.find(x => x.id === a.id)
          lines.push(`- **${c?.name || a.id}**（相关度：${Math.round(a.relevance * 100)}%）`)
          if (a.bridgingAnalogy) lines.push(`  > 💡 ${a.bridgingAnalogy}`)
        })
        lines.push('')
      }

      if (results.conflictConcepts.length > 0) {
        lines.push('### 🔴 认知冲突')
        lines.push('')
        results.conflictConcepts.forEach(c => {
          const concept = project.existingConcepts.find(x => x.id === c.id)
          lines.push(`- **${concept?.name || c.id}** [${c.conflictType}]`)
          lines.push(`  > ${c.description}`)
        })
        lines.push('')
      }

      if (results.restructuringRequired.length > 0) {
        lines.push('### 🟣 需要认知重构')
        lines.push('')
        results.restructuringRequired.forEach(r => {
          const c = project.existingConcepts.find(x => x.id === r.id)
          lines.push(`- **${c?.name || r.id}**：${r.reason}`)
        })
        lines.push('')
      }

      if (results.teachingSuggestions) {
        lines.push('### 💡 教学建议')
        lines.push('')
        lines.push(results.teachingSuggestions)
        lines.push('')
      }
    }

    lines.push('---')
    lines.push('*本报告由「知维图谱」自动生成*')

    return lines.join('\n')
  }

  const handleCopy = async () => {
    const md = generateMarkdown()
    await navigator.clipboard.writeText(md)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExport = () => {
    const md = generateMarkdown()
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name}-模拟报告.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!results) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
        <p style={{ fontSize: 16 }}>尚未运行模拟</p>
        <p style={{ fontSize: 13, marginTop: 8 }}>请先在「生态模拟」标签页中运行一次模拟分析</p>
      </div>
    )
  }

  const md = generateMarkdown()

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16 }}>📄 教学建议报告</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={handleCopy} style={{ fontSize: 12 }}>
            {copied ? <><Check size={14} /> 已复制</> : <><Copy size={14} /> 复制</>}
          </button>
          <button className="btn-primary" onClick={handleExport} style={{ fontSize: 12 }}>
            <Download size={14} /> 导出 Markdown
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <pre style={{
          whiteSpace: 'pre-wrap',
          fontSize: 13,
          lineHeight: 1.7,
          fontFamily: 'inherit',
          background: '#f8f9fa',
          padding: 20,
          borderRadius: 8,
          maxHeight: 'calc(100vh - 250px)',
          overflow: 'auto',
        }}>
          {md}
        </pre>
      </div>
    </div>
  )
}
