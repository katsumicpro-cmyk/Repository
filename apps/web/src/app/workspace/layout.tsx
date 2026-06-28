import type { ReactNode } from 'react'

// Standalone layout — no shared header, full-screen immersive workspace
export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
