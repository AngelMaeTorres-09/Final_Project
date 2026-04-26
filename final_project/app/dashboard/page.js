"use client";
import { useState } from 'react';

export default function Dashboard() {
    const [search, setSearch] = useState("");
    const topArticles = [
        { id: 1, title: "Deep Learning Trends", views: 2500, tag: "AI" },
        { id: 2, title: "Data Integration 101", views: 2100, tag: "Systems" },
        { id: 3, title: "Supabase vs Firebase", views: 1800, tag: "Database" },
        { id: 4, title: "Next.js 14 Speed", views: 1500, tag: "Web" },
        { id: 5, title: "Python for Finance", views: 1200, tag: "Data" },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
                <div>
                    <h2 className="text-3xl font-bold">Welcome back, Student!</h2>
                    <p className="text-slate-500">Here are the trending insights today.</p>
                </div>
                <div className="w-full md:w-80">
                    <input
                        type="text"
                        placeholder="Search ML topics..."
                        className="w-full px-4 py-2 rounded-full border border-slate-200 bg-white shadow-inner"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <h3 className="text-lg font-bold uppercase tracking-widest text-slate-400 mb-6">Top 5 Trending</h3>
            <div className="grid md:grid-cols-5 gap-6">
                {topArticles.map((art, index) => (
                    <div key={art.id} className="relative bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:translate-y-[-4px] transition-all">
                        <span className="absolute -top-3 -left-3 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                            {index + 1}
                        </span>
                        <p className="text-[10px] font-black text-blue-500 mb-2 uppercase">{art.tag}</p>
                        <h4 className="font-bold text-slate-800 leading-tight mb-4">{art.title}</h4>
                        <p className="text-xs text-slate-400 font-medium">{art.views} views</p>
                    </div>
                ))}
            </div>
        </div>
    );
}