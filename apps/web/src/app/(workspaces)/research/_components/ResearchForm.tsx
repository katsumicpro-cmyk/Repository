'use client'

import { useState, useTransition } from 'react'
import { generateDiscoveryAction, type ResearchResultDto } from '@/app/actions/discovery'

type Props = {
  onResult: (result: ResearchResultDto) => void
}

export function ResearchForm({ onResult }: Props) {
  const [theme, setTheme] = useState('')
  const [context, setContext] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await generateDiscoveryAction(theme, context)
      if (!result.ok) {
        setError(result.error)
        return
      }
      onResult(result.data)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
          リサーチテーマ <span className="text-red-500">*</span>
        </label>
        <input
          id="theme"
          type="text"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="例：AIエージェントの産業応用"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="context" className="block text-sm font-medium text-gray-700">
          追加コンテキスト（任意）
        </label>
        <textarea
          id="context"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="調査の背景や目的を補足してください"
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending || theme.trim().length === 0}
        className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? 'リサーチ中…' : 'Discovery を生成'}
      </button>
    </form>
  )
}
