import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Initialize Supabase Client (lazy to avoid crash when env vars are missing)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseServiceKey) {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
} else {
    console.warn('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Push notifications will not work.');
}

// Configure Web Push
const publicVapidKey = process.env.VITE_VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

if (publicVapidKey && privateVapidKey) {
    webpush.setVapidDetails(
        'mailto:admin@quizapp.com',
        publicVapidKey,
        privateVapidKey
    );
} else {
    console.warn('Missing VAPID Keys. Push notifications will not work.');
}

app.get('/', (req, res) => {
    res.send('Quiz Platform API is running');
});

// Endpoint to save subscription
app.post('/subscribe', async (req, res) => {
    if (!supabase) {
        res.status(503).json({ error: 'Push notifications are not configured' });
        return;
    }

    const { subscription, userId } = req.body;

    if (!subscription) {
        res.status(400).json({ error: 'Subscription object is required' });
        return;
    }

    try {
        const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
                user_id: userId || null,
                subscription: subscription
            } as any, { onConflict: 'subscription' });

        if (error) throw error;

        res.status(201).json({ message: 'Subscription saved successfully' });
    } catch (error: any) {
        console.error('Error saving subscription:', error);
        res.status(500).json({ error: 'Failed to save subscription' });
    }
});

// Endpoint to send notification (Admin only - ideally protected)
app.post('/send-notification', async (req, res) => {
    if (!supabase) {
        res.status(503).json({ error: 'Push notifications are not configured' });
        return;
    }

    if (!publicVapidKey || !privateVapidKey) {
        res.status(503).json({ error: 'VAPID keys are not configured on the server' });
        return;
    }

    const { title, message } = req.body;

    if (!title || !message) {
        res.status(400).json({ error: 'Title and message are required' });
        return;
    }

    try {
        // Fetch all subscriptions
        const { data: subscriptions, error } = await (supabase as any)
            .from('push_subscriptions')
            .select('id, subscription');

        if (error) throw error;

        if (!subscriptions || subscriptions.length === 0) {
            res.status(200).json({ message: 'No subscriptions found', sent: 0, failed: 0 });
            return;
        }

        const payload = JSON.stringify({ title, body: message });

        let sent = 0;
        let failed = 0;
        const errors: string[] = [];
        const expiredIds: string[] = [];

        // Send notifications in parallel
        const promises = subscriptions.map(async (sub: any) => {
            try {
                await webpush.sendNotification(sub.subscription as webpush.PushSubscription, payload);
                sent++;
            } catch (err: any) {
                failed++;
                const errMsg = `Sub ${sub.id}: ${err.statusCode || 'unknown'} - ${err.body || err.message}`;
                errors.push(errMsg);
                console.error('Error sending notification:', errMsg);

                if (err.statusCode === 410 || err.statusCode === 404) {
                    expiredIds.push(sub.id);
                }
            }
        });

        await Promise.all(promises);

        // Clean up expired subscriptions
        if (expiredIds.length > 0) {
            const { error: deleteError } = await supabase!
                .from('push_subscriptions')
                .delete()
                .in('id', expiredIds);
            if (deleteError) console.error('Error deleting expired subscriptions:', deleteError);
        }

        res.status(200).json({
            message: `Sent: ${sent}, Failed: ${failed}, Total: ${subscriptions.length}`,
            sent,
            failed,
            total: subscriptions.length,
            errors: errors.length > 0 ? errors : undefined,
            expiredRemoved: expiredIds.length
        });
    } catch (error: any) {
        console.error('Error sending notifications:', error);
        res.status(500).json({ error: 'Failed to send notifications', details: error.message });
    }
});

// Only listen if not running on Vercel (Vercel exports the app)
if (!process.env.VERCEL) {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

export default app;
