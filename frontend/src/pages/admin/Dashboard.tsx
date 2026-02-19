import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { PlusCircle, Edit3, Trash2, FileText, CheckCircle, Search, LayoutDashboard, Send, Bell, Image as ImageIcon, UploadCloud, X, Link as LinkIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const NOTIFICATION_STORAGE_BUCKET = 'question-images-v2';

interface Quiz {
    id: string;
    title: string;
    description: string;
    is_published: boolean;
    created_at: string;
}

export default function AdminDashboard() {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Notification State
    const [notifTitle, setNotifTitle] = useState('');
    const [notifMessage, setNotifMessage] = useState('');
    const [notifImage, setNotifImage] = useState('');
    const [sendingNotif, setSendingNotif] = useState(false);

    // Image upload state
    const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
    const [notifImageFile, setNotifImageFile] = useState<File | null>(null);
    const [notifImagePreview, setNotifImagePreview] = useState('');
    const [notifImageUploading, setNotifImageUploading] = useState(false);
    const imageInputRef = useRef<HTMLInputElement | null>(null);

    const uploadNotifImage = async (file: File): Promise<string | null> => {
        const fileExt = file.name.split('.').pop();
        const fileName = `notif_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `notifications/${fileName}`;

        setNotifImageUploading(true);
        try {
            const { error: uploadError } = await supabase.storage
                .from(NOTIFICATION_STORAGE_BUCKET)
                .upload(filePath, file);

            if (uploadError) {
                console.error('Error uploading notification image:', uploadError);
                alert(`Error uploading image: ${uploadError.message}`);
                return null;
            }

            const { data } = supabase.storage
                .from(NOTIFICATION_STORAGE_BUCKET)
                .getPublicUrl(filePath);

            return data?.publicUrl || null;
        } finally {
            setNotifImageUploading(false);
        }
    };

    const handleNotifImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setNotifImageFile(file);
        setNotifImagePreview(URL.createObjectURL(file));
        setNotifImage(''); // clear URL mode
    };

    const clearNotifImage = () => {
        setNotifImageFile(null);
        setNotifImagePreview('');
        setNotifImage('');
        if (imageInputRef.current) imageInputRef.current.value = '';
    };

    const sendNotification = async () => {
        if (!notifTitle || !notifMessage) return;
        setSendingNotif(true);
        try {
            let imageUrl = notifImage || undefined;

            // If a file was selected, upload it first
            if (imageMode === 'upload' && notifImageFile) {
                const uploadedUrl = await uploadNotifImage(notifImageFile);
                if (uploadedUrl) {
                    imageUrl = uploadedUrl;
                } else {
                    setSendingNotif(false);
                    return; // upload failed, don't send
                }
            }

            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
            const response = await fetch(`${backendUrl}/send-notification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: notifTitle, message: notifMessage, image: imageUrl })
            });

            const data = await response.json();

            if (response.ok) {
                const detail = `Sent: ${data.sent || 0}, Failed: ${data.failed || 0}, Total: ${data.total || 0}`;
                const errorInfo = data.errors ? `\n\nErrors:\n${data.errors.join('\n')}` : '';
                alert(`Notification result:\n${detail}${errorInfo}`);
                if (data.sent > 0) {
                    setNotifTitle('');
                    setNotifMessage('');
                    clearNotifImage();
                }
            } else {
                alert(`Failed: ${data.error || 'Unknown error'}${data.details ? '\n' + data.details : ''}`);
            }
        } catch (e) {
            console.error(e);
            alert('Error sending notification. Check console for details.');
        } finally {
            setSendingNotif(false);
        }
    };

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        try {
            const { data, error } = await supabase
                .from('quizzes')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setQuizzes(data || []);
        } catch (error) {
            console.error('Error fetching quizzes:', error);
        } finally {
            setLoading(false);
        }
    };

    const togglePublish = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('quizzes')
                .update({ is_published: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            setQuizzes(quizzes.map(q => q.id === id ? { ...q, is_published: !currentStatus } : q));
        } catch (error) {
            console.error('Error updating quiz:', error);
        }
    };

    const deleteQuiz = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) return;

        try {
            const { error } = await supabase
                .from('quizzes')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setQuizzes(quizzes.filter(q => q.id !== id));
        } catch (error) {
            console.error('Error deleting quiz:', error);
        }
    };

    const filteredQuizzes = quizzes.filter(quiz =>
        quiz.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = [
        { label: 'Total Quizzes', value: quizzes.length, icon: FileText, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
        { label: 'Published', value: quizzes.filter(q => q.is_published).length, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
        { label: 'Drafts', value: quizzes.filter(q => !q.is_published).length, icon: Edit3, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    ];

    if (loading) return (
        <div className="min-h-[50vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
    );

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                            <LayoutDashboard className="h-6 w-6 text-indigo-400" />
                        </div>
                        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                    </div>
                    <p className="text-slate-400">Manage your quizzes and view analytics.</p>
                </div>
                <Link
                    to="/admin/create-quiz"
                    className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-900 transition-all hover:scale-105"
                >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Create New Quiz
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={stat.label}
                        className={`bg-white/5 backdrop-blur-sm overflow-hidden rounded-2xl border ${stat.border} p-6`}
                    >
                        <div className="flex items-center">
                            <div className={`flex-shrink-0 rounded-xl p-3 ${stat.bg}`}>
                                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-slate-400 truncate">{stat.label}</dt>
                                    <dd>
                                        <div className="text-2xl font-bold text-white">{stat.value}</div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Quiz Management */}
            <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden shadow-xl">
                <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-slate-400" />
                        Your Quizzes
                    </h2>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search quizzes..."
                            className="bg-slate-900/50 border border-white/10 text-white text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2.5 placeholder-slate-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Search className="w-4 h-4 text-slate-500" />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/5">
                        <thead className="bg-white/5">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Quiz
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Date Created
                                </th>
                                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 bg-transparent">
                            {filteredQuizzes.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                        No quizzes found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredQuizzes.map((quiz) => (
                                    <tr key={quiz.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-white mb-1">
                                                    {quiz.title}
                                                </span>
                                                <span className="text-xs text-slate-400 truncate max-w-xs">{quiz.description || "No description"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => togglePublish(quiz.id, quiz.is_published)}
                                                className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border cursor-pointer transition-all ${quiz.is_published
                                                    ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                                                    : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20'
                                                    }`}
                                            >
                                                {quiz.is_published ? 'Published' : 'Draft'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                            {new Date(quiz.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-3">
                                                <Link
                                                    to={`/admin/edit-quiz/${quiz.id}`}
                                                    className="text-indigo-400 hover:text-indigo-300 p-2 hover:bg-indigo-500/20 rounded-full transition-colors"
                                                    title="Edit Quiz"
                                                >
                                                    <Edit3 className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    onClick={() => deleteQuiz(quiz.id)}
                                                    className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/20 rounded-full transition-colors"
                                                    title="Delete Quiz"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Push Notifications */}
            <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden shadow-xl p-6">
                <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                    <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
                        <Bell className="h-5 w-5 text-purple-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Push Notifications</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Notification Title</label>
                        <input
                            type="text"
                            value={notifTitle}
                            onChange={(e) => setNotifTitle(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="e.g. New Quiz Available!"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Message</label>
                        <input
                            type="text"
                            value={notifMessage}
                            onChange={(e) => setNotifMessage(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="Brief description..."
                        />
                    </div>
                </div>

                {/* Image Section */}
                <div className="mt-6">
                    <label className="block text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Notification Image (optional)
                    </label>

                    {/* Mode Tabs */}
                    <div className="flex gap-2 mb-4">
                        <button
                            type="button"
                            onClick={() => { setImageMode('upload'); setNotifImage(''); }}
                            className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-all ${imageMode === 'upload'
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                    : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                                }`}
                        >
                            <UploadCloud className="h-4 w-4" />
                            Upload Image
                        </button>
                        <button
                            type="button"
                            onClick={() => { setImageMode('url'); clearNotifImage(); }}
                            className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-all ${imageMode === 'url'
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                    : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                                }`}
                        >
                            <LinkIcon className="h-4 w-4" />
                            Paste URL
                        </button>
                    </div>

                    {/* Upload Mode */}
                    {imageMode === 'upload' && (
                        <div>
                            <input
                                type="file"
                                ref={imageInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleNotifImageSelect}
                            />
                            {!notifImageFile ? (
                                <button
                                    type="button"
                                    onClick={() => imageInputRef.current?.click()}
                                    className="w-full border-2 border-dashed border-white/10 hover:border-purple-500/40 rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-all hover:bg-white/5 cursor-pointer group"
                                >
                                    <div className="p-3 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
                                        <UploadCloud className="h-8 w-8 text-purple-400" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-white">Click to upload an image</p>
                                        <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF, WEBP</p>
                                    </div>
                                </button>
                            ) : (
                                <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/40 max-w-sm">
                                    <img
                                        src={notifImagePreview}
                                        alt="Notification preview"
                                        className="w-full h-auto max-h-48 object-contain"
                                    />
                                    <div className="absolute top-2 right-2 flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => imageInputRef.current?.click()}
                                            className="p-1.5 bg-black/60 hover:bg-black/80 rounded-lg text-white transition-colors backdrop-blur-sm"
                                            title="Change image"
                                        >
                                            <UploadCloud className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={clearNotifImage}
                                            className="p-1.5 bg-red-500/60 hover:bg-red-500/80 rounded-lg text-white transition-colors backdrop-blur-sm"
                                            title="Remove image"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div className="px-3 py-2 bg-black/40 text-xs text-slate-400 truncate">
                                        {notifImageFile.name}
                                    </div>
                                </div>
                            )}
                            {notifImageUploading && (
                                <div className="mt-3 flex items-center gap-2 text-sm text-purple-300">
                                    <div className="h-4 w-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                                    Uploading image...
                                </div>
                            )}
                        </div>
                    )}

                    {/* URL Mode */}
                    {imageMode === 'url' && (
                        <div>
                            <input
                                type="url"
                                value={notifImage}
                                onChange={(e) => setNotifImage(e.target.value)}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                placeholder="https://example.com/image.png"
                            />
                            {notifImage && (
                                <div className="mt-3 rounded-xl overflow-hidden border border-white/10 bg-black/40 max-w-sm">
                                    <img
                                        src={notifImage}
                                        alt="Notification preview"
                                        className="w-full h-auto max-h-48 object-contain"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={sendNotification}
                        disabled={sendingNotif || notifImageUploading || !notifTitle || !notifMessage}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {sendingNotif ? (
                            <>Sending...</>
                        ) : (
                            <>
                                <Send className="h-4 w-4 mr-2" />
                                Send to All Users
                            </>
                        )}
                    </button>
                </div>
            </div>

        </div>
    );
}
