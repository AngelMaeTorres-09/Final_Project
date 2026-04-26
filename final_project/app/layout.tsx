import './globals.css';
import Link from 'next/link';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">
        <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              ML HUB
            </h1>
            <div className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
              <Link href="/" className="hover:text-blue-600">Home</Link>
              <Link href="/dashboard" className="hover:text-blue-600">Articles</Link>
              <Link href="/auth" className="hover:text-blue-600">Profile</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative p-2 bg-slate-100 rounded-full hover:bg-slate-200 cursor-pointer">
              🔔 <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-500 border border-blue-200" />
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}