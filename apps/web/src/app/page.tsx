export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Innovation OS</h1>
      <p className="mt-4 text-lg text-gray-600">Knowledge Creation Operating System</p>
      <nav className="mt-12 flex gap-6">
        <a href="/research" className="rounded-lg border px-6 py-3 hover:bg-gray-50">
          Research Workspace
        </a>
        <a href="/knowledge" className="rounded-lg border px-6 py-3 hover:bg-gray-50">
          Knowledge Workspace
        </a>
        <a href="/innovation" className="rounded-lg border px-6 py-3 hover:bg-gray-50">
          Innovation Workspace
        </a>
      </nav>
    </main>
  )
}
