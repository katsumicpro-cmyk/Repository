'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Phase = 'challenge' | 'thinking' | 'result'
type StageStatus = 'idle' | 'active' | 'done'
type StageKey = 'discovery' | 'knowledge' | 'pattern' | 'invariant' | 'theory' | 'principle' | 'reasoning' | 'hypothesis' | 'research' | 'evidence'
type DecisionStatus = 'undecided' | 'pursue' | 'hold' | 'reject'

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
  patternShort: string
  invariant: string
  invariantShort: string
  invariantType: 'causal' | 'structural' | 'threshold'
  theory: string
  theoryShort: string
  principle: string
  principleShort: string
}

interface RiskItem {
  label: string
  detail: string
  severity: 'high' | 'medium' | 'low'
}

interface Concept {
  id: string
  emoji: string
  name: string
  tagline: string
  description: string
  whyNow: string
  risks: RiskItem[]
  nextQuestion: string
  chain: ConceptChainItem[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock Concepts — dental hygiene theme (v0.2: decision-ready)
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_CONCEPTS: Concept[] = [
  {
    id: '1',
    emoji: '⚔️',
    name: 'BrushQuest',
    tagline: '歯磨きをRPGクエストに変換する',
    description:
      '攻撃力がブラッシング精度に連動。虫歯菌ボスを倒すために2分間正確に磨く。子どもが「やらされる」から「倒したい」に変わる瞬間を設計する。',
    whyNow:
      'スマートフォンゲーム市場の成熟とBluetooth歯ブラシの普及で、習慣×ゲームの実装コストが過去最低水準にある。競合はルーティンアプリに留まっており、ゲームレイヤーで差別化できるウィンドウは2〜3年。子ども向けデジタルヘルスへの保険適用議論もあり、規制追い風となる可能性がある。',
    risks: [
      {
        label: 'ゲームの鮮度切れ',
        detail: 'ゲームコンテンツは飽きられやすい。継続的なアップデートコストが高く、小規模チームでは持続困難。',
        severity: 'high',
      },
      {
        label: 'センサー精度依存',
        detail: 'ブラッシング精度の計測にBluetooth歯ブラシが必要。デバイス非保有世帯では機能が半減する。',
        severity: 'high',
      },
      {
        label: '親の関与コスト',
        detail: '初回設定とアカウント管理が親に集中。親の離脱が子どもの使用停止に直結する。',
        severity: 'medium',
      },
    ],
    nextQuestion:
      'Bluetooth歯ブラシなしでもブラッシング時間だけを使って「攻撃力」を設計した場合、ゲーム体験として十分に成立するか？',
    chain: [
      {
        pattern: '強制より自発的参加の方が習慣が3倍長続きする（観測 n=847, strength: 0.92）',
        patternShort: '自発参加 → 習慣3倍',
        invariant: '内発的動機は外発的動機より習慣持続力が高い',
        invariantShort: '内発的動機 > 外発的動機',
        invariantType: 'causal',
        theory:
          '自己決定理論 (Deci & Ryan, 1985)：自律・有能感・関係性の三欲求が充足されると内発的動機が高まり、外部報酬への依存が生じない。強制は自律欲求を阻害し、モチベーションを外在化させる。',
        theoryShort: '自己決定理論',
        principle:
          '子どもが「自分で選択している」と感じられるUXを設計する。ゴールは子どもが設定し、進め方は子どもが選ぶ。選択肢があれば強制は不要になる。',
        principleShort: '選択感のあるUX設計',
      },
      {
        pattern: 'キャラクター育成型ゲームで2分継続率が89%に到達（観測 n=312, strength: 0.87）',
        patternShort: 'キャラ育成 → 継続89%',
        invariant: '即時フィードバックループが存在すると行動強化が起きる',
        invariantShort: '即時FBが行動強化を生む',
        invariantType: 'causal',
        theory:
          'オペラント条件付け (Skinner)：行動の直後に報酬が与えられると、その行動の頻度が増加する（正の強化）。遅延した報酬は強化効果が指数的に低下する。',
        theoryShort: 'オペラント条件付け',
        principle:
          '磨いた瞬間に何かが変化すること。2秒以内に視覚・音・数値で達成感を返す。「磨いた → 何かが起きた」の因果を体で覚えさせる。',
        principleShort: '2秒以内の即時達成感',
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
    whyNow:
      'コロナ後の「家族時間の再評価」トレンドと共働き家庭の増加が重なる。「短時間で毎日の絆を深める体験」への需要が可処分所得の高い子育て層で高まっている。競合は子ども単体向けに偏っており、親子共同体験のプロダクトはほぼ空白地帯。',
    risks: [
      {
        label: '親の毎日参加が前提',
        detail: '親が一日でも欠けるとシステムとして機能しない。共働き・不規則な生活では継続が困難。',
        severity: 'high',
      },
      {
        label: 'ひとり親世帯への非対応',
        detail: '「ペア」という設計がひとり親や多忙な親には排他的になる可能性。',
        severity: 'medium',
      },
      {
        label: 'スコアへのプレッシャー',
        detail: '親のスコアが低いとき、子どもへの申し訳なさが逆効果になるケースがある。',
        severity: 'low',
      },
    ],
    nextQuestion:
      '親が参加できない日に「代替ペアモード」（祖父母・先生など）を設けた場合、習慣継続率はどう変わるか？',
    chain: [
      {
        pattern: '親の同伴率と子どもの習慣継続率は強い正の相関（r=0.74, 観測 n=521）',
        patternShort: '親同伴 → 継続率 r=0.74',
        invariant: '社会的絆は行動の継続動機になる',
        invariantShort: '社会的絆が動機を持続させる',
        invariantType: 'structural',
        theory:
          '社会的学習理論 (Bandura)：人は他者の行動を観察し模倣する。また社会的承認欲求が行動の持続を促進する。「一緒にやっている誰か」の存在が孤独な義務を共同体験に変換する。',
        theoryShort: '社会的学習理論',
        principle:
          '親が観客でなく参加者になれる設計にする。「見守る」でなく「一緒にやる」体験が絆を生む。子どもは親がやっていることをやりたがる。',
        principleShort: '親が参加者になる設計',
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
    whyNow:
      'iPhone/AndroidのLiDARとARKit/ARCoreの精度が2024年以降、口腔内ARを実用レベルで実装できる水準に達した。歯科業界のDXが遅れており、ヘルスケア×ARの先行者が取れる市場。競合はチルドレン向けARゲームに集中しており、口腔ヘルスとの掛け合わせは空白。',
    risks: [
      {
        label: '医療機器規制リスク',
        detail: '細菌の「可視化」が医療診断と見なされた場合、薬機法の対象になる可能性がある。法務コストが想定外に膨らむリスク。',
        severity: 'high',
      },
      {
        label: 'AR精度と信頼性',
        detail: '子どもの口腔内をスマホカメラで撮影するARの精度は、まだ商用製品水準に達していない可能性がある。誤検知が子どもの不安を煽る。',
        severity: 'high',
      },
      {
        label: 'プライバシー懸念',
        detail: '子どもの口腔内動画をクラウド処理する場合、保護者からのプライバシー拒否反応が予想される。',
        severity: 'medium',
      },
    ],
    nextQuestion:
      'オフライン処理（端末内推論）でAR認識精度を保てるか？ 現在のスマホSoCで口腔内リアルタイム処理は実現可能か？',
    chain: [
      {
        pattern: '虫歯菌の視覚化で歯磨き動機づけが+67%（観測 n=203, strength: 0.81）',
        patternShort: '菌の可視化 → 動機+67%',
        invariant: '情報が具体的で即時的なほど意思決定の質が上がる',
        invariantShort: '具体的情報が行動変容を誘発',
        invariantType: 'threshold',
        theory:
          '情報処理理論：抽象的・将来的リスク（虫歯になるかもしれない）より具体的・即時的リスク（今ここに細菌がいる）は回避行動を強く誘発する。見えないものは存在しないも同然。',
        theoryShort: '情報処理理論',
        principle:
          '「なんとなく磨く」から「ここを磨く」に変換する情報設計。見えないものを見えるようにする。問題を発見するのはシステムでなく子ども自身であること。',
        principleShort: '見えないものを見えるように',
      },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Simulation timeline builder (unchanged from v0.1)
// ─────────────────────────────────────────────────────────────────────────────

type TimelineEvent =
  | { at: number; type: 'log'; entry: Omit<LogEntry, 'id'> }
  | { at: number; type: 'stage'; key: StageKey; status: 'active' | 'done'; count: number }
  | { at: number; type: 'complete' }

let _logId = 0
function buildTimeline(theme: string): TimelineEvent[] {
  const log = (text: string, kind: LogEntry['kind'], at: number): TimelineEvent =>
    ({ at, type: 'log', entry: { text, kind } })
  const stg = (key: StageKey, status: 'active' | 'done', count: number, at: number): TimelineEvent =>
    ({ at, type: 'stage', key, status, count })

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
// Constants
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

const EXAMPLE_THEMES = ['ドルツアプリ', '子どもの歯磨き習慣', '新しい電動歯ブラシ', '新しいUX']

const INVARIANT_TYPE_COLOR: Record<string, string> = {
  causal: '#7C6FF7', structural: '#3B82F6', threshold: '#F76B15',
}
const INVARIANT_TYPE_LABEL: Record<string, string> = {
  causal: 'causal', structural: 'structural', threshold: 'threshold',
}

const DECISION_CONFIG: Record<DecisionStatus, { label: string; color: string; bg: string; border: string; cardBorder: string }> = {
  undecided: { label: '未決定',  color: '#55555F', bg: 'transparent',             border: 'var(--border)',              cardBorder: 'var(--border)' },
  pursue:    { label: 'Pursue',  color: '#30A46C', bg: 'rgba(48,164,108,0.14)',   border: 'rgba(48,164,108,0.4)',       cardBorder: 'rgba(48,164,108,0.35)' },
  hold:      { label: 'Hold',    color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',   border: 'rgba(245,158,11,0.4)',       cardBorder: 'rgba(245,158,11,0.3)' },
  reject:    { label: 'Reject',  color: '#EF4444', bg: 'rgba(239,68,68,0.10)',    border: 'rgba(239,68,68,0.35)',       cardBorder: 'rgba(239,68,68,0.25)' },
}

const SEVERITY_COLOR: Record<string, string> = {
  high: '#EF4444', medium: '#F59E0B', low: '#6B7280',
}

// ─────────────────────────────────────────────────────────────────────────────
// Small UI atoms
// ─────────────────────────────────────────────────────────────────────────────

function Dot({ status }: { status: StageStatus }) {
  const cls = status === 'active' ? 'dot-active' : status === 'done' ? 'dot-done' : 'dot-idle'
  return (
    <span className={cls} style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', flexShrink: 0, marginTop: 2 }} />
  )
}

function StageRow({ label, sub, status, count }: { label: string; sub: string; status: StageStatus; count: number }) {
  const textColor = status === 'active' ? 'var(--text-primary)' : status === 'done' ? 'var(--text-secondary)' : 'var(--text-muted)'
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 8,
      background: status === 'active' ? 'var(--accent-dim)' : 'transparent',
      border: `1px solid ${status === 'active' ? 'rgba(124,111,247,0.2)' : 'transparent'}`,
      transition: 'all 0.3s ease',
    }}>
      <Dot status={status} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: textColor }}>{label}</span>
          {status === 'done' && count > 0 && (
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--green)', background: 'var(--green-dim)', padding: '1px 6px', borderRadius: 4 }}>{count}</span>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{sub}</div>
      </div>
    </div>
  )
}

function LogLine({ entry }: { entry: LogEntry }) {
  const color = entry.kind === 'success' ? 'var(--green)' : entry.kind === 'stage' ? 'var(--accent)' : entry.kind === 'data' ? '#9CA3AF' : 'var(--text-muted)'
  return (
    <div className="animate-slide-right" style={{ fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 11, color, lineHeight: 1.6, paddingLeft: entry.kind === 'data' ? 16 : 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
      {entry.text}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SectionLabel — reusable section header inside card
// ─────────────────────────────────────────────────────────────────────────────

function SectionLabel({ icon, label, color = 'var(--text-muted)' }: { icon: string; label: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      <span style={{ fontSize: 11 }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', color, textTransform: 'uppercase' }}>{label}</span>
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />
}

// ─────────────────────────────────────────────────────────────────────────────
// ConceptCard v0.2 — decision-ready
// ─────────────────────────────────────────────────────────────────────────────

function ConceptCard({ concept, decision, onDecide }: {
  concept: Concept
  decision: DecisionStatus
  onDecide: (d: DecisionStatus) => void
}) {
  const [chainOpen, setChainOpen] = useState(false)
  const [activeChain, setActiveChain] = useState(0)
  const dc = DECISION_CONFIG[decision]

  const isRejected = decision === 'reject'

  return (
    <div
      className="animate-fade-slide-up"
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${dc.cardBorder}`,
        borderRadius: 12,
        overflow: 'hidden',
        opacity: isRejected ? 0.45 : 1,
        transition: 'border-color 0.25s, opacity 0.25s',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Header ── */}
      <div style={{ padding: '18px 20px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>{concept.emoji}</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{concept.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{concept.tagline}</div>
            </div>
          </div>
          {/* Decision badge */}
          {decision !== 'undecided' && (
            <span style={{
              flexShrink: 0,
              fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: dc.color, background: dc.bg,
              border: `1px solid ${dc.border}`,
              padding: '3px 8px', borderRadius: 5,
            }}>
              {dc.label}
            </span>
          )}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>{concept.description}</p>
      </div>

      <div style={{ padding: '0 20px 18px', display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* ── Why now ── */}
        <Divider />
        <SectionLabel icon="⚡" label="Why now" color="#F59E0B" />
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>{concept.whyNow}</p>

        {/* ── Reason to believe ── */}
        <Divider />
        <SectionLabel icon="🔗" label="Reason to believe" color="var(--accent)" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {concept.chain.map((item, i) => (
            <div key={i} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
              <Chip label={item.patternShort}    color="#6B7280" />
              <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>→</span>
              <Chip label={item.invariantShort}  color={INVARIANT_TYPE_COLOR[item.invariantType] ?? 'var(--accent)'} />
              <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>→</span>
              <Chip label={item.theoryShort}     color="#F59E0B" />
              <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>→</span>
              <Chip label={item.principleShort}  color="var(--green)" />
            </div>
          ))}
        </div>

        {/* Explainability toggle */}
        <button
          onClick={() => setChainOpen(v => !v)}
          style={{
            marginTop: 8, padding: '5px 0', display: 'flex', alignItems: 'center', gap: 5,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 11,
          }}
        >
          <span style={{ transform: chainOpen ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.15s', display: 'inline-block' }}>▶</span>
          {chainOpen ? '根拠を閉じる' : '根拠を詳しく見る'}
        </button>

        {chainOpen && (
          <div className="animate-fade-in" style={{ marginTop: 6 }}>
            {concept.chain.length > 1 && (
              <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                {concept.chain.map((_, i) => (
                  <button key={i} onClick={() => setActiveChain(i)} style={{
                    padding: '3px 9px', fontSize: 10, fontWeight: 500, borderRadius: 5,
                    border: `1px solid ${activeChain === i ? 'var(--accent)' : 'var(--border)'}`,
                    background: activeChain === i ? 'var(--accent-dim)' : 'transparent',
                    color: activeChain === i ? 'var(--accent)' : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}>
                    根拠 {i + 1}
                  </button>
                ))}
              </div>
            )}
            {(() => {
              const item = concept.chain[activeChain]
              if (!item) return null
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <ChainStep layer="Pattern"   color="#6B7280"  label="何が見えたか"    content={item.pattern} />
                  <ChainConnector />
                  <ChainStep layer="Invariant" color={INVARIANT_TYPE_COLOR[item.invariantType] ?? '#7C6FF7'} label={`何が変わらないか · ${INVARIANT_TYPE_LABEL[item.invariantType] ?? ''}`} content={item.invariant} />
                  <ChainConnector />
                  <ChainStep layer="Theory"    color="#F59E0B"  label="なぜそうなるか"  content={item.theory} />
                  <ChainConnector />
                  <ChainStep layer="Principle" color="var(--green)" label="どう使うか"  content={item.principle} />
                </div>
              )
            })()}
          </div>
        )}

        {/* ── Risk ── */}
        <Divider />
        <SectionLabel icon="⚠️" label="Risk" color="#EF4444" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {concept.risks.map((r, i) => (
            <div key={i} style={{
              padding: '9px 12px', borderRadius: 8,
              background: 'var(--bg-elevated)',
              border: `1px solid ${r.severity === 'high' ? 'rgba(239,68,68,0.2)' : r.severity === 'medium' ? 'rgba(245,158,11,0.15)' : 'var(--border)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: SEVERITY_COLOR[r.severity], display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{r.label}</span>
                <span style={{ fontSize: 10, color: SEVERITY_COLOR[r.severity], marginLeft: 'auto', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{r.severity}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r.detail}</div>
            </div>
          ))}
        </div>

        {/* ── Next question ── */}
        <Divider />
        <SectionLabel icon="❓" label="Next question" color="var(--blue)" />
        <div style={{
          padding: '11px 14px', borderRadius: 8,
          background: 'var(--bg-elevated)',
          border: '1px solid rgba(59,130,246,0.15)',
        }}>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0, fontStyle: 'italic' }}>
            「{concept.nextQuestion}」
          </p>
        </div>

        {/* ── Decision status ── */}
        <Divider />
        <SectionLabel icon="🎯" label="Decision" />
        <div style={{ display: 'flex', gap: 6 }}>
          {(['pursue', 'hold', 'reject'] as const).map(d => {
            const cfg = DECISION_CONFIG[d]
            const active = decision === d
            return (
              <button
                key={d}
                onClick={() => onDecide(active ? 'undecided' : d)}
                style={{
                  flex: 1, padding: '9px 0',
                  borderRadius: 8,
                  border: `1px solid ${active ? cfg.border : 'var(--border)'}`,
                  background: active ? cfg.bg : 'transparent',
                  color: active ? cfg.color : 'var(--text-muted)',
                  fontSize: 12, fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.18s',
                  letterSpacing: active ? '0.03em' : '0',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.borderColor = cfg.border
                    e.currentTarget.style.color = cfg.color
                    e.currentTarget.style.background = cfg.bg
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.color = 'var(--text-muted)'
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                {active ? '✓ ' : ''}{cfg.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 500,
      color, background: `${color}18`,
      border: `1px solid ${color}30`,
      padding: '2px 7px', borderRadius: 4,
      whiteSpace: 'nowrap',
      maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block',
    }}>
      {label}
    </span>
  )
}

function ChainConnector() {
  return <div style={{ paddingLeft: 12 }}><div style={{ width: 1, height: 8, background: 'var(--border-active)' }} /></div>
}

function ChainStep({ layer, color, label, content }: { layer: string; color: string; label: string; content: string }) {
  return (
    <div style={{ borderRadius: 7, border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div style={{ padding: '5px 10px', display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
        <span style={{ fontSize: 9, fontWeight: 700, color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{layer}</span>
        <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{label}</span>
      </div>
      <div style={{ padding: '8px 10px', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6, background: 'var(--bg-surface)' }}>{content}</div>
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

  useEffect(() => { inputRef.current?.focus() }, [])

  const submit = useCallback(() => { if (theme.trim()) onAnalyze(theme.trim()) }, [theme, onAnalyze])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: 'var(--bg-base)' }}>
      <div className="animate-fade-slide-up" style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 14 }}>◈</span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Innovation OS</span>
        </div>
        <h1 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--text-primary)', margin: 0, lineHeight: 1.15 }}>
          何を探求しますか？
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 10 }}>テーマを入力して、知識の奥にある本質を発見してください</p>
      </div>

      <div className="animate-fade-slide-up" style={{ width: '100%', maxWidth: 560, animationDelay: '0.08s', opacity: 0, animationFillMode: 'forwards' }}>
        <div style={{
          background: 'var(--bg-surface)',
          border: `1px solid ${focused ? 'var(--border-active)' : 'var(--border)'}`,
          borderRadius: 14, padding: '4px 4px 4px 18px',
          display: 'flex', alignItems: 'center', gap: 10,
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxShadow: focused ? '0 0 0 3px rgba(124,111,247,0.12)' : 'none',
        }}>
          <input
            ref={inputRef}
            value={theme}
            onChange={e => setTheme(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="例: 子どもの歯磨き習慣"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 15, color: 'var(--text-primary)', padding: '10px 0', caretColor: 'var(--accent)' }}
          />
          <button
            onClick={submit} disabled={!theme.trim()}
            style={{
              padding: '9px 18px', borderRadius: 10,
              background: theme.trim() ? 'var(--accent)' : '#222228',
              border: 'none', color: theme.trim() ? '#fff' : 'var(--text-muted)',
              fontSize: 13, fontWeight: 600, cursor: theme.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}
          >
            Analyze →
          </button>
        </div>

        <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', paddingTop: 3 }}>例：</span>
          {EXAMPLE_THEMES.map(t => (
            <button key={t} onClick={() => { setTheme(t); inputRef.current?.focus() }}
              style={{ padding: '3px 9px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-active)'; e.currentTarget.style.color = 'var(--text-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 20, fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
        Pattern → Invariant → Theory → Principle → Concept
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen: Thinking (unchanged from v0.1)
// ─────────────────────────────────────────────────────────────────────────────

function ThinkingScreen({ theme, data }: { theme: string; data: ThinkingData }) {
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [data.logs.length])

  const doneCount = [data.discovery, data.knowledge, data.pattern, data.invariant, data.theory, data.principle, data.reasoning, data.hypothesis, data.research, data.evidence].filter(s => s.status === 'done').length
  const pct = Math.round((doneCount / 10) * 100)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-base)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse-ring 1.5s infinite' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Thinking</span>
        </div>
        <div style={{ flex: 1, height: 3, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden', maxWidth: 200 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.5s ease' }} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{pct}%</span>
        <div style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {theme}
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr' }}>
        {/* Left */}
        <div style={{ borderRight: '1px solid var(--border)', padding: '20px 16px', overflowY: 'auto' }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, paddingLeft: 4 }}>Knowledge Pipeline</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <StageRow label="Discovery"  sub="世界からの観測"     status={data.discovery.status}  count={data.discovery.count} />
            <StageRow label="Knowledge"  sub="グラフ構築"         status={data.knowledge.status}  count={data.knowledge.count} />
            <StageRow label="Pattern"    sub="繰り返し現れる現象" status={data.pattern.status}    count={data.pattern.count} />
            <StageRow label="Invariant"  sub="変わらない本質"     status={data.invariant.status}  count={data.invariant.count} />
            <StageRow label="Theory"     sub="なぜそうなるか"     status={data.theory.status}     count={data.theory.count} />
            <StageRow label="Principle"  sub="どう使うか"         status={data.principle.status}  count={data.principle.count} />
          </div>
        </div>

        {/* Center */}
        <div style={{ borderRight: '1px solid var(--border)', padding: '20px 16px', overflowY: 'auto' }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, paddingLeft: 4 }}>Reasoning Engine</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <StageRow label="Reasoning"  sub="矛盾・パターン発見" status={data.reasoning.status}  count={data.reasoning.count} />
            <StageRow label="Hypothesis" sub="仮説生成"           status={data.hypothesis.status} count={data.hypothesis.count} />
            <StageRow label="Research"   sub="調査・証拠収集"     status={data.research.status}   count={data.research.count} />
            <StageRow label="Evidence"   sub="評価・統合"         status={data.evidence.status}   count={data.evidence.count} />
          </div>
          {data.evidence.status === 'done' && (
            <div className="animate-fade-in" style={{ marginTop: 16, padding: '10px 12px', borderRadius: 8, background: 'var(--green-dim)', border: '1px solid rgba(48,164,108,0.2)' }}>
              <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 500 }}>推論完了</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.5 }}>全Invariantがvalidated。Concept生成へ。</div>
            </div>
          )}
        </div>

        {/* Right */}
        <div style={{ padding: '20px 18px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Live Log</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
            {data.logs.map(entry => <LogLine key={entry.id} entry={entry} />)}
            {data.logs.length === 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>初期化中...</div>}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen: Result v0.2 — decision-ready
// ─────────────────────────────────────────────────────────────────────────────

function ResultScreen({ theme, onReset }: { theme: string; onReset: () => void }) {
  const [decisions, setDecisions] = useState<Record<string, DecisionStatus>>({
    '1': 'undecided', '2': 'undecided', '3': 'undecided',
  })

  const decide = useCallback((id: string, d: DecisionStatus) => {
    setDecisions(prev => ({ ...prev, [id]: d }))
  }, [])

  const pursueCount = Object.values(decisions).filter(d => d === 'pursue').length
  const holdCount   = Object.values(decisions).filter(d => d === 'hold').length
  const rejectCount = Object.values(decisions).filter(d => d === 'reject').length
  const decided = pursueCount + holdCount + rejectCount

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{
        padding: '14px 24px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
        position: 'sticky', top: 0, background: 'var(--bg-base)', zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Result</span>
        </div>

        {/* Decision summary chips */}
        <div style={{ display: 'flex', gap: 6 }}>
          {pursueCount > 0 && <DecisionChip label={`Pursue ${pursueCount}`} color="#30A46C" bg="rgba(48,164,108,0.14)" border="rgba(48,164,108,0.4)" />}
          {holdCount   > 0 && <DecisionChip label={`Hold ${holdCount}`}     color="#F59E0B" bg="rgba(245,158,11,0.12)"   border="rgba(245,158,11,0.4)" />}
          {rejectCount > 0 && <DecisionChip label={`Reject ${rejectCount}`} color="#EF4444" bg="rgba(239,68,68,0.10)"    border="rgba(239,68,68,0.35)" />}
          {decided === 0 && <DecisionChip label="未決定" color="var(--text-muted)" bg="transparent" border="var(--border)" />}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border)' }}>{theme}</span>
          <button onClick={onReset}
            style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-active)'; e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          >
            ← 新しいテーマ
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '28px 24px', maxWidth: 1160, margin: '0 auto', width: '100%' }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: 0 }}>
            3つのConceptが生まれました
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5 }}>
            各Conceptの根拠・リスク・次の問いを確認して、Pursue / Hold / Reject を選んでください
          </p>
        </div>

        {/* Pipeline summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24, padding: '10px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, overflowX: 'auto' }}>
          {[
            { label: 'Discovery', count: 5, color: '#6B7280' },
            { label: 'Pattern',   count: 4, color: '#7C6FF7' },
            { label: 'Invariant', count: 4, color: '#3B82F6' },
            { label: 'Theory',    count: 4, color: '#F59E0B' },
            { label: 'Principle', count: 4, color: '#30A46C' },
            { label: 'Concept',   count: 3, color: '#EC4899' },
          ].map((item, i, arr) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ textAlign: 'center', padding: '0 12px' }}>
                <div style={{ fontSize: 9, color: item.color, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{item.label}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{item.count}</div>
              </div>
              {i < arr.length - 1 && <div style={{ color: '#333340', fontSize: 13 }}>→</div>}
            </div>
          ))}
        </div>

        {/* Concept cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, alignItems: 'start' }}>
          {MOCK_CONCEPTS.map((c, i) => (
            <div key={c.id} style={{ animationDelay: `${i * 0.08}s`, opacity: 0, animationFillMode: 'forwards' }} className="animate-fade-slide-up">
              <ConceptCard concept={c} decision={decisions[c.id] ?? 'undecided'} onDecide={d => decide(c.id, d)} />
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div style={{ marginTop: 28, padding: '14px 18px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>◈</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 3 }}>Innovation OS は Human Intelligence Amplifier です</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.65 }}>
              Pursue を選んだ後の第一歩は「Next question」への答えを持つことです。
              Innovation OS は可能性の地図を描きます。どこを歩くかを決めるのは人間です。
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DecisionChip({ label, color, bg, border }: { label: string; color: string; bg: string; border: string }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color, background: bg, border: `1px solid ${border}`, padding: '3px 9px', borderRadius: 5 }}>
      {label}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page — state machine
// ─────────────────────────────────────────────────────────────────────────────

export default function WorkspacePage() {
  const [phase, setPhase] = useState<Phase>('challenge')
  const [theme, setTheme] = useState('')
  const [thinkingData, setThinkingData] = useState<ThinkingData>(INITIAL_THINKING)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = [] }

  const handleAnalyze = useCallback((inputTheme: string) => {
    setTheme(inputTheme)
    setThinkingData(INITIAL_THINKING)
    setPhase('thinking')

    buildTimeline(inputTheme).forEach(event => {
      const t = setTimeout(() => {
        if (event.type === 'log') {
          const entry: LogEntry = { ...event.entry, id: _logId++ }
          setThinkingData(prev => ({ ...prev, logs: [...prev.logs, entry] }))
        } else if (event.type === 'stage') {
          const { key, status: stStatus, count } = event
          setThinkingData(prev => ({ ...prev, [key]: { status: stStatus, count } satisfies StageState } as ThinkingData))
        } else if (event.type === 'complete') {
          setPhase('result')
        }
      }, event.at)
      timersRef.current.push(t)
    })
  }, [])

  const handleReset = useCallback(() => { clearTimers(); setThinkingData(INITIAL_THINKING); setTheme(''); setPhase('challenge') }, [])

  useEffect(() => () => clearTimers(), [])

  if (phase === 'challenge') return <ChallengeScreen onAnalyze={handleAnalyze} />
  if (phase === 'thinking')  return <ThinkingScreen  theme={theme} data={thinkingData} />
  return <ResultScreen theme={theme} onReset={handleReset} />
}
