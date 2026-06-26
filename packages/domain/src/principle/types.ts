import type { PrefixedId } from '@innovation-os/foundation/ids'
import type { ConfidenceLevel } from '@innovation-os/shared/constants'

export type PrincipleId = PrefixedId<'prin'>

export type PrincipleProps = {
  readonly id: PrincipleId
  readonly statement: string
  readonly rationale: string
  readonly patternIds: readonly string[]
  readonly confidence: ConfidenceLevel
  readonly createdAt: string
  readonly updatedAt: string
}
