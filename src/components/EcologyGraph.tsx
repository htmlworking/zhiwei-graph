import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import type { Concept, Relationship, NewConceptFull, GraphNode, GraphLink } from '../types'

interface Props {
  concepts: Concept[]
  relationships: Relationship[]
  newConcept: NewConceptFull | null
}

const COLORS = {
  normal: { fill: '#aeaeb2', stroke: '#8e8e93' },
  activated: { fill: '#5ac8fa', stroke: '#4ac8f0' },
  anchor: { fill: '#34c759', stroke: '#30b84c' },
  conflict: { fill: '#ff3b30', stroke: '#e0352b' },
  new: { fill: '#af52de', stroke: '#9b3fd4' },
  restructure: { fill: '#ff9500', stroke: '#e68600' },
  link: {
    prerequisite: '#8e8e93',
    subsumes: '#af52de',
    conflicts: '#ff3b30',
    analogy: '#34c759',
    related: '#aeaeb2',
    simulated: '#af52de',
  },
}

export default function EcologyGraph({ concepts, relationships, newConcept }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)

    const g = svg.append('g')
    svg.call(d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      }) as any)

    // 构建节点
    const simResults = newConcept?.simulationResults
    const anchorSet = new Set(simResults?.anchorConcepts?.map(a => a.id) || [])
    const conflictSet = new Set(simResults?.conflictConcepts?.map(c => c.id) || [])
    const activatedSet = new Set(simResults?.activatedConcepts || [])
    const restructureSet = new Set(simResults?.restructuringRequired?.map(r => r.id) || [])

    const nodes: GraphNode[] = concepts.map(c => ({
      id: c.id,
      name: c.name,
      category: c.category,
      masteryLevel: c.masteryLevel,
      isActivated: activatedSet.has(c.id),
      isAnchor: anchorSet.has(c.id),
      isConflict: conflictSet.has(c.id),
      needsRestructuring: restructureSet.has(c.id),
    }))

    if (newConcept) {
      nodes.push({
        id: '__new__',
        name: newConcept.name,
        category: '核心概念',
        masteryLevel: 0,
        isNew: true,
      })
    }

    // 过滤掉引用不存在的概念的边（防御性）
    const nodeIds = new Set(concepts.map(c => c.id))
    const links: GraphLink[] = relationships
      .filter(r => nodeIds.has(r.source) && nodeIds.has(r.target))
      .map(r => ({
        source: r.source,
        target: r.target,
        type: r.type,
        strength: r.strength,
        description: r.description,
      }))

    // 新概念 → 锚点虚线
    if (newConcept && simResults) {
      const added = new Set<string>()
      simResults.anchorConcepts?.forEach(a => { added.add(a.id) })
      simResults.activatedConcepts?.forEach(id => { added.add(id) })
      added.forEach(id => {
        if (nodes.some(n => n.id === id)) {
          links.push({
            source: '__new__',
            target: id,
            type: 'related',
            strength: 0.6,
            description: '模拟关联',
          })
        }
      })
    }

    // 力模拟
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links as any).id((d: any) => d.id).distance(130))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(45))

    // 边
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', (d: any) => {
        const srcId = d.source?.id || d.source
        const tgtId = d.target?.id || d.target
        if (srcId === '__new__' || tgtId === '__new__') return COLORS.link.simulated
        return COLORS.link[d.type as keyof typeof COLORS.link] || COLORS.link.related
      })
      .attr('stroke-width', d => (d.strength || 0.5) * 2.5)
      .attr('stroke-dasharray', (d: any) => {
        const srcId = d.source?.id || d.source
        const tgtId = d.target?.id || d.target
        return (srcId === '__new__' || tgtId === '__new__') ? '6,4' : 'none'
      })
      .attr('stroke-opacity', 0.35)

    // 节点组
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag<any, any>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x; d.fy = d.y
        })
        .on('drag', (event, d) => {
          d.fx = event.x; d.fy = event.y
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null; d.fy = null
        }) as any)

    // 光晕（新概念）
    node.filter(d => d.isNew as boolean)
      .append('circle')
      .attr('r', 30)
      .attr('fill', 'none')
      .attr('stroke', COLORS.new.fill)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,4')
      .attr('opacity', 0.35)
      .lower()

    // 节点圆
    node.append('circle')
      .attr('r', d => {
        if (d.isNew) return 24
        if (d.isAnchor) return 19
        if (d.isConflict) return 17
        return 15
      })
      .attr('fill', d => {
        if (d.isNew) return COLORS.new.fill
        if (d.isConflict) return COLORS.conflict.fill
        if (d.isAnchor) return COLORS.anchor.fill
        if (d.isActivated) return COLORS.activated.fill
        if (d.needsRestructuring) return COLORS.restructure.fill
        return COLORS.normal.fill
      })
      .attr('stroke', d => {
        if (d.isNew) return COLORS.new.stroke
        if (d.isConflict) return COLORS.conflict.stroke
        if (d.isAnchor) return COLORS.anchor.stroke
        return COLORS.normal.stroke
      })
      .attr('stroke-width', d => (d.isNew || d.isConflict || d.isAnchor) ? 2.5 : 1.2)
      .attr('opacity', 0.9)

    // 锚点标记 ✓
    node.filter(d => Boolean(d.isAnchor) && !d.isNew).append('text')
      .text('✓')
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .attr('font-size', 12)
      .attr('font-weight', 700)
      .attr('fill', 'white')
      .attr('pointer-events', 'none')

    // 标签
    node.append('text')
      .text(d => d.name)
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.isNew ? 40 : 28)
      .attr('font-size', d => d.isNew ? 14 : 11)
      .attr('font-weight', d => d.isNew ? 600 : 500)
      .attr('fill', d => d.isNew ? COLORS.new.fill : '#1c1c1e')
      .attr('letter-spacing', '-0.01em')
      .attr('pointer-events', 'none')

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)
      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
    })

    return () => { simulation.stop() }
  }, [concepts, relationships, newConcept, containerRef.current?.clientWidth, containerRef.current?.clientHeight])

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
      {/* iOS 风格图例 */}
      <div style={{
        position: 'absolute',
        bottom: 10,
        left: 10,
        right: 10,
        display: 'flex',
        flexWrap: 'wrap',
        gap: '3px 8px',
        fontSize: 10,
        color: 'var(--ios-text-secondary)',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: '6px 10px',
        borderRadius: 100,
        justifyContent: 'center',
        border: '0.5px solid var(--ios-separator)',
      }}>
        <Legend color={COLORS.anchor.fill} label="同化锚点" />
        <Legend color={COLORS.conflict.fill} label="认知冲突" />
        <Legend color={COLORS.activated.fill} label="激活概念" />
        <Legend color={COLORS.restructure.fill} label="需重构" />
        <Legend color={COLORS.new.fill} label="新概念" />
      </div>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: color, display: 'inline-block',
        boxShadow: `0 0 4px ${color}40`,
      }} />
      {label}
    </span>
  )
}
