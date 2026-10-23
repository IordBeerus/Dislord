export type UserStatus = 'online' | 'idle' | 'dnd' | 'offline';

export interface User {
  id: string;
  username: string;
  displayName: string;
  discriminator: string;
  avatar: string;
  bannerColor: string;
  status: UserStatus;
  customStatus?: string;
  aboutMe?: string;
  badges?: string[];
  role?: string;
  roleColor?: string;
  email?: string;
  activity?: {
    type: 'Playing' | 'Listening to' | 'Streaming' | 'Watching';
    name: string;
    details?: string;
  };
  leftServerIds?: string[];
  isNitro?: boolean;
  nitroTier?: 'basic' | 'nitro';
  avatarFrame?: string;
  customBanner?: string;
  nitroBoostsRemaining?: number;
  isMuted?: boolean;
  isDeafened?: boolean;
}

export interface Reaction {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface Attachment {
  id: string;
  url: string;
  name: string;
  type: 'image' | 'video' | 'pdf' | 'file';
  size: string;
  isSpoiler?: boolean;
  isOversized?: boolean;
}

export interface MessageEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: string;
  image?: string;
  provider?: string;
}

export interface Message {
  id: string;
  channelId: string;
  authorId: string;
  author: User;
  content: string;
  timestamp: string;
  reactions: Reaction[];
  attachments?: Attachment[];
  replyTo?: {
    id: string;
    authorName: string;
    content: string;
  };
  pinned?: boolean;
  isSystem?: boolean;
  embed?: MessageEmbed;
  createdAt?: number | string;
}

export interface Channel {
  id: string;
  serverId: string;
  categoryId: string;
  name: string;
  type: 'text' | 'voice' | 'announcement';
  topic?: string;
  unreadCount?: number;
  isNsfw?: boolean;
  voiceUsers?: string[]; // IDs of users currently in this voice channel
}

export interface ChannelCategory {
  id: string;
  name: string;
  collapsed?: boolean;
}

export interface Role {
  id: string;
  name: string;
  color: string;
  hoist: boolean;
  mentionable: boolean;
  permissions: string[];
}

export interface ServerEmoji {
  id: string;
  name: string;
  url: string;
  uploadedBy: string;
}

export interface ServerInvite {
  code: string;
  channelName: string;
  inviter: string;
  uses: number;
  maxUses: number;
  expiresIn: string;
}

export interface AuditLogEntry {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
}

export interface Server {
  id: string;
  name: string;
  icon: string;
  acronym: string;
  banner?: string;
  description: string;
  category: string;
  memberCount: number;
  onlineCount: number;
  verified?: boolean;
  channels: Channel[];
  categories: ChannelCategory[];
  members: User[];
  roles?: Role[];
  emojis?: ServerEmoji[];
  invites?: ServerInvite[];
  auditLog?: AuditLogEntry[];
  afkChannelId?: string;
  afkTimeout?: number;
  systemChannelId?: string;
  defaultNotifications?: 'all' | 'mentions';
  boostCount?: number;
  boostLevel?: number;
  boosters?: string[];
}

export interface DirectMessage {
  id: string;
  recipient: User;
  unreadCount: number;
  lastMessage?: string;
  lastMessageTime?: string;
}
