import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500/30 overflow-hidden">
      {/* Background Aesthetic Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-purple-900/20 blur-[120px] rounded-full -z-10" />

      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <div className="text-2xl font-extrabold text-purple-600 tracking-tighter">
          vibe.
        </div>
        <Link href="/auth">
          <button className="text-sm font-medium hover:text-purple-400 transition-colors">
            Log In
          </button>
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center pt-20 pb-32 px-4 text-center">
        <div className="inline-block px-4 py-1.5 mb-6 text-sm font-medium tracking-wide text-purple-400 uppercase bg-purple-400/10 border border-purple-400/20 rounded-full">
          The Future of Intelligence
        </div>

        <h1 className="text-6xl md:text-8xl font-extrabold mb-6 tracking-tight bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
          Machine Learning <br />
          <span className="text-purple-600">Perfected.</span>
        </h1>

        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
          Explore the next frontier of AI. Our platform provides high-performance
          integrated tools for ML enthusiasts to collaborate, train, and deploy
          models in a purple-tinted digital ecosystem.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/auth">
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-purple-500/20 active:scale-95">
              Get Started Free
            </button>
          </Link>
          <button className="bg-[#121212] border border-white/10 hover:border-white/20 px-10 py-4 rounded-xl font-bold text-lg transition-all">
            View Docs
          </button>
        </div>

        {/* Feature Preview Elements */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
          {[
            { title: "Neural Sync", desc: "Collaborate on models in real-time." },
            { title: "Quantum Compute", desc: "Access high-tier GPU clusters." },
            { title: "Auto-Deploy", desc: "One-click deployment for your API." }
          ].map((feature, i) => (
            <div key={i} className="p-8 bg-[#0a0a0a] border border-white/5 rounded-2xl text-left hover:border-purple-500/40 transition-colors group">
              <div className="w-10 h-10 bg-purple-600/20 rounded-lg mb-4 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                ✦
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-500 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer Decoration */}
      <footer className="border-t border-white/5 py-12 text-center text-gray-600 text-sm">
        &copy; 2026 Vibe ML Hub. Built for the next generation.
      </footer>
    </div>
  );
}