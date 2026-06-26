import { Entity, type EntityProps } from '../core/entity.js'
import { generateId } from '@innovation-os/foundation/ids'
import { systemClock } from '@innovation-os/foundation/time'
import { validationError } from '@innovation-os/shared/errors'
import { ok, err, type Result } from '@innovation-os/shared/result'
import type { AppError } from '@innovation-os/shared/errors'
import type { PrefixedId } from '@innovation-os/foundation/ids'
import { ResearchTheme } from './research-theme.js'

export type ResearchRequestId = PrefixedId<'rreq'>

type ResearchRequestProps = EntityProps & {
  readonly id: ResearchRequestId
  readonly theme: ResearchTheme
  readonly additionalContext: string
  readonly requestedBy: string
}

export type CreateResearchRequestInput = {
  readonly themeText: string
  readonly additionalContext?: string
  readonly requestedBy?: string
  readonly language?: 'ja' | 'en'
}

/**
 * ResearchRequest — represents the user's intent to discover knowledge on a theme.
 * Created at form submission; drives GenerateDiscoveryUseCase.
 */
export class ResearchRequest extends Entity<ResearchRequestProps> {
  private constructor(props: ResearchRequestProps) {
    super(props)
  }

  static create(input: CreateResearchRequestInput): Result<ResearchRequest, AppError> {
    const themeResult = ResearchTheme.create(input.themeText, input.language)
    if (themeResult._tag === 'Err') return themeResult

    const now = systemClock.now()
    return ok(
      new ResearchRequest({
        id: generateId('rreq'),
        theme: themeResult.value,
        additionalContext: input.additionalContext?.trim() ?? '',
        requestedBy: input.requestedBy ?? 'anonymous',
        createdAt: now,
        updatedAt: now,
      }),
    )
  }

  get theme(): ResearchTheme { return this.props.theme }
  get additionalContext(): string { return this.props.additionalContext }
  get requestedBy(): string { return this.props.requestedBy }
}
