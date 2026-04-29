import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] text-white selection:bg-purple-500/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.24),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(79,70,229,0.18),_transparent_25%)] pointer-events-none" />
      <div className="absolute left-[10%] top-24 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />
      <div className="absolute right-[5%] top-1/4 h-60 w-60 rounded-full bg-fuchsia-500/10 blur-3xl" />

      <nav className="relative z-10 max-w-7xl mx-auto flex items-center justify-between px-6 py-6 lg:px-8">
        <div className="text-2xl font-black tracking-tight text-white">
          <span className="text-purple-400">vibe</span><span className="text-white">.</span>
        </div>
        <Link href="/auth" className="rounded-full border border-purple-500/30 bg-white/5 px-5 py-3 text-sm font-semibold text-purple-200 shadow-[0_15px_50px_-30px_rgba(124,58,237,0.7)] transition hover:bg-purple-500/20 hover:text-white">
          Sign in
        </Link>
      </nav>

      <main className="relative z-10 flex min-h-[calc(100vh-96px)] flex-col items-center justify-center px-6 pb-24 pt-8 text-center lg:px-8">
        <div className="mx-auto max-w-4xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-purple-200 shadow-sm shadow-purple-500/10">
            Launch your AI experience
          </span>

          <h1 className="mt-8 text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
            Build the next generation of <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-500">intelligent experiences</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-xl">
            A beautiful home for your ML workflows, from publishing ideas to sharing announcements and staying connected with your community.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/auth" className="inline-flex items-center justify-center rounded-full bg-purple-500 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-purple-500/20 transition hover:bg-purple-400">
              Get started
            </Link>
            <button className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-slate-200 transition hover:border-purple-400/40 hover:bg-white/10">
              Explore features
            </button>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-3">
            {[
              { title: 'Live Collaboration', subtitle: 'Share updates with your team instantly.' },
              { title: 'Intelligent Publishing', subtitle: 'Create, publish, and notify in one flow.' },
              { title: 'Insightful History', subtitle: 'Track read/unread updates with ease.' }
            ].map((item, index) => (
              <div key={index} className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-left shadow-[0_25px_80px_-50px_rgba(255,255,255,0.2)] backdrop-blur-xl transition hover:border-purple-500/30 hover:bg-white/10">
                <p className="text-sm uppercase tracking-[0.35em] text-purple-300">Feature</p>
                <h2 className="mt-4 text-2xl font-bold text-white">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">{item.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-black/60 py-10 text-center text-sm text-slate-500 backdrop-blur-xl">
        <p>© 2026 vibe. Crafted for ambitious creators and teams.</p>
      </footer>
    </div>
  );
}
