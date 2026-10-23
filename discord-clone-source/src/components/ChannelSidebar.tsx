import React, { useState } from 'react';
import {
  ChevronDown,
  Hash,
  Volume2,
  Megaphone,
  Plus,
  Settings,
  Mic,
  MicOff,
  Headphones,
  PhoneOff,
  Users,
  Sparkles,
  Radio,
  Share2,
  Music,
  Check,
  UserPlus,
  Bell,
  ShieldCheck,
  LogOut,
  FolderPlus,
  Rocket
} from 'lucide-react';
import { Server, Channel, User, DirectMessage } from '../types/discord';
import { playJoinVoiceSound, playLeaveVoiceSound, playMuteSound, playUnmuteSound, playDeafenSound, playUndeafenSound } from '../utils/audio';
import { getAvatarFrameClass } from '../utils/nitroUtils';

interface ChannelSidebarProps {
  currentServer: Server | null; // null means DMs (Home)
  activeChannelId: string | null;
  activeDmId: string | null;
  currentUser: User;
  directMessages: DirectMessage[];
  friendsCount?: number;
  activeVoiceChannelId: string | null;
  isVoiceMuted: boolean;
  isVoiceDeafened: boolean;
  onSelectChannel: (channelId: string) => void;
  onSelectDm: (dmId: string) => void;
  onSelectFriendsHome: () => void;
  onJoinVoice: (channelId: string) => void;
  onLeaveVoice: () => void;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onOpenSettings: () => void;
  onOpenServerSettings: () => void;
  onOpenCreateChannel: (categoryId?: string) => void;
  onOpenCreateCategory?: () => void;
  onOpenQuickSwitcher: () => void;
  onOpenSoundboard: () => void;
  onOpenNitro: () => void;
  onInvitePeople: () => void;
  onLeaveServer: (serverId: string) => void;
  isLoggedIn?: boolean;
  onOpenAuth?: () => void;
}

export const ChannelSidebar: React.FC<ChannelSidebarProps> = ({
  currentServer,
  activeChannelId,
  activeDmId,
  currentUser,
  directMessages,
  friendsCount,
  activeVoiceChannelId,
  isVoiceMuted,
  isVoiceDeafened,
  onSelectChannel,
  onSelectDm,
  onSelectFriendsHome,
  onJoinVoice,
  onLeaveVoice,
  onToggleMute,
  onToggleDeafen,
  onOpenSettings,
  onOpenServerSettings,
  onOpenCreateChannel,
  onOpenCreateCategory,
  onOpenQuickSwitcher,
  onOpenSoundboard,
  onOpenNitro,
  onInvitePeople,
  onLeaveServer,
  isLoggedIn,
  onOpenAuth
}) => {
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [isServerMenuOpen, setIsServerMenuOpen] = useState(false);

  const toggleCategory = (catId: string) => {
    setCollapsedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-[#23a55a]';
      case 'idle': return 'bg-[#f0b232]';
      case 'dnd': return 'bg-[#f23f43]';
      default: return 'bg-[#80848e]';
    }
  };

  // Find active voice channel name if connected
  const activeVoiceChannel = currentServer?.channels.find(c => c.id === activeVoiceChannelId);

  return (
    <div className="w-60 h-full bg-[#2b2d31] flex flex-col shrink-0 select-none border-r border-[#1f2023]/40 relative">
      {/* Top Header */}
      {currentServer ? (
        <div className="relative">
          <button
            onClick={() => setIsServerMenuOpen(!isServerMenuOpen)}
            className="w-full h-12 px-4 flex items-center justify-between font-bold text-white shadow-sm border-b border-[#1f2023] hover:bg-[#35373c] transition-colors"
          >
            <div className="flex items-center gap-1.5 truncate">
              {currentServer.verified && (
                <Check className="w-4 h-4 p-0.5 rounded-full bg-[#5865f2] text-white shrink-0" />
              )}
              <span className="truncate text-[15px]">{currentServer.name}</span>
              {Boolean(currentServer.boostLevel && currentServer.boostLevel > 0) && (
                <span
                  title={`Level ${currentServer.boostLevel} Boosted (${currentServer.boostCount || 0} Boosts)`}
                  className="px-1.5 py-0.5 text-[10px] font-black rounded bg-linear-to-r from-[#eb459e] to-[#ff73fa] text-white shrink-0 shadow-xs flex items-center gap-0.5"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>LVL {currentServer.boostLevel}</span>
                </span>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-[#949ba4] transition-transform duration-200 shrink-0 ${
                isServerMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Server Dropdown Menu */}
          {isServerMenuOpen && (
            <div
              className="absolute top-14 left-2 right-2 bg-[#111214] rounded-md shadow-2xl p-1.5 z-50 text-sm font-medium border border-[#2b2d31] discord-pop"
              onClick={() => setIsServerMenuOpen(false)}
            >
              <button
                onClick={() => {
                  setIsServerMenuOpen(false);
                  onOpenNitro();
                }}
                className="w-full flex items-center justify-between px-2.5 py-2 text-[#eb459e] hover:text-white hover:bg-[#eb459e] rounded transition-colors group font-semibold"
              >
                <div className="flex items-center gap-2">
                  <Rocket className="w-4 h-4 fill-current" />
                  <span>Server Boost</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/30 text-white uppercase font-bold">
                  {currentServer.boostCount ? `${currentServer.boostCount} boosts` : 'Boost'}
                </span>
              </button>
              <div className="h-[1px] bg-[#2b2d31] my-1" />
              <button
                onClick={onInvitePeople}
                className="w-full flex items-center justify-between px-2.5 py-2 text-[#949ba4] hover:text-white hover:bg-[#5865f2] rounded transition-colors group"
              >
                <span>Invite People</span>
                <UserPlus className="w-4 h-4" />
              </button>
              <button
                onClick={() => onOpenCreateChannel()}
                className="w-full flex items-center justify-between px-2.5 py-2 text-[#949ba4] hover:text-white hover:bg-[#5865f2] rounded transition-colors"
              >
                <span>Create Channel</span>
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => onOpenCreateCategory?.()}
                className="w-full flex items-center justify-between px-2.5 py-2 text-[#949ba4] hover:text-white hover:bg-[#5865f2] rounded transition-colors"
              >
                <span>Create Category</span>
                <FolderPlus className="w-4 h-4" />
              </button>
              <div className="h-[1px] bg-[#2b2d31] my-1" />
              <button
                onClick={onOpenServerSettings}
                className="w-full flex items-center justify-between px-2.5 py-2 text-[#949ba4] hover:text-white hover:bg-[#35373c] rounded transition-colors"
              >
                <span>Server Settings</span>
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={onInvitePeople}
                className="w-full flex items-center justify-between px-2.5 py-2 text-[#949ba4] hover:text-white hover:bg-[#35373c] rounded transition-colors"
              >
                <span>Notification Settings</span>
                <Bell className="w-4 h-4" />
              </button>
              <button
                onClick={onInvitePeople}
                className="w-full flex items-center justify-between px-2.5 py-2 text-[#949ba4] hover:text-white hover:bg-[#35373c] rounded transition-colors"
              >
                <span>Privacy & Safety</span>
                <ShieldCheck className="w-4 h-4" />
              </button>
              <div className="h-[1px] bg-[#2b2d31] my-1" />
              <button
                onClick={() => onLeaveServer(currentServer.id)}
                className="w-full flex items-center justify-between px-2.5 py-2 text-[#f23f43] hover:text-white hover:bg-[#da373c] rounded transition-colors"
              >
                <span>Leave Server</span>
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Home Header (Find / Start Conversation) */
        <div className="h-12 px-2.5 border-b border-[#1f2023] flex items-center shadow-sm">
          <button
            onClick={onOpenQuickSwitcher}
            className="w-full h-7 px-2 bg-[#1e1f22] text-[#949ba4] hover:text-[#dbdee1] rounded text-[13px] font-medium flex items-center justify-between transition-colors shadow-inner"
          >
            <span>Find or start a conversation</span>
            <kbd className="text-[10px] bg-[#2b2d31] px-1 py-0.5 rounded border border-[#35373c]">Ctrl+K</kbd>
          </button>
        </div>
      )}

      {/* Main Channel / DM Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-4">
        {currentServer ? (
          /* Server Categories & Channels */
          currentServer.categories.map((category) => {
            const channels = currentServer.channels.filter(c => c.categoryId === category.id);
            const isCollapsed = collapsedCategories[category.id];

            return (
              <div key={category.id} className="space-y-0.5">
                {/* Category Header */}
                <div className="flex items-center justify-between px-1 group py-1 text-[#949ba4] hover:text-[#dbdee1] cursor-pointer">
                  <div
                    onClick={() => toggleCategory(category.id)}
                    className="flex items-center gap-1 text-[11px] font-bold tracking-wider uppercase select-none flex-1 truncate"
                  >
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                    />
                    <span className="truncate">{category.name}</span>
                  </div>
                  <button
                    onClick={() => onOpenCreateChannel(category.id)}
                    title="Create Channel"
                    className="opacity-0 group-hover:opacity-100 hover:text-white p-0.5 rounded transition-opacity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Channel Items */}
                {!isCollapsed && (
                  <div className="space-y-[1px]">
                    {channels.map((channel) => {
                      const isActive = activeChannelId === channel.id;
                      const isVoice = channel.type === 'voice';
                      const isConnectedVoice = activeVoiceChannelId === channel.id;

                      return (
                        <div key={channel.id}>
                          <button
                            onClick={() => {
                              if (isVoice) {
                                if (isConnectedVoice) {
                                  // toggle voice canvas
                                  onSelectChannel(channel.id);
                                } else {
                                  onJoinVoice(channel.id);
                                  onSelectChannel(channel.id);
                                }
                              } else {
                                onSelectChannel(channel.id);
                              }
                            }}
                            className={`w-full group flex items-center justify-between px-2 py-1.5 rounded-md text-[14px] font-medium transition-colors ${
                              isActive
                                ? 'bg-[#35373c] text-white'
                                : 'text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {channel.type === 'announcement' ? (
                                <Megaphone className="w-4 h-4 text-[#949ba4] shrink-0" />
                              ) : isVoice ? (
                                <Volume2
                                  className={`w-4 h-4 shrink-0 ${
                                    isConnectedVoice ? 'text-[#23a55a]' : 'text-[#949ba4]'
                                  }`}
                                />
                              ) : (
                                <Hash className="w-4 h-4 text-[#949ba4] shrink-0" />
                              )}
                              <span className="truncate">{channel.name}</span>
                            </div>

                            {/* Settings icon on hover */}
                            <div className="flex items-center gap-1">
                              {channel.unreadCount && (
                                <span className="bg-[#f23f43] text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full">
                                  {channel.unreadCount}
                                </span>
                              )}
                              <Settings className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-[#949ba4] hover:text-white transition-opacity" />
                            </div>
                          </button>

                          {/* Voice Users List under voice channel */}
                          {isVoice && channel.voiceUsers && channel.voiceUsers.length > 0 && (
                            <div className="pl-6 py-1 space-y-1">
                              {channel.voiceUsers.map(uid => {
                                const member = currentServer.members.find(m => m.id === uid) || (uid === currentUser.id ? currentUser : null);
                                if (!member) return null;
                                return (
                                  <div key={uid} className="flex items-center gap-2 text-xs text-[#dbdee1] py-0.5">
                                    <div className="relative">
                                      <img
                                        src={member.avatar}
                                        alt={member.displayName}
                                        className="w-5 h-5 rounded-full object-cover"
                                      />
                                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#23a55a]" />
                                    </div>
                                    <span className="truncate">{member.displayName}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }).concat(
            <div key="add-category-btn" className="pt-2 pb-1">
              <button
                onClick={onOpenCreateCategory}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-[#949ba4] hover:text-white bg-[#232428]/40 hover:bg-[#35373c] border border-dashed border-[#3f4147] hover:border-[#5865f2] rounded-md transition-colors cursor-pointer group"
              >
                <FolderPlus className="w-3.5 h-3.5 text-[#5865f2] group-hover:scale-110 transition-transform" />
                <span>Add Category</span>
              </button>
            </div>
          )
        ) : (
          /* Direct Messages Sidebar (Home) */
          <div className="space-y-4">
            {/* Top Home items: Friends & Nitro */}
            <div className="space-y-0.5">
              <button
                onClick={onSelectFriendsHome}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-[14px] font-medium transition-colors ${
                  activeDmId === null
                    ? 'bg-[#35373c] text-white'
                    : 'text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-[#949ba4]" />
                  <span>Friends</span>
                </div>
                {Boolean(friendsCount && friendsCount > 0) && (
                  <span className="bg-[#5865f2] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {friendsCount}
                  </span>
                )}
              </button>

              <button
                onClick={onOpenNitro}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-[14px] font-medium text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1] transition-colors"
              >
                <Sparkles className="w-5 h-5 text-[#eb459e]" />
                <span>Nitro</span>
              </button>
            </div>

            {/* Direct Messages List */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 text-[#949ba4] text-[11px] font-bold tracking-wider uppercase">
                <span>DIRECT MESSAGES</span>
                <button
                  onClick={onOpenQuickSwitcher}
                  title="Create DM"
                  className="hover:text-white"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-[1px]">
                {directMessages.map((dm) => {
                  const isActive = activeDmId === dm.id;
                  return (
                    <button
                      key={dm.id}
                      onClick={() => onSelectDm(dm.id)}
                      className={`w-full group flex items-center justify-between px-2.5 py-2 rounded-md transition-colors ${
                        isActive
                          ? 'bg-[#35373c] text-white'
                          : 'text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={dm.recipient.avatar}
                            alt={dm.recipient.displayName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#2b2d31] ${getStatusColor(
                              dm.recipient.status
                            )}`}
                          />
                        </div>
                        <div className="text-left min-w-0">
                          <div className="text-[14px] font-medium truncate text-[#dbdee1]">
                            {dm.recipient.displayName}
                          </div>
                          {dm.lastMessage && (
                            <div className="text-[11px] text-[#949ba4] truncate max-w-[130px]">
                              {dm.lastMessage}
                            </div>
                          )}
                        </div>
                      </div>

                      {dm.unreadCount > 0 && (
                        <span className="bg-[#f23f43] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {dm.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Voice Connected Bar (If connected to any voice channel) */}
      {activeVoiceChannelId && (
        <div className="bg-[#111214] border-b border-[#2b2d31] px-3 py-2 flex flex-col gap-1.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#23a55a] animate-pulse" />
              <div>
                <div className="text-[#23a55a] font-semibold text-[13px] leading-tight">Voice Connected</div>
                <div className="text-[#949ba4] text-[11px] truncate max-w-[120px]">
                  {activeVoiceChannel?.name || 'Voice Lounge'} / 14ms
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={onOpenSoundboard}
                title="Open Soundboard"
                className="p-1.5 hover:bg-[#2b2d31] text-[#949ba4] hover:text-[#dbdee1] rounded transition-colors"
              >
                <Music className="w-4 h-4" />
              </button>
              <button
                onClick={onLeaveVoice}
                title="Disconnect"
                className="p-1.5 hover:bg-[#da373c] text-[#f23f43] hover:text-white rounded transition-colors"
              >
                <PhoneOff className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Bottom Status Bar */}
      <div className="h-[52px] bg-[#232428] px-2 flex items-center justify-between shrink-0 select-none">
        {/* User Info Button (Clicking opens Settings) */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 p-1 -ml-1 rounded-md hover:bg-[#35373c] text-left transition-colors min-w-0 flex-1 mr-1"
        >
          <div className="relative shrink-0">
            <img
              src={currentUser.avatar}
              alt={currentUser.displayName}
              className={`w-8 h-8 rounded-full object-cover ${getAvatarFrameClass(currentUser.avatarFrame)}`}
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#232428] ${getStatusColor(
                currentUser.status
              )}`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="text-[13px] font-semibold text-white truncate leading-tight">
                {currentUser.displayName}
              </span>
              {Boolean(currentUser.isNitro || currentUser.badges?.includes('Nitro Booster') || currentUser.badges?.includes('Nitro Subscriber')) && (
                <span title="Discord Nitro" className="shrink-0 text-[#eb459e]">
                  <Sparkles className="w-3 h-3 fill-current animate-pulse" />
                </span>
              )}
            </div>
            <div className="text-[11px] text-[#949ba4] truncate leading-tight">
              #{currentUser.discriminator}
            </div>
          </div>
        </button>

        {/* User Quick Controls: Mic, Deafen, Settings */}
        <div className="flex items-center text-[#b5bac1]">
          <button
            onClick={() => {
              if (isVoiceMuted) {
                playUnmuteSound();
              } else {
                playMuteSound();
              }
              onToggleMute();
            }}
            title={isVoiceMuted ? 'Unmute' : 'Mute'}
            className={`p-1.5 rounded-md hover:bg-[#35373c] hover:text-[#dbdee1] transition-colors ${
              isVoiceMuted ? 'text-[#f23f43]' : ''
            }`}
          >
            {isVoiceMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              if (isVoiceDeafened) {
                playUndeafenSound();
              } else {
                playDeafenSound();
              }
              onToggleDeafen();
            }}
            title={isVoiceDeafened ? 'Undeafen' : 'Deafen'}
            className={`p-1.5 rounded-md hover:bg-[#35373c] hover:text-[#dbdee1] transition-colors relative ${
              isVoiceDeafened ? 'text-[#f23f43]' : ''
            }`}
          >
            <div className="relative inline-flex items-center justify-center">
              <Headphones className={`w-4 h-4 ${isVoiceDeafened ? 'text-[#f23f43]' : ''}`} />
              {isVoiceDeafened && (
                <span className="absolute w-5 h-[2px] bg-[#f23f43] rotate-45 rounded-full pointer-events-none" />
              )}
            </div>
          </button>

          <button
            onClick={onOpenSettings}
            title="User Settings"
            className="p-1.5 rounded-md hover:bg-[#35373c] hover:text-[#dbdee1] transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
