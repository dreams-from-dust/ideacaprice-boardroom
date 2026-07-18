import React, { useState } from 'react';
import { BoardUser, isFirebaseConfigured, auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { ShieldCheck, Mail, Lock, User, Sparkles, X, ShieldAlert, Check, AlertCircle, MailCheck, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: BoardUser) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  if (!isOpen) return null;

  // Real-time password rules calculations
  const passesMinLength = password.length >= 8;
  const passesNumber = /[0-9]/.test(password);
  const passesSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordStrong = passesMinLength && passesNumber && passesSpecial;

  const handleCredentialsAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isSignUp && !isPasswordStrong) {
      setError('password does not meet all secure advisory rules yet');
      return;
    }

    setProcessing(true);

    try {
      if (isFirebaseConfigured && auth) {
        if (isSignUp) {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          if (displayName.trim()) {
            await updateProfile(userCredential.user, { displayName: displayName.trim() });
          }
          onAuthSuccess({
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: displayName.trim() || userCredential.user.displayName,
            isMock: false,
          });
        } else {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          onAuthSuccess({
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: userCredential.user.displayName || 'board member',
            isMock: false,
          });
        }
      } else {
        // Simulation mode for sandbox environments
        if (isSignUp && !displayName.trim()) {
          throw new Error('please enter a display name for your board member pass');
        }

        const simulatedUser: BoardUser = {
          uid: `usr_guest_${Math.random().toString(36).substring(2, 9)}`,
          email: email || 'guest@IdeaCaprice.co',
          displayName: displayName.trim() || 'executive associate',
          isMock: true,
        };

        const usersRaw = localStorage.getItem('IdeaCaprice_mock_users') || '[]';
        const users = JSON.parse(usersRaw);
        users.push(simulatedUser);
        localStorage.setItem('IdeaCaprice_mock_users', JSON.stringify(users));

        onAuthSuccess(simulatedUser);
      }
      onClose();
    } catch (err: any) {
      console.error('Auth error:', err);
      // convert any server error to lowercase and clean of forbidden characters
      const cleanError = (err.message || 'authentication failed')
        .toLowerCase()
        .replace(/[-/()]/g, ' ');
      setError(cleanError);
    } finally {
      setProcessing(false);
    }
  };

  const createGuestPass = () => {
    const randomGuest: BoardUser = {
      uid: `usr_guest_${Math.random().toString(36).substring(2, 6)}`,
      email: 'guest@IdeaCaprice.co',
      displayName: 'Guest Mode',
      isMock: true,
    };
    onAuthSuccess(randomGuest);
    onClose();
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('please enter your email address first');
      return;
    }

    setProcessing(true);
    try {
      if (isFirebaseConfigured && auth) {
        await sendPasswordResetEmail(auth, email.trim());
        setResetSent(true);
      } else {
        setError('password reset needs a connected cloud workspace, not available in local mode');
      }
    } catch (err: any) {
      console.error('Password reset error:', err);
      const cleanError = (err.message || 'could not send the reset email')
        .toLowerCase()
        .replace(/[-/()]/g, ' ');
      setError(cleanError);
    } finally {
      setProcessing(false);
    }
  };

  const exitResetMode = () => {
    setIsResetMode(false);
    setResetSent(false);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden" id="auth-modal-screen">
      <div className="relative bg-charcoal border-2 border-charcoal-light w-full max-w-md p-6 md:p-8 rounded-[2rem] shadow-2xl overflow-y-auto overflow-x-hidden max-h-[90vh] my-8 font-sans themed-scrollbar">
        
        {/* Decorative ambient lights */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-peach-medium/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-peach/5 rounded-full blur-2xl pointer-events-none" />

        <button
          onClick={() => {
            exitResetMode();
            onClose();
          }}
          id="close-auth-modal-btn"
          className="absolute top-4 right-4 text-cream-dim hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand header always in lowercase with clean sans-serif styles */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-peach flex items-center justify-center mx-auto mb-4 border border-white/10 shadow-inner">
            {isResetMode ? <MailCheck className="w-6 h-6 text-ink" /> : <ShieldCheck className="w-6 h-6 text-ink" />}
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-cream font-sans">
            {isResetMode
              ? (resetSent ? 'Check your inbox' : 'Reset your password')
              : (isSignUp ? 'Create your workspace account' : 'Sign in to your dashboard')}
          </h3>
          <p className="text-xs sm:text-sm text-[var(--color-peach-medium)] mt-1 font-mono tracking-wider font-bold">
            {isResetMode
              ? (resetSent ? 'Reset link sent, if that account exists' : "We'll email you a secure reset link")
              : (isFirebaseConfigured ? 'Connected to secure cloud workspace' : 'Local mode offline secure profile')}
          </p>
        </div>

        {isResetMode ? (
          resetSent ? (
            <div className="space-y-5 text-center">
              <p className="text-sm sm:text-base text-cream-dim leading-relaxed font-sans">
                If an account exists for <span className="text-cream font-semibold">{email}</span>, a password reset email is on its way. Follow the link inside to choose a new password.
              </p>
              <button
                onClick={exitResetMode}
                className="w-full py-3 rounded-2xl bg-peach text-ink text-sm sm:text-base font-bold cursor-pointer transition-all hover:bg-peach-medium active:scale-95 tracking-wide font-sans flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm sm:text-base font-semibold text-cream-dim block">
                  Your email address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-peach absolute left-3 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full bg-charcoal-dark border border-charcoal text-cream placeholder-cream-dim/20 rounded-2xl py-3 pl-10 pr-4 text-base focus:ring-1 focus:ring-peach focus:outline-none transition-all font-sans"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-peach-dark/10 border border-peach-dark/15 text-[#ff8080] text-sm leading-relaxed animate-fadeIn font-sans">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={processing}
                className="w-full py-3 rounded-2xl bg-peach text-ink text-sm sm:text-base font-bold cursor-pointer transition-all hover:bg-peach-medium active:scale-95 disabled:opacity-30 tracking-wide font-sans"
              >
                {processing ? 'Sending reset link...' : 'Send reset link'}
              </button>

              <button
                type="button"
                onClick={exitResetMode}
                className="w-full flex items-center justify-center gap-1.5 text-sm text-cream-dim hover:text-cream transition-colors cursor-pointer font-sans font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to sign in
              </button>
            </form>
          )
        ) : (
        <>
        <form onSubmit={handleCredentialsAuth} className="space-y-4">
          <AnimatePresence mode="wait">
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-1.5"
                key="name-field"
              >
                <label className="text-sm sm:text-base font-semibold text-cream-dim block">
                  Your full name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-peach absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Sterling Aiden"
                    className="w-full bg-charcoal-dark border border-charcoal text-cream placeholder-cream-dim/20 rounded-2xl py-3 pl-10 pr-4 text-base focus:ring-1 focus:ring-peach focus:outline-none transition-all font-sans"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1.5">
            <label className="text-sm sm:text-base font-semibold text-cream-dim block">
              Your email address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-peach absolute left-3 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full bg-charcoal-dark border border-charcoal text-cream placeholder-cream-dim/20 rounded-2xl py-3 pl-10 pr-4 text-base focus:ring-1 focus:ring-peach focus:outline-none transition-all font-sans"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm sm:text-base font-semibold text-cream-dim block">
                Choose a password
              </label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => {
                    setIsResetMode(true);
                    setError(null);
                  }}
                  className="text-xs sm:text-sm text-peach hover:underline cursor-pointer font-sans font-semibold shrink-0"
                >
                  Forgot password?
                </button>
              )}
            </div>
            {isSignUp && (
              <p className="text-xs sm:text-sm text-cream-dim/50 font-sans">
                At least 8 characters, with a number and a symbol.
              </p>
            )}
            <div className="relative">
              <Lock className="w-4 h-4 text-peach absolute left-3 top-3.5" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-charcoal-dark border border-charcoal text-cream placeholder-cream-dim/20 rounded-2xl py-3 pl-10 pr-11 text-base focus:ring-1 focus:ring-peach focus:outline-none transition-all font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-3.5 text-cream-dim/50 hover:text-cream transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Live Interactive Password Strength Checklist with zero capitals, hyphens, slashes or brackets */}
            {isSignUp && password.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-charcoal-dark/50 border border-charcoal-light p-3.5 rounded-2xl space-y-2 mt-2"
              >
                <p className="text-xs sm:text-sm text-cream-dim/60 font-sans font-bold">
                  Password strength criteria
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    {passesMinLength ? (
                      <Check className="w-4 h-4 text-peach-medium" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-cream-dim/20" />
                    )}
                    <span className={passesMinLength ? 'text-cream font-medium' : 'text-cream-dim/40'}>
                      Contains eight or more letters
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {passesNumber ? (
                      <Check className="w-4 h-4 text-peach-medium" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-cream-dim/20" />
                    )}
                    <span className={passesNumber ? 'text-cream font-medium' : 'text-cream-dim/40'}>
                      Contains at least one number
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {passesSpecial ? (
                      <Check className="w-4 h-4 text-peach-medium" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-cream-dim/20" />
                    )}
                    <span className={passesSpecial ? 'text-cream font-medium' : 'text-cream-dim/40'}>
                      Contains at least one symbol like exclamation mark or hashtag
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-peach-dark/10 border border-peach-dark/15 text-[#ff8080] text-sm leading-relaxed animate-fadeIn font-sans">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={processing || (isSignUp && !isPasswordStrong)}
            id="auth-submit-btn"
            className="w-full py-3 rounded-2xl bg-peach text-ink text-sm sm:text-base font-bold cursor-pointer transition-all hover:bg-peach-medium active:scale-95 disabled:opacity-30 tracking-wide font-sans mt-2"
          >
            {processing ? 'Signing you in...' : isSignUp ? 'Create my workspace profile' : 'Sign me into advisor dashboard'}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-charcoal-light flex flex-col gap-3 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-sm text-peach hover:underline cursor-pointer font-sans font-semibold"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-charcoal"></div>
            <span className="flex-shrink mx-3 text-xs sm:text-sm text-peach-medium font-sans font-bold tracking-wide">Or pitch as temporary visitor</span>
            <div className="flex-grow border-t border-charcoal"></div>
          </div>

          <button
            onClick={createGuestPass}
            className="w-full py-2.5 bg-charcoal-dark hover:bg-charcoal border border-charcoal text-cream text-sm sm:text-base font-bold rounded-2xl cursor-pointer transition-all active:scale-95 font-sans"
          >
            Use direct guest mode with no credentials
          </button>
        </div>
        </>
        )}
      </div>
    </div>
  );
}