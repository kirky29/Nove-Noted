'use client';

import { useState } from 'react';
import { Eye, EyeOff, Book, UserPlus, LogIn, Mail, Lock, User, Chrome } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type LoginMode = 'signin' | 'signup' | 'forgot';

export default function LoginPage() {
  const { signIn, signUp, signInWithGoogle, resetPassword, loading } = useAuth();
  const [mode, setMode] = useState<LoginMode>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      if (mode === 'signin') {
        await signIn(formData.email, formData.password);
      } else if (mode === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          return;
        }
        await signUp(formData.email, formData.password, formData.displayName);
      } else if (mode === 'forgot') {
        await resetPassword(formData.email);
        setMessage('Password reset email sent! Check your inbox.');
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      displayName: '',
      confirmPassword: '',
    });
    setError('');
    setMessage('');
  };

  const switchMode = (newMode: LoginMode) => {
    setMode(newMode);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Book className="h-10 w-10 text-white mr-2" />
            <h1 className="text-3xl font-bold text-white">Novel Noted</h1>
          </div>
          <p className="text-white/80">
            {mode === 'signin' && 'Welcome back! Sign in to continue your reading journey.'}
            {mode === 'signup' && 'Join thousands of readers tracking their literary adventures.'}
            {mode === 'forgot' && 'Enter your email to reset your password.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Display Name (Sign Up only) */}
          {mode === 'signup' && (
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-white mb-2">
                Display Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Your name"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>
          </div>

          {/* Password (not for forgot password) */}
          {mode !== 'forgot' && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          )}

          {/* Confirm Password (Sign Up only) */}
          {mode === 'signup' && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Confirm your password"
                />
              </div>
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="text-red-300 text-sm text-center bg-red-500/20 border border-red-500/30 rounded-lg p-3">
              {error}
            </div>
          )}
          {message && (
            <div className="text-green-300 text-sm text-center bg-green-500/20 border border-green-500/30 rounded-lg p-3">
              {message}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                {mode === 'signin' && <LogIn className="h-5 w-5 mr-2" />}
                {mode === 'signup' && <UserPlus className="h-5 w-5 mr-2" />}
                {mode === 'forgot' && <Mail className="h-5 w-5 mr-2" />}
                {mode === 'signin' && 'Sign In'}
                {mode === 'signup' && 'Create Account'}
                {mode === 'forgot' && 'Send Reset Email'}
              </>
            )}
          </button>

          {/* Google Sign In (not for forgot password) */}
          {mode !== 'forgot' && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white/60">
                    Or continue with
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white/10 border border-white/20 text-white py-3 px-4 rounded-lg font-medium hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              >
                <Chrome className="h-5 w-5 mr-2" />
                Continue with Google
              </button>
            </>
          )}
        </form>

        {/* Mode Switcher */}
        <div className="mt-6 text-center">
          {mode === 'signin' && (
            <div className="space-y-2">
              <p className="text-white/60">
                Don't have an account?{' '}
                <button
                  onClick={() => switchMode('signup')}
                  className="text-blue-300 hover:text-blue-200 font-medium"
                >
                  Sign up
                </button>
              </p>
              <button
                onClick={() => switchMode('forgot')}
                className="text-blue-300 hover:text-blue-200 text-sm"
              >
                Forgot your password?
              </button>
            </div>
          )}
          {mode === 'signup' && (
            <p className="text-white/60">
              Already have an account?{' '}
              <button
                onClick={() => switchMode('signin')}
                className="text-blue-300 hover:text-blue-200 font-medium"
              >
                Sign in
              </button>
            </p>
          )}
          {mode === 'forgot' && (
            <p className="text-white/60">
              Remember your password?{' '}
              <button
                onClick={() => switchMode('signin')}
                className="text-blue-300 hover:text-blue-200 font-medium"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 