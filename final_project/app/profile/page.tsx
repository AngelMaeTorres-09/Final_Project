"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
    User as UserIcon,
    MapPin,
    School,
    Phone,
    Calendar,
    VenusAndMars, // Fixed export name here
    RefreshCw,
    Edit,
    Loader2
} from 'lucide-react';

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [uploading, setUploading] = useState(false);
    const [updatedFields, setUpdatedFields] = useState<any>({});

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (data) {
                setProfile(data);
                setUpdatedFields(data);
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
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found.");

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setProfile((prev: any) => ({ ...prev, avatar_url: publicUrl }));
            setUpdatedFields((prev: any) => ({ ...prev, avatar_url: publicUrl }));
            alert('Photo updated successfully!');

        } catch (error: any) {
            alert("Error uploading: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSyncProfile = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('profiles')
            .update(updatedFields)
            .eq('id', user.id);

        if (error) {
            console.error(error);
            alert("Error syncing profile!");
        } else {
            await fetchProfile();
            alert("Profile Synced!");
        }
        setLoading(false);
    };

    const fieldDefinitions = [
        { key: 'full_name', label: 'Full Name', icon: UserIcon, placeholder: 'Enter Name' },
        { key: 'age', label: 'Age', icon: Calendar, placeholder: '21', type: 'number' },
        { key: 'gender', label: 'Gender', icon: VenusAndMars, placeholder: 'Gender' }, // Fixed icon here
        { key: 'school_institution', label: 'School / Institution', icon: School, placeholder: 'University Name' },
        { key: 'phone_number', label: 'Phone Number', icon: Phone, placeholder: '09xxxxxxxxx' },
        { key: 'current_address', label: 'Current Address', icon: MapPin, placeholder: 'City, Country' },
    ];

    return (
        <div className="flex-1 bg-black text-white font-sans p-10 min-h-screen">
            <div className="flex items-start justify-between mb-16 max-w-7xl mx-auto">
                <div>
                    <h1 className="text-6xl font-black text-white tracking-tighter italic uppercase">My Vibe</h1>
                    <p className="text-gray-500 mt-2 text-sm">Manage your identity and terminal settings.</p>
                </div>
                <div className="flex items-center gap-2 bg-[#111] border border-white/10 px-4 py-2 rounded-full shadow-inner text-xs font-mono text-purple-400">
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    SYSTEM STATUS: ONLINE
                </div>
            </div>

            {loading && !profile ? (
                <div className="flex items-center justify-center pt-20"><Loader2 className="animate-spin text-purple-500" size={40} /></div>
            ) : (
                <div className="max-w-7xl mx-auto grid grid-cols-12 gap-10">
                    <div className="col-span-4 bg-[#0a0a0a] border border-white/5 p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center text-center">

                        <div className="relative mb-6 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            {profile?.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt="Avatar"
                                    className="w-36 h-36 rounded-full object-cover border-4 border-[#111] shadow-xl group-hover:border-purple-600/50 transition-all"
                                />
                            ) : (
                                <div className="w-36 h-36 bg-[#111] border-4 border-[#111] rounded-full flex items-center justify-center text-gray-700 shadow-xl group-hover:border-purple-600/50 transition-all">
                                    <UserIcon size={56} />
                                </div>
                            )}

                            <div className="absolute inset-0 bg-black/70 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                                {uploading ? (
                                    <Loader2 className="animate-spin text-white" size={24} />
                                ) : (
                                    <>
                                        <Edit size={16} className="text-purple-400" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white text-center">Change<br />Photo</span>
                                    </>
                                )}
                            </div>

                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleUploadPhoto}
                                disabled={uploading}
                                className="hidden"
                            />
                        </div>

                        <h2 className="text-2xl font-black text-white tracking-tight leading-tight">{profile?.full_name || 'Guest User'}</h2>
                        <p className="text-[10px] font-black text-purple-400 mt-2 uppercase tracking-[0.2em] bg-purple-900/30 px-3 py-1 rounded-md">Verified Identity</p>

                        <div className="w-full h-px bg-white/5 my-8"></div>

                        <div className="w-full space-y-4 text-left px-4">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500 uppercase font-bold tracking-wider">Account Tier</span>
                                <span className="font-black text-purple-500 uppercase tracking-widest">{profile?.account_tier || 'PRO'}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500 uppercase font-bold tracking-wider">Server Node</span>
                                <span className="font-mono text-gray-400 uppercase">{profile?.server_node || 'US-EAST-1'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-8 bg-[#0a0a0a] border border-white/5 p-10 rounded-[2.5rem] shadow-2xl relative">
                        <div className="grid grid-cols-2 gap-x-10 gap-y-6">
                            {fieldDefinitions.map((field, idx) => (
                                <div key={idx} className={`${idx === 3 || idx === 5 ? 'col-span-2' : ''}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <field.icon className="text-purple-500" size={16} />
                                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{field.label}</label>
                                    </div>
                                    <input
                                        type={field.type || 'text'}
                                        value={updatedFields[field.key] || ''}
                                        placeholder={field.placeholder}
                                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                                        className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-1 focus:ring-purple-600 focus:border-purple-600/50 outline-none transition-all placeholder:text-gray-700 font-bold"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between mt-12 pt-8 border-t border-white/5">
                            <p className="text-[10px] text-gray-600 font-mono">
                                LAST SYNCHRONIZED: {profile?.updated_at ? new Date(profile.updated_at).toLocaleTimeString() : 'WAITING...'}
                            </p>
                            <button
                                onClick={handleSyncProfile}
                                disabled={loading}
                                className="bg-white text-black text-xs font-black py-4 px-10 rounded-full hover:bg-purple-600 hover:text-white transition-all uppercase tracking-widest flex items-center gap-3 shadow-lg"
                            >
                                {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                                Sync Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}