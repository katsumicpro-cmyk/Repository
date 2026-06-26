import type { ReactNode } from 'react'

export default function WorkspacesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <header className="border-b px-6 py-3">
        <a href="/" className="font-semibold">
          Innovation OS
        </a>
      </header>
      <div className="flex flex-1 overflow-hidden">{children}</div>
    </div>
  )
}
