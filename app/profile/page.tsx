"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
    User as UserIcon,
    MapPin,
    School,
    Phone,
    Calendar,
    VenusAndMars,
    RefreshCw,
    Edit,
    Loader2,
    ShieldCheck
} from 'lucide-react';

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [uploading, setUploading] = useState(false);
    const [updatedFields, setUpdatedFields] = useState<any>({});

    const isAdmin = profile?.role === 'admin' || profile?.is_admin;

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error && error.code === 'PGRST116') {
                const newProfile = {
                    id: user.id,
                    full_name: user.email?.split('@')[0] || 'New User',
                    avatar_url: null,
                    is_admin: false,
                    role: 'user',
                    updated_at: new Date().toISOString(),
                };

                const { data: createdData, error: createError } = await supabase
                    .from('profiles')
                    .insert(newProfile)
                    .select()
                    .single();

                if (!createError) data = createdData;
            }

            if (data) {
                setProfile(data);
                setUpdatedFields(data); // This loads existing DB values into the input fields
            }
        } catch (error) {
            console.error("Profile fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setUpdatedFields((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleUploadPhoto = async (event: any) => {
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) return;
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found.");

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    avatar_url: publicUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (updateError) throw updateError;
            setProfile((prev: any) => ({ ...prev, avatar_url: publicUrl }));
            alert('Photo updated successfully!');
        } catch (error: any) {
            alert("Error: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    // --- UPDATED SYNC LOGIC ---
    const handleSyncProfile = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // We prepare the update object specifically with the fields 
            const updatePayload = {
                full_name: updatedFields.full_name,
                age: updatedFields.age,
                gender: updatedFields.gender,
                school_institution: updatedFields.school_institution,
                phone_number: updatedFields.phone_number,
                current_address: updatedFields.current_address,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('profiles')
                .update(updatePayload)
                .eq('id', user.id);

            if (error) throw error;

            alert("Profile metadata updated successfully!");
            await fetchProfile(); // Refresh UI with new data
        } catch (error: any) {
            console.error(error);
            alert("Update failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const fieldDefinitions = [
        { key: 'full_name', label: 'Full Name', icon: UserIcon, placeholder: 'Enter Name' },
        { key: 'age', label: 'Age', icon: Calendar, placeholder: '21', type: 'number' },
        { key: 'gender', label: 'Gender', icon: VenusAndMars, placeholder: 'Gender' },
        { key: 'school_institution', label: 'School / Institution', icon: School, placeholder: 'University Name' },
        { key: 'phone_number', label: 'Phone Number', icon: Phone, placeholder: '09xxxxxxxxx' },
        { key: 'current_address', label: 'Current Address', icon: MapPin, placeholder: 'City, Country' },
    ];

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#050505] text-white selection:bg-purple-500/30 font-sans">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.24),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.14),_transparent_25%)]" />
            <div className="pointer-events-none absolute left-[-120px] top-24 h-72 w-72 rounded-full bg-purple-600/10 blur-3xl" />
            <div className="pointer-events-none absolute right-[-100px] bottom-24 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />

            <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:px-8">
                <div className="mb-12 flex flex-col gap-6 rounded-[2.5rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-3xl">
                        <p className="text-xs uppercase tracking-[0.35em] text-purple-300">Profile Control Center</p>
                        <h1 className="mt-4 text-5xl font-black tracking-tight text-white">Your personal vibe</h1>
                        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">Update your profile details, upload your avatar, and manage permissions with a premium interface.</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <button onClick={fetchProfile} className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Refresh profile</button>
                        <div className="rounded-full bg-purple-500/10 px-5 py-3 text-sm font-black uppercase tracking-[0.35em] text-purple-200">{isAdmin ? 'Admin' : 'User'}</div>
                    </div>
                </div>

                {loading && !profile ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-purple-500" size={44} /></div>
                ) : (
                    <div className="grid gap-10 xl:grid-cols-[360px_1fr]">
                        <aside className="rounded-[2.5rem] border border-white/10 bg-[#090a0e]/95 p-8 shadow-2xl shadow-black/30">
                            <div className="flex flex-col items-center gap-6 text-center">
                                <div className="relative cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                                    <div className={`relative overflow-hidden rounded-full ${profile?.is_admin ? 'bg-gradient-to-tr from-purple-600 to-blue-500 p-1 shadow-[0_0_30px_rgba(124,58,237,0.25)]' : 'bg-white/10 p-1'}`}>
                                        <div className="h-40 w-40 overflow-hidden rounded-full bg-[#111]"></div>
                                        {profile?.avatar_url ? (
                                            <img src={profile.avatar_url} alt="Avatar" className="absolute inset-0 h-full w-full object-cover" />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-white/80"><UserIcon size={56} /></div>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 hidden items-center justify-center rounded-full bg-black/70 text-sm uppercase tracking-[0.35em] text-white/80 transition-all group-hover:flex">
                                        {uploading ? <Loader2 className="animate-spin" size={20} /> : 'Change photo'}
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black tracking-tight text-white">{profile?.full_name || 'Guest User'}</h2>
                                    <p className="mt-2 text-xs uppercase tracking-[0.35em] text-slate-400">{isAdmin ? 'SYSTEM ADMINISTRATOR' : 'VERIFIED USER'}</p>
                                </div>
                            </div>

                            <div className="mt-10 space-y-4">
                                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                    <p className="text-[10px] uppercase tracking-[0.35em] text-purple-300">Access level</p>
                                    <p className="mt-3 text-2xl font-black text-white">{isAdmin ? 'Level 100' : 'Level 01'}</p>
                                </div>
                                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                    <p className="text-[10px] uppercase tracking-[0.35em] text-purple-300">Member since</p>
                                    <p className="mt-3 text-sm text-slate-300">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}</p>
                                </div>
                            </div>
                        </aside>

                        <section className="rounded-[2.5rem] border border-white/10 bg-[#090a0e]/95 p-10 shadow-2xl shadow-black/30">
                            <div className="grid gap-6 md:grid-cols-2">
                                {fieldDefinitions.map((field, idx) => (
                                    <div key={idx} className={`${idx === 3 || idx === 5 ? 'md:col-span-2' : ''}`}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <field.icon className={profile?.is_admin ? 'text-purple-500' : 'text-sky-400'} size={18} />
                                            <label className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">{field.label}</label>
                                        </div>
                                        <input
                                            type={field.type || 'text'}
                                            value={updatedFields[field.key] || ''}
                                            placeholder={field.placeholder}
                                            onChange={(e) => handleInputChange(field.key, e.target.value)}
                                            className="w-full rounded-3xl border border-white/10 bg-[#07101a] px-5 py-4 text-sm text-white outline-none transition focus:border-purple-500"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">Last sync</p>
                                    <p className="mt-2 text-sm text-slate-300">{profile?.updated_at ? new Date(profile.updated_at).toLocaleString() : 'Pending update'}</p>
                                </div>
                                <button
                                    onClick={handleSyncProfile}
                                    disabled={loading}
                                    className="inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 px-6 py-4 text-sm font-black uppercase tracking-[0.35em] text-white shadow-xl shadow-purple-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                                    Update Profile
                                </button>
                            </div>
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
}