import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  Shield,
  Award,
  Sparkles,
  Calendar,
  Rocket,
  Paintbrush,
  Lock,
  Check,
  RotateCcw
} from 'lucide-react';
import { User } from '../types/discord';
import { RoleBadge } from './RoleBadge';
import { NitroBadge } from './NitroBadge';
import {
  getAvatarFrameClass,
  getResolvedUserBanner,
  NITRO_BANNER_PRESETS,
  checkUserHasNitro
} from '../utils/nitroUtils';

interface UserProfileModalProps {
  user: User | null;
  onClose: () => void;
  onSendDirectMessage?: (userId: string, initialMessage?: string) => void;
  onOpenSettings?: () => void;
  onOpenNitro?: () => void;
  onUpdateUser?: (updated: Partial<User>) => void;
  isSelf?: boolean;
}

const QUICK_BANNER_COLORS = [
  '#5865F2', // Blurple
  '#eb459e', // Nitro Pink
  '#57f287', // Emerald
  '#fee75c', // Golden
  '#ed4245', // Crimson
  '#111214', // Jet Black
  '#2b1055', // Deep Cosmos
  '#00f2fe'  // Cyan
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  onClose,
  onSendDirectMessage,
  onOpenSettings,
  onOpenNitro,
  onUpdateUser,
  isSelf
}) => {
  const [quickMsg, setQuickMsg] = useState('');
  const [isBannerStudioOpen, setIsBannerStudioOpen] = useState(false);
  const [activeBannerTab, setActiveBannerTab] = useState<'animated' | 'color'>('animated');

  // Immediate null-check safety guard
  if (!user || typeof user !== 'object') {
    return null;
  }

  const userId = user.id || 'unknown_user';
  const displayName = user.displayName || user.username || 'Discord User';
  const username = user.username || 'user';
  const discriminator = user.discriminator || '0000';
  const avatar = user.avatar || 'https://api.dicebear.com/7.x/identicon/svg?seed=user';
  const avatarFrame = user.avatarFrame;
  const status = user.status || 'offline';
  const customStatus = user.customStatus || '';
  const aboutMe = user.aboutMe || '';
  const role = user.role;
  const roleColor = user.roleColor;

  const hasNitro = checkUserHasNitro(user);
  const isBooster = Boolean(user.badges?.includes('Nitro Booster'));

  // Banner resolution: only Nitro users have animated or custom color banners active
  const resolvedBanner = getResolvedUserBanner(user);

  const badges = Array.isArray(user.badges) ? [...user.badges] : [];
  if (hasNitro && !badges.includes('Nitro Subscriber') && !badges.includes('Nitro Booster')) {
    badges.unshift('Nitro Subscriber');
  }

  const getStatusColor = (st: string) => {
    switch (st) {
      case 'online':
        return 'bg-[#23a55a]';
      case 'idle':
        return 'bg-[#f0b232]';
      case 'dnd':
        return 'bg-[#f23f43]';
      default:
        return 'bg-[#80848e]';
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMsg.trim() || !onSendDirectMessage) return;
    onSendDirectMessage(userId, quickMsg.trim());
    onClose();
  };

  const handleSelectPreset = (presetBackground: string) => {
    if (!hasNitro) {
      onOpenNitro?.();
      return;
    }
    onUpdateUser?.({
      customBanner: presetBackground,
      bannerColor: presetBackground
    });
  };

  const handleSelectCustomColor = (colorHex: string) => {
    if (!hasNitro) {
      onOpenNitro?.();
      return;
    }
    onUpdateUser?.({
      customBanner: '',
      bannerColor: colorHex
    });
  };

  const handleResetBanner = () => {
    onUpdateUser?.({
      customBanner: '',
      bannerColor: '#5865F2'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-[340px] max-h-[90vh] flex flex-col bg-[#232428] rounded-2xl shadow-2xl overflow-hidden border border-[#1f2023] text-[#dbdee1] discord-pop relative">
        {/* Banner Area */}
        <div
          className={`h-28 w-full relative shrink-0 transition-all duration-300 ${resolvedBanner.className}`}
          style={{ background: resolvedBanner.background }}
        >
          {/* Subtle Animated Banner indicator pill if banner is actively animated */}
          {resolvedBanner.isAnimated && (
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/45 backdrop-blur-md border border-[#eb459e]/40 text-white text-[10px] font-bold shadow-md">
              <Sparkles className="w-3 h-3 text-[#eb459e]" />
              <span>Animated</span>
            </div>
          )}

          {/* Action buttons on top-right */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
            {isSelf && (
              <button
                type="button"
                onClick={() => setIsBannerStudioOpen(prev => !prev)}
                title="Customize Profile Banner"
                className="h-7 px-2.5 rounded-full bg-black/45 hover:bg-black/70 backdrop-blur-md flex items-center gap-1.5 text-white text-[11px] font-semibold border border-white/10 hover:border-white/20 transition-all cursor-pointer shadow-md"
              >
                <Paintbrush className="w-3.5 h-3.5 text-[#eb459e]" />
                <span>{isBannerStudioOpen ? 'Done' : 'Banner'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-black/45 hover:bg-black/70 flex items-center justify-center text-white transition-colors cursor-pointer border border-white/10"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Avatar & Badges Header (CRITICAL: positioned outside overflow-y-auto so the negative margin is never clipped) */}
        <div className="px-4 relative z-10 shrink-0">
          <div className="flex justify-between items-end -mt-10 mb-2">
            <div className="relative">
              <img
                src={avatar}
                alt={displayName}
                className={`w-20 h-20 rounded-full border-[6px] border-[#232428] bg-[#1e1f22] object-cover shadow-lg ${getAvatarFrameClass(
                  avatarFrame
                )}`}
              />
              <span
                className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-[3px] border-[#232428] ${getStatusColor(
                  status
                )}`}
              />
            </div>

            {/* Badges container with authentic Nitro Badge */}
            <div className="flex items-center gap-1.5 p-1.5 bg-[#111214] rounded-lg border border-[#2b2d31]">
              {hasNitro && (
                <NitroBadge size="sm" isBooster={isBooster} />
              )}
              {badges.filter(b => !b.includes('Nitro')).map((badge, idx) => (
                <div
                  key={idx}
                  title={badge}
                  className="w-5 h-5 rounded-md flex items-center justify-center bg-[#5865f2]/20 text-[#5865f2] hover:scale-110 transition-transform cursor-pointer"
                >
                  {badge.includes('Developer') ? (
                    <Shield className="w-3.5 h-3.5 text-[#57f287]" />
                  ) : (
                    <Award className="w-3.5 h-3.5 text-[#fee75c]" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="px-4 pb-4 overflow-y-auto flex-1 space-y-3">
          {/* Banner Studio Drawer (only accessible if opened by user) */}
          {isBannerStudioOpen && (
            <div className="p-3 bg-[#18191c] rounded-xl border border-[#eb459e]/30 space-y-3 discord-pop shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black text-white uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-[#eb459e]" />
                  <span>Nitro Profile Banner</span>
                </div>
                {!hasNitro && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenNitro?.();
                    }}
                    className="text-[11px] font-bold text-[#eb459e] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Lock className="w-3 h-3" /> Requires Nitro
                  </button>
                )}
              </div>

              {!hasNitro ? (
                // Locked State for non-Nitro users
                <div className="p-3 bg-gradient-to-r from-[#eb459e]/10 to-[#5865f2]/10 rounded-lg border border-[#eb459e]/20 text-center space-y-2">
                  <p className="text-xs text-[#dbdee1] leading-relaxed">
                    Custom banner colors and <span className="text-[#eb459e] font-bold">animated profile banners</span> are exclusive to Discord Nitro members.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenNitro?.();
                    }}
                    className="w-full py-1.5 px-3 bg-gradient-to-r from-[#eb459e] to-[#5865f2] hover:opacity-90 text-white text-xs font-bold rounded-md shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-current" />
                    <span>Unlock Animated Banners with Nitro</span>
                  </button>
                </div>
              ) : (
                // Active Nitro Customizer
                <div className="space-y-3">
                  {/* Tabs: Animated vs Color */}
                  <div className="flex bg-[#111214] p-1 rounded-lg border border-[#2b2d31]">
                    <button
                      type="button"
                      onClick={() => setActiveBannerTab('animated')}
                      className={`flex-1 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                        activeBannerTab === 'animated'
                          ? 'bg-[#eb459e] text-white shadow-xs'
                          : 'text-[#949ba4] hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Animated Banners</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveBannerTab('color')}
                      className={`flex-1 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                        activeBannerTab === 'color'
                          ? 'bg-[#5865f2] text-white shadow-xs'
                          : 'text-[#949ba4] hover:text-white'
                      }`}
                    >
                      <Paintbrush className="w-3 h-3" />
                      <span>Custom Color</span>
                    </button>
                  </div>

                  {activeBannerTab === 'animated' ? (
                    <div className="space-y-1.5">
                      <div className="grid grid-cols-2 gap-2">
                        {NITRO_BANNER_PRESETS.filter(p => p.isAnimated).map(preset => {
                          const isSelected = user.customBanner === preset.background;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => handleSelectPreset(preset.background)}
                              className={`h-11 rounded-lg p-2 flex flex-col justify-between text-left transition-all cursor-pointer relative overflow-hidden group border ${
                                isSelected
                                  ? 'border-white ring-2 ring-[#eb459e] shadow-md'
                                  : 'border-transparent hover:border-white/40'
                              } nitro-banner-animated`}
                              style={{ background: preset.background }}
                            >
                              <div className="flex items-center justify-between w-full relative z-10">
                                <span className="text-[9px] font-black uppercase tracking-wider px-1 py-0.5 rounded bg-black/60 text-[#eb459e] border border-[#eb459e]/30">
                                  {preset.badgeLabel || 'ANIMATED'}
                                </span>
                                {isSelected && (
                                  <span className="w-3.5 h-3.5 rounded-full bg-[#23a55a] flex items-center justify-center text-white">
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] font-bold text-white drop-shadow-md truncate relative z-10">
                                {preset.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={user.bannerColor || '#5865F2'}
                          onChange={(e) => handleSelectCustomColor(e.target.value)}
                          className="w-9 h-9 rounded cursor-pointer border border-[#232428] bg-transparent"
                        />
                        <span className="text-xs font-mono text-[#dbdee1]">
                          {user.bannerColor || '#5865F2'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_BANNER_COLORS.map((col) => (
                          <button
                            key={col}
                            type="button"
                            onClick={() => handleSelectCustomColor(col)}
                            className="w-6 h-6 rounded-full border border-white/20 hover:scale-110 transition-transform cursor-pointer shadow-xs"
                            style={{ backgroundColor: col }}
                            title={col}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reset to Default */}
                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={handleResetBanner}
                      className="text-[10px] text-[#949ba4] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset to Default</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Names & Details */}
          <div className="bg-[#111214] p-3 rounded-lg border border-[#2b2d31] space-y-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="text-lg font-bold text-white leading-tight">{displayName}</h3>
                {hasNitro && <NitroBadge size="sm" isBooster={isBooster} />}
                <RoleBadge role={role} roleColor={roleColor} size="sm" />
              </div>
              <p className="text-xs text-[#949ba4] font-medium">
                @{username}#{discriminator}
              </p>
              {customStatus && (
                <div className="mt-1.5 text-xs text-[#dbdee1] flex items-center gap-1.5">
                  <span>💬</span>
                  <span className="italic">{customStatus}</span>
                </div>
              )}
            </div>

            <div className="h-[1px] bg-[#232428]" />

            {/* About Me */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider text-[#949ba4] uppercase">
                About Me
              </span>
              <p className="text-xs text-[#dbdee1] leading-relaxed">
                {aboutMe || 'No bio written yet. Probably busy in a voice channel!'}
              </p>
            </div>

            {/* Roles */}
            {role && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold tracking-wider text-[#949ba4] uppercase">
                  Roles
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <RoleBadge role={role} roleColor={roleColor} size="md" />
                </div>
              </div>
            )}

            {/* Member Since info */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider text-[#949ba4] uppercase">
                Member Since
              </span>
              <div className="flex items-center gap-2 text-[11px] text-[#949ba4]">
                <Calendar className="w-3.5 h-3.5" />
                <span>Discord Member</span>
              </div>
            </div>

            {/* Action Buttons */}
            {isSelf && (
              <div className="pt-2 space-y-2">
                {!hasNitro && onOpenNitro && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenNitro();
                    }}
                    className="w-full py-2 bg-gradient-to-r from-[#eb459e] to-[#5865f2] hover:opacity-95 text-white text-xs font-bold rounded-lg shadow transition-opacity flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-current" />
                    <span>Get Nitro for Animated Banners & Perks</span>
                  </button>
                )}

                {onOpenSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSettings();
                    }}
                    className="w-full py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold rounded-lg shadow transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Edit Profile & Avatar</span>
                  </button>
                )}
              </div>
            )}

            {/* Quick DM message input if not self */}
            {!isSelf && onSendDirectMessage && (
              <form onSubmit={handleSend} className="pt-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={`Message @${displayName}`}
                    value={quickMsg}
                    onChange={(e) => setQuickMsg(e.target.value)}
                    className="w-full bg-[#1e1f22] text-xs text-[#dbdee1] placeholder-[#80848e] rounded px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-[#5865f2] border border-[#2b2d31]"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#949ba4] hover:text-[#5865f2] cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
