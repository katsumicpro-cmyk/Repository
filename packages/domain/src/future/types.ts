import type { PrefixedId } from '@innovation-os/foundation/ids'
import type { ConfidenceLevel } from '@innovation-os/shared/constants'

export type FutureId = PrefixedId<'futr'>

export type TimeHorizon = 'near' | 'mid' | 'far'

export type FutureProps = {
  readonly id: FutureId
  readonly scenario: string
  readonly rationale: string
  readonly timeHorizon: TimeHorizon
  readonly principleIds: readonly string[]
  readonly confidence: ConfidenceLevel
  readonly createdAt: string
  readonly updatedAt: string
}
