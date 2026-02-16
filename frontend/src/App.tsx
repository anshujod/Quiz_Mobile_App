import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Layout from './components/Layout';
import Home from './pages/Home';
import AdminDashboard from './pages/admin/Dashboard';
import CreateQuiz from './pages/admin/CreateQuiz';
import QuizPlayer from './pages/QuizPlayer';
import UserHistory from './pages/UserHistory';
import Leaderboard from './pages/Leaderboard';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: ('admin' | 'user')[] }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />; // Redirect unauthorized users to home
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Home />} />
        <Route path="quiz/:quizId" element={<QuizPlayer />} />
        <Route path="history" element={<UserHistory />} />
        <Route path="leaderboard" element={<Leaderboard />} />



        {/* Admin Routes */}
        <Route path="admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="admin/create-quiz" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CreateQuiz />
          </ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

import { useRegisterSW } from 'virtual:pwa-register/react';
import { useEffect } from 'react';
import { supabase } from './lib/supabase';

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function App() {
  useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  useEffect(() => {
    const subscribeUser = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

          if (!publicVapidKey) {
            console.warn('VITE_VAPID_PUBLIC_KEY not found');
            return;
          }

          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
          });

          // Send subscription to backend
          const { data: { user } } = await supabase.auth.getUser();

          // Replace with your backend URL. Assuming relative path if proxied, or full URL.
          // For now using localhost for dev, but should be env var for prod.
          // In previous steps we saw no explicit backend URL in .env, frontend calls Supabase directly.
          // But for push we added a backend. We should use a relative path if deployed properly or configured URL.
          // Let's assume relative '/api' or direct URL.
          // Since we deployed backend separately, we need its URL.
          // I'll add a placeholder or check env.
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

          await fetch(`${backendUrl}/subscribe`, {
            method: 'POST',
            body: JSON.stringify({
              subscription: subscription,
              userId: user?.id
            }),
            headers: {
              'Content-Type': 'application/json'
            }
          });

          console.log('User Subscribed to Push Notifications');
        } catch (error) {
          console.error('Failed to subscribe the user: ', error);
        }
      }
    };

    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          subscribeUser();
        }
      });
    } else if (Notification.permission === 'granted') {
      subscribeUser();
    }
  }, []);

  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
