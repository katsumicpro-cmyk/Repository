import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ data: [], message: 'Discovery list — not yet implemented' })
}

export async function POST() {
  return NextResponse.json({ message: 'Create Discovery — not yet implemented' }, { status: 201 })
}
