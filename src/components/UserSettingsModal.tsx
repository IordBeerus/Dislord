import React, { useState, useEffect } from 'react';
import {
  X,
  User as UserIcon,
  Sparkles,
  Volume2,
  Tv,
  Bell,
  Palette,
  KeyRound,
  LogOut,
  Check,
  Mic,
  ShieldCheck,
  Sliders,
  Upload,
  Crown,
  Lock,
  Zap,
  Code2,
  Download,
  FileArchive,
  ExternalLink,
  Copy,
  RefreshCw
} from 'lucide-react';
import { User } from '../types/discord';
import { setSoundEffectsEnabled, isSoundEffectsEnabled } from '../utils/audio';
import { AVATAR_FRAMES, NITRO_BANNER_PRESETS, getAvatarFrameClass } from '../utils/nitroUtils';
import { RoleBadge } from './RoleBadge';

interface UserSettingsModalProps {
  currentUser: User;
  onUpdateUser: (updatedUser: Partial<User>) => void;
  onClose: () => void;
  onOpenNitro: () => void;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  currentUser,
  onUpdateUser,
  onClose,
  onOpenNitro
}) => {
  const [activeTab, setActiveTab] = useState<'account' | 'profile' | 'voice' | 'appearance' | 'sounds' | 'code'>('profile');

  // Profile edit states
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [customStatus, setCustomStatus] = useState(currentUser.customStatus || '');
  const [aboutMe, setAboutMe] = useState(currentUser.aboutMe || '');
  const [bannerColor, setBannerColor] = useState(currentUser.bannerColor || '#5865F2');
  const [userStatus, setUserStatus] = useState(currentUser.status);
  const [avatarFrame, setAvatarFrame] = useState(currentUser.avatarFrame || 'none');
  const [customBanner, setCustomBanner] = useState(currentUser.customBanner || '');

  // Download code states
  const [isDownloadingCode, setIsDownloadingCode] = useState(false);
  const [downloadCodeDone, setDownloadCodeDone] = useState(false);
  const [copiedZipUrl, setCopiedZipUrl] = useState(false);

  const handleDownloadZip = async () => {
    setIsDownloadingCode(true);
    try {
      const res = await fetch('/discord-clone-source.zip', { cache: 'no-cache' });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const zipBlob = new Blob([blob], { type: 'application/zip' });
      const blobUrl = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'discord-clone-source.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 15000);
      setDownloadCodeDone(true);
      setTimeout(() => setDownloadCodeDone(false), 3000);
    } catch (err) {
      console.warn('Fallback download:', err);
      window.open('/discord-clone-source.zip', '_blank');
    } finally {
      setIsDownloadingCode(false);
    }
  };

  const handleCopyZipUrl = () => {
    const fullUrl = window.location.origin + '/discord-clone-source.zip';
    navigator.clipboard.writeText(fullUrl);
    setCopiedZipUrl(true);
    setTimeout(() => setCopiedZipUrl(false), 2500);
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('Image size exceeds 8MB. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setAvatar(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRandomizePreset = () => {
    const styles = ['adventurer', 'bottts', 'identicon', 'lorelei', 'personas'];
    const chosen = styles[Math.floor(Math.random() * styles.length)];
    const seed = Math.random().toString(36).substring(2, 8);
    setAvatar(`https://api.dicebear.com/7.x/${chosen}/svg?seed=${seed}&backgroundColor=5865F2`);
  };

  // Audio testing
  const [soundFx, setSoundFx] = useState(isSoundEffectsEnabled());
  const [micTesting, setMicTesting] = useState(false);
  const [micLevel, setMicLevel] = useState(0);

  // Appearance
  const [selectedTheme, setSelectedTheme] = useState<'dark' | 'midnight' | 'light'>('dark');

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Mic test simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (micTesting) {
      interval = setInterval(() => {
        setMicLevel(Math.floor(20 + Math.random() * 75));
      }, 100);
    } else {
      setMicLevel(0);
    }
    return () => clearInterval(interval);
  }, [micTesting]);

  const handleSaveProfile = () => {
    onUpdateUser({
      avatar,
      displayName,
      customStatus,
      aboutMe,
      bannerColor,
      status: userStatus,
      avatarFrame,
      customBanner
    });
  };

  return (
    <div className="fixed inset-0 bg-[#313338] text-[#dbdee1] flex z-50 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Left Sidebar */}
      <div className="w-60 bg-[#2b2d31] flex flex-col items-end py-14 pr-6 select-none shrink-0 border-r border-[#1f2023]/30">
        <div className="w-48 space-y-4">
          {/* USER SETTINGS Group */}
          <div className="space-y-0.5">
            <div className="text-[11px] font-bold text-[#949ba4] uppercase tracking-wider px-2.5 py-1">
              User Settings
            </div>
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-sm font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'bg-[#35373c] text-white'
                  : 'text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Profiles</span>
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-sm font-medium transition-colors ${
                activeTab === 'account'
                  ? 'bg-[#35373c] text-white'
                  : 'text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>My Account</span>
            </button>
            <button
              onClick={onOpenNitro}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-sm font-medium text-[#eb459e] hover:bg-[#eb459e]/10 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4" />
                <span>Nitro</span>
              </div>
              <span className="text-[10px] font-bold uppercase bg-[#eb459e] text-white px-1.5 py-0.2 rounded-full">
                Perks
              </span>
            </button>
          </div>

          <div className="h-[1px] bg-[#35373c] mx-2" />

          {/* APP SETTINGS Group */}
          <div className="space-y-0.5">
            <div className="text-[11px] font-bold text-[#949ba4] uppercase tracking-wider px-2.5 py-1">
              App Settings
            </div>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-sm font-medium transition-colors ${
                activeTab === 'appearance'
                  ? 'bg-[#35373c] text-white'
                  : 'text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Appearance</span>
            </button>
            <button
              onClick={() => setActiveTab('voice')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-sm font-medium transition-colors ${
                activeTab === 'voice'
                  ? 'bg-[#35373c] text-white'
                  : 'text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>Voice & Video</span>
            </button>
            <button
              onClick={() => setActiveTab('sounds')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-sm font-medium transition-colors ${
                activeTab === 'sounds'
                  ? 'bg-[#35373c] text-white'
                  : 'text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Notifications & Sound FX</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-sm font-medium transition-colors ${
                activeTab === 'code'
                  ? 'bg-[#35373c] text-white'
                  : 'text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Code2 className="w-4 h-4 text-[#5865F2]" />
                <span>Download Source Code</span>
              </div>
              <span className="text-[10px] font-bold uppercase bg-[#5865F2]/20 text-[#5865F2] px-1.5 py-0.5 rounded border border-[#5865F2]/30">
                .ZIP
              </span>
            </button>
          </div>

          <div className="h-[1px] bg-[#35373c] mx-2" />

          {/* Logout */}
          <button
            onClick={onClose}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-sm font-medium text-[#f23f43] hover:bg-[#da373c]/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Close Settings</span>
          </button>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 overflow-y-auto px-10 py-14 max-w-3xl relative">
        {/* ESC Button */}
        <div className="fixed top-14 right-16 flex flex-col items-center gap-1 select-none z-10">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border-2 border-[#b5bac1] hover:bg-[#35373c] flex items-center justify-center text-[#b5bac1] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="text-[11px] font-bold text-[#b5bac1]">ESC</span>
        </div>

        {/* Tab 1: Profile Customizer */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">User Profile</h2>
              <p className="text-xs text-[#949ba4]">Customize how you look across all servers</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Form Controls */}
              <div className="space-y-4">
                {/* Avatar Upload Control */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b5bac1]">
                    Avatar (Profile Picture)
                  </label>
                  <div className="flex items-center gap-4 p-3 bg-[#1e1f22] rounded-xl border border-[#232428]">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <img
                        src={avatar}
                        alt="Avatar Preview"
                        className="w-16 h-16 rounded-full object-cover border-2 border-[#5865f2] bg-[#2b2d31]"
                      />
                      <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[9px] font-bold transition-opacity">
                        <Upload className="w-4 h-4 mb-0.5" />
                        <span>CHANGE</span>
                      </div>
                    </div>

                    <div className="space-y-2 flex-1">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-semibold rounded transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Image</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleRandomizePreset}
                          className="px-3 py-1.5 bg-[#2b2d31] hover:bg-[#35373c] text-[#dbdee1] text-xs font-semibold rounded transition-colors flex items-center gap-1.5 border border-[#35373c]"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#fee75c]" />
                          <span>Random Preset</span>
                        </button>
                      </div>
                      <span className="text-[10px] text-[#949ba4] block">
                        Supports PNG, JPG, GIF, WebP (up to 8MB)
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b5bac1] mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-[#1e1f22] text-sm text-[#dbdee1] rounded px-3 py-2 border border-[#232428] focus:outline-none focus:border-[#5865f2]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b5bac1] mb-1.5">
                    Status Message
                  </label>
                  <input
                    type="text"
                    value={customStatus}
                    onChange={(e) => setCustomStatus(e.target.value)}
                    placeholder="What are you up to?"
                    className="w-full bg-[#1e1f22] text-sm text-[#dbdee1] rounded px-3 py-2 border border-[#232428] focus:outline-none focus:border-[#5865f2]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b5bac1] mb-1.5">
                    Presence
                  </label>
                  <select
                    value={userStatus}
                    onChange={(e) => setUserStatus(e.target.value as any)}
                    className="w-full bg-[#1e1f22] text-sm text-[#dbdee1] rounded px-3 py-2 border border-[#232428] focus:outline-none focus:border-[#5865f2]"
                  >
                    <option value="online">🟢 Online</option>
                    <option value="idle">🟡 Idle</option>
                    <option value="dnd">🔴 Do Not Disturb</option>
                    <option value="offline">⚪ Invisible</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b5bac1]">
                      Banner Color
                    </label>
                    {!currentUser.isNitro && (
                      <button
                        type="button"
                        onClick={onOpenNitro}
                        className="text-[10px] font-bold text-[#eb459e] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Lock className="w-3 h-3" /> Requires Nitro
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      disabled={!currentUser.isNitro}
                      value={bannerColor}
                      onChange={(e) => {
                        if (currentUser.isNitro) {
                          setBannerColor(e.target.value);
                          setCustomBanner('');
                        } else {
                          onOpenNitro();
                        }
                      }}
                      className={`w-10 h-10 rounded border border-[#232428] bg-transparent ${currentUser.isNitro ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
                    />
                    <span className="text-xs font-mono text-[#949ba4]">{bannerColor}</span>
                    {!currentUser.isNitro && (
                      <span className="text-[11px] text-[#eb459e]">Unlock custom banner colors with Nitro</span>
                    )}
                  </div>
                </div>

                {/* Nitro Customization Section */}
                <div className="p-3.5 bg-gradient-to-r from-[#eb459e]/10 to-[#5865f2]/10 rounded-xl border border-[#eb459e]/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black text-[#eb459e] uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Nitro Avatar Frames</span>
                    </div>
                    {!currentUser.isNitro && (
                      <button
                        onClick={onOpenNitro}
                        className="text-[10px] font-bold text-[#eb459e] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Lock className="w-3 h-3" /> Requires Nitro
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setAvatarFrame('none')}
                      className={`p-2 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                        avatarFrame === 'none'
                          ? 'border-[#5865f2] bg-[#5865f2]/20 text-white font-bold'
                          : 'border-[#35373c] bg-[#1e1f22] text-[#949ba4] hover:text-white'
                      }`}
                    >
                      None
                    </button>
                    {AVATAR_FRAMES.map((frame) => {
                      const isSelected = avatarFrame === frame.id;
                      return (
                        <button
                          key={frame.id}
                          type="button"
                          onClick={() => {
                            if (currentUser.isNitro) {
                              setAvatarFrame(frame.id);
                            } else {
                              onOpenNitro();
                            }
                          }}
                          className={`p-2 rounded-lg text-[11px] font-medium border text-center transition-all cursor-pointer truncate ${
                            isSelected
                              ? 'border-[#eb459e] bg-[#eb459e]/20 text-white font-bold ring-1 ring-[#eb459e]'
                              : 'border-[#35373c] bg-[#1e1f22] text-[#dbdee1] hover:border-[#eb459e]/60'
                          }`}
                          title={frame.name}
                        >
                          {frame.name.split(' ')[0]} Frame
                        </button>
                      );
                    })}
                  </div>

                  {/* Nitro Themes */}
                  <div className="pt-2 border-t border-[#35373c]/50 space-y-2">
                    <div className="text-[11px] font-black text-[#eb459e] uppercase tracking-wider flex items-center gap-1">
                      <Palette className="w-3.5 h-3.5" />
                      <span>Nitro Profile Themes</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {NITRO_BANNER_PRESETS.map((preset) => {
                        const isSelected = customBanner === preset.background;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              if (currentUser.isNitro) {
                                setCustomBanner(preset.background);
                              } else {
                                onOpenNitro();
                              }
                            }}
                            className={`h-9 rounded-lg text-[10px] font-bold text-white px-2.5 flex items-center justify-between shadow-xs border transition-all cursor-pointer ${
                              isSelected ? 'ring-2 ring-[#eb459e] border-white' : 'border-transparent hover:opacity-90'
                            } ${preset.isAnimated ? 'nitro-banner-animated' : ''}`}
                            style={{ background: preset.background }}
                          >
                            <span className="truncate">{preset.name}</span>
                            <div className="flex items-center gap-1 shrink-0 ml-1">
                              {preset.isAnimated && (
                                <span className="text-[8px] px-1 py-0.5 rounded bg-black/50 text-[#eb459e] font-black">
                                  ANIMATED
                                </span>
                              )}
                              {!currentUser.isNitro && <Lock className="w-3 h-3 text-white/80" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b5bac1] mb-1.5">
                    About Me
                  </label>
                  <textarea
                    rows={4}
                    value={aboutMe}
                    onChange={(e) => setAboutMe(e.target.value)}
                    className="w-full bg-[#1e1f22] text-sm text-[#dbdee1] rounded px-3 py-2 border border-[#232428] focus:outline-none focus:border-[#5865f2] resize-none"
                  />
                </div>

                <button
                  onClick={handleSaveProfile}
                  className="px-5 py-2.5 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold rounded shadow transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>

              {/* Live Preview Card */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4]">
                  Preview
                </span>
                <div className="w-full max-w-[300px] bg-[#232428] rounded-2xl shadow-xl overflow-hidden border border-[#1f2023]">
                  <div
                    className="h-20 w-full"
                    style={{ background: customBanner || bannerColor }}
                  />
                  <div className="px-4 pb-4">
                    <div className="flex justify-between items-end -mt-8 mb-2">
                      <div className="relative">
                        <img
                          src={avatar}
                          alt="Avatar"
                          className={`w-16 h-16 rounded-full border-[4px] border-[#232428] bg-[#1e1f22] object-cover ${getAvatarFrameClass(
                            avatarFrame
                          )}`}
                        />
                      </div>
                      <RoleBadge role={currentUser.role} roleColor={currentUser.roleColor} />
                    </div>
                    <div className="bg-[#111214] p-3 rounded-lg border border-[#2b2d31] space-y-2">
                      <div>
                        <div className="font-bold text-white text-sm">{displayName}</div>
                        <div className="text-[11px] text-[#949ba4]">@{currentUser.username}</div>
                        {customStatus && (
                          <div className="text-xs text-[#dbdee1] mt-1 italic">"{customStatus}"</div>
                        )}
                      </div>
                      <div className="h-[1px] bg-[#232428]" />
                      <div className="text-xs text-[#949ba4] line-clamp-3">
                        {aboutMe || 'No bio yet'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: My Account */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">My Account</h2>
            <div className="bg-[#1e1f22] p-4 rounded-xl border border-[#232428] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img src={currentUser.avatar} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
                <div>
                  <h3 className="font-bold text-white text-base">{currentUser.displayName}</h3>
                  <p className="text-xs text-[#949ba4]">@{currentUser.username}#{currentUser.discriminator}</p>
                  {currentUser.aboutMe && (
                    <p className="text-xs text-[#b5bac1] mt-1">{currentUser.aboutMe}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setActiveTab('profile')}
                className="px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-semibold rounded cursor-pointer transition-colors"
              >
                Edit User Profile
              </button>
            </div>

            {/* Multi-User & Realtime Sync Card */}
            <div className="bg-[#2b2d31] p-5 rounded-xl border border-[#1f2023] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#23a55a] animate-pulse"></span>
                    Live Multi-User Cloud Sync
                  </h4>
                  <p className="text-xs text-[#949ba4] mt-1">
                    Powered by Cloud Firestore. Other people who open this app can create their own accounts and chat with you in real time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Voice & Video */}
        {activeTab === 'voice' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Voice & Video Settings</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1e1f22] p-4 rounded-xl border border-[#232428] space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#b5bac1]">
                  Input Device
                </span>
                <select className="w-full bg-[#2b2d31] text-xs text-white p-2 rounded border border-[#35373c] focus:outline-none">
                  <option>Default - Built-in Microphone</option>
                  <option>Studio USB Condenser Mic</option>
                  <option>Headset Microphone</option>
                </select>
              </div>

              <div className="bg-[#1e1f22] p-4 rounded-xl border border-[#232428] space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#b5bac1]">
                  Output Device
                </span>
                <select className="w-full bg-[#2b2d31] text-xs text-white p-2 rounded border border-[#35373c] focus:outline-none">
                  <option>Default - Headphones / Speakers</option>
                  <option>Digital Audio Interface</option>
                </select>
              </div>
            </div>

            {/* Mic Test Bar */}
            <div className="bg-[#1e1f22] p-4 rounded-xl border border-[#232428] space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#b5bac1]">
                Mic Test
              </span>
              <p className="text-xs text-[#949ba4]">
                Having mic issues? Test your sound volume below.
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setMicTesting(!micTesting)}
                  className={`px-4 py-2 text-xs font-semibold rounded transition-colors ${
                    micTesting ? 'bg-[#f23f43] text-white' : 'bg-[#5865f2] text-white hover:bg-[#4752c4]'
                  }`}
                >
                  {micTesting ? 'Stop Testing' : 'Let\'s Check'}
                </button>
                <div className="flex-1 h-3 bg-[#2b2d31] rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-[#23a55a] via-[#f0b232] to-[#f23f43] rounded-full transition-all duration-100"
                    style={{ width: `${micLevel}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Appearance */}
        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Appearance</h2>

            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#b5bac1]">
                Theme
              </span>
              <div className="grid grid-cols-3 gap-4">
                {/* Dark */}
                <button
                  onClick={() => setSelectedTheme('dark')}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    selectedTheme === 'dark'
                      ? 'border-[#5865f2] ring-2 ring-[#5865f2] bg-[#2b2d31]'
                      : 'border-[#232428] bg-[#1e1f22]'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-[#313338] border-2 border-[#5865f2]" />
                  <span className="text-xs font-bold text-white">Dark</span>
                </button>

                {/* Midnight */}
                <button
                  onClick={() => setSelectedTheme('midnight')}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    selectedTheme === 'midnight'
                      ? 'border-[#5865f2] ring-2 ring-[#5865f2] bg-[#111214]'
                      : 'border-[#232428] bg-[#0c0d0e]'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-[#000000] border-2 border-[#5865f2]" />
                  <span className="text-xs font-bold text-white">Midnight (AMOLED)</span>
                </button>

                {/* Light */}
                <button
                  onClick={() => setSelectedTheme('light')}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    selectedTheme === 'light'
                      ? 'border-[#5865f2] ring-2 ring-[#5865f2] bg-white text-black'
                      : 'border-[#232428] bg-[#e3e5e8] text-black'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-white border-2 border-[#5865f2]" />
                  <span className="text-xs font-bold text-black">Light</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Sound Effects */}
        {activeTab === 'sounds' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Notifications & Sound FX</h2>
            <div className="bg-[#1e1f22] p-4 rounded-xl border border-[#232428] flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-white text-sm">Discord Sound Effects</h4>
                <p className="text-xs text-[#949ba4]">
                  Play authentic Web Audio chimes for incoming messages, voice join/leave, mute, and soundboard.
                </p>
              </div>
              <button
                onClick={() => {
                  const next = !soundFx;
                  setSoundFx(next);
                  setSoundEffectsEnabled(next);
                }}
                className={`w-12 h-6 rounded-full transition-colors p-0.5 ${
                  soundFx ? 'bg-[#23a55a]' : 'bg-[#4e5058]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    soundFx ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Tab 6: Source Code & Download */}
        {activeTab === 'code' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileArchive className="w-6 h-6 text-[#5865F2]" />
                <span>Download Source Code</span>
              </h2>
              <p className="text-sm text-[#949ba4] mt-1">
                Export and download the full source code of this Discord Clone application as a ready-to-run ZIP archive.
              </p>
            </div>

            {/* Download Card */}
            <div className="bg-gradient-to-br from-[#2b2d31] to-[#1e1f22] p-6 rounded-2xl border border-[#3f4147] shadow-xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-[#5865F2]/20 border border-[#5865F2]/40 flex items-center justify-center text-[#5865F2]">
                    <FileArchive className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">discord-clone-source.zip</h3>
                    <p className="text-xs text-[#949ba4]">
                      Includes React 19, TypeScript, Tailwind CSS, Firebase config, components & utilities
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleDownloadZip}
                    disabled={isDownloadingCode}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#5865F2] hover:bg-[#4752c4] active:scale-95 text-white font-semibold transition-all cursor-pointer shadow-lg hover:shadow-[#5865F2]/25 disabled:opacity-60"
                  >
                    {downloadCodeDone ? (
                      <Check className="w-4 h-4 text-[#57f287]" />
                    ) : isDownloadingCode ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>{downloadCodeDone ? 'ZIP Downloaded!' : isDownloadingCode ? 'Preparing ZIP...' : 'Download ZIP'}</span>
                  </button>

                  <a
                    href="/discord-clone-source.zip"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#35373c] hover:bg-[#3f4147] text-[#dbdee1] hover:text-white font-medium transition-colors text-xs cursor-pointer border border-[#4e5058]/40"
                    title="Open direct file download in a new browser tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>New Tab</span>
                  </a>

                  <button
                    onClick={handleCopyZipUrl}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#35373c] hover:bg-[#3f4147] text-[#dbdee1] hover:text-white font-medium transition-colors text-xs cursor-pointer border border-[#4e5058]/40"
                    title="Copy full direct download URL to clipboard"
                  >
                    {copiedZipUrl ? <Check className="w-3.5 h-3.5 text-[#57f287]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedZipUrl ? 'Copied URL!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              <div className="h-[1px] bg-[#35373c]" />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-[#1e1f22]/70 p-3 rounded-lg border border-[#2b2d31]">
                  <span className="text-[#949ba4] block font-medium">Archive Format</span>
                  <span className="text-white font-bold text-sm">Standard Deflate ZIP</span>
                </div>
                <div className="bg-[#1e1f22]/70 p-3 rounded-lg border border-[#2b2d31]">
                  <span className="text-[#949ba4] block font-medium">OS Compatibility</span>
                  <span className="text-[#57f287] font-bold text-sm">Windows & Mac Tested</span>
                </div>
                <div className="bg-[#1e1f22]/70 p-3 rounded-lg border border-[#2b2d31]">
                  <span className="text-[#949ba4] block font-medium">Clean Source</span>
                  <span className="text-[#57f287] font-bold text-sm">No node_modules</span>
                </div>
                <div className="bg-[#1e1f22]/70 p-3 rounded-lg border border-[#2b2d31]">
                  <span className="text-[#949ba4] block font-medium">Stack</span>
                  <span className="text-white font-bold text-sm">React 19 + Vite</span>
                </div>
              </div>
            </div>

            {/* Quick Run Instructions */}
            <div className="bg-[#2b2d31] p-5 rounded-xl border border-[#35373c] space-y-3">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[#57f287]" />
                <span>How to run locally</span>
              </h4>
              <ol className="text-xs text-[#dbdee1] space-y-2 list-decimal list-inside">
                <li>
                  <span className="text-[#949ba4]">Extract the downloaded </span>
                  <code className="text-[#f2f3f5] bg-[#1e1f22] px-1.5 py-0.5 rounded border border-[#35373c]">discord-clone-source.zip</code>
                </li>
                <li>
                  <span className="text-[#949ba4]">Open your terminal in the extracted folder and run:</span>
                  <pre className="mt-1.5 p-2.5 rounded-lg bg-[#1e1f22] text-[#57f287] font-mono text-xs overflow-x-auto border border-[#35373c]">npm install</pre>
                </li>
                <li>
                  <span className="text-[#949ba4]">Start the local development server:</span>
                  <pre className="mt-1.5 p-2.5 rounded-lg bg-[#1e1f22] text-[#57f287] font-mono text-xs overflow-x-auto border border-[#35373c]">npm run dev</pre>
                </li>
                <li>
                  <span className="text-[#949ba4]">Open </span>
                  <code className="text-[#5865F2] bg-[#1e1f22] px-1.5 py-0.5 rounded border border-[#35373c]">http://localhost:3000</code>
                  <span className="text-[#949ba4]"> in your web browser.</span>
                </li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
