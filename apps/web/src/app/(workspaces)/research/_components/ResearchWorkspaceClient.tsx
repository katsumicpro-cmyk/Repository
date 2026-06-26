'use client'

import { useState } from 'react'
import { ResearchForm } from './ResearchForm'
import { ResearchResultCard } from './ResearchResultCard'
import type { ResearchResultDto } from '@/app/actions/discovery'

/**
 * ResearchWorkspaceClient — client shell that wires form → result.
 * Keeps all useState on the client; Server Component (page.tsx) stays static.
 */
export function ResearchWorkspaceClient() {
  const [result, setResult] = useState<ResearchResultDto | null>(null)

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Research Workspace</h1>
        <p className="mt-1 text-sm text-gray-500">
          テーマを入力すると、Discovery フェーズの Fact を自動生成します。
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
        <ResearchForm onResult={setResult} />
      </div>

      {result && (
        <div className="rounded-xl border border-indigo-100 bg-white p-6 shadow-sm">
          <ResearchResultCard result={result} />
        </div>
      )}
    </div>
  )
}
