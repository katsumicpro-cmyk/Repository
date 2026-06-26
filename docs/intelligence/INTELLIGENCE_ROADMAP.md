# Innovation OS — 知性獲得ロードマップ

> 知性とは何か。どのように獲得されるか。
> このドキュメントはその問いへの答えを、
> 実装を通じて定義する。

---

## 知性の階層

```
Level 0  存在する       （Foundation）
Level 1  記憶する       （Memory）
Level 2  想起する       （Recall）
Level 3  推論する       （Reasoning）
Level 4  調査する       （Research）
Level 5  原則を持つ     （Principle）
Level 6  未来を描く     （Prediction）
Level 7  概念を生む     （Concept）
Level 8  価値を創出する  （Innovation）
```

各レベルは前のレベルを包含する。
Level 4 のシステムは Level 1–3 の能力をすべて持つ。

---

## なぜこの順序か

### 記憶なき想起はない

記憶していないものを想起できない。
Memory（Sprint 3）なしに Recall（Sprint 4）は成立しない。

### 想起なき推論は表面的だ

何を知っているかを探せなければ、
矛盾も欠落も見えない。
Recall（Sprint 4）なしに Reasoning（Sprint 5）は深くなれない。

### 推論なき調査は盲目だ

何を問うべきかを知らなければ、
何を調べるべきかも分からない。
Reasoning（Sprint 5）なしに Research（Sprint 6）は方向を持てない。

### 調査なき原則は仮説だ

検証されていない洞察は原則ではなく仮説だ。
Research（Sprint 6）なしに Principle（Sprint 7）は根拠を持てない。

### 原則なき予測は想像だ

何が成り立つかを知らなければ、
何が可能かも分からない。
Principle（Sprint 7）なしに Prediction（Sprint 8）は空想だ。

### 予測なき概念は現状の延長だ

未来の可能性を見ていなければ、
新しい概念は生まれない。
Prediction（Sprint 8）なしに Concept（Sprint 9）は革新ではない。

---

## 各段階で「知性」は何を意味するか

| レベル | 知性の意味 | 証拠 |
|--------|----------|------|
| Memory | 経験を蓄積できる | KnowledgeGraph に Fact が永続する |
| Recall | 関連を見つけられる | hasUnexpectedConnections() === true |
| Reasoning | 欠落に気づける | generatedQuestionsCount > 0 |
| Research | 自ら調べられる | EvidenceRequest が自律的に answered になる |
| Principle | 普遍性を見出せる | 複数仮説から Principle が抽出される |
| Prediction | 可能性を描ける | 現存しない Future が根拠付きで生成される |
| Concept | 解決策を構想できる | Knowledge Chain が Concept に収束する |
| Innovation | 協働して価値を創れる | 人間とシステムが共に出力を所有できる |

---

## 知性の定義

このロードマップにおける「知性」は、
処理速度でも記憶容量でもない。

**問いを立て、調べ、学び、また問う能力。**

その能力が深まるほど、
立てる問いが鋭くなる。
調べる方法が巧みになる。
学ぶ速度が上がる。

最終的に、システムが立てる問いが
人間が思いつかなかった問いになること。

それが Innovation OS の目指す知性だ。

---

## 知性獲得の速度

知性の獲得は線形ではない。

Level 1–3 は基盤であり、比較的直線的に積み上がる。
Level 4–6 は相互強化の段階であり、
Research が Principle を生み、Principle が Research を深める。
Level 7–8 は創発の段階であり、
それまでのすべての能力が組み合わさって
予測不可能な質の出力が生まれる。

このロードマップは Level 8 まで設計されているが、
Innovation OS が本当に目指す場所は
その先にある「設計されていない知性」かもしれない。
