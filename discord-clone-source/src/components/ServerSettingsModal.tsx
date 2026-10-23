import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Smile,
  Hash,
  Users,
  Link,
  History,
  Trash2,
  Check,
  Plus,
  Copy,
  ExternalLink,
  AlertTriangle,
  Upload,
  Radio,
  Sparkles,
  Bot,
  Layers,
  ChevronDown,
  Volume2,
  FolderPlus,
  Folder
} from 'lucide-react';
import { Server, Role, ServerEmoji, ServerInvite, AuditLogEntry, User, Channel, ChannelCategory } from '../types/discord';
import { RoleBadge } from './RoleBadge';
import confetti from 'canvas-confetti';

interface ServerSettingsModalProps {
  server: Server;
  currentUser: User;
  onUpdateServer: (updatedServer: Server) => void;
  onDeleteServer: (serverId: string) => void;
  onClose: () => void;
}

const SERVER_ICON_PRESETS = [
  { name: 'Gaming Squad', url: 'https://api.dicebear.com/7.x/identicon/svg?seed=GamingGuild&backgroundColor=5865F2' },
  { name: 'Cyber Bot', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberBot&backgroundColor=23a55a' },
  { name: 'Anime Art', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=AnimeArt&backgroundColor=eb459e' },
  { name: 'Neon Shapes', url: 'https://api.dicebear.com/7.x/shapes/svg?seed=NeonGrid&backgroundColor=f0b232' },
  { name: 'Lo-Fi Chill', url: 'https://api.dicebear.com/7.x/identicon/svg?seed=LofiVibes&backgroundColor=57f287' },
  { name: 'Cosmic Void', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CosmicVoid&backgroundColor=2b1055' },
  { name: 'Pixel Hero', url: 'https://api.dicebear.com/7.x/personas/svg?seed=PixelHero&backgroundColor=5865f2' },
  { name: 'Golden Crown', url: 'https://api.dicebear.com/7.x/identicon/svg?seed=CrownRoyal&backgroundColor=fee75c' }
];

export const ServerSettingsModal: React.FC<ServerSettingsModalProps> = ({
  server,
  currentUser,
  onUpdateServer,
  onDeleteServer,
  onClose
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'roles' | 'emoji' | 'channels' | 'members' | 'invites' | 'audit'>('overview');

  // Overview form state
  const [serverName, setServerName] = useState(server.name);
  const [serverDescription, setServerDescription] = useState(server.description || '');
  const [serverIcon, setServerIcon] = useState(server.icon);
  const [systemChannelId, setSystemChannelId] = useState(server.systemChannelId || server.channels[0]?.id || '');
  const [afkChannelId, setAfkChannelId] = useState(server.afkChannelId || '');
  const [afkTimeout, setAfkTimeout] = useState(server.afkTimeout || 300);
  const [defaultNotifications, setDefaultNotifications] = useState<'all' | 'mentions'>(server.defaultNotifications || 'mentions');
  const [hasOverviewChanges, setHasOverviewChanges] = useState(false);

  // Icon customizer state
  const iconFileInputRef = React.useRef<HTMLInputElement>(null);
  const [showIconPresets, setShowIconPresets] = useState(false);
  const [iconUrlInput, setIconUrlInput] = useState('');

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('Image size exceeds 8MB. Please select a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setServerIcon(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRandomizeIcon = () => {
    const styles = ['identicon', 'bottts', 'shapes', 'adventurer', 'personas'];
    const chosenStyle = styles[Math.floor(Math.random() * styles.length)];
    const bgColors = ['5865F2', 'EB459E', '23A55A', 'F0B232', '2B1055', '57F287'];
    const chosenBg = bgColors[Math.floor(Math.random() * bgColors.length)];
    const seed = Math.random().toString(36).substring(2, 9);
    setServerIcon(`https://api.dicebear.com/7.x/${chosenStyle}/svg?seed=${seed}&backgroundColor=${chosenBg}`);
  };

  // Roles state
  const [roles, setRoles] = useState<Role[]>(server.roles || [
    { id: 'r_admin', name: 'Admin', color: '#EB459E', hoist: true, mentionable: true, permissions: ['ADMINISTRATOR', 'MANAGE_CHANNELS', 'SEND_MESSAGES'] },
    { id: 'r_mod', name: 'Moderator', color: '#57F287', hoist: true, mentionable: true, permissions: ['KICK_MEMBERS', 'SEND_MESSAGES'] },
    { id: 'r_everyone', name: '@everyone', color: '#949BA4', hoist: false, mentionable: false, permissions: ['SEND_MESSAGES', 'CONNECT', 'SPEAK'] }
  ]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[0]?.id || 'r_everyone');

  // Emoji state
  const [emojis, setEmojis] = useState<ServerEmoji[]>(server.emojis || []);
  const [newEmojiName, setNewEmojiName] = useState('');
  const [isAddingEmoji, setIsAddingEmoji] = useState(false);

  // Channels state
  const [channels, setChannels] = useState<Channel[]>(server.channels);
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [editChannelName, setEditChannelName] = useState('');
  const [editChannelTopic, setEditChannelTopic] = useState('');

  // Categories state
  const [categories, setCategories] = useState<ChannelCategory[]>(server.categories || []);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Members state
  const [members, setMembers] = useState<User[]>(server.members);
  const [memberSearch, setMemberSearch] = useState('');

  // Invites state
  const [invites, setInvites] = useState<ServerInvite[]>(server.invites || [
    { code: `discord.gg/${server.acronym.toLowerCase()}-hub`, channelName: '#general', inviter: currentUser.displayName, uses: 42, maxUses: 0, expiresIn: 'Never' }
  ]);
  const [inviteCopied, setInviteCopied] = useState<string | null>(null);

  // Audit log state
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(server.auditLog || [
    { id: 'al_init', user: currentUser.displayName, action: 'Opened server settings', target: server.name, timestamp: 'Just now' }
  ]);

  // Delete server confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');

  // Track overview changes
  useEffect(() => {
    const isChanged =
      serverName !== server.name ||
      serverDescription !== (server.description || '') ||
      serverIcon !== server.icon ||
      systemChannelId !== (server.systemChannelId || server.channels[0]?.id || '') ||
      afkChannelId !== (server.afkChannelId || '') ||
      afkTimeout !== (server.afkTimeout || 300) ||
      defaultNotifications !== (server.defaultNotifications || 'mentions');

    setHasOverviewChanges(isChanged);
  }, [serverName, serverDescription, serverIcon, systemChannelId, afkChannelId, afkTimeout, defaultNotifications, server]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDeleteConfirm, onClose]);

  // Save overview changes
  const handleSaveOverview = () => {
    const updated: Server = {
      ...server,
      name: serverName.trim(),
      description: serverDescription.trim(),
      icon: serverIcon,
      acronym: serverName.trim().slice(0, 3).toUpperCase(),
      systemChannelId,
      afkChannelId,
      afkTimeout,
      defaultNotifications,
      roles,
      emojis,
      channels,
      members,
      invites,
      auditLog: [
        {
          id: `al_${Date.now()}`,
          user: currentUser.displayName,
          action: 'Updated Server Overview',
          target: serverName.trim(),
          timestamp: 'Just now'
        },
        ...auditLog
      ]
    };

    onUpdateServer(updated);
    setHasOverviewChanges(false);
  };

  const handleResetOverview = () => {
    setServerName(server.name);
    setServerDescription(server.description || '');
    setServerIcon(server.icon);
    setSystemChannelId(server.systemChannelId || server.channels[0]?.id || '');
    setAfkChannelId(server.afkChannelId || '');
    setAfkTimeout(server.afkTimeout || 300);
    setDefaultNotifications(server.defaultNotifications || 'mentions');
    setHasOverviewChanges(false);
  };

  // Roles management
  const selectedRole = roles.find(r => r.id === selectedRoleId) || roles[0];

  const handleCreateRole = () => {
    const newRole: Role = {
      id: `r_${Date.now()}`,
      name: 'new role',
      color: '#99AAB5',
      hoist: false,
      mentionable: false,
      permissions: ['SEND_MESSAGES', 'CONNECT', 'SPEAK']
    };
    const nextRoles = [...roles, newRole];
    setRoles(nextRoles);
    setSelectedRoleId(newRole.id);

    const nextAudit: AuditLogEntry[] = [
      { id: `al_${Date.now()}`, user: currentUser.displayName, action: 'Created role', target: 'new role', timestamp: 'Just now' },
      ...auditLog
    ];
    setAuditLog(nextAudit);

    onUpdateServer({ ...server, roles: nextRoles, auditLog: nextAudit });
  };

  const handleUpdateRole = (roleId: string, updates: Partial<Role>) => {
    const nextRoles = roles.map(r => r.id === roleId ? { ...r, ...updates } : r);
    setRoles(nextRoles);
    onUpdateServer({ ...server, roles: nextRoles });
  };

  const handleDeleteRole = (roleId: string) => {
    if (roleId === 'r_everyone') return;
    const deletedRole = roles.find(r => r.id === roleId);
    const nextRoles = roles.filter(r => r.id !== roleId);
    setRoles(nextRoles);
    setSelectedRoleId(nextRoles[0]?.id || 'r_everyone');

    const nextAudit: AuditLogEntry[] = [
      { id: `al_${Date.now()}`, user: currentUser.displayName, action: 'Deleted role', target: deletedRole?.name || 'role', timestamp: 'Just now' },
      ...auditLog
    ];
    setAuditLog(nextAudit);

    onUpdateServer({ ...server, roles: nextRoles, auditLog: nextAudit });
  };

  const togglePermission = (perm: string) => {
    if (!selectedRole) return;
    const hasPerm = selectedRole.permissions.includes(perm);
    const nextPerms = hasPerm
      ? selectedRole.permissions.filter(p => p !== perm)
      : [...selectedRole.permissions, perm];
    handleUpdateRole(selectedRole.id, { permissions: nextPerms });
  };

  // Emojis management
  const handleAddEmoji = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmojiName.trim()) return;

    const seed = newEmojiName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const newEmoji: ServerEmoji = {
      id: `em_${Date.now()}`,
      name: seed || 'custom_emoji',
      url: `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=5865F2`,
      uploadedBy: currentUser.displayName
    };

    const nextEmojis = [...emojis, newEmoji];
    setEmojis(nextEmojis);
    setNewEmojiName('');
    setIsAddingEmoji(false);

    confetti({ particleCount: 40, spread: 45, origin: { y: 0.6 } });

    const nextAudit: AuditLogEntry[] = [
      { id: `al_${Date.now()}`, user: currentUser.displayName, action: 'Created emoji', target: `:${newEmoji.name}:`, timestamp: 'Just now' },
      ...auditLog
    ];
    setAuditLog(nextAudit);

    onUpdateServer({ ...server, emojis: nextEmojis, auditLog: nextAudit });
  };

  const handleDeleteEmoji = (emojiId: string) => {
    const deleted = emojis.find(e => e.id === emojiId);
    const nextEmojis = emojis.filter(e => e.id !== emojiId);
    setEmojis(nextEmojis);

    const nextAudit: AuditLogEntry[] = [
      { id: `al_${Date.now()}`, user: currentUser.displayName, action: 'Deleted emoji', target: deleted ? `:${deleted.name}:` : 'emoji', timestamp: 'Just now' },
      ...auditLog
    ];
    setAuditLog(nextAudit);

    onUpdateServer({ ...server, emojis: nextEmojis, auditLog: nextAudit });
  };

  // Channels management
  const handleSaveChannelEdit = (channelId: string) => {
    const nextChannels = channels.map(c =>
      c.id === channelId
        ? { ...c, name: editChannelName.trim().toLowerCase().replace(/\s+/g, '-'), topic: editChannelTopic.trim() }
        : c
    );
    setChannels(nextChannels);
    setEditingChannelId(null);

    const nextAudit: AuditLogEntry[] = [
      { id: `al_${Date.now()}`, user: currentUser.displayName, action: 'Updated channel settings', target: `#${editChannelName}`, timestamp: 'Just now' },
      ...auditLog
    ];
    setAuditLog(nextAudit);

    onUpdateServer({ ...server, channels: nextChannels, auditLog: nextAudit });
  };

  const handleDeleteChannel = (channelId: string) => {
    if (channels.length <= 1) {
      alert("A server must have at least one channel!");
      return;
    }
    const target = channels.find(c => c.id === channelId);
    const nextChannels = channels.filter(c => c.id !== channelId);
    setChannels(nextChannels);

    const nextAudit: AuditLogEntry[] = [
      { id: `al_${Date.now()}`, user: currentUser.displayName, action: 'Deleted channel', target: target?.name || 'channel', timestamp: 'Just now' },
      ...auditLog
    ];
    setAuditLog(nextAudit);

    onUpdateServer({ ...server, channels: nextChannels, auditLog: nextAudit });
  };

  // Members management
  const handleToggleMemberRole = (memberId: string, roleName: string, roleColor: string) => {
    const nextMembers = members.map(m => {
      if (m.id === memberId) {
        // Toggle role
        const isCurrentRole = m.role === roleName;
        return {
          ...m,
          role: isCurrentRole ? 'Member' : roleName,
          roleColor: isCurrentRole ? '#949BA4' : roleColor
        };
      }
      return m;
    });
    setMembers(nextMembers);
    onUpdateServer({ ...server, members: nextMembers });
  };

  const handleKickMember = (memberId: string) => {
    if (memberId === currentUser.id) {
      alert("You cannot kick yourself from the server settings!");
      return;
    }
    const member = members.find(m => m.id === memberId);
    if (!confirm(`Are you sure you want to kick ${member?.displayName || 'this member'}?`)) return;

    const nextMembers = members.filter(m => m.id !== memberId);
    setMembers(nextMembers);

    const nextAudit: AuditLogEntry[] = [
      { id: `al_${Date.now()}`, user: currentUser.displayName, action: 'Kicked member', target: member?.displayName || 'member', timestamp: 'Just now' },
      ...auditLog
    ];
    setAuditLog(nextAudit);

    onUpdateServer({ ...server, members: nextMembers, memberCount: Math.max(1, server.memberCount - 1), auditLog: nextAudit });
  };

  // Invites management
  const handleCreateInvite = () => {
    const code = `discord.gg/${Math.random().toString(36).substring(2, 8)}`;
    const newInvite: ServerInvite = {
      code,
      channelName: '#general',
      inviter: currentUser.displayName,
      uses: 0,
      maxUses: 0,
      expiresIn: '7 days'
    };
    const nextInvites = [...invites, newInvite];
    setInvites(nextInvites);
    onUpdateServer({ ...server, invites: nextInvites });
  };

  const handleCopyInvite = (code: string) => {
    navigator.clipboard?.writeText(`https://${code}`);
    setInviteCopied(code);
    setTimeout(() => setInviteCopied(null), 2000);
  };

  const handleRevokeInvite = (code: string) => {
    const nextInvites = invites.filter(i => i.code !== code);
    setInvites(nextInvites);
    onUpdateServer({ ...server, invites: nextInvites });
  };

  // Delete server execution
  const handleDeleteServer = () => {
    if (deleteConfirmInput.trim().toLowerCase() !== server.name.trim().toLowerCase()) {
      alert("Server name did not match.");
      return;
    }
    onDeleteServer(server.id);
  };

  // Color presets for roles
  const colorPresets = [
    '#5865F2', // Blurple
    '#57F287', // Green
    '#FEE75C', // Gold
    '#EB459E', // Pink
    '#ED4245', // Red
    '#3498DB', // Cyan / Blue
    '#9B59B6', // Purple
    '#E67E22', // Orange
    '#1ABC9C'  // Teal
  ];

  return (
    <div className="fixed inset-0 bg-[#313338] text-[#dbdee1] flex z-50 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Left Sidebar */}
      <div className="w-60 bg-[#2b2d31] flex flex-col items-end py-14 pr-6 select-none shrink-0 border-r border-[#1f2023]/30">
        <div className="w-48 space-y-4">
          {/* Server Title Header */}
          <div className="px-2.5 py-1">
            <span className="text-[11px] font-black text-[#949ba4] uppercase tracking-wider truncate block">
              {server.name}
            </span>
          </div>

          {/* SERVER SETTINGS Group */}
          <div className="space-y-0.5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-[#35373c] text-white'
                  : 'text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]'
              }`}
            >
              <Hash className="w-4 h-4" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-sm font-medium transition-colors ${
                activeTab === 'roles'
                  ? 'bg-[#35373c] text-white'
                  : 'text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4" />
                <span>Roles</span>
              </div>
              <span className="text-xs text-[#949ba4] font-mono">{roles.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('emoji')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-sm font-medium transition-colors ${
                activeTab === 'emoji'
                  ? 'bg-[#35373c] text-white'
                  : 'text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Smile className="w-4 h-4" />
                <span>Emoji</span>
              </div>
              <span className="text-xs text-[#949ba4] font-mono">{emojis.length}/50</span>
            </button>
            <button
              onClick={() => setActiveTab('channels')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-sm font-medium transition-colors ${
                activeTab === 'channels'
                  ? 'bg-[#35373c] text-white'
                  : 'text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4" />
                <span>Channels</span>
              </div>
              <span className="text-xs text-[#949ba4] font-mono">{channels.length}</span>
            </button>
          </div>

          <div className="h-[1px] bg-[#35373c] mx-2" />

          {/* USER MANAGEMENT Group */}
          <div className="space-y-0.5">
            <div className="text-[11px] font-bold text-[#949ba4] uppercase tracking-wider px-2.5 py-1">
              User Management
            </div>
            <button
              onClick={() => setActiveTab('members')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-sm font-medium transition-colors ${
                activeTab === 'members'
                  ? 'bg-[#35373c] text-white'
                  : 'text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>Members</span>
              </div>
              <span className="text-xs text-[#949ba4] font-mono">{members.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('invites')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-sm font-medium transition-colors ${
                activeTab === 'invites'
                  ? 'bg-[#35373c] text-white'
                  : 'text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Link className="w-4 h-4" />
                <span>Invites</span>
              </div>
              <span className="text-xs text-[#949ba4] font-mono">{invites.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-sm font-medium transition-colors ${
                activeTab === 'audit'
                  ? 'bg-[#35373c] text-white'
                  : 'text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Audit Log</span>
            </button>
          </div>

          <div className="h-[1px] bg-[#35373c] mx-2" />

          {/* Delete Server Button */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-sm font-medium text-[#f23f43] hover:bg-[#da373c]/15 transition-colors group"
          >
            <span>Delete Server</span>
            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Right Content Viewport */}
      <div className="flex-1 overflow-y-auto px-10 py-14 max-w-4xl relative">
        {/* Top-Right ESC button */}
        <div className="fixed top-14 right-16 flex flex-col items-center gap-1 select-none z-10">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border-2 border-[#b5bac1] hover:bg-[#35373c] flex items-center justify-center text-[#b5bac1] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="text-[11px] font-bold text-[#b5bac1]">ESC</span>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8 pb-20">
            <div>
              <h2 className="text-xl font-bold text-white">Server Overview</h2>
              <p className="text-xs text-[#949ba4]">Set up your community identity, icon, and system channels</p>
            </div>

            {/* Server Icon & Name Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Icon Picker */}
              <div className="space-y-3">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b5bac1]">
                  Server Icon
                </label>
                <div className="flex items-start gap-4">
                  {/* Icon Avatar Preview */}
                  <div
                    className="relative group cursor-pointer shrink-0"
                    onClick={() => iconFileInputRef.current?.click()}
                  >
                    <div className="w-24 h-24 rounded-[28px] overflow-hidden border-2 border-[#5865f2] bg-[#1e1f22] shadow-xl transition-all duration-200 group-hover:rounded-[18px]">
                      {serverIcon ? (
                        <img
                          src={serverIcon}
                          alt={serverName}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#5865f2] text-white font-bold text-xl uppercase tracking-wider">
                          {serverName.slice(0, 3)}
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/60 rounded-[28px] group-hover:rounded-[18px] opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold transition-all">
                      <Upload className="w-5 h-5 mb-1" />
                      <span>CHANGE</span>
                    </div>
                  </div>

                  <input
                    type="file"
                    ref={iconFileInputRef}
                    accept="image/*"
                    onChange={handleIconUpload}
                    className="hidden"
                  />

                  {/* Icon Controls */}
                  <div className="space-y-2 flex-1">
                    <span className="text-xs text-[#949ba4] block leading-relaxed">
                      Minimum size of 128x128 recommended. Supports PNG, JPG, GIF, WebP, SVG.
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => iconFileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Image</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRandomizeIcon}
                        className="px-3 py-1.5 bg-[#2b2d31] hover:bg-[#35373c] text-[#dbdee1] hover:text-white text-xs font-semibold rounded-md border border-[#35373c] transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#fee75c]" />
                        <span>Randomize</span>
                      </button>
                      {serverIcon && (
                        <button
                          type="button"
                          onClick={() => setServerIcon('')}
                          className="px-2.5 py-1.5 bg-[#da373c]/15 hover:bg-[#da373c]/30 text-[#f23f43] text-xs font-semibold rounded-md transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowIconPresets(prev => !prev)}
                      className="text-xs text-[#5865f2] hover:underline font-semibold flex items-center gap-1 pt-1 cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>{showIconPresets ? 'Hide Icon Presets' : 'Choose from Icon Presets & Web Link'}</span>
                    </button>
                  </div>
                </div>

                {/* Optional Expandable Presets & Direct URL panel */}
                {showIconPresets && (
                  <div className="p-3 bg-[#1e1f22] rounded-xl border border-[#2b2d31] space-y-3 discord-pop mt-2">
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider block">
                        Community Icon Presets
                      </span>
                      <div className="grid grid-cols-4 gap-2">
                        {SERVER_ICON_PRESETS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setServerIcon(preset.url)}
                            title={preset.name}
                            className={`p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col items-center gap-1 group ${
                              serverIcon === preset.url
                                ? 'border-[#5865f2] bg-[#5865f2]/20 ring-1 ring-[#5865f2]'
                                : 'border-[#2b2d31] hover:border-[#5865f2] bg-[#2b2d31]'
                            }`}
                          >
                            <img
                              src={preset.url}
                              alt={preset.name}
                              className="w-10 h-10 rounded-lg object-cover group-hover:scale-105 transition-transform"
                            />
                            <span className="text-[10px] text-[#949ba4] group-hover:text-white truncate max-w-full">
                              {preset.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#2b2d31] space-y-1.5">
                      <span className="text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider block">
                        Direct Image URL
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="https://example.com/icon.png"
                          value={iconUrlInput}
                          onChange={(e) => setIconUrlInput(e.target.value)}
                          className="flex-1 bg-[#111214] text-xs text-[#dbdee1] rounded px-3 py-1.5 border border-[#2b2d31] focus:outline-none focus:border-[#5865f2]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (iconUrlInput.trim()) {
                              setServerIcon(iconUrlInput.trim());
                              setIconUrlInput('');
                            }
                          }}
                          className="px-3 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-semibold rounded transition-colors cursor-pointer"
                        >
                          Apply URL
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Server Name Input */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b5bac1]">
                  Server Name
                </label>
                <input
                  type="text"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  className="w-full bg-[#1e1f22] text-sm text-[#dbdee1] rounded px-3 py-2 border border-[#232428] focus:outline-none focus:border-[#5865f2]"
                />
              </div>
            </div>

            <div className="h-[1px] bg-[#35373c]" />

            {/* Server Description */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b5bac1]">
                Server Description
              </label>
              <textarea
                rows={3}
                value={serverDescription}
                onChange={(e) => setServerDescription(e.target.value)}
                placeholder="Tell people what your server is about..."
                className="w-full bg-[#1e1f22] text-sm text-[#dbdee1] rounded px-3 py-2 border border-[#232428] focus:outline-none focus:border-[#5865f2] resize-none"
              />
            </div>

            <div className="h-[1px] bg-[#35373c]" />

            {/* Channels configuration: System & AFK */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* System Channel */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b5bac1]">
                  System Messages Channel
                </label>
                <select
                  value={systemChannelId}
                  onChange={(e) => setSystemChannelId(e.target.value)}
                  className="w-full bg-[#1e1f22] text-sm text-white p-2.5 rounded border border-[#232428] focus:outline-none focus:border-[#5865f2]"
                >
                  {channels.filter(c => c.type === 'text').map(c => (
                    <option key={c.id} value={c.id}>
                      # {c.name}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-[#949ba4] block">
                  Channel where welcome and boost messages are delivered.
                </span>
              </div>

              {/* Inactive AFK Channel */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b5bac1]">
                  Inactive Channel (AFK)
                </label>
                <select
                  value={afkChannelId}
                  onChange={(e) => setAfkChannelId(e.target.value)}
                  className="w-full bg-[#1e1f22] text-sm text-white p-2.5 rounded border border-[#232428] focus:outline-none focus:border-[#5865f2]"
                >
                  <option value="">No Inactive Channel</option>
                  {channels.filter(c => c.type === 'voice').map(c => (
                    <option key={c.id} value={c.id}>
                      🔊 {c.name}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-[#949ba4] block">
                  Automatically moves members who are idle in voice.
                </span>
              </div>
            </div>

            {/* Default Notification Settings */}
            <div className="space-y-3">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b5bac1]">
                Default Notification Settings
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label
                  onClick={() => setDefaultNotifications('all')}
                  className={`p-3 rounded-lg border flex items-center gap-3 cursor-pointer transition-colors ${
                    defaultNotifications === 'all'
                      ? 'border-[#5865f2] bg-[#5865f2]/10'
                      : 'border-[#232428] bg-[#1e1f22]'
                  }`}
                >
                  <input
                    type="radio"
                    name="notifs"
                    checked={defaultNotifications === 'all'}
                    onChange={() => setDefaultNotifications('all')}
                    className="accent-[#5865f2]"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">All Messages</div>
                    <div className="text-[10px] text-[#949ba4]">Recommended for small friend servers</div>
                  </div>
                </label>

                <label
                  onClick={() => setDefaultNotifications('mentions')}
                  className={`p-3 rounded-lg border flex items-center gap-3 cursor-pointer transition-colors ${
                    defaultNotifications === 'mentions'
                      ? 'border-[#5865f2] bg-[#5865f2]/10'
                      : 'border-[#232428] bg-[#1e1f22]'
                  }`}
                >
                  <input
                    type="radio"
                    name="notifs"
                    checked={defaultNotifications === 'mentions'}
                    onChange={() => setDefaultNotifications('mentions')}
                    className="accent-[#5865f2]"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">Only @mentions</div>
                    <div className="text-[10px] text-[#949ba4]">Recommended for public or large communities</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ROLES */}
        {activeTab === 'roles' && (
          <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Roles</h2>
                <p className="text-xs text-[#949ba4]">Use roles to organize your server members and customize their permissions.</p>
              </div>
              <button
                onClick={handleCreateRole}
                className="px-3.5 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold rounded flex items-center gap-1.5 transition-colors shadow cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Role</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Roles List */}
              <div className="bg-[#1e1f22] p-2 rounded-xl border border-[#232428] space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4] px-2 py-1 block">
                  Roles — {roles.length}
                </span>
                {roles.map((role) => {
                  const isSelected = role.id === selectedRole?.id;
                  return (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRoleId(role.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-left transition-colors ${
                        isSelected
                          ? 'bg-[#35373c] text-white'
                          : 'text-[#dbdee1] hover:bg-[#2b2d31]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: role.color }}
                        />
                        <span className="truncate">{role.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Role Details & Permissions */}
              {selectedRole && (
                <div className="md:col-span-2 bg-[#2b2d31] p-5 rounded-xl border border-[#232428] space-y-5">
                  <div className="flex items-center justify-between border-b border-[#35373c] pb-3">
                    <h3 className="text-base font-bold text-white">Edit Role — {selectedRole.name}</h3>
                    {selectedRole.id !== 'r_everyone' && (
                      <button
                        onClick={() => handleDeleteRole(selectedRole.id)}
                        className="text-xs text-[#f23f43] hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>

                  {/* Role Name */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b5bac1]">
                      Role Name
                    </label>
                    <input
                      type="text"
                      disabled={selectedRole.id === 'r_everyone'}
                      value={selectedRole.name}
                      onChange={(e) => handleUpdateRole(selectedRole.id, { name: e.target.value })}
                      className="w-full bg-[#1e1f22] text-sm text-[#dbdee1] rounded px-3 py-2 border border-[#232428] focus:outline-none focus:border-[#5865f2] disabled:opacity-50"
                    />
                  </div>

                  {/* Role Color */}
                  {selectedRole.id !== 'r_everyone' && (
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b5bac1]">
                        Role Color
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        {colorPresets.map((c) => (
                          <button
                            key={c}
                            onClick={() => handleUpdateRole(selectedRole.id, { color: c })}
                            className={`w-7 h-7 rounded-md transition-transform ${
                              selectedRole.color === c ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                        <input
                          type="color"
                          value={selectedRole.color}
                          onChange={(e) => handleUpdateRole(selectedRole.id, { color: e.target.value })}
                          className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                        />
                      </div>
                    </div>
                  )}

                  {/* Hoist & Mentionable toggles */}
                  {selectedRole.id !== 'r_everyone' && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between p-3 bg-[#1e1f22] rounded-lg">
                        <div>
                          <div className="text-xs font-bold text-white">Display role members separately</div>
                          <div className="text-[11px] text-[#949ba4]">Show distinct role category in member sidebar</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedRole.hoist}
                          onChange={(e) => handleUpdateRole(selectedRole.id, { hoist: e.target.checked })}
                          className="w-4 h-4 accent-[#5865f2]"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-[#1e1f22] rounded-lg">
                        <div>
                          <div className="text-xs font-bold text-white">Allow anyone to @mention this role</div>
                          <div className="text-[11px] text-[#949ba4]">Members can ping all users with this role</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedRole.mentionable}
                          onChange={(e) => handleUpdateRole(selectedRole.id, { mentionable: e.target.checked })}
                          className="w-4 h-4 accent-[#5865f2]"
                        />
                      </div>
                    </div>
                  )}

                  {/* Granular Permissions */}
                  <div className="space-y-3 pt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#b5bac1] block">
                      Permissions
                    </span>

                    {[
                      { id: 'ADMINISTRATOR', name: 'Administrator', desc: 'Grants all permissions. Highly dangerous.' },
                      { id: 'MANAGE_CHANNELS', name: 'Manage Channels', desc: 'Allows creation, editing, or deleting of channels.' },
                      { id: 'MANAGE_ROLES', name: 'Manage Roles', desc: 'Allows creating and editing roles lower than this one.' },
                      { id: 'KICK_MEMBERS', name: 'Kick Members', desc: 'Allows removing unwanted members from the server.' },
                      { id: 'BAN_MEMBERS', name: 'Ban Members', desc: 'Permanently bans users from the server.' },
                      { id: 'SEND_MESSAGES', name: 'Send Messages', desc: 'Allows posting in text channels.' },
                      { id: 'ATTACH_FILES', name: 'Attach Files', desc: 'Allows uploading images and media attachments.' },
                      { id: 'CONNECT', name: 'Connect to Voice', desc: 'Allows joining voice channels.' },
                      { id: 'SPEAK', name: 'Speak in Voice', desc: 'Allows speaking in voice channels.' }
                    ].map((perm) => {
                      const enabled = selectedRole.permissions.includes(perm.id);
                      return (
                        <div key={perm.id} className="flex items-center justify-between p-2.5 bg-[#1e1f22] rounded-lg">
                          <div>
                            <div className="text-xs font-bold text-white">{perm.name}</div>
                            <div className="text-[10px] text-[#949ba4]">{perm.desc}</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={() => togglePermission(perm.id)}
                            className="w-4 h-4 accent-[#23a55a]"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: EMOJI */}
        {activeTab === 'emoji' && (
          <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Server Emojis</h2>
                <p className="text-xs text-[#949ba4]">Upload custom emojis for anyone in this server to use in chat!</p>
              </div>
              <button
                onClick={() => setIsAddingEmoji(true)}
                className="px-3.5 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold rounded flex items-center gap-1.5 transition-colors shadow cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Emoji</span>
              </button>
            </div>

            {/* Slot counter */}
            <div className="p-3 bg-[#1e1f22] rounded-xl border border-[#232428] flex items-center justify-between text-xs">
              <span className="font-semibold text-white">
                {emojis.length} / 50 Emoji Slots Available
              </span>
              <span className="text-[11px] text-[#949ba4]">
                Boost to Level 1 to unlock 50 additional slots
              </span>
            </div>

            {/* Add emoji modal */}
            {isAddingEmoji && (
              <form onSubmit={handleAddEmoji} className="p-4 bg-[#2b2d31] rounded-xl border border-[#5865f2] space-y-3 discord-pop">
                <h3 className="text-sm font-bold text-white">Upload New Emoji</h3>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b5bac1] mb-1">
                    Emoji Name
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#949ba4]">:</span>
                    <input
                      type="text"
                      placeholder="e.g. pepe_hype, party_cat, gg_trophy"
                      value={newEmojiName}
                      onChange={(e) => setNewEmojiName(e.target.value)}
                      autoFocus
                      className="flex-1 bg-[#1e1f22] text-xs text-white rounded px-3 py-2 border border-[#232428] focus:outline-none focus:border-[#5865f2]"
                    />
                    <span className="text-sm font-bold text-[#949ba4]">:</span>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingEmoji(false)}
                    className="px-3 py-1.5 text-xs text-[#949ba4] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newEmojiName.trim()}
                    className="px-4 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold rounded disabled:opacity-50 cursor-pointer"
                  >
                    Save Emoji
                  </button>
                </div>
              </form>
            )}

            {/* Emojis Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {emojis.map((emoji) => (
                <div
                  key={emoji.id}
                  className="p-3 bg-[#1e1f22] rounded-xl border border-[#232428] flex items-center justify-between group hover:border-[#35373c] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#2b2d31] p-1 flex items-center justify-center shrink-0">
                      <img src={emoji.url} alt={emoji.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">:{emoji.name}:</div>
                      <div className="text-[10px] text-[#949ba4] truncate">By {emoji.uploadedBy}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteEmoji(emoji.id)}
                    title="Delete Emoji"
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-[#f23f43] hover:bg-[#da373c]/20 rounded transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: CHANNELS & CATEGORIES */}
        {activeTab === 'channels' && (
          <div className="space-y-6 pb-20">
            {/* Categories Management Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Categories Management</h2>
                  <p className="text-xs text-[#949ba4]">Organize your channels into structured categories</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(true)}
                  className="px-3.5 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold rounded flex items-center gap-1.5 transition-colors shadow cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Add Category</span>
                </button>
              </div>

              {/* Add category form */}
              {isAddingCategory && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newCategoryName.trim()) return;
                    const newCat: ChannelCategory = {
                      id: `cat_${Date.now()}`,
                      name: newCategoryName.trim().toUpperCase()
                    };
                    const updatedCategories = [...categories, newCat];
                    setCategories(updatedCategories);
                    setNewCategoryName('');
                    setIsAddingCategory(false);
                    onUpdateServer({ ...server, categories: updatedCategories });
                  }}
                  className="p-3.5 bg-[#2b2d31] rounded-xl border border-[#5865f2] space-y-2.5"
                >
                  <label className="text-[11px] font-bold text-[#b5bac1] uppercase">Category Name</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="e.g. VOICE CHANNELS, ANNOUNCEMENTS"
                      className="flex-1 bg-[#1e1f22] text-xs text-white rounded px-3 py-1.5 border border-[#35373c] focus:outline-none uppercase"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={!newCategoryName.trim()}
                      className="px-3 py-1.5 bg-[#23a55a] text-white text-xs font-semibold rounded disabled:opacity-50 cursor-pointer"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCategory(false);
                        setNewCategoryName('');
                      }}
                      className="px-3 py-1.5 bg-[#4e5058] text-white text-xs font-semibold rounded cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Categories list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {categories.map((cat) => {
                  const chanCount = channels.filter((c) => c.categoryId === cat.id).length;
                  return (
                    <div
                      key={cat.id}
                      className="p-3 bg-[#1e1f22] rounded-xl border border-[#232428] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Folder className="w-4 h-4 text-[#5865f2] shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{cat.name}</div>
                          <div className="text-[11px] text-[#949ba4]">{chanCount} channel{chanCount !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                      {categories.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete category "${cat.name}"? Channels will be kept.`)) {
                              const updatedCategories = categories.filter((c) => c.id !== cat.id);
                              setCategories(updatedCategories);
                              onUpdateServer({ ...server, categories: updatedCategories });
                            }
                          }}
                          className="p-1.5 text-[#949ba4] hover:text-[#f23f43] hover:bg-[#da373c]/20 rounded transition-colors cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="h-[1px] bg-[#35373c]" />

            <div>
              <h2 className="text-xl font-bold text-white">Channels Management</h2>
              <p className="text-xs text-[#949ba4]">Reorder, rename, set topics, or delete channels.</p>
            </div>

            <div className="space-y-3">
              {channels.map((chan) => {
                const isEditing = editingChannelId === chan.id;
                return (
                  <div
                    key={chan.id}
                    className="p-3 bg-[#1e1f22] rounded-xl border border-[#232428] flex items-center justify-between transition-colors"
                  >
                    {isEditing ? (
                      <div className="flex-1 space-y-2 pr-4">
                        <input
                          type="text"
                          value={editChannelName}
                          onChange={(e) => setEditChannelName(e.target.value)}
                          className="w-full bg-[#2b2d31] text-xs text-white rounded px-2.5 py-1.5 border border-[#35373c] focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Channel topic..."
                          value={editChannelTopic}
                          onChange={(e) => setEditChannelTopic(e.target.value)}
                          className="w-full bg-[#2b2d31] text-xs text-[#949ba4] rounded px-2.5 py-1.5 border border-[#35373c] focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveChannelEdit(chan.id)}
                            className="px-3 py-1 bg-[#23a55a] text-white text-[11px] font-bold rounded"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingChannelId(null)}
                            className="px-3 py-1 bg-[#4e5058] text-white text-[11px] font-bold rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 min-w-0">
                        {chan.type === 'voice' ? (
                          <Volume2 className="w-5 h-5 text-[#23a55a] shrink-0" />
                        ) : (
                          <Hash className="w-5 h-5 text-[#80848e] shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{chan.name}</div>
                          <div className="text-[11px] text-[#949ba4] truncate">{chan.topic || 'No topic configured'}</div>
                        </div>
                      </div>
                    )}

                    {!isEditing && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setEditingChannelId(chan.id);
                            setEditChannelName(chan.name);
                            setEditChannelTopic(chan.topic || '');
                          }}
                          className="px-2.5 py-1 bg-[#2b2d31] hover:bg-[#35373c] text-white text-xs font-semibold rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteChannel(chan.id)}
                          className="p-1.5 text-[#f23f43] hover:bg-[#da373c]/20 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: MEMBERS */}
        {activeTab === 'members' && (
          <div className="space-y-6 pb-20">
            <div>
              <h2 className="text-xl font-bold text-white">Server Members</h2>
              <p className="text-xs text-[#949ba4]">Assign roles, view membership dates, or moderate members.</p>
            </div>

            {/* Member search */}
            <input
              type="text"
              placeholder="Search members by username..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="w-full bg-[#1e1f22] text-xs text-white rounded-lg px-3.5 py-2.5 border border-[#232428] focus:outline-none focus:border-[#5865f2]"
            />

            <div className="space-y-2">
              {members
                .filter(m =>
                  !memberSearch ||
                  m.displayName.toLowerCase().includes(memberSearch.toLowerCase()) ||
                  m.username.toLowerCase().includes(memberSearch.toLowerCase())
                )
                .map((m) => (
                  <div
                    key={m.id}
                    className="p-3 bg-[#1e1f22] rounded-xl border border-[#232428] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={m.avatar} alt={m.displayName} className="w-10 h-10 rounded-full object-cover shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">{m.displayName}</span>
                          <span className="text-[11px] text-[#949ba4]">@{m.username}</span>
                        </div>
                        {/* Role Pills */}
                        <div className="flex items-center gap-1.5 mt-1">
                          <RoleBadge role={m.role} roleColor={m.roleColor} size="sm" />
                        </div>
                      </div>
                    </div>

                    {/* Role selector dropdown & kick action */}
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={m.role || 'Member'}
                        onChange={(e) => {
                          const chosenRole = roles.find(r => r.name === e.target.value);
                          handleToggleMemberRole(m.id, e.target.value, chosenRole?.color || '#5865f2');
                        }}
                        className="bg-[#2b2d31] text-xs text-white p-1.5 rounded border border-[#35373c] focus:outline-none"
                      >
                        {roles.map(r => (
                          <option key={r.id} value={r.name}>{r.name}</option>
                        ))}
                      </select>

                      {m.id !== currentUser.id && (
                        <button
                          onClick={() => handleKickMember(m.id)}
                          title="Kick Member"
                          className="px-2.5 py-1 text-xs text-[#f23f43] hover:bg-[#da373c]/20 rounded font-semibold transition-colors"
                        >
                          Kick
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 6: INVITES */}
        {activeTab === 'invites' && (
          <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Active Invites</h2>
                <p className="text-xs text-[#949ba4]">Here's a list of all active invite links created for this server.</p>
              </div>
              <button
                onClick={handleCreateInvite}
                className="px-3.5 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold rounded flex items-center gap-1.5 transition-colors shadow cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Invite Link</span>
              </button>
            </div>

            <div className="space-y-2">
              {invites.map((inv) => (
                <div
                  key={inv.code}
                  className="p-3 bg-[#1e1f22] rounded-xl border border-[#232428] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Link className="w-5 h-5 text-[#5865f2]" />
                    <div>
                      <div className="text-xs font-mono font-bold text-white">{inv.code}</div>
                      <div className="text-[11px] text-[#949ba4]">
                        Created by {inv.inviter} · {inv.uses} uses · Expires {inv.expiresIn}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyInvite(inv.code)}
                      className="px-3 py-1.5 bg-[#2b2d31] hover:bg-[#35373c] text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors"
                    >
                      {inviteCopied === inv.code ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#23a55a]" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleRevokeInvite(inv.code)}
                      title="Revoke Invite"
                      className="p-1.5 text-[#f23f43] hover:bg-[#da373c]/20 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: AUDIT LOG */}
        {activeTab === 'audit' && (
          <div className="space-y-6 pb-20">
            <div>
              <h2 className="text-xl font-bold text-white">Audit Log</h2>
              <p className="text-xs text-[#949ba4]">All administrative actions made by managers and bots on this server.</p>
            </div>

            <div className="space-y-2">
              {auditLog.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 bg-[#1e1f22] rounded-xl border border-[#232428] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#5865f2]/20 text-[#5865f2] flex items-center justify-center font-bold">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-white">
                        <strong className="text-[#5865f2]">{log.user}</strong> {log.action}{' '}
                        <span className="font-semibold text-white bg-[#2b2d31] px-1.5 py-0.5 rounded border border-[#35373c]">
                          {log.target}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#949ba4] mt-0.5">{log.timestamp}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Discord Floating "Unsaved Changes" Banner at Bottom */}
        {hasOverviewChanges && (
          <div className="fixed bottom-6 left-72 right-12 bg-[#111214] border border-[#232428] shadow-2xl rounded-xl p-3 flex items-center justify-between z-30 discord-pop">
            <div className="text-xs font-semibold text-white">
              Careful — you have unsaved changes!
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleResetOverview}
                className="text-xs text-white hover:underline px-2 py-1 font-semibold"
              >
                Reset
              </button>
              <button
                onClick={handleSaveOverview}
                className="px-4 py-2 bg-[#23a55a] hover:bg-[#1f9250] text-white text-xs font-bold rounded shadow transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Server Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-[#313338] rounded-2xl shadow-2xl border border-[#da373c] overflow-hidden text-[#dbdee1] discord-pop">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-[#f23f43]">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-lg font-bold">Delete '{server.name}'</h3>
              </div>
              <p className="text-xs text-[#949ba4] leading-relaxed">
                Are you sure you want to delete <strong className="text-white">{server.name}</strong>? This action cannot be undone and will permanently remove all channels, roles, and message history.
              </p>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b5bac1] mb-1.5">
                  Enter Server Name
                </label>
                <input
                  type="text"
                  placeholder={server.name}
                  value={deleteConfirmInput}
                  onChange={(e) => setDeleteConfirmInput(e.target.value)}
                  className="w-full bg-[#1e1f22] text-xs text-white rounded px-3 py-2 border border-[#232428] focus:outline-none focus:border-[#f23f43]"
                />
              </div>
            </div>

            <div className="p-4 bg-[#2b2d31] border-t border-[#232428] flex items-center justify-between">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-xs font-semibold text-white hover:underline"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteServer}
                disabled={deleteConfirmInput.trim().toLowerCase() !== server.name.trim().toLowerCase()}
                className="px-4 py-2 bg-[#da373c] hover:bg-[#ba2e33] disabled:opacity-40 text-white text-xs font-bold rounded shadow transition-colors cursor-pointer"
              >
                Delete Server
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
