import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Missing Supabase URL or Service Role Key. Push notifications will not work.');
}

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');

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
            }, { onConflict: 'subscription' });

        if (error) throw error;

        res.status(201).json({ message: 'Subscription saved successfully' });
    } catch (error: any) {
        console.error('Error saving subscription:', error);
        res.status(500).json({ error: 'Failed to save subscription' });
    }
});

// Endpoint to send notification (Admin only - ideally protected)
app.post('/send-notification', async (req, res) => {
    const { title, message } = req.body;

    if (!title || !message) {
        res.status(400).json({ error: 'Title and message are required' });
        return;
    }

    try {
        // Fetch all subscriptions
        const { data: subscriptions, error } = await supabase
            .from('push_subscriptions')
            .select('subscription');

        if (error) throw error;

        if (!subscriptions || subscriptions.length === 0) {
            res.status(200).json({ message: 'No subscriptions found' });
            return;
        }

        const payload = JSON.stringify({ title, body: message });

        // Send notifications in parallel
        const promises = subscriptions.map(sub =>
            webpush.sendNotification(sub.subscription as webpush.PushSubscription, payload)
                .catch((err: any) => {
                    console.error('Error sending notification:', err);
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        // Subscription has expired or is no longer valid, remove it
                        console.log('Removing expired subscription...');
                        supabase
                            .from('push_subscriptions')
                            .delete()
                            .match({ subscription: sub.subscription })
                            .then(({ error: deleteError }) => {
                                if (deleteError) console.error('Error deleting expired subscription:', deleteError);
                            });
                    }
                })
        );

        await Promise.all(promises);

        res.status(200).json({ message: `Attempted to send to ${subscriptions.length} subscribers` });
    } catch (error: any) {
        console.error('Error sending notifications:', error);
        res.status(500).json({ error: 'Failed to send notifications' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

export default app;
