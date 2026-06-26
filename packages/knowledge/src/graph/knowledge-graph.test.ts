import { describe, it, expect } from 'vitest'
import { isOk, isErr } from '@innovation-os/shared/result'
import { KnowledgeGraph } from './knowledge-graph.js'
import { KnowledgeFact } from '../fact/knowledge-fact.js'

function makeFact(content: string) {
  const r = KnowledgeFact.create({ content, sourceKind: 'discovery', sourceLabel: 'mock', theme: 'AI' })
  if (!isOk(r)) throw new Error('fact creation failed')
  return r.value
}

describe('KnowledgeGraph', () => {
  it('creates empty graph with prefixed ID', () => {
    const r = KnowledgeGraph.create({ theme: 'AIエージェント' })
    expect(isOk(r)).toBe(true)
    if (!isOk(r)) return
    expect(r.value.id).toMatch(/^kgph_[0-9a-f]{32}$/)
    expect(r.value.nodeCount).toBe(0)
    expect(r.value.edgeCount).toBe(0)
  })

  it('rejects empty theme', () => {
    expect(isErr(KnowledgeGraph.create({ theme: '  ' }))).toBe(true)
  })

  it('addFact increases nodeCount', () => {
    const g = KnowledgeGraph.create({ theme: 'AI' })
    expect(isOk(g)).toBe(true)
    if (!isOk(g)) return

    const r = g.value.addFact(makeFact('Fact A'))
    expect(isOk(r)).toBe(true)
    if (!isOk(r)) return
    expect(r.value.nodeCount).toBe(1)
  })

  it('addFact is idempotent for duplicate content', () => {
    let g = KnowledgeGraph.create({ theme: 'AI' })
    if (!isOk(g)) return

    const fact = makeFact('Fact A')
    const r1 = g.value.addFact(fact)
    if (!isOk(r1)) return
    const r2 = r1.value.addFact(fact)
    if (!isOk(r2)) return
    expect(r2.value.nodeCount).toBe(1)
  })

  it('addEdge connects two nodes', () => {
    const gResult = KnowledgeGraph.create({ theme: 'AI' })
    if (!isOk(gResult)) return

    const r1 = gResult.value.addFact(makeFact('Fact A'))
    if (!isOk(r1)) return
    const r2 = r1.value.addFact(makeFact('Fact B'))
    if (!isOk(r2)) return

    const graph = r2.value
    const [nodeA, nodeB] = graph.nodes
    if (!nodeA || !nodeB) return

    const r3 = graph.addEdge(nodeA.id, nodeB.id, 'RELATED_TO')
    expect(isOk(r3)).toBe(true)
    if (!isOk(r3)) return
    expect(r3.value.edgeCount).toBe(1)
    expect(r3.value.neighbors(nodeA.id)).toHaveLength(1)
  })

  it('addEdge rejects self-loops', () => {
    const gResult = KnowledgeGraph.create({ theme: 'AI' })
    if (!isOk(gResult)) return

    const r1 = gResult.value.addFact(makeFact('Fact A'))
    if (!isOk(r1)) return
    const node = r1.value.nodes[0]
    if (!node) return

    expect(isErr(r1.value.addEdge(node.id, node.id, 'RELATED_TO'))).toBe(true)
  })

  it('addEdge rejects unknown node IDs', () => {
    const gResult = KnowledgeGraph.create({ theme: 'AI' })
    if (!isOk(gResult)) return

    const fakeId = 'knd_00000000000000000000000000000000' as ReturnType<typeof gResult.value.nodes[0]['id'] extends infer T ? () => T : never>
    expect(isErr(gResult.value.addEdge(fakeId as never, fakeId as never, 'RELATED_TO'))).toBe(true)
  })

  it('emits NodeAdded domain event when fact is added', () => {
    const gResult = KnowledgeGraph.create({ theme: 'AI' })
    if (!isOk(gResult)) return

    const r = gResult.value.addFact(makeFact('Fact A'))
    if (!isOk(r)) return
    expect(r.value.domainEvents).toHaveLength(1)
    expect(r.value.domainEvents[0]?._type).toBe('knowledge.node_added')
  })

  it('highConfidenceNodes filters correctly', () => {
    const gResult = KnowledgeGraph.create({ theme: 'AI' })
    if (!isOk(gResult)) return

    const lowFact = KnowledgeFact.create({ content: 'Low confidence', sourceKind: 'manual', sourceLabel: 's', confidenceBand: 'low' })
    const highFact = KnowledgeFact.create({ content: 'High confidence', sourceKind: 'manual', sourceLabel: 's', confidenceBand: 'high' })
    if (!isOk(lowFact) || !isOk(highFact)) return

    const r1 = gResult.value.addFact(lowFact.value)
    if (!isOk(r1)) return
    const r2 = r1.value.addFact(highFact.value)
    if (!isOk(r2)) return

    expect(r2.value.highConfidenceNodes()).toHaveLength(1)
  })
})
