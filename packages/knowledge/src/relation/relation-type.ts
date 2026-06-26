/**
 * RelationType — the semantic meaning of a directed edge between KnowledgeNodes.
 *
 * Direction: source ──[RelationType]──▶ target
 *
 * Designed to be:
 * - Extensible (new types added as const, no code change needed elsewhere)
 * - LangGraph-compatible (edges carry semantic labels for conditional routing)
 */

export const RELATION_TYPES = [
  'SUPPORTS',         // source は target を支持する Evidence
  'CONTRADICTS',      // source は target を否定する
  'IS_A',             // source は target の一種である (taxonomic)
  'CAUSES',           // source は target を引き起こす (causal)
  'RELATED_TO',       // 意味的に関連する（弱い結合）
  'PRECEDES',         // source は target の前提条件である
  'DERIVED_FROM',     // source は target から導出された
  'EXEMPLIFIES',      // source は target の具体例である
] as const

export type RelationType = (typeof RELATION_TYPES)[number]

/** Edge directionality hint for graph traversal algorithms */
export type EdgeDirection = 'forward' | 'backward' | 'both'

/** Human-readable label for each relation type */
export const RELATION_LABELS: Record<RelationType, string> = {
  SUPPORTS:     '支持',
  CONTRADICTS:  '否定',
  IS_A:         '種類',
  CAUSES:       '原因',
  RELATED_TO:   '関連',
  PRECEDES:     '前提',
  DERIVED_FROM: '派生',
  EXEMPLIFIES:  '具体例',
}
