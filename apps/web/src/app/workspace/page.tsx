'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Phase = 'challenge' | 'thinking' | 'result'
type StageStatus = 'idle' | 'active' | 'done'
type StageKey = 'discovery' | 'knowledge' | 'pattern' | 'invariant' | 'theory' | 'principle' | 'reasoning' | 'hypothesis' | 'research' | 'evidence'

interface LogEntry {
  id: number
  text: string
  kind: 'stage' | 'info' | 'success' | 'data'
}

interface StageState {
  status: StageStatus
  count: number
}

interface ThinkingData {
  discovery: StageState
  knowledge: StageState
  pattern: StageState
  invariant: StageState
  theory: StageState
  principle: StageState
  reasoning: StageState
  hypothesis: StageState
  research: StageState
  evidence: StageState
  logs: LogEntry[]
}

interface ConceptChainItem {
  pattern: string
  invariant: string
  invariantType: 'causal' | 'structural' | 'threshold'
  theory: string
  principle: string
}

interface Concept {
  id: string
  emoji: string
  name: string
  tagline: string
  description: string
  chain: ConceptChainItem[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock Concepts (dental hygiene theme)
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_CONCEPTS: Concept[] = [
  {
    id: '1',
    emoji: '⚔️',
    name: 'BrushQuest',
    tagline: '歯磨きをRPGクエストに変換する',
    description:
      '攻撃力がブラッシング精度に連動。虫歯菌ボスを倒すために2分間正確に磨く。子どもが「やらされる」から「倒したい」に変わる瞬間を設計する。',
    chain: [
      {
        pattern: '強制より自発的参加の方が習慣が3倍長続きする（観測 n=847, strength: 0.92）',
        invariant: '内発的動機は外発的動機より習慣持続力が高い',
        invariantType: 'causal',
        theory:
          '自己決定理論 (Deci & Ryan, 1985)：自律・有能感・関係性の三欲求が充足されると内発的動機が高まり、外部報酬への依存が生じない。強制は自律欲求を阻害し、モチベーションを外在化させる。',
        principle:
          '子どもが「自分で選択している」と感じられるUXを設計する。ゴールは子どもが設定し、進め方は子どもが選ぶ。選択肢があれば強制は不要になる。',
      },
      {
        pattern: 'キャラクター育成型ゲームで2分継続率が89%に到達（観測 n=312, strength: 0.87）',
        invariant: '即時フィードバックループが存在すると行動強化が起きる',
        invariantType: 'causal',
        theory:
          'オペラント条件付け (Skinner)：行動の直後に報酬が与えられると、その行動の頻度が増加する（正の強化）。遅延した報酬は強化効果が指数的に低下する。',
        principle:
          '磨いた瞬間に何かが変化すること。2秒以内に視覚・音・数値で達成感を返す。「磨いた → 何かが起きた」の因果を体で覚えさせる。',
      },
    ],
  },
  {
    id: '2',
    emoji: '👨‍👩‍👧',
    name: 'おやこブラシ',
    tagline: '親子が同時に磨き、スコアを共有する',
    description:
      '親と子がペアを組んで同時に歯磨き。お互いのブラッシングスコアがリアルタイムで見える。今日の「最高スコアペア」を記録し、家族の小さな物語になる。',
    chain: [
      {
        pattern: '親の同伴率と子どもの習慣継続率は強い正の相関（r=0.74, 観測 n=521）',
        invariant: '社会的絆は行動の継続動機になる',
        invariantType: 'structural',
        theory:
          '社会的学習理論 (Bandura)：人は他者の行動を観察し模倣する。また社会的承認欲求が行動の持続を促進する。「一緒にやっている誰か」の存在が孤独な義務を共同体験に変換する。',
        principle:
          '親が観客でなく参加者になれる設計にする。「見守る」でなく「一緒にやる」体験が絆を生む。子どもは親がやっていることをやりたがる。',
      },
    ],
  },
  {
    id: '3',
    emoji: '🧫',
    name: 'ムシバスターズ',
    tagline: '口内の虫歯菌をリアルタイムで可視化する',
    description:
      'ARで歯の表面の細菌を赤い光として見せる。磨くたびにモンスターが消える。子どもが自分で「汚れている」を発見することで、歯磨きが自分ごとになる。',
    chain: [
      {
        pattern: '虫歯菌の視覚化で歯磨き動機づけが+67%（観測 n=203, strength: 0.81）',
        invariant: '情報が具体的で即時的なほど意思決定の質が上がる',
        invariantType: 'threshold',
        theory:
          '情報処理理論：抽象的・将来的リスク（虫歯になるかもしれない）より具体的・即時的リスク（今ここに細菌がいる）は回避行動を強く誘発する。見えないものは存在しないも同然。',
        principle:
          '「なんとなく磨く」から「ここを磨く」に変換する情報設計。見えないものを見えるようにする。問題を発見するのはシステムでなく子ども自身であること。',
      },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Simulation timeline builder
// ─────────────────────────────────────────────────────────────────────────────

type TimelineEvent =
  | { at: number; type: 'log'; entry: Omit<LogEntry, 'id'> }
  | { at: number; type: 'stage'; key: StageKey; status: 'active' | 'done'; count: number }
  | { at: number; type: 'complete' }

let _logId = 0
function buildTimeline(theme: string): TimelineEvent[] {
  const log = (
    text: string,
    kind: LogEntry['kind'],
    at: number,
  ): TimelineEvent => ({ at, type: 'log', entry: { text, kind } })
  const stg = (
    key: StageKey,
    status: 'active' | 'done',
    count: number,
    at: number,
  ): TimelineEvent => ({ at, type: 'stage', key, status, count })

  return [
    log(`テーマを受信 — "${theme}"`, 'stage', 150),
    stg('reasoning', 'active', 0, 300),
    log('KnowledgeGraph を検索中...', 'info', 450),
    log('関連する KnowledgeFact を想起中...', 'info', 750),
    stg('discovery', 'active', 0, 850),
    log('Discovery 1  ╌  子どもは義務として歯磨きを認識している', 'data', 1050),
    log('Discovery 2  ╌  2分タイマーで磨き残し40%減少', 'data', 1350),
    log('Discovery 3  ╌  ゲーム化で習慣定着率3倍', 'data', 1650),
    log('Discovery 4  ╌  親の同伴率と継続率 r=0.74', 'data', 1950),
    log('Discovery 5  ╌  虫歯菌可視化で動機づけ+67%', 'data', 2200),
    stg('discovery', 'done', 5, 2400),
    log('✓  5件の Discovery を観測', 'success', 2550),
    stg('knowledge', 'active', 0, 2700),
    log('KnowledgeGraph を構築中...', 'info', 2900),
    log('12 ノード、18 エッジを追加 (CAUSES / SUPPORTS / CONTRADICTS)', 'info', 3200),
    log('意味的類似度でクラスタリング中...', 'info', 3500),
    stg('knowledge', 'done', 12, 3800),
    log('✓  KnowledgeGraph 完成 (12 nodes, 18 edges)', 'success', 3950),
    stg('reasoning', 'done', 5, 4050),
    stg('pattern', 'active', 0, 4200),
    log('Pattern を抽出中 (hub_convergence / causal_chain / cluster)...', 'info', 4350),
    log('Pattern 1  ╌  強制より自発参加で習慣が3倍長続き [strength: 0.92]', 'data', 4750),
    log('Pattern 2  ╌  即時視覚 FB が行動変容を促進 [strength: 0.87]', 'data', 5150),
    log('Pattern 3  ╌  親子共同体験が習慣定着を強化 [strength: 0.84]', 'data', 5550),
    log('Pattern 4  ╌  虫歯菌可視化で自発的磨き行動 [strength: 0.81]', 'data', 5900),
    stg('pattern', 'done', 4, 6150),
    log('✓  4件の Pattern を抽出', 'success', 6300),
    stg('hypothesis', 'active', 0, 6450),
    log('Hypothesis を生成中...', 'info', 6600),
    stg('research', 'active', 0, 6750),
    log('EvidenceRequest を生成中（AI なし・決定論的）', 'info', 6950),
    stg('invariant', 'active', 0, 7200),
    log('Invariant を解析中 (causal_chain → causal 変換)...', 'stage', 7200),
    log('Invariant 1  ╌  内発的動機は外発的より習慣持続力が高い [candidate]', 'data', 7550),
    log('Invariant 2  ╌  即時 FB ループが存在すると行動強化が起きる [candidate]', 'data', 7900),
    log('Invariant 3  ╌  社会的絆は行動継続動機になる [candidate]', 'data', 8200),
    log('Invariant 4  ╌  具体的情報が意思決定の質を高める [candidate]', 'data', 8450),
    log('チャレンジテスト中... stabilityScore を算出中...', 'info', 8650),
    log('✓  全 Invariant がチャレンジを突破 → validated', 'success', 9050),
    stg('invariant', 'done', 4, 9200),
    stg('evidence', 'done', 14, 9300),
    stg('hypothesis', 'done', 4, 9400),
    stg('research', 'done', 4, 9500),
    stg('theory', 'active', 0, 9650),
    log('Theory を構築中（なぜそうなるかの説明）...', 'stage', 9650),
    log('Theory 1  ╌  自己決定理論：自律・有能感・関係性の充足で内発的動機が高まる', 'data', 10100),
    log('Theory 2  ╌  オペラント条件付け：行動直後報酬が行動頻度を増加させる', 'data', 10500),
    log('Theory 3  ╌  社会的学習理論：他者観察と承認欲求が行動を促進する', 'data', 10900),
    log('Theory 4  ╌  情報処理理論：具体的即時リスクが回避行動を強く誘発する', 'data', 11250),
    stg('theory', 'done', 4, 11500),
    log('✓  4件の Theory を構築 — Explainability 基盤完成', 'success', 11650),
    stg('principle', 'active', 0, 11800),
    log('Principle を導出中（Theory × domain: ChildUX）...', 'stage', 11800),
    log('Principle 1  ╌  子どもが「選択している」と感じられる UX を設計する', 'data', 12200),
    log('Principle 2  ╌  磨いた瞬間に視覚的達成感を与える（2 秒以内）', 'data', 12600),
    log('Principle 3  ╌  親が観客でなく参加者になれる設計にする', 'data', 13000),
    log('Principle 4  ╌  見えないものを見えるようにする情報設計', 'data', 13350),
    stg('principle', 'done', 4, 13600),
    log('✓  4件の Principle を生成', 'success', 13750),
    log('Concept を構想中...', 'stage', 13950),
    log('Concept 1  ╌  BrushQuest（RPG × 歯磨き）', 'data', 14250),
    log('Concept 2  ╌  おやこブラシ（親子共同スコア）', 'data', 14550),
    log('Concept 3  ╌  ムシバスターズ（虫歯菌 AR 可視化）', 'data', 14850),
    log('─────────────────────────────────────────', 'stage', 15100),
    log('✓✓✓  分析完了 — 3件の Concept を生成しました', 'success', 15250),
    { at: 15800, type: 'complete' },
  ]
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_THINKING: ThinkingData = {
  discovery:  { status: 'idle', count: 0 },
  knowledge:  { status: 'idle', count: 0 },
  pattern:    { status: 'idle', count: 0 },
  invariant:  { status: 'idle', count: 0 },
  theory:     { status: 'idle', count: 0 },
  principle:  { status: 'idle', count: 0 },
  reasoning:  { status: 'idle', count: 0 },
  hypothesis: { status: 'idle', count: 0 },
  research:   { status: 'idle', count: 0 },
  evidence:   { status: 'idle', count: 0 },
  logs: [],
}

const EXAMPLE_THEMES = [
  'ドルツアプリ',
  '子どもの歯磨き習慣',
  '新しい電動歯ブラシ',
  '新しいUX',
]

const INVARIANT_TYPE_COLOR: Record<string, string> = {
  causal:    '#7C6FF7',
  structural: '#3B82F6',
  threshold:  '#F76B15',
}

const INVARIANT_TYPE_LABEL: Record<string, string> = {
  causal:    'causal',
  structural: 'structural',
  threshold:  'threshold',
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Dot({ status }: { status: StageStatus }) {
  const cls =
    status === 'active' ? 'dot-active' :
    status === 'done'   ? 'dot-done'   : 'dot-idle'
  return (
    <span
      className={cls}
      style={{
        display: 'inline-block',
        width: 7,
        height: 7,
        borderRadius: '50%',
        flexShrink: 0,
        marginTop: 2,
      }}
    />
  )
}

function StageRow({
  label,
  sub,
  status,
  count,
}: {
  label: string
  sub: string
  status: StageStatus
  count: number
}) {
  const textColor =
    status === 'active' ? 'var(--text-primary)' :
    status === 'done'   ? 'var(--text-secondary)' : 'var(--text-muted)'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '10px 14px',
        borderRadius: 8,
        background: status === 'active' ? 'var(--accent-dim)' : 'transparent',
        border: `1px solid ${status === 'active' ? 'rgba(124,111,247,0.2)' : 'transparent'}`,
        transition: 'all 0.3s ease',
      }}
    >
      <Dot status={status} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: textColor }}>{label}</span>
          {status === 'done' && count > 0 && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--green)',
                background: 'var(--green-dim)',
                padding: '1px 6px',
                borderRadius: 4,
              }}
            >
              {count}
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{sub}</div>
      </div>
    </div>
  )
}

function LogLine({ entry }: { entry: LogEntry }) {
  const color =
    entry.kind === 'success' ? 'var(--green)' :
    entry.kind === 'stage'   ? 'var(--accent)' :
    entry.kind === 'data'    ? '#9CA3AF'       : 'var(--text-muted)'

  return (
    <div
      className="animate-slide-right"
      style={{
        fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
        fontSize: 11,
        color,
        lineHeight: '1.6',
        paddingLeft: entry.kind === 'data' ? 16 : 0,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
      }}
    >
      {entry.text}
    </div>
  )
}

function ConceptCard({ concept }: { concept: Concept }) {
  const [open, setOpen] = useState(false)
  const [activeChain, setActiveChain] = useState(0)

  return (
    <div
      className="animate-fade-slide-up"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-active)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      {/* Header */}
      <div style={{ padding: '20px 22px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <span style={{ fontSize: 28 }}>{concept.emoji}</span>
          <div>
            <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {concept.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              {concept.tagline}
            </div>
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: '1.65', margin: 0 }}>
          {concept.description}
        </p>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border)', margin: '0 22px' }} />

      {/* Why button */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%',
          padding: '11px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: '0.01em',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ opacity: 0.5 }}>↳</span>
          なぜこのConceptが生まれたか
        </span>
        <span style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', opacity: 0.4 }}>
          ▾
        </span>
      </button>

      {/* Explainability chain */}
      {open && (
        <div className="animate-fade-in" style={{ padding: '0 22px 20px' }}>
          {/* Chain selector if multiple */}
          {concept.chain.length > 1 && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {concept.chain.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveChain(i)}
                  style={{
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 500,
                    borderRadius: 6,
                    border: `1px solid ${activeChain === i ? 'var(--accent)' : 'var(--border)'}`,
                    background: activeChain === i ? 'var(--accent-dim)' : 'transparent',
                    color: activeChain === i ? 'var(--accent)' : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  根拠 {i + 1}
                </button>
              ))}
            </div>
          )}

          {/* Chain display */}
          {(() => {
            const item = concept.chain[activeChain]
            if (!item) return null
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <ChainStep
                  layer="Pattern"
                  layerColor="#6B7280"
                  label="何が見えたか"
                  content={item.pattern}
                />
                <ChainArrow />
                <ChainStep
                  layer="Invariant"
                  layerColor={INVARIANT_TYPE_COLOR[item.invariantType] ?? 'var(--accent)'}
                  label={`何が変わらないか  ·  ${INVARIANT_TYPE_LABEL[item.invariantType] ?? ''}`}
                  content={item.invariant}
                />
                <ChainArrow />
                <ChainStep
                  layer="Theory"
                  layerColor="#F59E0B"
                  label="なぜそうなるか"
                  content={item.theory}
                />
                <ChainArrow />
                <ChainStep
                  layer="Principle"
                  layerColor="var(--green)"
                  label="どう使うか"
                  content={item.principle}
                />
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}

function ChainArrow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 20 }}>
      <div style={{ width: 1, height: 10, background: 'var(--border-active)' }} />
    </div>
  )
}

function ChainStep({
  layer,
  layerColor,
  label,
  content,
}: {
  layer: string
  layerColor: string
  label: string
  content: string
}) {
  return (
    <div
      style={{
        borderRadius: 8,
        border: '1px solid var(--border)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-elevated)',
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: layerColor,
            textTransform: 'uppercase',
          }}
        >
          {layer}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{label}</span>
      </div>
      <div
        style={{
          padding: '10px 12px',
          fontSize: 12,
          color: 'var(--text-secondary)',
          lineHeight: '1.65',
          background: 'var(--bg-surface)',
        }}
      >
        {content}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen: Challenge
// ─────────────────────────────────────────────────────────────────────────────

function ChallengeScreen({ onAnalyze }: { onAnalyze: (theme: string) => void }) {
  const [theme, setTheme] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const submit = useCallback(() => {
    const t = theme.trim()
    if (t) onAnalyze(t)
  }, [theme, onAnalyze])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submit()
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 24px',
        background: 'var(--bg-base)',
      }}
    >
      {/* Logo */}
      <div className="animate-fade-slide-up" style={{ textAlign: 'center', marginBottom: 48 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 10,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 14 }}>◈</span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
            Innovation OS
          </span>
        </div>
        <h1
          style={{
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            color: 'var(--text-primary)',
            margin: 0,
            lineHeight: 1.15,
          }}
        >
          何を探求しますか？
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-muted)', marginTop: 10 }}>
          テーマを入力して、知識の奥にある本質を発見してください
        </p>
      </div>

      {/* Input card */}
      <div
        className="animate-fade-slide-up"
        style={{
          width: '100%',
          maxWidth: 560,
          animationDelay: '0.08s',
          opacity: 0,
          animationFillMode: 'forwards',
        }}
      >
        <div
          style={{
            background: 'var(--bg-surface)',
            border: `1px solid ${focused ? 'var(--border-active)' : 'var(--border)'}`,
            borderRadius: 14,
            padding: '4px 4px 4px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxShadow: focused ? '0 0 0 3px rgba(124,111,247,0.12)' : 'none',
          }}
        >
          <input
            ref={inputRef}
            value={theme}
            onChange={e => setTheme(e.target.value)}
            onKeyDown={handleKey}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="例: 子どもの歯磨き習慣"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 15,
              color: 'var(--text-primary)',
              padding: '10px 0',
              caretColor: 'var(--accent)',
            }}
          />
          <button
            onClick={submit}
            disabled={!theme.trim()}
            style={{
              padding: '9px 18px',
              borderRadius: 10,
              background: theme.trim() ? 'var(--accent)' : '#222228',
              border: 'none',
              color: theme.trim() ? '#fff' : 'var(--text-muted)',
              fontSize: 13,
              fontWeight: 600,
              cursor: theme.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
            }}
          >
            Analyze →
          </button>
        </div>

        {/* Examples */}
        <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', paddingTop: 3 }}>例：</span>
          {EXAMPLE_THEMES.map(t => (
            <button
              key={t}
              onClick={() => { setTheme(t); inputRef.current?.focus() }}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--border-active)'
                e.currentTarget.style.color = 'var(--text-primary)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          fontSize: 11,
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
        Pattern → Invariant → Theory → Principle → Concept
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen: Thinking
// ─────────────────────────────────────────────────────────────────────────────

function ThinkingScreen({ theme, data }: { theme: string; data: ThinkingData }) {
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [data.logs.length])

  const activeCount = [
    data.discovery, data.knowledge, data.pattern,
    data.invariant, data.theory, data.principle,
    data.reasoning, data.hypothesis, data.research, data.evidence,
  ].filter(s => s.status === 'done').length
  const totalStages = 10
  const pct = Math.round((activeCount / totalStages) * 100)

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-base)',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          padding: '14px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'var(--bg-base)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--accent)',
              animation: 'pulse-ring 1.5s infinite',
            }}
          />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Thinking</span>
        </div>
        <div
          style={{
            flex: 1,
            height: 3,
            background: 'var(--bg-elevated)',
            borderRadius: 2,
            overflow: 'hidden',
            maxWidth: 200,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: 'var(--accent)',
              borderRadius: 2,
              transition: 'width 0.5s ease',
            }}
          />
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{pct}%</span>
        <div
          style={{
            marginLeft: 'auto',
            padding: '4px 12px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            fontSize: 12,
            color: 'var(--text-secondary)',
            maxWidth: 280,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {theme}
        </div>
      </div>

      {/* 3-column grid */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1.4fr',
          gap: 0,
          minHeight: 0,
        }}
      >
        {/* LEFT — Knowledge pipeline */}
        <div
          style={{
            borderRight: '1px solid var(--border)',
            padding: '20px 16px',
            overflowY: 'auto',
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, paddingLeft: 4 }}>
            Knowledge Pipeline
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <StageRow label="Discovery"  sub="世界からの観測"       status={data.discovery.status}  count={data.discovery.count} />
            <StageRow label="Knowledge"  sub="グラフ構築"           status={data.knowledge.status}  count={data.knowledge.count} />
            <StageRow label="Pattern"    sub="繰り返し現れる現象"    status={data.pattern.status}    count={data.pattern.count} />
            <StageRow label="Invariant"  sub="変わらない本質"        status={data.invariant.status}  count={data.invariant.count} />
            <StageRow label="Theory"     sub="なぜそうなるか"        status={data.theory.status}     count={data.theory.count} />
            <StageRow label="Principle"  sub="どう使うか"            status={data.principle.status}  count={data.principle.count} />
          </div>

          {/* Mini legend */}
          <div style={{ marginTop: 24, paddingLeft: 4, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.06em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
              Abstraction Flow
            </div>
            {['Pattern', 'Invariant', 'Theory', 'Principle'].map((l, i, arr) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 60 }}>{l}</span>
                {i < arr.length - 1 && (
                  <span style={{ fontSize: 10, color: '#333340' }}>↓</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CENTER — Reasoning */}
        <div
          style={{
            borderRight: '1px solid var(--border)',
            padding: '20px 16px',
            overflowY: 'auto',
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, paddingLeft: 4 }}>
            Reasoning Engine
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <StageRow label="Reasoning"  sub="矛盾・パターン発見"   status={data.reasoning.status}  count={data.reasoning.count} />
            <StageRow label="Hypothesis" sub="仮説生成"             status={data.hypothesis.status} count={data.hypothesis.count} />
            <StageRow label="Research"   sub="調査・証拠収集"        status={data.research.status}   count={data.research.count} />
            <StageRow label="Evidence"   sub="評価・統合"            status={data.evidence.status}   count={data.evidence.count} />
          </div>

          {/* Active indicator */}
          {[data.reasoning, data.hypothesis, data.research, data.evidence].some(s => s.status === 'active') && (
            <div
              style={{
                marginTop: 20,
                padding: '10px 12px',
                borderRadius: 8,
                background: 'var(--accent-dim)',
                border: '1px solid rgba(124,111,247,0.2)',
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>AI なし推論</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.5 }}>
                EvidenceRequest を決定論的に生成中。
                外部API不使用。
              </div>
            </div>
          )}

          {/* Done state */}
          {data.evidence.status === 'done' && (
            <div
              className="animate-fade-in"
              style={{
                marginTop: 20,
                padding: '10px 12px',
                borderRadius: 8,
                background: 'var(--green-dim)',
                border: '1px solid rgba(48,164,108,0.2)',
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 500 }}>推論完了</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.5 }}>
                {data.research.count}件のResearchPlan。
                全Invariantがvalidated。
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Live log */}
        <div
          style={{
            padding: '20px 18px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>
            Live Log
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
            {data.logs.map(entry => (
              <LogLine key={entry.id} entry={entry} />
            ))}
            {data.logs.length === 0 && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                初期化中...
              </div>
            )}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen: Result
// ─────────────────────────────────────────────────────────────────────────────

function ResultScreen({ theme, onReset }: { theme: string; onReset: () => void }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          padding: '14px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          position: 'sticky',
          top: 0,
          background: 'var(--bg-base)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Result</span>
        </div>
        <div
          style={{
            padding: '4px 10px',
            borderRadius: 6,
            background: 'var(--green-dim)',
            border: '1px solid rgba(48,164,108,0.2)',
            fontSize: 11,
            color: 'var(--green)',
          }}
        >
          3件のConcept
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              padding: '4px 12px',
              borderRadius: 6,
              border: '1px solid var(--border)',
            }}
          >
            {theme}
          </span>
          <button
            onClick={onReset}
            style={{
              padding: '6px 14px',
              borderRadius: 7,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--border-active)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
          >
            ← 新しいテーマ
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '32px 24px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            3つのConceptが生まれました
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
            各Conceptは Pattern → Invariant → Theory → Principle の連鎖から導出されています。
            「なぜ？」を展開すると根拠が見えます。
          </p>
        </div>

        {/* Pipeline summary bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            marginBottom: 28,
            padding: '12px 18px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            overflowX: 'auto',
          }}
        >
          {[
            { label: 'Discovery', count: 5, color: '#6B7280' },
            { label: 'Pattern', count: 4, color: '#7C6FF7' },
            { label: 'Invariant', count: 4, color: '#3B82F6' },
            { label: 'Theory', count: 4, color: '#F59E0B' },
            { label: 'Principle', count: 4, color: '#30A46C' },
            { label: 'Concept', count: 3, color: '#EC4899' },
          ].map((item, i, arr) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ textAlign: 'center', padding: '0 14px' }}>
                <div style={{ fontSize: 10, color: item.color, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {item.count}
                </div>
              </div>
              {i < arr.length - 1 && (
                <div style={{ color: '#333340', fontSize: 14, padding: '0 2px' }}>→</div>
              )}
            </div>
          ))}
        </div>

        {/* Concept cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
          }}
        >
          {MOCK_CONCEPTS.map((c, i) => (
            <div
              key={c.id}
              style={{ animationDelay: `${i * 0.1}s`, opacity: 0, animationFillMode: 'forwards' }}
              className="animate-fade-slide-up"
            >
              <ConceptCard concept={c} />
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div
          style={{
            marginTop: 32,
            padding: '14px 18px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 16, flexShrink: 0 }}>◈</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Innovation OS は Human Intelligence Amplifier です
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.65 }}>
              これらのConceptはあなたの最終答えではありません。
              あなたがどれを選ぶか、どう変形するか、どう捨てるかが、本当の創造です。
              Innovation OS は可能性の地図を描きます。地図を歩くのは人間です。
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function WorkspacePage() {
  const [phase, setPhase] = useState<Phase>('challenge')
  const [theme, setTheme] = useState('')
  const [thinkingData, setThinkingData] = useState<ThinkingData>(INITIAL_THINKING)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

  const handleAnalyze = useCallback((inputTheme: string) => {
    setTheme(inputTheme)
    setThinkingData(INITIAL_THINKING)
    setPhase('thinking')

    const timeline = buildTimeline(inputTheme)

    timeline.forEach(event => {
      const t = setTimeout(() => {
        if (event.type === 'log') {
          const entry: LogEntry = { ...event.entry, id: _logId++ }
          setThinkingData(prev => ({
            ...prev,
            logs: [...prev.logs, entry],
          }))
        } else if (event.type === 'stage') {
          const { key, status: stStatus, count } = event
          setThinkingData(prev => ({
            ...prev,
            [key]: { status: stStatus, count } satisfies StageState,
          } as ThinkingData))
        } else if (event.type === 'complete') {
          setPhase('result')
        }
      }, event.at)

      timersRef.current.push(t)
    })
  }, [])

  const handleReset = useCallback(() => {
    clearTimers()
    setThinkingData(INITIAL_THINKING)
    setTheme('')
    setPhase('challenge')
  }, [])

  // Cleanup on unmount
  useEffect(() => () => clearTimers(), [])

  if (phase === 'challenge') {
    return <ChallengeScreen onAnalyze={handleAnalyze} />
  }

  if (phase === 'thinking') {
    return <ThinkingScreen theme={theme} data={thinkingData} />
  }

  return <ResultScreen theme={theme} onReset={handleReset} />
}
