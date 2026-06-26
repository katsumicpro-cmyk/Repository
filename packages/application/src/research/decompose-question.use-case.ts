import { ok, isOk, err, type Result } from '@innovation-os/shared/result'
import { validationError } from '@innovation-os/shared/errors'
import type { AppError } from '@innovation-os/shared/errors'
import type { EvidenceRequestRepository, HypothesisRepository, ResearchPlanRepository } from '@innovation-os/knowledge/repository'
import type { EvidenceRequestId } from '@innovation-os/knowledge/reasoning'
import { ResearchQuestion, ResearchPlan } from '@innovation-os/knowledge/research'
import type { Hypothesis } from '@innovation-os/knowledge/reasoning'

export type DecomposeQuestionInput = {
  readonly evidenceRequestId: EvidenceRequestId
  readonly theme: string
}

export type DecomposeQuestionOutput = {
  readonly plan: ResearchPlan
}

/**
 * DecomposeQuestionUseCase — transforms an EvidenceRequest into a ResearchPlan.
 *
 * This is the "Research Planning" capability.
 * The system takes a question it generated (EvidenceRequest) and decides:
 *   - What sub-questions need to be answered?
 *   - In what order should they be searched?
 *   - What search terms will find relevant evidence?
 *
 * Decomposition is deterministic based on hypothesis type:
 *
 *   resolve_contradiction →
 *     "Find evidence supporting factA"      (factual, priority 0.9)
 *     "Find evidence supporting factB"      (factual, priority 0.9)
 *     "Find a third perspective"            (exploratory, priority 0.5)
 *
 *   emergent_principle →
 *     "Find confirming evidence"            (factual, priority 0.8)
 *     "Find counter-examples"               (comparative, priority 0.7)
 *
 *   causal_hypothesis / transitive_causation →
 *     "Find direct causal evidence"         (causal, priority 0.8)
 *     "Find intermediate mechanisms"        (causal, priority 0.6)
 *
 *   default →
 *     "Search for related facts"            (exploratory, priority 0.6)
 *
 * No AI is called. Term extraction is rule-based.
 */
export class DecomposeQuestionUseCase {
  constructor(
    private readonly evidenceRequestRepo: EvidenceRequestRepository,
    private readonly hypothesisRepo: HypothesisRepository,
    private readonly planRepo: ResearchPlanRepository,
  ) {}

  async execute(input: DecomposeQuestionInput): Promise<Result<DecomposeQuestionOutput, AppError>> {
    // Load EvidenceRequest
    const erResult = await this.evidenceRequestRepo.findById(input.evidenceRequestId)
    if (!isOk(erResult)) return erResult
    const evidenceRequest = erResult.value

    // Load Hypothesis
    const hypoResult = await this.hypothesisRepo.findById(evidenceRequest.hypothesisId as ReturnType<typeof evidenceRequest.hypothesisId extends string ? () => string : never>)
    if (!isOk(hypoResult)) return hypoResult
    const hypothesis = hypoResult.value

    // Decompose
    const questionsResult = decomposeHypothesis(hypothesis)
    if (questionsResult.length === 0) {
      return err(validationError('DecomposeQuestion: could not extract any research questions'))
    }

    const planResult = ResearchPlan.create({
      hypothesisId: hypothesis.id,
      evidenceRequestId: evidenceRequest.id,
      theme: input.theme,
      questions: questionsResult,
      strategy: deriveStrategy(hypothesis),
    })
    if (!isOk(planResult)) return planResult

    const saved = await this.planRepo.save(planResult.value)
    if (!isOk(saved)) return saved

    return ok({ plan: saved.value })
  }
}

// ── Internal: decomposition logic ─────────────────────────────────────────

function decomposeHypothesis(hypothesis: Hypothesis): ResearchQuestion[] {
  const facts = hypothesis.supportingFacts
  const questions: ResearchQuestion[] = []

  switch (hypothesis.hypothesisType) {
    case 'resolve_contradiction': {
      const a = facts[0]
      const b = facts[1]
      if (a) {
        const qr = ResearchQuestion.create({
          text: `「${a.content.slice(0, 50)}」を支持する追加証拠を探す`,
          questionType: 'factual',
          searchTerms: extractTerms(a.content),
          priority: 0.9,
        })
        if (isOk(qr)) questions.push(qr.value)
      }
      if (b) {
        const qr = ResearchQuestion.create({
          text: `「${b.content.slice(0, 50)}」を支持する追加証拠を探す`,
          questionType: 'factual',
          searchTerms: extractTerms(b.content),
          priority: 0.9,
        })
        if (isOk(qr)) questions.push(qr.value)
      }
      const allTerms = [...extractTerms(a?.content ?? ''), ...extractTerms(b?.content ?? '')]
      const unique = [...new Set(allTerms)].slice(0, 5)
      if (unique.length > 0) {
        const qr = ResearchQuestion.create({
          text: `この矛盾を解消する第三の観点・中立的な証拠を探す`,
          questionType: 'exploratory',
          searchTerms: unique,
          priority: 0.5,
        })
        if (isOk(qr)) questions.push(qr.value)
      }
      break
    }

    case 'emergent_principle': {
      const terms = extractTerms(hypothesis.claim)
      const q1 = ResearchQuestion.create({
        text: `原則を支持する事実を探す: 「${hypothesis.claim.slice(0, 60)}」`,
        questionType: 'factual',
        searchTerms: terms,
        priority: 0.8,
      })
      if (isOk(q1)) questions.push(q1.value)
      const q2 = ResearchQuestion.create({
        text: `この原則の反例・例外・成立しない条件を探す`,
        questionType: 'comparative',
        searchTerms: terms,
        priority: 0.7,
      })
      if (isOk(q2)) questions.push(q2.value)
      break
    }

    case 'causal_hypothesis':
    case 'transitive_causation': {
      const a = facts[0]
      const c = facts[facts.length - 1]
      const aTerms = extractTerms(a?.content ?? '')
      const cTerms = extractTerms(c?.content ?? '')
      const allTerms = [...new Set([...aTerms, ...cTerms])].slice(0, 6)
      if (allTerms.length > 0) {
        const q1 = ResearchQuestion.create({
          text: `「${a?.content.slice(0, 40) ?? ''}」と「${c?.content.slice(0, 40) ?? ''}」の因果関係を示す証拠を探す`,
          questionType: 'causal',
          searchTerms: allTerms,
          priority: 0.8,
        })
        if (isOk(q1)) questions.push(q1.value)
        const q2 = ResearchQuestion.create({
          text: `この因果連鎖を否定する反証・代替説明を探す`,
          questionType: 'comparative',
          searchTerms: allTerms,
          priority: 0.6,
        })
        if (isOk(q2)) questions.push(q2.value)
      }
      break
    }

    default: {
      const terms = extractTerms(hypothesis.claim)
      if (terms.length > 0) {
        const qr = ResearchQuestion.create({
          text: `仮説に関連する事実を探す: ${hypothesis.claim.slice(0, 80)}`,
          questionType: 'exploratory',
          searchTerms: terms,
          priority: 0.6,
        })
        if (isOk(qr)) questions.push(qr.value)
      }
    }
  }

  return questions
}

function deriveStrategy(hypothesis: Hypothesis): ResearchPlan['strategy'] {
  switch (hypothesis.hypothesisType) {
    case 'resolve_contradiction': return 'depth_first'
    case 'emergent_principle':    return 'breadth_first'
    default:                      return 'breadth_first'
  }
}

/**
 * extractTerms — rule-based term extraction from Japanese/English text.
 * Splits on spaces, brackets, and particles. Returns 2–5 meaningful tokens.
 */
function extractTerms(text: string): string[] {
  return text
    .split(/[\s、。「」『』【】・（）()\n]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && t.length <= 20)
    .slice(0, 5)
}
