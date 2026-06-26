import type { PrefixedId } from '@innovation-os/foundation/ids'
import type { ConfidenceLevel, ProcessingStatus } from '@innovation-os/shared/constants'

export type PatternId = PrefixedId<'patt'>

export type PatternProps = {
  readonly id: PatternId
  readonly title: string
  readonly description: string
  readonly discoveryIds: readonly string[]
  readonly confidence: ConfidenceLevel
  readonly status: ProcessingStatus
  readonly createdAt: string
  readonly updatedAt: string
}
