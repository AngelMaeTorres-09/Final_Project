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
        // Validation
        if (!title.trim()) {
            alert("Please enter an article title");
            return;
        }
        if (!content.trim()) {
            alert("Please enter article content");
            return;
        }

        setLoading(true);

        try {
            // 1. Insert the Article
            const { data: article, error: artError } = await supabase
                .from('articles')
                .insert([{ 
                    title: title.trim(), 
                    content: content.trim(),
                    likes_count: 0,
                    comment_count: 0
                }])
                .select();

            if (artError || !article || article.length === 0) {
                alert("Publishing failed: " + (artError?.message || "No data returned"));
                setLoading(false);
                return;
            }

            const publishedArticle = article[0];

            // 2. Create Global Notification for all users
            const notificationMsg = `New Article Published: "${title.trim()}"`;
            const { data: notifData, error: notifError } = await supabase.from('notifications').insert({
                content: notificationMsg,
                type: 'post',
                created_at: new Date().toISOString()
            }).select();

            if (notifError) {
                alert("Article published, but notification failed: " + notifError.message);
                console.warn("Notification save failed:", notifError.message);
            }

            // 3. Complete publish flow without sending email
            alert("Article published successfully! Notification created.");

            // 4. Clear form and redirect
            setTitle('');
            setContent('');
            router.push('/articles');
        } catch (error: any) {
            alert("Unexpected error: " + (error?.message || "Unknown error"));
            console.error("Publish error:", error);
        } finally {
            setLoading(false);
        }
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