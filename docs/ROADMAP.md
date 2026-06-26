# Innovation OS — Roadmap

> 各フェーズの完了条件は「コードの完成」ではなく「能力の獲得」である。
> (D005参照)

---

## Phase 1 — 構築できる ✅

**獲得した能力**: monorepo が buildできる。型が通る。テストが走る。

Foundation が存在する。
まだ何も「できない」が、すべてを「作れる」土台がある。

完了の証明: `pnpm build` が全パッケージで成功する。

---

## Phase 2 — 発見できる ✅

**獲得した能力**: テーマを与えると、構造化された事実の集合が返ってくる。

Discovery Domain が動く。
AIなし・Mockで、ResearchThemeからFactCollectionを生成できる。

完了の証明: `generateDiscoveryAction('AIエージェント')` が6件のFactを返す。

---

## Phase 3 — 記憶できる ✅

**獲得した能力**: 発見された事実が、関係を持つ知識として永続する。

KnowledgeGraph が動く。
FactがKnowledgeFactになり、KnowledgeNodeになり、Graphに接続される。

完了の証明: `SaveDiscoveryToKnowledgeUseCase` が実行後、
`KnowledgeGraph.nodeCount > 0` かつ `edgesOfType('RELATED_TO').length > 0`。

---

## Phase 4 — 想起できる ✅

**獲得した能力**: クエリに対して、意味的に関連する知識が活性化して返ってくる。

Semantic Memory が動く。
Vector SearchとGraph TraversalによってKnowledgeActivationが生成される。

完了の証明: `RecallKnowledgeUseCase` が `hasUnexpectedConnections() === true` を返す。
（直接検索しなかった事実がグラフ経由で浮上する）

---

## Phase 5 — 問いを立てる ✅

**獲得した能力**: 人間が尋ねる前に、システムが問いを生成する。

Reasoning Foundation が動く。
矛盾・パターン・推移的因果からHypothesisが生成され、
EvidenceRequestとして問いが立つ。

完了の証明: `InitiateReasoningCycleUseCase` が
`generatedQuestionsCount > 0` を返す。人間の入力は theme のみ。

---

## Phase 6 — 繋げられる

**目標能力**: 複数テーマの知識が、意味的に接続される。

Cross-theme reasoning。
「AIエージェント」と「組織変革」のKnowledgeGraphが
共通のPatternを持つことをシステムが発見する。

完了の証明: 異なるthemeの2つのグラフから
`ExtractedPattern.patternType === 'hub_convergence'` が
共通のclaim内容を持つHypothesisを生成する。

---

## Phase 7 — 原則を導く

**目標能力**: 複数の事実・パターンから、普遍的な原則を抽出する。

Principle Domain が動く。
`emergent_principle` HypothesisがPattern Domainに昇格し、
人間がレビュー・承認できる。

完了の証明: `HypothesisGenerator` が生成したhypothesisが
人間のレビューを経てPrinciple Entityとして保存される。

---

## Phase 8 — 未来を描く

**目標能力**: 原則から、まだ存在しない可能性を推論する。

Future Domain が動く。
Principleの集合から「〜が可能になるかもしれない」という
Future Entityが生成される。

完了の証明: `FutureGenerator` が Principle から Future を生成し、
「現時点では存在しない可能性」として記録される。

---

## Phase 9 — 概念を生む

**目標能力**: Discovery → Pattern → Principle → Future の全サイクルが1回転する。

Concept Domain が動く。
Knowledge Flowが端から端まで流れ、
新しいConceptが生まれる。

完了の証明: あるテーマについて、
Discovery から始まり Concept に至るまでの
全エンティティが生成・接続される。

---

## Phase 10 — 自律的に問い続ける

**目標能力**: システムが外部の入力なしに、継続的に推論サイクルを回す。

Innovation OS 1.0。
人間は問いを立てなくてよい。
システムが問い、発見し、記憶し、想起し、また問う。

完了の証明: Scheduled Reasoning Cycleが走り、
前回のサイクルより鋭い問いを生成したことを
`EvidenceRequest.question` の比較で示せる。

---

## 能力の系譜

```
構築できる
  └─ 発見できる
       └─ 記憶できる
            └─ 想起できる
                 └─ 問いを立てる
                      └─ 繋げられる
                           └─ 原則を導く
                                └─ 未来を描く
                                     └─ 概念を生む
                                          └─ 自律的に問い続ける
```

各能力は前の能力を基盤とする。
前の能力が壊れたとき、後の能力も壊れる。
これが回帰テストの存在理由である。
