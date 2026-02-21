import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, Clock, Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface AppNotification {
    id: string;
    title: string;
    message: string;
    image?: string;
    created_at: string;
}

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
};

export default function Notifications() {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotifications(data || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                            <Bell className="h-6 w-6 text-indigo-400" />
                        </div>
                        <h1 className="text-3xl font-bold text-white">Notifications</h1>
                    </div>
                    <p className="text-slate-400">View your latest updates and alerts.</p>
                </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden shadow-xl p-6">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                        <Info className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg">No notifications yet.</p>
                    </div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="space-y-4"
                    >
                        {notifications.map((notif) => (
                            <motion.div
                                key={notif.id}
                                variants={itemVariants}
                                className="p-5 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-indigo-500/30 transition-all flex flex-col sm:flex-row gap-5 items-start"
                            >
                                <div className="flex-shrink-0 p-3 bg-indigo-500/10 rounded-xl">
                                    <Bell className="h-6 w-6 text-indigo-400" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                        <h3 className="text-lg font-bold text-white">{notif.title}</h3>
                                        <div className="flex items-center text-xs text-slate-400">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {new Date(notif.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                    <p className="text-slate-300 text-sm leading-relaxed mb-3">
                                        {notif.message}
                                    </p>
                                    {notif.image && (
                                        <div className="mt-4 rounded-xl overflow-hidden border border-white/10 max-w-sm">
                                            <img
                                                src={notif.image}
                                                alt="Notification"
                                                className="w-full h-auto object-cover max-h-48"
                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
