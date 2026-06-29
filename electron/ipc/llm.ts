import { IpcMain } from 'electron'
import { executeTool } from './tools'

interface Concept {
  id: string
  name: string
  description: string
  category: string
  masteryLevel: number
  tags: string[]
}

interface Relationship {
  source: string
  target: string
  type: string
  strength: number
  description: string
}

interface NewConcept {
  name: string
  description: string
}

interface Settings {
  llmProvider: string
  apiKey: string
  apiEndpoint: string
  model: string
  language: string
}

function buildSimulationPrompt(
  concepts: Concept[],
  relationships: Relationship[],
  newConcept: NewConcept
): string {
  const conceptMap = concepts.map(c => ({
    id: c.id,
    name: c.name,
    description: c.description,
    category: c.category,
    masteryLevel: c.masteryLevel,
  }))

  const relSummary = relationships.map(r => {
    const src = concepts.find(c => c.id === r.source)
    const tgt = concepts.find(c => c.id === r.target)
    return `${src?.name || r.source} --[${r.type}]--> ${tgt?.name || r.target}: ${r.description}`
  })

  return `你是一位认知心理学家，专精于以下理论：
- 皮亚杰认知发展理论（同化 assimilation、顺应 accommodation、平衡化 equilibration）
- 概念转变理论（Conceptual Change Theory, Posner et al.）
- 奥苏贝尔有意义学习理论（Ausubel's Meaningful Learning Theory，先行组织者 advance organizer）
- 变易理论（Variation Theory）

【任务】
分析一个"新概念"进入学生"已有概念生态"后会发生什么。
你需要找出：哪些已有概念可以助力学习（锚点）、哪些会造成阻碍（冲突）、哪些需要根本性重组（重构）。

【已有概念生态】
概念列表：
${JSON.stringify(conceptMap, null, 2)}

概念间关系：
${JSON.stringify(relSummary, null, 2)}

【待学新概念】
名称：${newConcept.name}
描述：${newConcept.description}

【分析要求】
1. **激活锚点**（activated + anchor）：哪些已有概念可作为同化新知识的"锚点"？为每个高相关锚点提供一个具体的桥梁类比或先行组织者。
2. **认知冲突**（conflict）：哪些已有概念（包括常见的迷思概念 misconception）会与新概念产生认知冲突？描述冲突类型和具体内容。
3. **认知重构**（restructuring）：哪些已有概念结构需要被根本性重组（accommodation）？说明原因。
4. **难度预测**：综合评估学生对这一新概念的学习难度（0-1 数值），并解释理由。
5. **教学建议**：给出 3 条具体、可操作的教学策略建议。

【输出格式】
严格返回以下 JSON 格式，不要包含任何其他文字、markdown 标记或解释：

{
  "activatedConcepts": ["概念ID1", "概念ID2"],
  "anchorConcepts": [
    {"id": "概念ID", "relevance": 0.9, "bridgingAnalogy": "具体的类比或桥梁描述"}
  ],
  "conflictConcepts": [
    {"id": "概念ID（或生成新ID如 'misconception_1'）", "conflictType": "misconception|prerequisite_gap|contradiction|ontological_mismatch", "description": "冲突的具体描述"}
  ],
  "restructuringRequired": [
    {"id": "概念ID", "reason": "需要重组的原因"}
  ],
  "difficultyPrediction": 0.65,
  "difficultyReason": "难度评估的理由",
  "teachingSuggestions": "三条具体的、可操作的教学策略建议，用中文分点列出"
}`
}

async function callLLM(prompt: string, settings: Settings): Promise<any> {
  const { apiKey, apiEndpoint, model, llmProvider } = settings

  if (!apiKey) {
    throw new Error('请先在设置中配置 API Key')
  }

  let url = apiEndpoint
  if (llmProvider === 'anthropic' && !url.includes('/v1/messages')) {
    url = 'https://api.anthropic.com/v1/messages'
  }
  if (llmProvider === 'openai' && !url.includes('/v1/chat')) {
    url = 'https://api.openai.com/v1/chat/completions'
  }

  let body: any
  let headers: Record<string, string>

  if (llmProvider === 'anthropic') {
    headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    }
    body = {
      model: model || 'claude-sonnet-4-6-20250514',
      max_tokens: 4096,
      system: '你是一个严格遵循指令的 AI 助手。只返回请求的 JSON 格式，不添加任何其他内容。',
      messages: [{ role: 'user', content: prompt }],
    }
  } else {
    // OpenAI 兼容模式
    headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    }
    body = {
      model: model || 'gpt-4o',
      max_tokens: 4096,
      messages: [
        { role: 'system', content: '你是一个严格遵循指令的 AI 助手。只返回请求的 JSON 格式，不添加任何其他内容。' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`LLM API 错误 (${response.status}): ${errText}`)
  }

  const json: any = await response.json()

  // 提取文本内容
  let text = ''
  if (llmProvider === 'anthropic') {
    text = json.content?.[0]?.text || ''
  } else {
    text = json.choices?.[0]?.message?.content || ''
  }

  return extractAndParseJSON(text)
}

// 从 LLM 返回的文本中提取并解析 JSON，带有容错能力
function extractAndParseJSON(text: string): any {
  // 1. 去掉 markdown 代码块包裹
  let cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()

  // 2. 尝试找到 JSON 对象的起止位置
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
    throw new Error('无法在 LLM 返回中定位 JSON 对象')
  }
  cleaned = cleaned.slice(firstBrace, lastBrace + 1)

  // 3. 首次尝试直接解析
  try {
    return JSON.parse(cleaned)
  } catch (_) {
    // 继续修复
  }

  // 4. 修复常见 JSON 语法问题
  let repaired = cleaned
    // 移除尾部逗号（数组和对象中的）
    .replace(/,(\s*[}\]])/g, '$1')
    // 修复缺失的引号（key 没有引号的情况）
    // LLM 偶尔会输出不带引号的 key
    .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
    // 移除注释（// 和 /* */）
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // 移除 JSON 中意外的换行（在字符串值中间的合法换行保留）
    // 修复空值：undefined, None, null → null
    .replace(/:\s*(undefined|None)\s*([,}\]])/g, ': null$2')

  try {
    return JSON.parse(repaired)
  } catch (err: any) {
    // 5. 还是失败，抛出带上下文的错误
    const snippet = cleaned.length > 500
      ? cleaned.slice(0, 250) + ' ... ' + cleaned.slice(-250)
      : cleaned
    throw new Error(
      `LLM 返回的 JSON 格式异常：${err.message}\n\n` +
      `--- 原始响应（已清理）---\n${snippet}\n` +
      `--- 修复后 ---\n${repaired.length > 500 ? repaired.slice(0, 250) + ' ... ' + repaired.slice(-250) : repaired}`
    )
  }
}

export function registerLLMHandlers(ipcMain: IpcMain) {
  // 概念生态模拟
  ipcMain.handle(
    'llm:simulate',
    async (_event, concepts: Concept[], relationships: Relationship[], newConcept: NewConcept, settings: Settings) => {
      const prompt = buildSimulationPrompt(concepts, relationships, newConcept)
      return await callLLM(prompt, settings)
    }
  )

  // 生成概念图谱骨架
  ipcMain.handle(
    'llm:generateSkeleton',
    async (_event, domain: string, topic: string, settings: Settings) => {
      const prompt = `你是一位经验丰富的学科教学专家。

请为【${domain} - ${topic}】这一学科主题，生成学生在学习该主题前通常已掌握的"概念知识图谱骨架"。

【要求】
1. 列出 6-12 个核心先备概念（prerequisite concepts）
2. 为每个概念给出：名称(name)、简要描述(description)、类别(category: "核心概念"/"基础概念"/"辅助概念")、预估学生掌握度(masteryLevel: 0-1)
3. 定义概念间的关系（relationships）：哪些是前提关系(prerequisite)、哪些是上下位关系(subsumes)、哪些是类比关系(analogy)
4. 给出 2-3 个常见的学生迷思概念（misconception）

【输出格式】严格返回 JSON：
{
  "concepts": [
    {"name": "...", "description": "...", "category": "核心概念", "masteryLevel": 0.8, "tags": ["..."]}
  ],
  "relationships": [
    {"sourceIndex": 0, "targetIndex": 1, "type": "prerequisite", "strength": 0.9, "description": "..."}
  ],
  "commonMisconceptions": [
    {"name": "...", "description": "..."}
  ]
}`

      return await callLLM(prompt, settings)
    }
  )

  // 对话式智能体 — Function Calling 模式
  ipcMain.on(
    'llm:chat-stream',
    async (event, messages: { role: string; content: string }[], projectContext: any, settings: Settings) => {
      try {
        await agentLoop(messages, projectContext, settings, projectContext.projectId || '', (text, done) => {
          event.sender.send('llm:chat-chunk', { text, done })
        })
      } catch (err: any) {
        event.sender.send('llm:chat-chunk', { text: '错误：' + (err.message || '未知'), done: true })
      }
    }
  )

  // 非流式回退
  ipcMain.handle(
    'llm:chat',
    async (_event, messages: { role: string; content: string }[], projectContext: any, settings: Settings) => {
      let result = ''
      await agentLoop(messages, projectContext, settings, projectContext.projectId || '', (text, done) => {
        result += text
      })
      return result
    }
  )
}

// ============ Agent 循环（自实现工具调用，兼容所有模型）============

const TOOL_SYSTEM_PROMPT = `你是概念知识库管理助手。你可以通过调用工具来直接操作知识库。

## 可用工具

1. list_concepts — 查看所有概念和关系
2. add_concepts — 批量添加概念
   参数: {"concepts":[{"name":"名称","description":"描述","category":"核心概念|基础概念|辅助概念","masteryLevel":0.8,"tags":[]}]}
3. delete_concepts — 删除概念（自动清理关联关系）
   参数: {"names":["概念名1","概念名2"]}
4. update_concept — 更新概念
   参数: {"name":"概念名","changes":{"masteryLevel":0.9}}
5. add_relationships — 添加关系
   参数: {"relationships":[{"from":"概念A","to":"概念B","type":"prerequisite|subsumes|analogy|conflicts|related","description":"说明"}]}

## 使用方式

当你需要操作知识库时，在回复中插入工具调用块：

<tool>
工具名
{"参数名":"参数值"}
</tool>

例如：
<tool>
add_concepts
{"concepts":[{"name":"加速度","description":"描述速度变化快慢","category":"核心概念","masteryLevel":0.5,"tags":["运动学"]}]}
</tool>

每段回复中可以包含多个 <tool> 块。不要输出 JSON 代码块，只用 <tool> 标签。
操作前先用 list_concepts 确认概念名是否精确匹配。重要：概念名必须和库中完全一致。
如果用户要求删除，先列出要删的内容征求确认。删除操作只匹配完全一致的概念名。`

async function agentLoop(
  messages: { role: string; content: string }[],
  ctx: any,
  settings: Settings,
  projectId: string,
  onChunk: (text: string, done: boolean) => void
): Promise<void> {
  const { apiKey, apiEndpoint, model, llmProvider } = settings
  if (!apiKey) { onChunk('请先配置 API Key', true); return }

  // 构建包含当前知识库信息的上下文
  const conceptsSummary = (ctx.existingConcepts || [])
    .map((c: any) => `${c.name} [${c.category}] — ${c.description}`)
    .join('\n')
  const relsSummary = (ctx.relationships || [])
    .map((r: any) => {
      const src = (ctx.existingConcepts || []).find((c: any) => c.id === r.source)
      const tgt = (ctx.existingConcepts || []).find((c: any) => c.id === r.target)
      return `${src?.name || r.source} --[${r.type}]--> ${tgt?.name || r.target}`
    }).join('\n')

  const sysPrompt = `${TOOL_SYSTEM_PROMPT}\n\n学科：${ctx.subjectDomain || '未指定'}，对象：${ctx.targetAudience || '未指定'}\n\n## 当前知识库\n\n概念 (${(ctx.existingConcepts||[]).length}个)：\n${conceptsSummary || '（空）'}\n\n关系 (${(ctx.relationships||[]).length}条)：\n${relsSummary || '（空）'}`

  const apiMessages: any[] = [
    { role: 'system', content: sysPrompt },
    ...messages.map(m => ({ role: m.role, content: m.content })),
  ]

  let url = apiEndpoint
  const headers: Record<string, string> = llmProvider === 'anthropic'
    ? { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }
    : { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }

  if (llmProvider === 'anthropic' && !url.includes('/v1/messages')) url = 'https://api.anthropic.com/v1/messages'
  if (llmProvider === 'openai' && !url.includes('/v1/chat')) url = 'https://api.openai.com/v1/chat/completions'

  // 最多 5 轮
  for (let turn = 0; turn < 5; turn++) {
    let body: any
    if (llmProvider === 'anthropic') {
      body = {
        model: model || 'claude-sonnet-4-6-20250514',
        max_tokens: 4096,
        system: apiMessages.find(m => m.role === 'system')?.content || '',
        messages: apiMessages.filter(m => m.role !== 'system').map((m: any) => ({ role: m.role, content: m.content })),
      }
    } else {
      body = {
        model: model || 'deepseek-chat',
        max_tokens: 4096,
        messages: apiMessages.map((m: any) => ({ role: m.role, content: m.content })),
        temperature: 0.7,
      }
    }

    const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
    if (!response.ok) {
      const et = await response.text()
      onChunk(`API 错误 (${response.status}): ${et.slice(0, 300)}`, true)
      return
    }

    const json: any = await response.json()
    let text = ''
    if (llmProvider === 'anthropic') {
      text = (json.content || []).map((b: any) => b.text || '').join('')
    } else {
      text = json.choices?.[0]?.message?.content || ''
    }

    if (!text.trim()) {
      onChunk('（模型返回空内容，请检查 API 配置）', true)
      return
    }

    // 解析 <tool> 标签
    const toolRegex = /<tool>\s*\n?\s*(\S+)\s*\n?\s*(\{[\s\S]*?\})\s*\n?\s*<\/tool>/g
    const toolCalls: { name: string; input: any }[] = []
    let displayText = text
    let match

    while ((match = toolRegex.exec(text)) !== null) {
      const toolName = match[1].trim()
      try {
        const input = JSON.parse(match[2].trim())
        toolCalls.push({ name: toolName, input })
      } catch {
        // JSON 解析失败，跳过
      }
    }

    // 去掉 tool 标签用于显示
    displayText = displayText.replace(/<tool>[\s\S]*?<\/tool>/g, '').trim()

    if (toolCalls.length > 0) {
      // 有工具调用：先显示文本部分，执行工具，把结果发给 LLM 继续
      if (displayText) {
        onChunk(displayText + '\n\n', false)
      }

      // 执行工具
      const results: string[] = []
      for (const tc of toolCalls) {
        try {
          const result = executeTool(tc.name, tc.input, projectId)
          results.push(`[${tc.name}] ${result}`)
        } catch (err: any) {
          results.push(`[${tc.name}] 执行失败: ${err.message}`)
        }
      }

      // 把工具调用和结果加入对话
      apiMessages.push({ role: 'assistant', content: text })
      apiMessages.push({ role: 'user', content: `<tool_results>\n${results.join('\n')}\n</tool_results>\n请根据以上工具执行结果继续回复用户。如果操作成功，简要告知用户。如果还需要其他操作，继续使用 <tool> 标签。` })

      // 继续下一轮
      continue
    }

    // 没有工具调用：纯文本回复，流式输出
    if (displayText) {
      onChunk(displayText, false)
    }
    onChunk('', true)
    return
  }

  onChunk('（操作轮次过多，停止）', true)
}

// ============ 模拟引擎 Prompt ============

