import type { PrefixedId } from '@innovation-os/foundation/ids'
import type { ProcessingStatus } from '@innovation-os/shared/constants'

export type DiscoveryId = PrefixedId<'disc'>

export type DiscoverySource = 'manual' | 'url' | 'file' | 'api'

export type DiscoveryProps = {
  readonly id: DiscoveryId
  readonly title: string
  readonly rawContent: string
  readonly source: DiscoverySource
  readonly sourceUrl: string | null
  readonly status: ProcessingStatus
  readonly tags: readonly string[]
  readonly createdAt: string
  readonly updatedAt: string
}
