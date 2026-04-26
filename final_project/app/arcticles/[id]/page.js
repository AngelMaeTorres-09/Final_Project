"use client";
import { useState } from 'react';

export default function ArticleDetail() {
    const [comment, setComment] = useState("");

    // Mock Data for Demo
    const comments = [
        {
            id: 1, user: "Alex", text: "Great intro to ML!",
            replies: [{ id: 101, user: "Admin", text: "Glad you liked it!" }]
        },
    ];

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <header className="mb-10">
                <h1 className="text-4xl font-bold mb-4">Neural Networks Basics</h1>
                <div className="flex gap-4 text-sm text-slate-500">
                    <span>👁️ 1,240 views</span>
                    <button onClick={() => navigator.share({ title: 'ML Hub', url: '' })} className="text-blue-600 font-bold hover:underline">
                        Share to Platforms
                    </button>
                </div>
            </header>

            {/* Comment Section */}
            <section className="mt-12 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-xl font-bold mb-6">Discussion</h3>
                <textarea
                    className="w-full p-4 border border-slate-200 rounded-xl mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Write a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                />

                <div className="space-y-6">
                    {comments.map(c => (
                        <div key={c.id} className="group">
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <p className="font-bold text-sm text-blue-600">{c.user}</p>
                                <p className="text-slate-700">{c.text}</p>
                            </div>

                            {/* Nested Replies */}
                            <div className="ml-10 mt-3 space-y-3 border-l-2 border-slate-100 pl-4">
                                {c.replies.map(r => (
                                    <div key={r.id} className="text-sm bg-white border border-slate-100 p-3 rounded-lg">
                                        <p className="font-bold text-slate-800">{r.user}</p>
                                        <p className="text-slate-600">{r.text}</p>
                                    </div>
                                ))}
                                <button className="text-xs font-bold text-slate-400 hover:text-blue-500">Reply</button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}