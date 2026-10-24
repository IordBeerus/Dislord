/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  CURRENT_USER,
  INITIAL_SERVERS,
  INITIAL_MESSAGES,
  INITIAL_DMS
} from './data/initialData';
import { Server, Channel, User, Message, DirectMessage, Attachment } from './types/discord';
import { ServerSidebar } from './components/ServerSidebar';
import { ChannelSidebar } from './components/ChannelSidebar';
import { ChatArea } from './components/ChatArea';
import { VoiceStage } from './components/VoiceStage';
import { MemberList } from './components/MemberList';
import { FriendsHome } from './components/FriendsHome';
import { UserProfileModal } from './components/UserProfileModal';
import { UserSettingsModal } from './components/UserSettingsModal';
import { ServerDiscoveryModal } from './components/ServerDiscoveryModal';
import { CreateServerModal } from './components/CreateServerModal';
import { QuickSwitcher } from './components/QuickSwitcher';
import { NitroModal } from './components/NitroModal';
import { SoundboardModal } from './components/SoundboardModal';
import { ServerSettingsModal } from './components/ServerSettingsModal';
import { AuthModal } from './components/AuthModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CreateCategoryModal } from './components/CreateCategoryModal';
import { CreateChannelModal } from './components/CreateChannelModal';
import { ChannelCategory } from './types/discord';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  syncUserProfile,
  subscribeToUsers,
  subscribeToServers,
  ensureDefaultServersExist,
  createFirestoreServer,
  subscribeToChannelMessages,
  sendChannelMessage,
  subscribeToDirectMessages,
  subscribeToDMMessages,
  sendDirectMessage,
  createDirectMessageThread,
  updateFirestoreServerCategories,
  updateFirestoreServerChannels,
  leaveFirestoreServer,
  updateUserLeftServers,
  joinFirestoreServer,
  boostFirestoreServer,
  updateFirestoreServerDetails
} from './lib/chatService';
import { playJoinVoiceSound, playLeaveVoiceSound, playMessageSound } from './utils/audio';
import { pruneMessagesOlderThan, pruneLocalStorageMessages } from './utils/messagePruner';
import { Share2, Check, LogIn, Users as UsersIcon, AlertTriangle, ExternalLink, RefreshCw, Download } from 'lucide-react';

const SYSTEM_USER: User = {
  id: 'system_bot',
  username: 'system',
  displayName: 'System',
  discriminator: '0000',
  avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=DiscordSystem&backgroundColor=5865F2',
  bannerColor: '#5865F2',
  status: 'online',
  badges: ['System'],
  role: 'System',
  roleColor: '#5865F2'
};

const SIMULATED_IDS = new Set([
  'user_sarah',
  'user_marcus',
  'user_elena',
  'user_kenji',
  'user_luna',
  'user_clyde',
  'bot_clyde'
]);

const SIMULATED_USERNAMES = new Set([
  'sarah_sky',
  'marcus_dev',
  'elena_art',
  'kenji_blade',
  'luna_beats',
  'clyde'
]);

const isSimulatedAccount = (u?: Partial<User> | null): boolean => {
  if (!u) return false;
  if (u.id && SIMULATED_IDS.has(u.id)) return true;
  if (u.username && SIMULATED_USERNAMES.has(u.username.toLowerCase())) return true;
  if (u.role && u.role.toLowerCase() === 'bot') return true;
  return false;
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [allRegisteredUsers, setAllRegisteredUsers] = useState<User[]>([]);
  const [tokenApiErrorUrl, setTokenApiErrorUrl] = useState<string | null>(null);
  const [isRetryingToken, setIsRetryingToken] = useState(false);
  const [isDownloadingCode, setIsDownloadingCode] = useState(false);
  const [downloadCodeDone, setDownloadCodeDone] = useState(false);

  const handleDownloadCode = async () => {
    setIsDownloadingCode(true);
    try {
      const res = await fetch('/discord-clone-source.zip', { cache: 'no-cache' });
      if (!res.ok) throw new Error('Failed to fetch file');
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
    } catch (e) {
      console.warn('Falling back to direct anchor download:', e);
      const link = document.createElement('a');
      link.href = '/discord-clone-source.zip';
      link.download = 'discord-clone-source.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadCodeDone(true);
      setTimeout(() => setDownloadCodeDone(false), 3000);
    } finally {
      setIsDownloadingCode(false);
    }
  };

  // Current user state
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('discord_clone_user');
    if (saved) {
      try {
        const parsed: User = JSON.parse(saved);
        if (parsed.avatar && parsed.avatar.includes('bottts')) {
          parsed.avatar = CURRENT_USER.avatar;
        }
        return parsed;
      } catch (e) { /* ignore */ }
    }
    return CURRENT_USER;
  });

  const [friends, setFriends] = useState<User[]>(() => {
    const saved = localStorage.getItem('discord_clone_friends');
    if (saved) {
      try {
        const parsed: User[] = JSON.parse(saved);
        return parsed.filter(u => !isSimulatedAccount(u));
      } catch (e) { /* ignore */ }
    }
    return [];
  });

  // Track servers the user has explicitly left so they are not rejoined automatically
  const [leftServerIds, setLeftServerIds] = useState<string[]>(() => {
    try {
      const userKey = 'discord_clone_left_servers_' + CURRENT_USER.id;
      const stored = localStorage.getItem(userKey) || localStorage.getItem('discord_clone_left_servers');
      if (stored) return JSON.parse(stored);
    } catch (e) { /* ignore */ }
    return [];
  });

  const [servers, setServers] = useState<Server[]>(() => {
    let initialLeft: string[] = [];
    try {
      const userKey = 'discord_clone_left_servers_' + CURRENT_USER.id;
      const stored = localStorage.getItem(userKey) || localStorage.getItem('discord_clone_left_servers');
      if (stored) initialLeft = JSON.parse(stored);
    } catch (e) { /* ignore */ }

    const saved = localStorage.getItem('discord_clone_servers');
    if (saved) {
      try {
        const parsed: Server[] = JSON.parse(saved);
        return parsed
          .filter(s => !initialLeft.includes(s.id))
          .map(s => {
            const validMembers = (s.members || []).filter(m => !isSimulatedAccount(m));
            const hasCurrentUser = validMembers.some(m => m.id === CURRENT_USER.id);
            const membersList = hasCurrentUser ? validMembers : [CURRENT_USER, ...validMembers];
            return {
              ...s,
              memberCount: membersList.length,
              onlineCount: membersList.filter(m => m.status !== 'offline').length,
              members: membersList,
              roles: (s.roles || []).filter(r => r.name.toLowerCase() !== 'bot'),
              channels: s.channels
                .filter(c => c.id !== 'c_bot_cmds' && c.name !== 'bot-commands')
                .map(c => ({
                  ...c,
                  voiceUsers: (c.voiceUsers || []).filter(uid => !SIMULATED_IDS.has(uid))
                }))
            };
          });
      } catch (e) { /* ignore */ }
    }
    return INITIAL_SERVERS.filter(s => !initialLeft.includes(s.id));
  });

  const [directMessages, setDirectMessages] = useState<DirectMessage[]>(() => {
    const saved = localStorage.getItem('discord_clone_dms');
    if (saved) {
      try {
        const parsed: DirectMessage[] = JSON.parse(saved);
        return parsed.filter(
          dm =>
            !isSimulatedAccount(dm.recipient) &&
            !dm.id.includes('sarah') &&
            !dm.id.includes('marcus') &&
            !dm.id.includes('elena') &&
            !dm.id.includes('clyde')
        );
      } catch (e) { /* ignore */ }
    }
    return INITIAL_DMS;
  });

  const [allMessages, setAllMessages] = useState<Record<string, Message[]>>(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem('discord_clone_messages');
      if (saved && saved.length > 2 * 1024 * 1024) {
        localStorage.removeItem('discord_clone_messages');
        saved = null;
      }
    } catch (e) {
      saved = null;
    }
    if (saved) {
      try {
        const parsed: Record<string, Message[]> = JSON.parse(saved);
        const { pruned } = pruneMessagesOlderThan(parsed);
        const cleaned: Record<string, Message[]> = {};
        for (const [key, msgs] of Object.entries(pruned)) {
          if (
            key === 'dm_clyde' ||
            key === 'c_bot_cmds' ||
            key.includes('sarah') ||
            key.includes('marcus') ||
            key.includes('elena')
          ) {
            continue;
          }
          cleaned[key] = (msgs || [])
            .filter(
              m =>
                !isSimulatedAccount(m.author) &&
                !SIMULATED_IDS.has(m.authorId) &&
                !m.id.startsWith('bot_')
            )
            .map(m => ({
              ...m,
              reactions: (m.reactions || [])
                .map(r => ({
                  ...r,
                  userIds: (r.userIds || []).filter(uid => !SIMULATED_IDS.has(uid)),
                  count: (r.userIds || []).filter(uid => !SIMULATED_IDS.has(uid)).length
                }))
                .filter(r => r.count > 0)
            }));
        }
        if (!cleaned.c_general || cleaned.c_general.length === 0) {
          cleaned.c_general = INITIAL_MESSAGES.c_general;
        }
        return cleaned;
      } catch (e) { /* ignore */ }
    }
    return INITIAL_MESSAGES;
  });

  // Navigation state
  const [activeServerId, setActiveServerId] = useState<string | null>(() => {
    let initialLeft: string[] = [];
    try {
      const stored = localStorage.getItem('discord_clone_left_servers_' + CURRENT_USER.id) ||
                     localStorage.getItem('discord_clone_left_servers');
      if (stored) initialLeft = JSON.parse(stored);
    } catch (e) { /* ignore */ }
    return initialLeft.includes('server_dev') ? null : 'server_dev';
  });
  const [activeChannelId, setActiveChannelId] = useState<string | null>('c_general');
  const [activeDmId, setActiveDmId] = useState<string | null>(null);

  // Voice room state with persistent mute & deafen preferences
  const [activeVoiceChannelId, setActiveVoiceChannelId] = useState<string | null>(null);
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('discord_clone_voice_muted');
      if (saved !== null) return JSON.parse(saved);
      const userSaved = localStorage.getItem('discord_clone_user');
      if (userSaved) {
        const parsed = JSON.parse(userSaved);
        if (typeof parsed.isMuted === 'boolean') return parsed.isMuted;
      }
    } catch (e) { /* ignore */ }
    return false;
  });
  const [isVoiceDeafened, setIsVoiceDeafened] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('discord_clone_voice_deafened');
      if (saved !== null) return JSON.parse(saved);
      const userSaved = localStorage.getItem('discord_clone_user');
      if (userSaved) {
        const parsed = JSON.parse(userSaved);
        if (typeof parsed.isDeafened === 'boolean') return parsed.isDeafened;
      }
    } catch (e) { /* ignore */ }
    return false;
  });
  const [isViewingVoiceStage, setIsViewingVoiceStage] = useState(false);

  // Modals state
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);
  const [isAddServerOpen, setIsAddServerOpen] = useState(false);
  const [isQuickSwitcherOpen, setIsQuickSwitcherOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isServerSettingsOpen, setIsServerSettingsOpen] = useState(false);
  const [isNitroOpen, setIsNitroOpen] = useState(false);
  const [isSoundboardOpen, setIsSoundboardOpen] = useState(false);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [createChannelDefaultCategoryId, setCreateChannelDefaultCategoryId] = useState<string | undefined>(undefined);
  const [selectedProfileUser, setSelectedProfileUser] = useState<User | null>(null);

  // UI state
  const [isMemberListOpen, setIsMemberListOpen] = useState(true);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  // 1. Firebase Auth listener and Token Service API error interceptor
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      const msg = event?.reason?.message || String(event?.reason || '');
      if (msg.includes('token-service-api') || msg.includes('securetoken.googleapis.com')) {
        event.preventDefault();
        setTokenApiErrorUrl('https://console.developers.google.com/apis/api/securetoken.googleapis.com/overview?project=1043939381344');
      }
    };
    window.addEventListener('unhandledrejection', handleRejection);

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setIsLoggedIn(true);

        // Check if token service API is enabled
        let hasTokenError = false;
        try {
          await fbUser.getIdToken();
          setTokenApiErrorUrl(null);
        } catch (tokenErr: any) {
          hasTokenError = true;
          const msg = tokenErr?.message || String(tokenErr);
          if (msg.includes('token-service-api') || msg.includes('securetoken.googleapis.com')) {
            console.warn('Google Cloud Token Service API requires activation for project 1043939381344:', msg);
            setTokenApiErrorUrl('https://console.developers.google.com/apis/api/securetoken.googleapis.com/overview?project=1043939381344');
          }
        }

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
          customStatus: 'Available live on Discord',
          aboutMe: 'Real Discord Member',
          badges: ['Active Member', 'Early Supporter'],
          role: 'Member',
          roleColor: '#5865F2'
        };

        setCurrentUser(realUser);
        if (!hasTokenError) {
          syncUserProfile(realUser).catch(e => console.warn('User profile sync deferred:', e));
          ensureDefaultServersExist(realUser).catch(e => console.warn('Default servers sync deferred:', e));
        }

        // Load leftServerIds for signed in user
        try {
          const userKey = 'discord_clone_left_servers_' + realUser.id;
          const stored = localStorage.getItem(userKey) || localStorage.getItem('discord_clone_left_servers');
          if (stored) {
            setLeftServerIds(JSON.parse(stored));
          }
        } catch (e) { /* ignore */ }
      } else {
        setIsLoggedIn(false);
        setTokenApiErrorUrl(null);
      }
    });

    return () => {
      unsubscribe();
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // Handle Token API verification retry
  const handleRetryToken = async () => {
    if (!auth.currentUser) return;
    setIsRetryingToken(true);
    try {
      await auth.currentUser.getIdToken(true);
      setTokenApiErrorUrl(null);
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('token-service-api') || msg.includes('securetoken.googleapis.com')) {
        setTokenApiErrorUrl('https://console.developers.google.com/apis/api/securetoken.googleapis.com/overview?project=1043939381344');
      }
    } finally {
      setIsRetryingToken(false);
    }
  };

  // 2. Subscribe to real-time Users collection
  useEffect(() => {
    if (!isLoggedIn || !auth.currentUser || tokenApiErrorUrl) return;

    const unsub = subscribeToUsers((users) => {
      const filtered = users.filter(u => !isSimulatedAccount(u));
      setAllRegisteredUsers(filtered);

      // Check current user profile for leftServerIds
      const myProfile = users.find(u => u.id === currentUser.id);
      if (myProfile?.leftServerIds && Array.isArray(myProfile.leftServerIds) && myProfile.leftServerIds.length > 0) {
        setLeftServerIds(prev => Array.from(new Set([...prev, ...(myProfile.leftServerIds || [])])));
      }

      // Merge real users into server members list
      setServers(prev =>
        prev
          .filter(s => !leftServerIds.includes(s.id))
          .map(s => {
            const combined = [...filtered];
            // Ensure currentUser is in list only if they haven't left
            if (!leftServerIds.includes(s.id) && !combined.some(u => u.id === currentUser.id)) {
              combined.unshift(currentUser);
            }
            return {
              ...s,
              members: combined,
              memberCount: combined.length,
              onlineCount: combined.filter(u => u.status !== 'offline').length
            };
          })
      );
    });

    return () => unsub();
  }, [isLoggedIn, currentUser, leftServerIds, tokenApiErrorUrl]);

  // 3. Subscribe to real-time Servers collection
  useEffect(() => {
    if (!isLoggedIn || !auth.currentUser || tokenApiErrorUrl) return;

    const unsub = subscribeToServers((liveServers) => {
      if (liveServers.length > 0) {
        // Exclude servers the current user has left
        const userServers = liveServers.filter(s => !leftServerIds.includes(s.id));
        setServers(userServers.map(s => {
          const activeMembers = allRegisteredUsers.length > 0
            ? allRegisteredUsers.filter(u => !(u.leftServerIds || []).includes(s.id))
            : [currentUser];
          return {
            ...s,
            members: activeMembers,
            memberCount: Math.max(1, activeMembers.length),
            onlineCount: Math.max(1, activeMembers.filter(u => u.status !== 'offline').length)
          };
        }));
      }
    });

    return () => unsub();
  }, [isLoggedIn, allRegisteredUsers, currentUser, leftServerIds, tokenApiErrorUrl]);

  // 4. Subscribe to active channel messages
  useEffect(() => {
    if (!isLoggedIn || !auth.currentUser || tokenApiErrorUrl) return;
    if (!activeServerId || !activeChannelId) return;

    const unsub = subscribeToChannelMessages(activeServerId, activeChannelId, (msgs) => {
      setAllMessages(prev => ({
        ...prev,
        [activeChannelId]: msgs
      }));
    });

    return () => unsub();
  }, [isLoggedIn, activeServerId, activeChannelId, tokenApiErrorUrl]);

  // 5. Subscribe to Direct Messages
  useEffect(() => {
    if (!isLoggedIn || !auth.currentUser || tokenApiErrorUrl) return;
    if (!currentUser.id || currentUser.id !== auth.currentUser.uid) return;

    const unsub = subscribeToDirectMessages(currentUser.id, (dms) => {
      if (dms.length > 0) {
        setDirectMessages(dms);
      }
    });

    return () => unsub();
  }, [isLoggedIn, currentUser.id, tokenApiErrorUrl]);

  // 6. Subscribe to active DM messages
  useEffect(() => {
    if (!isLoggedIn || !auth.currentUser || tokenApiErrorUrl) return;
    if (activeServerId !== null || !activeDmId) return;

    const unsub = subscribeToDMMessages(activeDmId, (msgs) => {
      setAllMessages(prev => ({
        ...prev,
        [activeDmId]: msgs
      }));
    });

    return () => unsub();
  }, [isLoggedIn, activeServerId, activeDmId, tokenApiErrorUrl]);

  // 7. Background process: Periodically removes messages older than 24 hours across all channels
  useEffect(() => {
    const runCleanup = () => {
      setAllMessages((prev) => {
        const { pruned, removedCount } = pruneMessagesOlderThan(prev);
        if (removedCount > 0) {
          return pruned;
        }
        return prev;
      });
      pruneLocalStorageMessages();
    };

    // Run once on mount
    runCleanup();

    // Run every 15 minutes in the background
    const intervalId = setInterval(runCleanup, 15 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Safe localStorage setter with QuotaExceededError protection and sliding window message truncation
  const safeSetStorage = (key: string, data: unknown) => {
    // Proactively prune messages older than 24h when updating local storage
    let dataToStore = data;
    if (key === 'discord_clone_messages' && data && typeof data === 'object') {
      const { pruned } = pruneMessagesOlderThan(data as Record<string, Message[]>);
      dataToStore = pruned;
    }

    try {
      localStorage.setItem(key, JSON.stringify(dataToStore));
    } catch (err) {
      console.warn(`localStorage quota exceeded for key "${key}". Truncating with sliding window.`);
      if (key === 'discord_clone_messages' && data && typeof data === 'object') {
        const msgsObj = data as Record<string, Message[]>;

        // Build a sliding window of the N most recent messages across all channels
        const buildSlidingWindowCache = (windowLimit: number): Record<string, Message[]> => {
          interface MessageWithContext {
            channelKey: string;
            message: Message;
            orderScore: number;
          }

          const allItems: MessageWithContext[] = [];

          for (const [channelKey, msgList] of Object.entries(msgsObj)) {
            if (!Array.isArray(msgList)) continue;
            msgList.forEach((msg, idx) => {
              // Extract numeric timestamp from ID (e.g. msg_1792719838370_gqd6q) or parse timestamp or use index
              let orderScore = idx;
              const idTimestampMatch = msg.id?.match(/msg_(\d+)/);
              if (idTimestampMatch) {
                orderScore = parseInt(idTimestampMatch[1], 10);
              } else {
                const parsed = Date.parse(msg.timestamp);
                if (!isNaN(parsed)) {
                  orderScore = parsed;
                }
              }

              // Sanitize attachments: strip heavy base64 data URLs to prevent consuming storage
              const sanitizedMsg: Message = {
                ...msg,
                attachments: msg.attachments?.map(a => ({
                  ...a,
                  url: a.url && a.url.startsWith('data:') ? '' : a.url
                }))
              };

              allItems.push({
                channelKey,
                message: sanitizedMsg,
                orderScore
              });
            });
          }

          // Sort messages chronologically across all channels
          allItems.sort((a, b) => a.orderScore - b.orderScore);

          // Keep only the most recent messages across all channels (sliding window)
          const recentItems = allItems.slice(-windowLimit);

          // Group back into channels dictionary
          const truncatedMap: Record<string, Message[]> = {};
          // Preserve channel keys so existing channel references remain defined
          for (const channelKey of Object.keys(msgsObj)) {
            truncatedMap[channelKey] = [];
          }
          for (const item of recentItems) {
            if (!truncatedMap[item.channelKey]) {
              truncatedMap[item.channelKey] = [];
            }
            truncatedMap[item.channelKey].push(item.message);
          }

          return truncatedMap;
        };

        // Sliding window sizes to gracefully degrade if quota is extremely tight (50, 35, 20, 10)
        // instead of ever deleting the cache
        const windowSizes = [50, 35, 20, 10];
        let savedSuccessfully = false;

        for (const limit of windowSizes) {
          try {
            const truncated = buildSlidingWindowCache(limit);
            localStorage.setItem(key, JSON.stringify(truncated));
            savedSuccessfully = true;
            break;
          } catch (quotaErr) {
            // If quota error occurs at this limit, try the next smaller window size
            continue;
          }
        }

        if (!savedSuccessfully) {
          // If still constrained by other non-essential keys, clear them first to make room
          // for the 50 most recent messages rather than deleting messages
          try {
            localStorage.removeItem('discord_clone_dms');
            localStorage.removeItem('discord_clone_friends');
            const truncated = buildSlidingWindowCache(50);
            localStorage.setItem(key, JSON.stringify(truncated));
          } catch (finalErr) {
            console.warn('Could not persist sliding window of messages to localStorage:', finalErr);
          }
        }
      }
    }
  };

  // Persist to localStorage as backup with QuotaExceeded protection
  useEffect(() => {
    safeSetStorage('discord_clone_servers', servers);
  }, [servers]);

  useEffect(() => {
    safeSetStorage('discord_clone_user', currentUser);
  }, [currentUser]);

  useEffect(() => {
    safeSetStorage('discord_clone_friends', friends);
  }, [friends]);

  useEffect(() => {
    safeSetStorage('discord_clone_dms', directMessages);
  }, [directMessages]);

  useEffect(() => {
    safeSetStorage('discord_clone_messages', allMessages);
  }, [allMessages]);

  // Global keybind for Quick Switcher (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsQuickSwitcherOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Current server and channel objects
  const currentServer = servers.find(s => s.id === activeServerId) || null;
  const currentChannel = currentServer?.channels.find(c => c.id === activeChannelId) || null;
  const currentDm = directMessages.find(d => d.id === activeDmId) || null;

  // Active channel messages key
  const activeChatKey = activeServerId ? activeChannelId || '' : activeDmId || '';
  const currentChatMessages = allMessages[activeChatKey] || [];

  // Handle server selection
  const handleSelectServer = (serverId: string | null) => {
    setActiveServerId(serverId);
    setIsDiscoveryOpen(false);

    if (serverId === null) {
      setActiveDmId(null);
      setIsViewingVoiceStage(false);
    } else {
      const srv = servers.find(s => s.id === serverId);
      if (srv && srv.channels.length > 0) {
        const firstText = srv.channels.find(c => c.type === 'text') || srv.channels[0];
        setActiveChannelId(firstText.id);
        setIsViewingVoiceStage(firstText.type === 'voice');
      }
    }
  };

  // Handle channel selection
  const handleSelectChannel = (channelId: string) => {
    setActiveChannelId(channelId);
    const ch = currentServer?.channels.find(c => c.id === channelId);
    if (ch?.type === 'voice') {
      setIsViewingVoiceStage(true);
    } else {
      setIsViewingVoiceStage(false);
    }
  };

  // Join voice channel
  const handleJoinVoice = (channelId: string) => {
    playJoinVoiceSound();
    setActiveVoiceChannelId(channelId);
    setIsViewingVoiceStage(true);

    setServers(prev =>
      prev.map(s => ({
        ...s,
        channels: s.channels.map(c => {
          if (c.id === channelId) {
            const currentVoice = c.voiceUsers || [];
            if (!currentVoice.includes(currentUser.id)) {
              return { ...c, voiceUsers: [...currentVoice, currentUser.id] };
            }
          } else {
            return {
              ...c,
              voiceUsers: (c.voiceUsers || []).filter(uid => uid !== currentUser.id)
            };
          }
          return c;
        })
      }))
    );
  };

  // Leave voice channel
  const handleLeaveVoice = () => {
    playLeaveVoiceSound();
    setActiveVoiceChannelId(null);
    setIsViewingVoiceStage(false);

    setServers(prev =>
      prev.map(s => ({
        ...s,
        channels: s.channels.map(c => ({
          ...c,
          voiceUsers: (c.voiceUsers || []).filter(uid => uid !== currentUser.id)
        }))
      }))
    );
  };

  // Persistent voice mute toggle
  const handleToggleVoiceMute = () => {
    setIsVoiceMuted(prevMuted => {
      const nextMuted = !prevMuted;
      try {
        localStorage.setItem('discord_clone_voice_muted', JSON.stringify(nextMuted));
      } catch (e) { /* ignore */ }

      // In Discord: if user un-mutes while deafened, automatically undeafen them as well
      if (!nextMuted && isVoiceDeafened) {
        setIsVoiceDeafened(false);
        try {
          localStorage.setItem('discord_clone_voice_deafened', JSON.stringify(false));
        } catch (e) { /* ignore */ }
      }

      setCurrentUser(prevUser => {
        const updated: User = {
          ...prevUser,
          isMuted: nextMuted,
          isDeafened: !nextMuted ? false : prevUser.isDeafened
        };
        try {
          localStorage.setItem('discord_clone_user', JSON.stringify(updated));
        } catch (e) { /* ignore */ }
        syncUserProfile(updated);
        return updated;
      });

      return nextMuted;
    });
  };

  // Persistent voice deafen toggle
  const handleToggleVoiceDeafen = () => {
    setIsVoiceDeafened(prevDeafened => {
      const nextDeafened = !prevDeafened;
      try {
        localStorage.setItem('discord_clone_voice_deafened', JSON.stringify(nextDeafened));
      } catch (e) { /* ignore */ }

      // In Discord: deafening automatically mutes microphone
      if (nextDeafened) {
        setIsVoiceMuted(true);
        try {
          localStorage.setItem('discord_clone_voice_muted', JSON.stringify(true));
        } catch (e) { /* ignore */ }
      }

      setCurrentUser(prevUser => {
        const updated: User = {
          ...prevUser,
          isDeafened: nextDeafened,
          isMuted: nextDeafened ? true : prevUser.isMuted
        };
        try {
          localStorage.setItem('discord_clone_user', JSON.stringify(updated));
        } catch (e) { /* ignore */ }
        syncUserProfile(updated);
        return updated;
      });

      return nextDeafened;
    });
  };

  // Handle Send Message
  const handleSendMessage = async (
    content: string,
    replyTo?: { id: string; authorName: string; content: string },
    attachmentsParam?: Attachment[] | string
  ) => {
    const chatKey = activeServerId ? activeChannelId : activeDmId;
    if (!chatKey) return;

    let finalAttachments: Attachment[] | undefined;
    if (Array.isArray(attachmentsParam)) {
      finalAttachments = attachmentsParam.length > 0 ? attachmentsParam : undefined;
    } else if (typeof attachmentsParam === 'string' && attachmentsParam.trim()) {
      finalAttachments = [
        {
          id: `att_${Date.now()}`,
          url: attachmentsParam,
          name: 'attachment.png',
          type: 'image',
          size: '1.8 MB'
        }
      ];
    }

    const newMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      channelId: chatKey,
      authorId: currentUser.id,
      author: currentUser,
      content,
      timestamp: 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now(),
      reactions: [],
      replyTo,
      attachments: finalAttachments
    };

    // Optimistic local state update
    setAllMessages(prev => ({
      ...prev,
      [chatKey]: [...(prev[chatKey] || []), newMessage]
    }));

    // Firestore real-time write
    if (activeServerId && activeChannelId) {
      try {
        await sendChannelMessage(activeServerId, activeChannelId, newMessage);
      } catch (e) {
        console.warn('Channel message local fallback:', e);
      }
    } else if (!activeServerId && activeDmId && currentDm) {
      try {
        await sendDirectMessage(activeDmId, newMessage, currentDm.recipient.id);
      } catch (e) {
        console.warn('DM message local fallback:', e);
      }
    }

    // Process Slash Commands
    processSlashCommand(content, chatKey);
  };

  const processSlashCommand = (userText: string, chatKey: string) => {
    const lower = userText.toLowerCase().trim();

    if (lower.startsWith('/help')) {
      setTimeout(() => {
        const sysMsg: Message = {
          id: `sys_${Date.now()}`,
          channelId: chatKey,
          authorId: SYSTEM_USER.id,
          author: SYSTEM_USER,
          isSystem: true,
          content: `📌 **Available Commands & Features:**
• \`/roll\` - Roll a random 1-100 die
• \`/flip\` - Flip a coin (Heads or Tails)
• \`/poll [question]\` - Create a community voting poll
• \`/shrug\` - Appends ¯\\_(ツ)_/¯
• \`/tableflip\` - Appends (╯°□°)╯︵ ┻━┻
• \`/clear\` - Clears recent messages in this channel
• \`||spoiler||\` - Hides sensitive text with spoiler blur
• \`\`\`ts code \`\`\` - Syntax highlighted code block`,
          timestamp: 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          reactions: []
        };
        playMessageSound();
        setAllMessages(prev => ({ ...prev, [chatKey]: [...(prev[chatKey] || []), sysMsg] }));
      }, 250);
      return;
    }

    if (lower.startsWith('/flip')) {
      setTimeout(() => {
        const isHeads = Math.random() > 0.5;
        const sysMsg: Message = {
          id: `sys_${Date.now()}`,
          channelId: chatKey,
          authorId: SYSTEM_USER.id,
          author: SYSTEM_USER,
          isSystem: true,
          content: `🪙 **Coin Flip:** The coin landed on **${isHeads ? 'HEADS' : 'TAILS'}**!`,
          timestamp: 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          reactions: [{ emoji: '🪙', count: 1, userIds: [currentUser.id] }]
        };
        playMessageSound();
        setAllMessages(prev => ({ ...prev, [chatKey]: [...(prev[chatKey] || []), sysMsg] }));
      }, 250);
      return;
    }

    if (lower.startsWith('/roll')) {
      setTimeout(() => {
        const roll = Math.floor(Math.random() * 100) + 1;
        const sysMsg: Message = {
          id: `sys_${Date.now()}`,
          channelId: chatKey,
          authorId: SYSTEM_USER.id,
          author: SYSTEM_USER,
          isSystem: true,
          content: `🎲 **Dice Roll:** ${currentUser.displayName} rolled a **${roll}** (1-100)!`,
          timestamp: 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          reactions: [{ emoji: '🎲', count: 1, userIds: [currentUser.id] }]
        };
        playMessageSound();
        setAllMessages(prev => ({ ...prev, [chatKey]: [...(prev[chatKey] || []), sysMsg] }));
      }, 250);
      return;
    }

    if (lower.startsWith('/poll')) {
      setTimeout(() => {
        const pollQuestion = userText.replace('/poll', '').trim() || 'Community Poll';
        const sysMsg: Message = {
          id: `sys_${Date.now()}`,
          channelId: chatKey,
          authorId: SYSTEM_USER.id,
          author: SYSTEM_USER,
          isSystem: true,
          content: `📊 **COMMUNITY POLL:** "${pollQuestion}"\nReact with 1️⃣ Yes, 2️⃣ No, or 3️⃣ Maybe!`,
          timestamp: 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          reactions: [
            { emoji: '1️⃣', count: 1, userIds: [currentUser.id] },
            { emoji: '2️⃣', count: 0, userIds: [] },
            { emoji: '3️⃣', count: 0, userIds: [] }
          ]
        };
        playMessageSound();
        setAllMessages(prev => ({ ...prev, [chatKey]: [...(prev[chatKey] || []), sysMsg] }));
      }, 250);
      return;
    }

    if (lower === '/clear') {
      setAllMessages(prev => ({ ...prev, [chatKey]: [] }));
      return;
    }
  };

  // Reactions handler
  const handleAddReaction = (messageId: string, emoji: string) => {
    const chatKey = activeServerId ? activeChannelId : activeDmId;
    if (!chatKey) return;

    setAllMessages(prev => {
      const msgs = prev[chatKey] || [];
      const updated = msgs.map(m => {
        if (m.id !== messageId) return m;

        const existingReaction = m.reactions.find(r => r.emoji === emoji);
        let newReactions: typeof m.reactions;

        if (existingReaction) {
          if (existingReaction.userIds.includes(currentUser.id)) {
            const newUserIds = existingReaction.userIds.filter(uid => uid !== currentUser.id);
            if (newUserIds.length === 0) {
              newReactions = m.reactions.filter(r => r.emoji !== emoji);
            } else {
              newReactions = m.reactions.map(r =>
                r.emoji === emoji ? { ...r, count: r.count - 1, userIds: newUserIds } : r
              );
            }
          } else {
            newReactions = m.reactions.map(r =>
              r.emoji === emoji ? { ...r, count: r.count + 1, userIds: [...r.userIds, currentUser.id] } : r
            );
          }
        } else {
          newReactions = [...m.reactions, { emoji, count: 1, userIds: [currentUser.id] }];
        }

        return { ...m, reactions: newReactions };
      });

      return { ...prev, [chatKey]: updated };
    });
  };

  // Delete message handler
  const handleDeleteMessage = (messageId: string) => {
    const chatKey = activeServerId ? activeChannelId : activeDmId;
    if (!chatKey) return;

    setAllMessages(prev => ({
      ...prev,
      [chatKey]: (prev[chatKey] || []).filter(m => m.id !== messageId)
    }));
  };

  // Pin message handler
  const handleTogglePinMessage = (messageId: string) => {
    const chatKey = activeServerId ? activeChannelId : activeDmId;
    if (!chatKey) return;

    setAllMessages(prev => ({
      ...prev,
      [chatKey]: (prev[chatKey] || []).map(m =>
        m.id === messageId ? { ...m, pinned: !m.pinned } : m
      )
    }));
  };

  // Friend addition
  const handleAddFriend = (username: string): boolean => {
    const raw = username.trim().replace(/^@/, '');
    if (!raw) return false;

    // Check if target user exists in registered users
    const matched = allRegisteredUsers.find(
      u =>
        u.username.toLowerCase() === raw.toLowerCase() ||
        `${u.username}#${u.discriminator}`.toLowerCase() === raw.toLowerCase()
    );

    const newFriend: User = matched || {
      id: `user_${Date.now()}`,
      username: raw.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'friend',
      displayName: raw.split('#')[0],
      discriminator: raw.split('#')[1] || Math.floor(1000 + Math.random() * 9000).toString(),
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(raw)}&backgroundColor=5865F2`,
      bannerColor: '#5865F2',
      status: 'online',
      customStatus: 'Available',
      badges: [],
      role: 'Friend',
      roleColor: '#57F287'
    };

    setFriends(prev => [...prev.filter(f => f.username !== newFriend.username), newFriend]);
    handleOpenDmWithUser(newFriend);
    return true;
  };

  // Open DM with user
  const handleOpenDmWithUser = async (user: User, initialMessage?: string) => {
    let threadId = `dm_${[currentUser.id, user.id].sort().join('_')}`;

    try {
      threadId = await createDirectMessageThread(currentUser, user);
    } catch (e) {
      console.warn('Using local DM thread fallback:', e);
    }

    if (!directMessages.find(d => d.id === threadId)) {
      setDirectMessages(prev => [
        ...prev,
        {
          id: threadId,
          recipient: user,
          unreadCount: 0,
          lastMessage: initialMessage || 'Direct message started',
          lastMessageTime: 'Just now'
        }
      ]);
    }

    setActiveServerId(null);
    setActiveDmId(threadId);
    setIsDiscoveryOpen(false);
    setIsViewingVoiceStage(false);

    if (initialMessage) {
      handleSendMessage(initialMessage);
    }
  };

  // Open Create Channel modal
  const handleOpenCreateChannelModal = (categoryId?: string) => {
    if (!currentServer) return;
    setCreateChannelDefaultCategoryId(categoryId || currentServer.categories[0]?.id);
    setIsCreateChannelOpen(true);
  };

  // Submit Create Channel
  const handleCreateChannel = async (
    name: string,
    type: 'text' | 'voice' | 'announcement',
    categoryId: string
  ) => {
    if (!currentServer) return;
    const newChan: Channel = {
      id: `c_${Date.now()}`,
      serverId: currentServer.id,
      categoryId,
      name,
      type,
      topic: `Discussion topic for #${name}`,
      voiceUsers: type === 'voice' ? [] : undefined
    };

    const updatedChannels = [...currentServer.channels, newChan];
    setServers(prev =>
      prev.map(s =>
        s.id === currentServer.id ? { ...s, channels: updatedChannels } : s
      )
    );
    setActiveChannelId(newChan.id);
    setIsViewingVoiceStage(type === 'voice');

    try {
      await updateFirestoreServerChannels(currentServer.id, updatedChannels);
    } catch (e) {
      console.warn('Channel updated locally:', e);
    }
  };

  // Submit Create Category
  const handleCreateCategory = async (name: string, isPrivate?: boolean) => {
    if (!currentServer) return;
    const newCatId = `cat_${Date.now()}`;
    const newCategory: ChannelCategory = {
      id: newCatId,
      name: name.trim().toUpperCase()
    };

    // Auto-create an initial general channel for the new category
    const initialChan: Channel = {
      id: `c_${Date.now()}`,
      serverId: currentServer.id,
      categoryId: newCatId,
      name: 'general',
      type: 'text',
      topic: `General discussions in category ${newCategory.name}`
    };

    const updatedCategories = [...currentServer.categories, newCategory];
    const updatedChannels = [...currentServer.channels, initialChan];

    setServers(prev =>
      prev.map(s =>
        s.id === currentServer.id
          ? { ...s, categories: updatedCategories, channels: updatedChannels }
          : s
      )
    );
    setActiveChannelId(initialChan.id);
    setIsViewingVoiceStage(false);

    try {
      await updateFirestoreServerCategories(currentServer.id, updatedCategories);
      await updateFirestoreServerChannels(currentServer.id, updatedChannels);
    } catch (e) {
      console.warn('Category updated locally:', e);
    }
  };

  // Join Server from discovery
  const handleJoinServerFromDiscovery = async (discovered: any) => {
    const newSrv: Server = {
      id: discovered.id,
      name: discovered.name,
      icon: discovered.icon,
      acronym: discovered.name.slice(0, 2).toUpperCase(),
      banner: discovered.banner,
      description: discovered.description,
      category: discovered.category,
      memberCount: (discovered.memberCount || 0) + 1,
      onlineCount: Math.floor((discovered.memberCount || 1) * 0.25),
      verified: discovered.verified,
      categories: [
        { id: `cat_${discovered.id}_1`, name: 'WELCOME' },
        { id: `cat_${discovered.id}_2`, name: 'GENERAL' },
        { id: `cat_${discovered.id}_3`, name: 'VOICE CHANNELS' }
      ],
      channels: [
        {
          id: `c_${discovered.id}_welcome`,
          serverId: discovered.id,
          categoryId: `cat_${discovered.id}_1`,
          name: 'welcome-and-rules',
          type: 'announcement',
          topic: `Welcome to ${discovered.name}!`
        },
        {
          id: `c_${discovered.id}_chat`,
          serverId: discovered.id,
          categoryId: `cat_${discovered.id}_2`,
          name: 'general-chat',
          type: 'text',
          topic: `Community chatter in ${discovered.name}`
        },
        {
          id: `c_${discovered.id}_voice`,
          serverId: discovered.id,
          categoryId: `cat_${discovered.id}_3`,
          name: 'Community Voice',
          type: 'voice',
          voiceUsers: []
        }
      ],
      members: [currentUser]
    };

    // Remove from leftServerIds if previously left
    const updatedLeft = leftServerIds.filter(id => id !== discovered.id);
    setLeftServerIds(updatedLeft);
    try {
      localStorage.setItem('discord_clone_left_servers_' + currentUser.id, JSON.stringify(updatedLeft));
      localStorage.setItem('discord_clone_left_servers', JSON.stringify(updatedLeft));
      await updateUserLeftServers(currentUser.id, updatedLeft);
      await joinFirestoreServer(discovered.id, currentUser, newSrv);
    } catch (e) {
      console.warn('Rejoin server Firestore sync:', e);
    }

    try {
      await createFirestoreServer(newSrv);
    } catch (e) {
      console.warn('Created server locally:', e);
    }

    setServers(prev => [...prev.filter(s => s.id !== newSrv.id), newSrv]);
    setActiveServerId(newSrv.id);
    setActiveChannelId(newSrv.channels[1]?.id || newSrv.channels[0]?.id || 'c_general');
    setIsDiscoveryOpen(false);
  };

  // Leave server
  const handleLeaveServer = async (serverId: string) => {
    // Save to leftServerIds state and persistent storage
    const updatedLeft = Array.from(new Set([...leftServerIds, serverId]));
    setLeftServerIds(updatedLeft);

    try {
      localStorage.setItem('discord_clone_left_servers_' + currentUser.id, JSON.stringify(updatedLeft));
      localStorage.setItem('discord_clone_left_servers', JSON.stringify(updatedLeft));
    } catch (e) { /* ignore */ }

    // Update in Firestore
    try {
      await leaveFirestoreServer(serverId, currentUser.id);
      await updateUserLeftServers(currentUser.id, updatedLeft);
    } catch (e) {
      console.warn('Leave server Firestore sync:', e);
    }

    // Immediately remove from servers list and save
    setServers(prev => {
      const remaining = prev.filter(s => s.id !== serverId);
      safeSetStorage('discord_clone_servers', remaining);
      return remaining;
    });

    // Navigate to friends home or remaining server
    if (activeServerId === serverId) {
      handleSelectServer(null);
    }
  };

  // Handle Server Boosting
  const handleBoostServer = async (serverId: string) => {
    const targetServer = servers.find(s => s.id === serverId) || currentServer;
    if (!targetServer) return;

    let newBoostCount = (targetServer.boostCount || 0) + 1;
    let newBoostLevel = newBoostCount >= 14 ? 3 : newBoostCount >= 7 ? 2 : newBoostCount >= 2 ? 1 : 0;

    try {
      const res = await boostFirestoreServer(serverId, currentUser.id);
      newBoostCount = res.boostCount;
      newBoostLevel = res.boostLevel;
    } catch (e) {
      console.warn('Boost Firestore update:', e);
    }

    // 1. Update server state locally
    const updatedServerList = servers.map(s => {
      if (s.id === serverId) {
        return {
          ...s,
          boostCount: newBoostCount,
          boostLevel: newBoostLevel,
          boosters: Array.from(new Set([...(s.boosters || []), currentUser.id]))
        };
      }
      return s;
    });
    setServers(updatedServerList);
    safeSetStorage('discord_clone_servers', updatedServerList);

    // 2. Grant current user 'Nitro Booster' badge and activate Nitro
    const updatedBadges = Array.from(new Set([...(currentUser.badges || []), 'Nitro Booster', 'Nitro Subscriber']));
    const updatedUser: User = {
      ...currentUser,
      isNitro: true,
      nitroTier: currentUser.nitroTier || 'nitro',
      badges: updatedBadges
    };
    setCurrentUser(updatedUser);
    syncUserProfile(updatedUser);

    // 3. Post a celebratory boost message in #general or active text channel
    const boostChannel = targetServer.channels.find(c => c.name.toLowerCase() === 'general' && c.type === 'text')
      || targetServer.channels.find(c => c.type === 'text')
      || targetServer.channels[0];

    if (boostChannel) {
      const boostMessage: Message = {
        id: `msg_${Date.now()}_boost`,
        channelId: boostChannel.id,
        authorId: currentUser.id,
        author: updatedUser,
        content: `🚀 **${currentUser.displayName}** just boosted the server! We reached **Level ${newBoostLevel}** with ${newBoostCount} total boosts! 🎉✨`,
        timestamp: 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: Date.now(),
        reactions: [{ emoji: '🚀', count: 1, userIds: [currentUser.id] }]
      };

      setAllMessages(prev => ({
        ...prev,
        [boostChannel.id]: [...(prev[boostChannel.id] || []), boostMessage]
      }));

      try {
        await sendChannelMessage(serverId, boostChannel.id, boostMessage);
      } catch (e) {
        console.warn('Channel boost message fallback:', e);
      }
    }
  };

  // Copy share invite link
  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Total unread DMs count
  const unreadCountHome = directMessages.reduce((acc, dm) => acc + (dm.unreadCount || 0), 0);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#1e1f22] text-[#dbdee1] font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Token Service API Requirement Banner */}
      {tokenApiErrorUrl && (
        <div className="bg-[#da373c] border-b border-[#a1282c] px-3.5 py-2 flex items-center justify-between text-xs text-white shrink-0 select-none shadow-md gap-3 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 animate-pulse" />
            <span className="font-bold text-amber-200 shrink-0">Setup Required:</span>
            <span className="truncate">
              Google Cloud <strong>Token Service API</strong> is not yet enabled for project <code>1043939381344</code>.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={tokenApiErrorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-[#da373c] font-black rounded hover:bg-amber-100 transition-colors shadow-xs"
            >
              <span>Enable API in Cloud Console</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={handleRetryToken}
              disabled={isRetryingToken}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-black/30 hover:bg-black/50 text-white font-semibold rounded transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isRetryingToken ? 'animate-spin' : ''}`} />
              <span>Retry</span>
            </button>
            <button
              onClick={async () => {
                await signOut(auth);
                setTokenApiErrorUrl(null);
                setIsLoggedIn(false);
              }}
              className="px-2 py-1 bg-black/20 hover:bg-black/40 text-[#f2f3f5] font-medium rounded transition-colors cursor-pointer"
            >
              Sign Out (Offline Mode)
            </button>
          </div>
        </div>
      )}

      {/* Real-time Multi-User Notification Banner */}
      <div className="h-9 bg-[#2b2d31] border-b border-[#1f2023] px-3 flex items-center justify-between text-xs text-[#b5bac1] shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${tokenApiErrorUrl ? 'bg-[#f0b232]' : 'bg-[#23a55a]'} animate-pulse`}></span>
          <span className="font-semibold text-white">
            {tokenApiErrorUrl ? 'Operating in Offline / Local Mode' : 'Live Multi-User Chat Active'}
          </span>
          <span className="text-[#949ba4] hidden md:inline">
            {tokenApiErrorUrl
              ? '· Enable Token Service API in Google Cloud for live cloud sync'
              : '· Cloud Firestore synchronized across browsers and accounts'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Download Code ZIP button */}
          <button
            onClick={handleDownloadCode}
            disabled={isDownloadingCode}
            title="Download complete, standard ZIP archive of project code (compatible with Windows & Mac)"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#5865F2] hover:bg-[#4752c4] active:scale-95 text-white font-semibold transition-all cursor-pointer shadow-xs text-xs disabled:opacity-60"
          >
            {downloadCodeDone ? (
              <Check className="w-3.5 h-3.5 text-[#57f287]" />
            ) : isDownloadingCode ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{downloadCodeDone ? 'ZIP Downloaded!' : isDownloadingCode ? 'Preparing...' : 'Download Code (.zip)'}</span>
          </button>

          <button
            onClick={handleCopyShareLink}
            title="Copy app link to invite a friend to chat"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#35373c] hover:bg-[#3f4147] text-white font-medium transition-colors cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-[#57f287]" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Invite / Share Link'}</span>
          </button>

          {isLoggedIn ? (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#5865F2]/20 hover:bg-[#5865F2]/30 text-[#5865F2] font-semibold transition-colors cursor-pointer border border-[#5865F2]/30"
            >
              <UsersIcon className="w-3.5 h-3.5" />
              <span>Signed In: {currentUser.displayName}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#5865F2] hover:bg-[#4752c4] text-white font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In with Google</span>
            </button>
          )}
        </div>
      </div>

      {/* Main 3-column Discord Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* 1. Left Icon Rail: Server list + Clyde + Add server + Discovery */}
        <ServerSidebar
          servers={servers}
          activeServerId={activeServerId}
          isDiscoveryOpen={isDiscoveryOpen}
          onSelectServer={handleSelectServer}
          onOpenAddServer={() => setIsAddServerOpen(true)}
          onOpenDiscovery={() => {
            setIsDiscoveryOpen(true);
            setActiveServerId(null);
          }}
          onOpenNitro={() => setIsNitroOpen(true)}
          unreadCountHome={unreadCountHome}
        />

        {/* 2. Second Column: Channels / DMs list + User Status bar */}
        <ChannelSidebar
          currentServer={currentServer}
          activeChannelId={activeChannelId}
          activeDmId={activeDmId}
          currentUser={currentUser}
          directMessages={directMessages}
          friendsCount={friends.length}
          activeVoiceChannelId={activeVoiceChannelId}
          isVoiceMuted={isVoiceMuted}
          isVoiceDeafened={isVoiceDeafened}
          onSelectChannel={handleSelectChannel}
          onSelectDm={(dmId) => {
            setActiveServerId(null);
            setActiveDmId(dmId);
            setIsDiscoveryOpen(false);
            setIsViewingVoiceStage(false);
          }}
          onSelectFriendsHome={() => {
            setActiveServerId(null);
            setActiveDmId(null);
            setIsDiscoveryOpen(false);
            setIsViewingVoiceStage(false);
          }}
          onJoinVoice={handleJoinVoice}
          onLeaveVoice={handleLeaveVoice}
          onToggleMute={handleToggleVoiceMute}
          onToggleDeafen={handleToggleVoiceDeafen}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenServerSettings={() => setIsServerSettingsOpen(true)}
          onOpenCreateChannel={handleOpenCreateChannelModal}
          onOpenCreateCategory={() => setIsCreateCategoryOpen(true)}
          onOpenQuickSwitcher={() => setIsQuickSwitcherOpen(true)}
          onOpenSoundboard={() => setIsSoundboardOpen(true)}
          onOpenNitro={() => setIsNitroOpen(true)}
          onInvitePeople={handleCopyShareLink}
          onLeaveServer={handleLeaveServer}
          isLoggedIn={isLoggedIn}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />

        {/* 3. Third Column: Main Center Area (Chat, Friends Home, Voice, or Discovery) */}
        {isDiscoveryOpen ? (
          <ServerDiscoveryModal
            onJoinServer={handleJoinServerFromDiscovery}
            onClose={() => handleSelectServer('server_dev')}
            joinedServerIds={servers.map(s => s.id)}
          />
        ) : activeServerId === null && activeDmId === null ? (
          /* Friends Home when in DMs root */
          <FriendsHome
            friends={friends}
            onOpenDmWithUser={handleOpenDmWithUser}
            onSelectMember={(u) => setSelectedProfileUser(u)}
            onAddFriend={handleAddFriend}
          />
        ) : isViewingVoiceStage && activeVoiceChannelId && currentChannel ? (
          /* Voice Stage Room */
          <VoiceStage
            channel={currentChannel}
            serverName={currentServer?.name || 'Voice Lounge'}
            currentUser={currentUser}
            connectedUsers={
              (currentChannel?.voiceUsers || []).includes(currentUser.id)
                ? [currentUser]
                : []
            }
            isMuted={isVoiceMuted}
            isDeafened={isVoiceDeafened}
            onDisconnect={handleLeaveVoice}
            onToggleMute={handleToggleVoiceMute}
            onToggleDeafen={handleToggleVoiceDeafen}
            onOpenSoundboard={() => setIsSoundboardOpen(true)}
          />
        ) : (
          /* Chat Area */
          <ChatArea
            channel={currentChannel}
            dmRecipient={currentDm?.recipient || null}
            serverName={currentServer?.name || 'Direct Messages'}
            serverEmojis={currentServer?.emojis}
            messages={currentChatMessages}
            currentUser={currentUser}
            isMemberListOpen={isMemberListOpen}
            typingUser={typingUser}
            onToggleMemberList={() => setIsMemberListOpen(!isMemberListOpen)}
            onSendMessage={handleSendMessage}
            onAddReaction={handleAddReaction}
            onDeleteMessage={handleDeleteMessage}
            onTogglePinMessage={handleTogglePinMessage}
            onSelectMember={(u) => setSelectedProfileUser(u)}
            onOpenNitro={() => setIsNitroOpen(true)}
          />
        )}

        {/* 4. Right Rail: Server Member List (Visible only inside servers and when toggled) */}
        {activeServerId !== null && isMemberListOpen && !isViewingVoiceStage && (
          <MemberList
            members={currentServer?.members || [currentUser]}
            onSelectMember={(u) => setSelectedProfileUser(u)}
          />
        )}
      </div>

      {/* MODALS */}
      {/* Google Auth & Multi-User Modal */}
      {isAuthModalOpen && (
        <AuthModal
          currentUser={currentUser}
          isLoggedIn={isLoggedIn}
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setIsLoggedIn(true);
            syncUserProfile(user);
          }}
          onLogoutSuccess={() => {
            setIsLoggedIn(false);
          }}
        />
      )}

      {/* User Profile Popover Modal with Error Boundary and null safety */}
      {selectedProfileUser && typeof selectedProfileUser === 'object' && Boolean(selectedProfileUser.id || selectedProfileUser.displayName || selectedProfileUser.username) && (
        <ErrorBoundary
          componentName="User Profile"
          onReset={() => setSelectedProfileUser(null)}
        >
          <UserProfileModal
            user={selectedProfileUser}
            onClose={() => setSelectedProfileUser(null)}
            onSendDirectMessage={(userId: string, initialMessage?: string) => {
              setSelectedProfileUser(null);
              const target = allRegisteredUsers.find(u => u.id === userId) || selectedProfileUser;
              if (target) handleOpenDmWithUser(target, initialMessage);
            }}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenNitro={() => {
              setSelectedProfileUser(null);
              setIsNitroOpen(true);
            }}
            onUpdateUser={(updated) => {
              const next = { ...currentUser, ...updated };
              setCurrentUser(next);
              setSelectedProfileUser(next);
              syncUserProfile(next);
            }}
            isSelf={selectedProfileUser.id === currentUser.id}
          />
        </ErrorBoundary>
      )}

      {/* User Settings Modal */}
      {isSettingsOpen && (
        <UserSettingsModal
          currentUser={currentUser}
          onUpdateUser={(updated) => {
            const next = { ...currentUser, ...updated };
            setCurrentUser(next);
            syncUserProfile(next);
          }}
          onClose={() => setIsSettingsOpen(false)}
          onOpenNitro={() => {
            setIsSettingsOpen(false);
            setIsNitroOpen(true);
          }}
        />
      )}

      {/* Server Settings Modal */}
      {isServerSettingsOpen && currentServer && (
        <ServerSettingsModal
          server={currentServer}
          currentUser={currentUser}
          onClose={() => setIsServerSettingsOpen(false)}
          onUpdateServer={(updatedSrv) => {
            setServers(prev => {
              const next = prev.map(s => (s.id === updatedSrv.id ? updatedSrv : s));
              try {
                localStorage.setItem('discord_clone_servers', JSON.stringify(next));
              } catch (e) { /* ignore */ }
              return next;
            });
            updateFirestoreServerDetails(updatedSrv.id, {
              name: updatedSrv.name,
              icon: updatedSrv.icon,
              acronym: updatedSrv.acronym,
              description: updatedSrv.description
            });
          }}
          onDeleteServer={(serverId) => {
            setServers(prev => prev.filter(s => s.id !== serverId));
            setIsServerSettingsOpen(false);
            handleSelectServer(null);
          }}
        />
      )}

      {/* Create / Add Server Modal */}
      {isAddServerOpen && (
        <CreateServerModal
          currentUser={currentUser}
          onClose={() => setIsAddServerOpen(false)}
          onCreateServer={async (newServer) => {
            const updatedLeft = leftServerIds.filter(id => id !== newServer.id);
            setLeftServerIds(updatedLeft);
            try {
              localStorage.setItem('discord_clone_left_servers_' + currentUser.id, JSON.stringify(updatedLeft));
              localStorage.setItem('discord_clone_left_servers', JSON.stringify(updatedLeft));
              await updateUserLeftServers(currentUser.id, updatedLeft);
            } catch (e) { /* ignore */ }

            try {
              await createFirestoreServer(newServer);
            } catch (e) {
              console.warn('Created server locally:', e);
            }
            setServers(prev => [...prev.filter(s => s.id !== newServer.id), newServer]);
            setActiveServerId(newServer.id);
            setActiveChannelId(newServer.channels[1]?.id || newServer.channels[0]?.id);
            setIsAddServerOpen(false);
          }}
        />
      )}

      {/* Quick Switcher (Ctrl+K) */}
      {isQuickSwitcherOpen && (
        <QuickSwitcher
          servers={servers}
          directMessages={directMessages}
          members={{ [currentUser.id]: currentUser, ...Object.fromEntries(allRegisteredUsers.map(u => [u.id, u])) }}
          onNavigate={(srvId: string | null, channelId?: string, dmId?: string) => {
            if (srvId) {
              setActiveServerId(srvId);
              if (channelId) setActiveChannelId(channelId);
            } else if (dmId) {
              setActiveServerId(null);
              setActiveDmId(dmId);
            }
            setIsViewingVoiceStage(false);
            setIsQuickSwitcherOpen(false);
          }}
          onClose={() => setIsQuickSwitcherOpen(false)}
        />
      )}

      {/* Nitro Perks Modal */}
      {isNitroOpen && (
        <NitroModal
          onClose={() => setIsNitroOpen(false)}
          isNitro={Boolean(currentUser.isNitro || currentUser.badges?.includes('Nitro Booster') || currentUser.badges?.includes('Nitro Subscriber'))}
          currentServer={currentServer}
          onBoostServer={handleBoostServer}
          onUpgradeNitro={(tier: 'basic' | 'nitro') => {
            const nextBadges = Array.from(new Set([...(currentUser.badges || []), 'Nitro Booster', 'Nitro Subscriber']));
            const nextUser: User = {
              ...currentUser,
              isNitro: true,
              nitroTier: tier,
              badges: nextBadges
            };
            setCurrentUser(nextUser);
            syncUserProfile(nextUser);
          }}
        />
      )}

      {/* Create Category Modal */}
      {isCreateCategoryOpen && (
        <CreateCategoryModal
          onClose={() => setIsCreateCategoryOpen(false)}
          onCreateCategory={handleCreateCategory}
        />
      )}

      {/* Create Channel Modal */}
      {isCreateChannelOpen && currentServer && (
        <CreateChannelModal
          categories={currentServer.categories}
          defaultCategoryId={createChannelDefaultCategoryId}
          onClose={() => setIsCreateChannelOpen(false)}
          onCreateChannel={handleCreateChannel}
        />
      )}

      {/* Floating Soundboard Modal */}
      {isSoundboardOpen && (
        <SoundboardModal
          onClose={() => setIsSoundboardOpen(false)}
          isNitro={Boolean(currentUser.isNitro || currentUser.badges?.includes('Nitro Booster') || currentUser.badges?.includes('Nitro Subscriber'))}
          onOpenNitro={() => {
            setIsSoundboardOpen(false);
            setIsNitroOpen(true);
          }}
          onSendSoundToChat={(soundName, icon) => {
            handleSendMessage(`🔊 **Played Soundboard Sound:** ${icon} *${soundName}*`);
          }}
        />
      )}
    </div>
  );
}
