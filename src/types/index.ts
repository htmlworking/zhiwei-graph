// ============ 概念 ============
export interface Concept {
  id: string
  name: string
  description: string
  category: '核心概念' | '基础概念' | '辅助概念' | '迷思概念'
  masteryLevel: number // 0-1
  tags: string[]
}

// ============ 概念关系 ============
export type RelationshipType = 'prerequisite' | 'subsumes' | 'conflicts' | 'analogy' | 'related'

export interface Relationship {
  source: string
  target: string
  type: RelationshipType
  strength: number // 0-1
  description: string
}

// ============ 新概念 + 模拟结果 ============
export interface NewConceptInput {
  name: string
  description: string
}

export interface AnchorConcept {
  id: string
  relevance: number
  bridgingAnalogy: string
}

export interface ConflictConcept {
  id: string
  conflictType: 'misconception' | 'prerequisite_gap' | 'contradiction' | 'ontological_mismatch'
  description: string
}

export interface RestructuringItem {
  id: string
  reason: string
}

export interface SimulationResults {
  activatedConcepts: string[]
  anchorConcepts: AnchorConcept[]
  conflictConcepts: ConflictConcept[]
  restructuringRequired: RestructuringItem[]
  difficultyPrediction: number
  difficultyReason: string
  teachingSuggestions: string
}

export interface NewConceptFull {
  name: string
  description: string
  simulationResults: SimulationResults | null
}

// ============ 模拟历史 ============
export interface SimulationHistoryItem {
  timestamp: string
  newConceptName: string
  newConceptDescription: string
  difficultyPrediction: number
  summary: string
}

// ============ 项目 ============
export interface Project {
  id: string
  name: string
  subjectDomain: string
  targetAudience: string
  createdAt: string
  updatedAt: string
  existingConcepts: Concept[]
  relationships: Relationship[]
  newConcept: NewConceptFull | null
  simulationHistory: SimulationHistoryItem[]
}

// ============ 项目列表项 ============
export interface ProjectListItem {
  id: string
  name: string
  subjectDomain: string
  targetAudience: string
  createdAt: string
  updatedAt: string
  conceptCount: number
}

// ============ 设置 ============
export interface Settings {
  llmProvider: 'anthropic' | 'openai' | 'custom'
  apiKey: string
  apiEndpoint: string
  model: string
  language: string
}

// ============ AI 生成的概念骨架 ============
export interface GeneratedConcept {
  name: string
  description: string
  category: Concept['category']
  masteryLevel: number
  tags: string[]
}

export interface GeneratedRelationship {
  sourceIndex: number
  targetIndex: number
  type: RelationshipType
  strength: number
  description: string
}

export interface GeneratedMisconception {
  name: string
  description: string
}

export interface GeneratedSkeleton {
  concepts: GeneratedConcept[]
  relationships: GeneratedRelationship[]
  commonMisconceptions: GeneratedMisconception[]
}

// ============ D3 图谱节点/边 ============
export interface GraphNode {
  id: string
  name: string
  category: string
  masteryLevel: number
  isNew?: boolean
  // 模拟后的标记
  isActivated?: boolean
  isAnchor?: boolean
  isConflict?: boolean
  needsRestructuring?: boolean
}

export interface GraphLink {
  source: string | GraphNode
  target: string | GraphNode
  type: RelationshipType
  strength: number
  description: string
}

// ============ Electron API ============
export interface ElectronAPI {
  listProjects: () => Promise<ProjectListItem[]>
  createProject: (data: Partial<Project>) => Promise<Project>
  readProject: (id: string) => Promise<Project>
  updateProject: (id: string, data: Partial<Project>) => Promise<Project>
  deleteProject: (id: string) => Promise<{ success: boolean }>
  exportProject: (id: string) => Promise<{ success: boolean; path?: string }>
  importProject: () => Promise<Project | null>
  getSettings: () => Promise<Settings>
  saveSettings: (data: Partial<Settings>) => Promise<Settings>
  runSimulation: (
    concepts: Concept[],
    relationships: Relationship[],
    newConcept: NewConceptInput,
    settings: Settings
  ) => Promise<SimulationResults>
  generateConceptSkeleton: (
    domain: string,
    topic: string,
    settings: Settings
  ) => Promise<GeneratedSkeleton>
  chatWithAgent: (
    messages: ChatMessage[],
    projectContext: any,
    settings: Settings
  ) => Promise<string>
  chatWithAgentStream: (
    messages: ChatMessage[],
    projectContext: any,
    settings: Settings,
    callback: (data: { text: string; done: boolean; error?: boolean }) => void
  ) => () => void
  minimizeWindow: () => void
  maximizeWindow: () => void
  closeWindow: () => void
  onMaximizedChange: (callback: (maximized: boolean) => void) => () => void
}

// 聊天消息
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// 智能体动作（从 LLM 回复中解析）
export interface AgentAction {
  type: 'add_concepts' | 'add_relationships' | 'update_concept' | 'delete_concept'
  data: any
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
