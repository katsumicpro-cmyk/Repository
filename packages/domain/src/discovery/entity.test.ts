import { describe, it, expect } from 'vitest'
import { Discovery } from './entity.js'
import { isOk, isErr } from '@innovation-os/shared/result'

describe('Discovery', () => {
  it('creates with generated prefixed ID and pending status', () => {
    const result = Discovery.create({
      title: 'AI Agents are becoming autonomous',
      rawContent: 'Multiple sources indicate...',
      source: 'manual',
    })
    expect(isOk(result)).toBe(true)
    if (!isOk(result)) return
    expect(result.value.id).toMatch(/^disc_[0-9a-f]{32}$/)
    expect(result.value.status).toBe('pending')
    expect(result.value.title).toBe('AI Agents are becoming autonomous')
  })

  it('trims title whitespace', () => {
    const result = Discovery.create({
      title: '  Trimmed  ',
      rawContent: 'content',
      source: 'manual',
    })
    expect(isOk(result)).toBe(true)
    if (isOk(result)) expect(result.value.title).toBe('Trimmed')
  })

  it('rejects empty title', () => {
    const result = Discovery.create({ title: '   ', rawContent: 'content', source: 'manual' })
    expect(isErr(result)).toBe(true)
    if (isErr(result)) expect(result.error.code).toBe('VALIDATION_ERROR')
  })

  it('rejects empty content', () => {
    const result = Discovery.create({ title: 'Title', rawContent: '', source: 'manual' })
    expect(isErr(result)).toBe(true)
  })

  it('transitions pending → processing → completed', () => {
    const d = Discovery.create({ title: 'T', rawContent: 'C', source: 'manual' })
    expect(isOk(d)).toBe(true)
    if (!isOk(d)) return

    const p = d.value.markProcessing()
    expect(isOk(p)).toBe(true)
    if (!isOk(p)) return
    expect(p.value.status).toBe('processing')

    const c = p.value.markCompleted()
    expect(isOk(c)).toBe(true)
    if (isOk(c)) expect(c.value.status).toBe('completed')
  })

  it('blocks invalid transition: pending → completed', () => {
    const d = Discovery.create({ title: 'T', rawContent: 'C', source: 'manual' })
    if (!isOk(d)) return
    expect(isErr(d.value.markCompleted())).toBe(true)
  })

  it('each creation generates a unique ID', () => {
    const a = Discovery.create({ title: 'A', rawContent: 'C', source: 'manual' })
    const b = Discovery.create({ title: 'B', rawContent: 'C', source: 'manual' })
    if (!isOk(a) || !isOk(b)) return
    expect(a.value.id).not.toBe(b.value.id)
  })
})
