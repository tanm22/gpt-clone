'use client';

import { useAuth } from '@/components/AuthProvider';
import AuthForm from '@/components/AuthForm';
import ChatInterface from '@/components/ChatInterface';

export default function HomePage() {
  const { user, loading } = useAuth();

  //show loading state
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  //show auth form if not authenticated
  if (!user) {
    return <AuthForm />;
  }

  //show chat interface if authenticated
  return <ChatInterface />;
}
