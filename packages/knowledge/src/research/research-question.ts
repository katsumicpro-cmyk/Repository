import { ValueObject } from '@innovation-os/domain/core'
import { validationError } from '@innovation-os/shared/errors'
import { ok, err, type Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'

export type QuestionType = 'factual' | 'causal' | 'comparative' | 'exploratory'

type ResearchQuestionProps = {
  readonly text: string
  readonly questionType: QuestionType
  /** Extracted search terms used to find relevant KnowledgeFacts */
  readonly searchTerms: readonly string[]
  /** 0–1: how important is this question to answering the hypothesis */
  readonly priority: number
}

/**
 * ResearchQuestion — a decomposed sub-question derived from an EvidenceRequest.
 *
 * A single EvidenceRequest (e.g. "AとBの矛盾を解消する証拠はあるか")
 * is decomposed into multiple ResearchQuestions:
 *   - "Aを支持する追加証拠を探す"        (factual, priority 0.9)
 *   - "Bを支持する追加証拠を探す"        (factual, priority 0.9)
 *   - "この矛盾を解消する第三の観点を探す" (exploratory, priority 0.5)
 *
 * searchTerms drive the actual search against KnowledgeFactRepository.
 * They are extracted deterministically from the hypothesis content.
 *
 * Question types:
 *   factual:     find facts that directly confirm or deny a claim
 *   causal:      find cause-effect relationships
 *   comparative: find similarities or differences
 *   exploratory: open-ended — we don't know what form the answer will take
 */
export class ResearchQuestion extends ValueObject<ResearchQuestionProps> {
  private constructor(props: ResearchQuestionProps) {
    super(props)
  }

  static create(input: {
    text: string
    questionType: QuestionType
    searchTerms: readonly string[]
    priority?: number
  }): Result<ResearchQuestion, AppError> {
    if (input.text.trim().length === 0) {
      return err(validationError('ResearchQuestion: text must not be empty'))
    }
    if (input.searchTerms.length === 0) {
      return err(validationError('ResearchQuestion: searchTerms must not be empty'))
    }
    return ok(
      new ResearchQuestion({
        text: input.text.trim(),
        questionType: input.questionType,
        searchTerms: input.searchTerms.filter((t) => t.trim().length > 0),
        priority: Math.max(0, Math.min(1, input.priority ?? 0.5)),
      }),
    )
  }

  get text(): string { return this.props.text }
  get questionType(): QuestionType { return this.props.questionType }
  get searchTerms(): readonly string[] { return this.props.searchTerms }
  get priority(): number { return this.props.priority }
}
