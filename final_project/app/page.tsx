import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-blue-500/30">
      {/* Decorative Background Element */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent -z-10" />

      {/* Main Content Container */}
      <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center">

        {/* Requirement: Application Title [cite: 43] */}
        <div className="space-y-4">
          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
            Machine Learning Hub
          </h1>

          {/* Requirement: Short Description [cite: 44, 46] */}
          <p className="max-w-xl mx-auto text-lg md:text-xl text-gray-400 leading-relaxed">
            A simple integrated platform for data science and system architecture.
            Connect your frontend to Supabase and deploy seamlessly with Vercel. [cite: 151]
          </p>
        </div>

        {/* Requirement: Button/Link to Login Page [cite: 45, 84] */}
        <div className="mt-10">
          <Link
            href="/auth"
            className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-blue-600 font-pj rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)]"
          >
            Get Started
            <svg
              className="w-5 h-5 ml-2 -mr-1 transition-transform group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        {/* Lab Info Footer (Optional but helpful for Demo) [cite: 129] */}
        <footer className="absolute bottom-8 text-sm text-gray-600 font-mono">
          Laboratory Exercise No. 3 | System Integration & Architecture [cite: 1, 3]
        </footer>
      </main>
    </div>
  );
}