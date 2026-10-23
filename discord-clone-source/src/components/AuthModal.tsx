import React, { useState } from 'react';
import { X, LogIn, LogOut, CheckCircle, ShieldCheck, Users, MessageSquare } from 'lucide-react';
import { User } from '../types/discord';
import { loginWithGoogle, logoutUser, auth } from '../lib/firebase';

interface AuthModalProps {
  currentUser: User;
  isLoggedIn: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  onLogoutSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  currentUser,
  isLoggedIn,
  onClose,
  onLoginSuccess,
  onLogoutSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await loginWithGoogle();
      const fbUser = result.user;
      const cleanUsername = (fbUser.displayName || 'user')
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .slice(0, 24);

      const realUser: User = {
        id: fbUser.uid,
        username: cleanUsername,
        displayName: fbUser.displayName || 'Discord User',
        discriminator: fbUser.uid.slice(-4).padStart(4, '0'),
        avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${cleanUsername}&backgroundColor=5865F2`,
        bannerColor: '#5865F2',
        status: 'online',
        customStatus: 'Connected live with Discord',
        aboutMe: 'Authenticated Discord Member',
        badges: ['Active Member', 'Early Supporter'],
        role: 'Member',
        roleColor: '#5865F2'
      };

      onLoginSuccess(realUser);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await logoutUser();
      onLogoutSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to sign out.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#313338] text-[#dbdee1] rounded-2xl shadow-2xl overflow-hidden border border-[#1f2023]/40">
        {/* Header decoration */}
        <div className="bg-[#5865F2] h-24 relative flex items-center justify-center">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-white/80 hover:text-white p-1 rounded-full hover:bg-black/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 rounded-full bg-[#313338] p-1 shadow-lg flex items-center justify-center">
            <svg className="w-9 h-9 fill-[#5865F2]" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
          </div>
        </div>

        <div className="p-6 text-center space-y-4">
          <div>
            <h3 className="text-xl font-bold text-white tracking-wide">
              {isLoggedIn ? 'Account Settings' : 'Join Discord Live'}
            </h3>
            <p className="text-sm text-[#949ba4] mt-1">
              {isLoggedIn
                ? 'You are signed in and synced with live Firestore channels and direct messages.'
                : 'Sign in to create your real account and chat with other people live in real-time!'}
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="bg-[#2b2d31] rounded-xl p-3 text-left space-y-2 text-xs text-[#b5bac1]">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#5865F2] shrink-0" />
              <span>Real-time cross-device messages and voice lounge</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#57f287] shrink-0" />
              <span>Appear in live member lists and send direct messages</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#fee75c] shrink-0" />
              <span>No bots or simulated accounts — only authentic users</span>
            </div>
          </div>

          {isLoggedIn ? (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 p-3 bg-[#2b2d31] rounded-xl text-left">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.displayName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#5865F2]"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-white truncate">{currentUser.displayName}</div>
                  <div className="text-xs text-[#949ba4] truncate">
                    @{currentUser.username}#{currentUser.discriminator}
                  </div>
                  {auth.currentUser?.email && (
                    <div className="text-[11px] text-[#5865F2] truncate mt-0.5">
                      {auth.currentUser.email}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[#57f287] text-xs font-medium">
                  <CheckCircle className="w-4 h-4" />
                  <span>Online</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-[#5865F2] hover:bg-[#4752c4] text-white font-medium text-sm transition-colors cursor-pointer"
                >
                  Continue Chatting
                </button>
                <button
                  onClick={handleSignOut}
                  disabled={loading}
                  className="py-2.5 px-4 rounded-lg bg-[#da373c] hover:bg-[#a1282c] text-white font-medium text-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {error && (
                <div className="p-2.5 rounded-lg bg-[#da373c]/20 border border-[#da373c]/40 text-xs text-[#f23f43]">
                  {error}
                </div>
              )}

              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-neutral-100 text-[#1e1f22] font-semibold text-sm transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{loading ? 'Signing In...' : 'Sign In with Google'}</span>
              </button>

              <p className="text-[11px] text-[#949ba4]">
                By signing in, your display name and avatar will be shared with people you chat with.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
