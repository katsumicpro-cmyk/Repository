import { redirect } from 'next/navigation'

// Redirect root to Innovation Workspace v0.1
export default function HomePage() {
  redirect('/workspace')
}
