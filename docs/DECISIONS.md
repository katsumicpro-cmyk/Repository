# Architecture Decisions

軽量な設計判断ログ。  
大規模な決定は `docs/adr/` に ADR として昇格させる。

---

## D001 — Knowledge First

**日付**: 2026-06-26  
**状態**: 採用

Knowledge Engine を Pattern Engine より先に実装する。

**理由**  
Knowledgeが存在しなければ Pattern品質は向上しない。  
AIがパターンを抽出する前に、  
Factの構造化・関係付け・クラスタリングの基盤が必要である。

**影響**  
Sprint 3 は `packages/knowledge` の実装から開始する。

---

## D002 — Discovery は検索ではない

**日付**: 2026-06-26  
**状態**: 採用

Discovery は Knowledge生成の入口である。

**理由**  
「情報を見つける」行為と「知識を生み出す」行為は異なる。  
Discovery ドメインの責務は、生の情報 (Fact) を  
構造化された知識の種へ変換することである。  
検索エンジンの代替ではない。

---

## D003 — Project Memory を Repository の正式成果物とする

**日付**: 2026-06-26  
**状態**: 採用

`docs/PROJECT_MEMORY.md` は開発ドキュメントではなく、  
AIセッション間でコンテキストを継承するための **Knowledge Asset** である。

**理由**  
LLMはセッションをまたいで記憶を保持しない。  
Project Memoryを Gitで管理することで、  
どのAIセッションでも同じ設計コンテキストから作業を開始できる。

---

## D004 — Mock First, AI Later

**日付**: 2026-06-26  
**状態**: 採用

AIを呼ばずにドメインフローを完成させ、  
その後 `ResearchResultPort` の AI実装で差し替える。

**理由**  
AIなしでビジネスロジックが正しく動くことを先に証明する。  
テストコストを抑え、AI呼び出しのレイテンシなしで開発サイクルを高速化する。
