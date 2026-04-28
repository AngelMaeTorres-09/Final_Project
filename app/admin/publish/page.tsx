"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminPublish() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handlePublish() {
        setLoading(true);

        // 1. Insert the Article
        const { data: article, error: artError } = await supabase
            .from('articles')
            .insert([{ title, content }])
            .select()
            .single();

        if (artError) {
            alert("Publishing failed: " + artError.message);
            setLoading(false);
            return;
        }

        // 2. Trigger Dashboard Notifications for all users
        const { data: users } = await supabase.from('profiles').select('id');
        if (users) {
            const notifications = users.map(u => ({
                user_id: u.id,
                title: "New Article Published",
                message: `Read our latest research: ${title}`,
                link: `/articles/${article.id}`
            }));
            await supabase.from('dashboard_notifications').insert(notifications);
        }

        // 3. Email Notification Note
        // Note: For real emails, use Supabase Edge Functions or an 
        // onChange Trigger to call Resend/SendGrid API.

        alert("Article Live & Notifications Synced!");
        router.push('/articles');
    }

    return (
        <div className="min-h-screen bg-black text-white p-10">
            <h1 className="text-3xl font-black mb-8 text-purple-500 uppercase italic">Publish Research</h1>
            <div className="max-w-2xl space-y-6">
                <input
                    className="w-full bg-[#0a0a0a] border border-white/10 p-4 rounded-xl outline-none focus:border-purple-500"
                    placeholder="Article Title..."
                    onChange={(e) => setTitle(e.target.value)}
                />
                <textarea
                    className="w-full bg-[#0a0a0a] border border-white/10 p-4 rounded-xl h-64 outline-none focus:border-purple-500"
                    placeholder="Write content here..."
                    onChange={(e) => setContent(e.target.value)}
                />
                <button
                    onClick={handlePublish}
                    disabled={loading}
                    className="w-full bg-purple-600 p-4 rounded-xl font-bold uppercase tracking-widest hover:bg-purple-700 transition-all"
                >
                    {loading ? "Syncing..." : "Post to Library"}
                </button>
            </div>
        </div>
    );
}