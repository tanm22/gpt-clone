'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }
      // Remove window.location.reload() - AuthProvider handles state changes
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymous = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      console.log('Anonymous user created:', data.user);
      // Remove window.location.reload() - AuthProvider handles state changes
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="modal">
      <div className="modal-overlay" />
      <div className="modal-content">
        <div className="modal-header">
          <h2>{isLogin ? 'Welcome back!' : 'Create your account'}</h2>
        </div>
        <div className="card__body">
          <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="form-control"
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="form-control"
                required
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              className="btn btn--primary btn--full-width"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </button>
          </form>

          <button
            onClick={handleAnonymous}
            className="btn btn--secondary btn--full-width"
            disabled={isLoading}
            style={{ marginTop: '12px' }}
          >
            Continue as Guest
          </button>
        </div>
        <div className="modal-footer auth-switch">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="link-button"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              cursor: 'pointer',
              marginLeft: 4,
              padding: 0,
              font: 'inherit'
            }}
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
