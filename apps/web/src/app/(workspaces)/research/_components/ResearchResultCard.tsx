'use client'

import type { ResearchResultDto } from '@/app/actions/discovery'

const CONFIDENCE_LABEL: Record<string, { label: string; className: string }> = {
  low:      { label: '低',      className: 'bg-gray-100 text-gray-600' },
  medium:   { label: '中',      className: 'bg-yellow-100 text-yellow-700' },
  high:     { label: '高',      className: 'bg-green-100 text-green-700' },
  verified: { label: '検証済み', className: 'bg-blue-100 text-blue-700' },
}

type Props = { result: ResearchResultDto }

export function ResearchResultCard({ result }: Props) {
  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{result.theme}</h2>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {result.isMock && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">Mock</span>
          )}
          <span>{result.processingTimeMs}ms</span>
        </div>
      </div>

      {/* Fact list */}
      <ul className="space-y-3">
        {result.facts.map((fact, i) => {
          const badge = CONFIDENCE_LABEL[fact.confidence] ?? CONFIDENCE_LABEL['low']
          return (
            <li
              key={i}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <p className="text-sm text-gray-800">{fact.content}</p>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
                >
                  信頼度: {badge.label}
                </span>
                <span className="text-xs text-gray-400">出典: {fact.source}</span>
              </div>
            </li>
          )
        })}
      </ul>

      {/* Footer */}
      <p className="text-right text-xs text-gray-400">
        生成日時: {new Date(result.createdAt).toLocaleString('ja-JP')}
      </p>
    </section>
  )
}
