import { Entity, type EntityProps } from '@innovation-os/domain/core'
import { generateId, type PrefixedId } from '@innovation-os/foundation/ids'
import { systemClock } from '@innovation-os/foundation/time'
import type { Hypothesis, HypothesisType } from '../hypothesis/hypothesis.js'

export type EvidenceRequestId = PrefixedId<'evreq'>

export type EvidenceRequestType =
  | 'confirm'   // find evidence that confirms the hypothesis
  | 'refute'    // find evidence that refutes the hypothesis
  | 'quantify'  // establish a degree or magnitude
  | 'explore'   // open-ended — the system doesn't know what kind of evidence to expect

export type EvidenceRequestStatus = 'open' | 'answered' | 'abandoned'

type EvidenceRequestProps = EntityProps & {
  readonly id: EvidenceRequestId
  readonly hypothesisId: string
  readonly requestType: EvidenceRequestType
  readonly question: string
  readonly priority: number
  readonly status: EvidenceRequestStatus
  readonly theme: string
}

/**
 * EvidenceRequest — a question the system poses before being asked.
 *
 * This is the moment where Knowledge OS transitions from passive storage
 * to active inquiry. The system noticed something (contradiction, pattern,
 * transitive gap) and is now asking: "Can you help me verify this?"
 *
 * The `question` field is generated deterministically from the hypothesis type
 * and content — no AI required for question generation.
 *
 * Question templates by hypothesis type:
 *   resolve_contradiction:  「X」と「Y」、どちらがより正確ですか？
 *   emergent_principle:     これは他の状況でも成立しますか？反例はありますか？
 *   causal_hypothesis:      この因果連鎖を支持・否定する証拠はありますか？
 *   transitive_causation:   A→Bが間接的にCを引き起こすという直接的な証拠はありますか？
 *   missing_relation:       これら2つの事実の間にはどのような関係がありますか？
 *
 * Priority:
 *   1.0 — must resolve (high-severity contradiction, bridge fact)
 *   0.7 — should verify (emergent principle)
 *   0.4 — worth exploring (transitive inference)
 */
export class EvidenceRequest extends Entity<EvidenceRequestProps> {
  private constructor(props: EvidenceRequestProps) {
    super(props)
  }

  static fromHypothesis(hypothesis: Hypothesis, theme: string): EvidenceRequest {
    const now = systemClock.now()
    return new EvidenceRequest({
      id: generateId('evreq'),
      hypothesisId: hypothesis.id,
      requestType: deriveRequestType(hypothesis.hypothesisType),
      question: generateQuestion(hypothesis),
      priority: derivePriority(hypothesis),
      status: 'open',
      theme,
      createdAt: now,
      updatedAt: now,
    })
  }

  static reconstitute(props: EvidenceRequestProps): EvidenceRequest {
    return new EvidenceRequest(props)
  }

  get hypothesisId(): string { return this.props.hypothesisId }
  get requestType(): EvidenceRequestType { return this.props.requestType }
  get question(): string { return this.props.question }
  get priority(): number { return this.props.priority }
  get status(): EvidenceRequestStatus { return this.props.status }
  get theme(): string { return this.props.theme }

  isOpen(): boolean { return this.props.status === 'open' }
  isHighPriority(): boolean { return this.props.priority >= 0.7 }

  answer(): EvidenceRequest {
    return new EvidenceRequest({ ...this.props, status: 'answered', updatedAt: systemClock.now() })
  }

  abandon(): EvidenceRequest {
    return new EvidenceRequest({ ...this.props, status: 'abandoned', updatedAt: systemClock.now() })
  }

  toProps(): EvidenceRequestProps { return this.props }
}

// ── Internal helpers ───────────────────────────────────────────────────────

function deriveRequestType(type: HypothesisType): EvidenceRequestType {
  switch (type) {
    case 'resolve_contradiction': return 'refute'
    case 'emergent_principle':    return 'confirm'
    case 'causal_hypothesis':     return 'confirm'
    case 'transitive_causation':  return 'explore'
    case 'missing_relation':      return 'explore'
  }
}

function derivePriority(hypothesis: Hypothesis): number {
  switch (hypothesis.hypothesisType) {
    case 'resolve_contradiction': return 1.0
    case 'emergent_principle':    return 0.7
    case 'causal_hypothesis':     return 0.6
    case 'transitive_causation':  return 0.4
    case 'missing_relation':      return 0.5
  }
}

function generateQuestion(hypothesis: Hypothesis): string {
  const facts = hypothesis.supportingFacts
  const a = facts[0]?.content.slice(0, 60) ?? ''
  const b = facts[1]?.content.slice(0, 60) ?? ''

  switch (hypothesis.hypothesisType) {
    case 'resolve_contradiction':
      return `矛盾の解消が必要です。\n「${a}」\nと\n「${b}」\nはどちらがより正確ですか？この矛盾を解消する証拠はありますか？`

    case 'emergent_principle':
      return `原則候補の検証が必要です。\n${hypothesis.claim}\nこれは他のドメインや状況でも成立しますか？反例はありますか？`

    case 'causal_hypothesis':
      return `因果連鎖の検証が必要です。\n${hypothesis.claim}\nこの連鎖を全体として支持、または否定する証拠を探してください。`

    case 'transitive_causation':
      return `推移的因果の検証が必要です。\n${hypothesis.claim}\n「${a}」が直接「${b}」に影響を与えるという証拠はありますか？`

    case 'missing_relation':
      return `未記録の関係の確認が必要です。\n「${a}」\nと\n「${b}」\nは意味的に近いです。どのような関係がありますか？`
  }
}
