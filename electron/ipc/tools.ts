// ============================================
// 工具定义 + 执行器 — Function Calling
// ============================================

import fs from 'fs'
import path from 'path'
import { app } from 'electron'

// ---------- 工具 Schema（Anthropic 格式）----------

export const TOOL_DEFINITIONS = [
  {
    name: 'add_concepts',
    description: '向知识库批量添加新概念。返回添加结果。',
    input_schema: {
      type: 'object',
      properties: {
        concepts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: '概念名称' },
              description: { type: 'string', description: '概念的简要描述' },
              category: { type: 'string', enum: ['核心概念', '基础概念', '辅助概念'], description: '概念类别' },
              masteryLevel: { type: 'number', description: '学生预估掌握度 0-1' },
              tags: { type: 'array', items: { type: 'string' }, description: '标签列表' },
            },
            required: ['name', 'description', 'category'],
          },
          description: '要添加的概念列表',
        },
      },
      required: ['concepts'],
    },
  },
  {
    name: 'delete_concepts',
    description: '从知识库删除概念。自动清理关联的关系。返回删除结果。',
    input_schema: {
      type: 'object',
      properties: {
        names: {
          type: 'array',
          items: { type: 'string' },
          description: '要删除的概念名称列表（必须与库中名称精确匹配）',
        },
      },
      required: ['names'],
    },
  },
  {
    name: 'update_concept',
    description: '更新知识库中已有概念的属性。',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '要更新的概念名称' },
        changes: {
          type: 'object',
          properties: {
            name: { type: 'string', description: '新名称' },
            description: { type: 'string' },
            category: { type: 'string', enum: ['核心概念', '基础概念', '辅助概念', '迷思概念'] },
            masteryLevel: { type: 'number' },
            tags: { type: 'array', items: { type: 'string' } },
          },
          description: '要修改的字段',
        },
      },
      required: ['name', 'changes'],
    },
  },
  {
    name: 'add_relationships',
    description: '在概念之间添加关系。',
    input_schema: {
      type: 'object',
      properties: {
        relationships: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string', description: '源概念名称' },
              to: { type: 'string', description: '目标概念名称' },
              type: { type: 'string', enum: ['prerequisite', 'subsumes', 'analogy', 'conflicts', 'related'], description: '关系类型' },
              description: { type: 'string', description: '关系说明' },
              strength: { type: 'number', description: '关系强度 0-1' },
            },
            required: ['from', 'to', 'type'],
          },
          description: '要添加的关系列表',
        },
      },
      required: ['relationships'],
    },
  },
  {
    name: 'list_concepts',
    description: '列出知识库中所有概念和关系，用于查看当前状态。调用后你会获得完整的概念列表和关系列表。',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
]

// ---------- 工具执行 ----------

function getProjectPath(projectId: string): string {
  const dir = path.join(app.getPath('documents'), 'ConceptEcology', 'projects')
  return path.join(dir, `${projectId}.json`)
}

function loadProject(projectId: string): any {
  const p = getProjectPath(projectId)
  if (!fs.existsSync(p)) throw new Error(`项目不存在: ${projectId}`)
  return JSON.parse(fs.readFileSync(p, 'utf-8'))
}

function saveProject(projectId: string, data: any) {
  const p = getProjectPath(projectId)
  data.updatedAt = new Date().toISOString()
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8')
}

export function executeTool(toolName: string, toolInput: any, projectId: string): string {
  const project = loadProject(projectId)
  const concepts: any[] = project.existingConcepts || []
  const relationships: any[] = project.relationships || []

  switch (toolName) {
    case 'list_concepts': {
      const summary = concepts.map((c: any) =>
        `${c.name} [${c.category}] 掌握度${Math.round(c.masteryLevel * 100)}% — ${c.description} (id: ${c.id})`
      ).join('\n')
      const relSummary = relationships.map((r: any) => {
        const src = concepts.find((c: any) => c.id === r.source)
        const tgt = concepts.find((c: any) => c.id === r.target)
        return `${src?.name || r.source} --[${r.type}]--> ${tgt?.name || r.target}: ${r.description || ''}`
      }).join('\n')
      return `当前知识库有 ${concepts.length} 个概念，${relationships.length} 条关系。\n\n概念列表：\n${summary || '（空）'}\n\n关系列表：\n${relSummary || '（空）'}`
    }

    case 'add_concepts': {
      const items = toolInput.concepts || []
      const added: string[] = []
      for (const item of items) {
        const id = 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)
        concepts.push({
          id,
          name: item.name,
          description: item.description || '',
          category: item.category || '核心概念',
          masteryLevel: item.masteryLevel ?? 0.7,
          tags: item.tags || [],
        })
        added.push(item.name)
      }
      saveProject(projectId, { ...project, existingConcepts: concepts, relationships })
      return `成功添加 ${added.length} 个概念：${added.join('、')}`
    }

    case 'delete_concepts': {
      const names: string[] = toolInput.names || []
      const nameSet = new Set(names.map((n: string) => n.trim()))
      const toDeleteIds = new Set(concepts.filter((c: any) => nameSet.has(c.name.trim())).map((c: any) => c.id))
      const kept = concepts.filter((c: any) => !toDeleteIds.has(c.id))
      const keptRels = relationships.filter((r: any) => !toDeleteIds.has(r.source) && !toDeleteIds.has(r.target))
      const deleted = concepts.length - kept.length

      if (deleted === 0) {
        const available = concepts.map((c: any) => c.name).join('、')
        return `未找到匹配的概念。「${names.join('、')}」都不在库中。库中现有概念：${available.slice(0, 300)}`
      }

      saveProject(projectId, { ...project, existingConcepts: kept, relationships: keptRels })
      return `成功删除 ${deleted} 个概念（含 ${relationships.length - keptRels.length} 条关联关系）`
    }

    case 'update_concept': {
      const { name, changes } = toolInput
      const idx = concepts.findIndex((c: any) => c.name.trim() === name.trim())
      if (idx === -1) {
        return `未找到概念「${name}」。请用 list_concepts 查看库中所有概念的正确名称。`
      }
      concepts[idx] = { ...concepts[idx], ...changes }
      saveProject(projectId, { ...project, existingConcepts: concepts, relationships })
      const changedFields = Object.keys(changes).join('、')
      return `已更新「${name}」的 ${changedFields}`
    }

    case 'add_relationships': {
      const items = toolInput.relationships || []
      const added: string[] = []
      const failed: string[] = []
      for (const item of items) {
        const src = concepts.find((c: any) => c.name.trim() === (item.from || '').trim())
        const tgt = concepts.find((c: any) => c.name.trim() === (item.to || '').trim())
        if (src && tgt) {
          relationships.push({
            source: src.id,
            target: tgt.id,
            type: item.type || 'related',
            strength: item.strength ?? 0.8,
            description: item.description || '',
          })
          added.push(`${item.from} → ${item.to}`)
        } else {
          failed.push(`${item.from || '?'} → ${item.to || '?'}`)
        }
      }

      saveProject(projectId, { ...project, existingConcepts: concepts, relationships })
      let msg = `成功添加 ${added.length} 条关系`
      if (failed.length > 0) {
        msg += `。以下关系未匹配到概念名：${failed.join('、')}。请用 list_concepts 确认概念名称。`
      }
      return msg
    }

    default:
      return `未知工具: ${toolName}`
  }
}
