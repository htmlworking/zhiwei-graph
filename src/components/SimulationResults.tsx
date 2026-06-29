import { AlertTriangle, Anchor, Zap, RefreshCw, Lightbulb } from 'lucide-react'
import type { SimulationResults as SR, Concept } from '../types'

interface Props {
  results: SR
  concepts: Concept[]
}

export default function SimulationResults({ results, concepts }: Props) {
  const getConcept = (id: string) => concepts.find(c => c.id === id)

  return (
    <div style={{ marginTop: 16 }}>
      {/* 难度预测 */}
      <div className="card" style={{
        padding: 16,
        marginBottom: 12,
        background: results.difficultyPrediction > 0.7 ? '#fff5f5' : results.difficultyPrediction > 0.4 ? '#fffdf0' : '#f0fff4',
        borderLeft: `4px solid ${results.difficultyPrediction > 0.7 ? '#e17055' : results.difficultyPrediction > 0.4 ? '#fdcb6e' : '#00b894'}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600 }}>📊 学习难度预测</span>
          <span style={{
            fontSize: 24,
            fontWeight: 700,
            color: results.difficultyPrediction > 0.7 ? '#e17055' : results.difficultyPrediction > 0.4 ? '#e17055' : '#00b894',
          }}>
            {Math.round(results.difficultyPrediction * 100)}%
          </span>
        </div>
        {results.difficultyReason && (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>{results.difficultyReason}</p>
        )}
      </div>

      {/* 激活锚点 */}
      <ResultSection
        icon={<Anchor size={16} />}
        title="同化锚点"
        color="#00b894"
        count={results.anchorConcepts.length}
      >
        {results.anchorConcepts.length === 0 ? (
          <EmptyHint text="未检测到明显锚点概念，建议先补充基础概念" />
        ) : (
          results.anchorConcepts.map((a, i) => {
            const c = getConcept(a.id)
            return (
              <ResultItem key={i}>
                <strong>{c?.name || a.id}</strong>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 8 }}>
                  相关度: {Math.round(a.relevance * 100)}%
                </span>
                {a.bridgingAnalogy && (
                  <p style={{ fontSize: 13, marginTop: 4, color: 'var(--text)' }}>
                    💡 {a.bridgingAnalogy}
                  </p>
                )}
              </ResultItem>
            )
          })
        )}
      </ResultSection>

      {/* 认知冲突 */}
      <ResultSection
        icon={<AlertTriangle size={16} />}
        title="认知冲突"
        color="#e17055"
        count={results.conflictConcepts.length}
      >
        {results.conflictConcepts.length === 0 ? (
          <EmptyHint text="未检测到明显认知冲突" />
        ) : (
          results.conflictConcepts.map((c, i) => {
            const concept = getConcept(c.id)
            return (
              <ResultItem key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong>{concept?.name || c.id}</strong>
                  <span style={{
                    fontSize: 11,
                    padding: '2px 6px',
                    borderRadius: 8,
                    background: '#ffeaa7',
                    color: '#d63031',
                  }}>
                    {CONFLICT_TYPE_LABELS[c.conflictType] || c.conflictType}
                  </span>
                </div>
                <p style={{ fontSize: 13, marginTop: 4 }}>{c.description}</p>
              </ResultItem>
            )
          })
        )}
      </ResultSection>

      {/* 认知重构 */}
      <ResultSection
        icon={<RefreshCw size={16} />}
        title="需要认知重构"
        color="#6c5ce7"
        count={results.restructuringRequired.length}
      >
        {results.restructuringRequired.length === 0 ? (
          <EmptyHint text="未检测到需要认知重构的概念" />
        ) : (
          results.restructuringRequired.map((r, i) => {
            const c = getConcept(r.id)
            return (
              <ResultItem key={i}>
                <strong>{c?.name || r.id}</strong>
                <p style={{ fontSize: 13, marginTop: 4, color: 'var(--text-secondary)' }}>{r.reason}</p>
              </ResultItem>
            )
          })
        )}
      </ResultSection>

      {/* 教学建议 */}
      {results.teachingSuggestions && (
        <ResultSection
          icon={<Lightbulb size={16} />}
          title="教学建议"
          color="#fdcb6e"
        >
          <div style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {results.teachingSuggestions}
          </div>
        </ResultSection>
      )}
    </div>
  )
}

// 冲突类型中文
const CONFLICT_TYPE_LABELS: Record<string, string> = {
  misconception: '迷思概念',
  prerequisite_gap: '前提缺失',
  contradiction: '直接矛盾',
  ontological_mismatch: '本体论错位',
}

// 子组件
function ResultSection({ icon, title, color, count, children }: {
  icon: React.ReactNode; title: string; color: string; count?: number; children: React.ReactNode
}) {
  return (
    <div className="card" style={{ padding: 14, marginBottom: 10, borderLeft: `3px solid ${color}` }}>
      <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, marginBottom: 8, color }}>
        {icon} {title}
        {count != null && <span style={{ fontSize: 12, fontWeight: 400 }}>({count})</span>}
      </h4>
      {children}
    </div>
  )
}

function ResultItem({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
      {children}
    </div>
  )
}

function EmptyHint({ text }: { text: string }) {
  return <p style={{ fontSize: 13, color: '#b2bec3', fontStyle: 'italic' }}>{text}</p>
}
