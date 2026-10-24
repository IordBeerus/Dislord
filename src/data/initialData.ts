import { Server, User, DirectMessage, Message } from '../types/discord';

export const CURRENT_USER: User = {
  id: 'user_me',
  username: 'alex_codes',
  displayName: 'Alex',
  discriminator: '1337',
  avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=alex_codes&backgroundColor=5865F2',
  bannerColor: '#5865F2',
  status: 'online',
  customStatus: 'Building something cool 🚀',
  aboutMe: 'Software developer, nocturnal coffee enjoyer, TypeScript lover.',
  badges: ['Active Developer', 'HypeSquad Bravery', 'Nitro Booster'],
  role: 'Owner',
  roleColor: '#FEE75C',
  activity: {
    type: 'Playing',
    name: 'Visual Studio Code',
    details: 'editing src/App.tsx'
  }
};

// Initial member dictionary is empty - no simulated accounts
export const INITIAL_MEMBERS: Record<string, User> = {};

export const INITIAL_SERVERS: Server[] = [
  {
    id: 'server_dev',
    name: 'Dev Sanctuary',
    icon: 'https://api.dicebear.com/7.x/identicon/svg?seed=DevSanctuary&backgroundColor=5865F2',
    acronym: 'DS',
    banner: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80',
    description: 'The premier community for frontend, backend, and software architects.',
    category: 'Technology',
    memberCount: 1,
    onlineCount: 1,
    verified: true,
    categories: [
      { id: 'cat_welcome', name: 'INFORMATION' },
      { id: 'cat_text', name: 'TEXT CHANNELS' },
      { id: 'cat_voice', name: 'VOICE CHANNELS' }
    ],
    channels: [
      {
        id: 'c_rules',
        serverId: 'server_dev',
        categoryId: 'cat_welcome',
        name: 'rules-and-info',
        type: 'announcement',
        topic: 'Community guidelines, FAQ, and server updates.'
      },
      {
        id: 'c_general',
        serverId: 'server_dev',
        categoryId: 'cat_text',
        name: 'general',
        type: 'text',
        topic: 'General conversation, dev discussions, and everyday thoughts.'
      },
      {
        id: 'c_react',
        serverId: 'server_dev',
        categoryId: 'cat_text',
        name: 'react-typescript',
        type: 'text',
        topic: 'React, TypeScript, state management, and modern component design.'
      },
      {
        id: 'c_showcase',
        serverId: 'server_dev',
        categoryId: 'cat_text',
        name: 'project-showcase',
        type: 'text',
        topic: 'Share what you have built and gather feedback from peers!'
      },
      {
        id: 'c_resources',
        serverId: 'server_dev',
        categoryId: 'cat_text',
        name: 'resources-and-links',
        type: 'text',
        topic: 'Helpful documentation, design assets, and developer tools.'
      },
      {
        id: 'c_voice_lounge',
        serverId: 'server_dev',
        categoryId: 'cat_voice',
        name: 'Voice Lounge',
        type: 'voice',
        voiceUsers: []
      },
      {
        id: 'c_pair_prog',
        serverId: 'server_dev',
        categoryId: 'cat_voice',
        name: 'Pair Programming',
        type: 'voice',
        voiceUsers: []
      }
    ],
    members: [CURRENT_USER],
    roles: [
      {
        id: 'r_owner',
        name: 'Owner',
        color: '#FEE75C',
        hoist: true,
        mentionable: true,
        permissions: ['ADMINISTRATOR', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'KICK_MEMBERS', 'BAN_MEMBERS', 'SEND_MESSAGES', 'ATTACH_FILES', 'CONNECT', 'SPEAK']
      },
      {
        id: 'r_admin',
        name: 'Admin',
        color: '#EB459E',
        hoist: true,
        mentionable: true,
        permissions: ['MANAGE_CHANNELS', 'MANAGE_ROLES', 'KICK_MEMBERS', 'SEND_MESSAGES', 'ATTACH_FILES', 'CONNECT', 'SPEAK']
      },
      {
        id: 'r_mod',
        name: 'Moderator',
        color: '#57F287',
        hoist: true,
        mentionable: true,
        permissions: ['KICK_MEMBERS', 'SEND_MESSAGES', 'ATTACH_FILES', 'CONNECT', 'SPEAK']
      },
      {
        id: 'r_creator',
        name: 'Creator',
        color: '#3498DB',
        hoist: true,
        mentionable: false,
        permissions: ['SEND_MESSAGES', 'ATTACH_FILES', 'CONNECT', 'SPEAK']
      },
      {
        id: 'r_everyone',
        name: '@everyone',
        color: '#949BA4',
        hoist: false,
        mentionable: false,
        permissions: ['SEND_MESSAGES', 'CONNECT', 'SPEAK']
      }
    ],
    emojis: [
      { id: 'em_1', name: 'fire_nitro', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=80&auto=format&fit=crop&q=80', uploadedBy: 'Alex' },
      { id: 'em_2', name: 'cat_jam', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=80&auto=format&fit=crop&q=80', uploadedBy: 'Alex' },
      { id: 'em_3', name: 'blob_dance', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=80&auto=format&fit=crop&q=80', uploadedBy: 'Alex' },
      { id: 'em_4', name: 'gaming_star', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=80&auto=format&fit=crop&q=80', uploadedBy: 'Alex' }
    ],
    invites: [
      { code: 'discord.gg/devsanctuary', channelName: '#general', inviter: 'Alex', uses: 1, maxUses: 0, expiresIn: 'Never' }
    ],
    auditLog: [
      { id: 'al_1', user: 'Alex', action: 'Created server', target: 'Dev Sanctuary', timestamp: 'Today' }
    ],
    systemChannelId: 'c_general',
    afkTimeout: 300,
    defaultNotifications: 'mentions'
  },
  {
    id: 'server_gaming',
    name: 'The Gaming Guild',
    icon: 'https://api.dicebear.com/7.x/identicon/svg?seed=GamingGuild&backgroundColor=EB459E',
    acronym: 'GG',
    description: 'Competitive ranked stacks, clip sharing, and late night raids.',
    category: 'Gaming',
    memberCount: 1,
    onlineCount: 1,
    categories: [
      { id: 'cat_gg_text', name: 'COMMUNITY' },
      { id: 'cat_gg_voice', name: 'SQUAD VOICE' }
    ],
    channels: [
      {
        id: 'c_gg_general',
        serverId: 'server_gaming',
        categoryId: 'cat_gg_text',
        name: 'general-gaming',
        type: 'text',
        topic: 'Talk about games, patch notes, esports, and setups.'
      },
      {
        id: 'c_gg_clips',
        serverId: 'server_gaming',
        categoryId: 'cat_gg_text',
        name: 'clips-and-highlights',
        type: 'text',
        topic: 'Insane clutch moments and funny fails.'
      },
      {
        id: 'c_gg_squad1',
        serverId: 'server_gaming',
        categoryId: 'cat_gg_voice',
        name: 'Squad 1 (Ranked)',
        type: 'voice',
        voiceUsers: []
      },
      {
        id: 'c_gg_chill',
        serverId: 'server_gaming',
        categoryId: 'cat_gg_voice',
        name: 'Chill & Spectate',
        type: 'voice',
        voiceUsers: []
      }
    ],
    members: [CURRENT_USER]
  },
  {
    id: 'server_lofi',
    name: 'Lofi Cafe & Chill',
    icon: 'https://api.dicebear.com/7.x/identicon/svg?seed=LofiCafe&backgroundColor=57F287',
    acronym: 'LC',
    description: 'Relaxed beats, study timers, and wholesome conversation.',
    category: 'Music',
    memberCount: 1,
    onlineCount: 1,
    verified: true,
    categories: [
      { id: 'cat_lofi_text', name: 'CAFE CHAT' },
      { id: 'cat_lofi_voice', name: 'STUDY ROOMS' }
    ],
    channels: [
      {
        id: 'c_lofi_lounge',
        serverId: 'server_lofi',
        categoryId: 'cat_lofi_text',
        name: 'cafe-lounge',
        type: 'text',
        topic: 'Grab a warm drink and unwind with us.'
      },
      {
        id: 'c_lofi_study',
        serverId: 'server_lofi',
        categoryId: 'cat_lofi_voice',
        name: 'Study Room (Muted)',
        type: 'voice',
        voiceUsers: []
      }
    ],
    members: [CURRENT_USER]
  },
  {
    id: 'server_anime',
    name: 'Anime Haven',
    icon: 'https://api.dicebear.com/7.x/identicon/svg?seed=AnimeHaven&backgroundColor=FEE75C',
    acronym: 'AH',
    description: 'Seasonal anime recommendations, manga discussions, and fan art.',
    category: 'Entertainment',
    memberCount: 1,
    onlineCount: 1,
    categories: [
      { id: 'cat_anime_text', name: 'CHANNELS' }
    ],
    channels: [
      {
        id: 'c_anime_discussion',
        serverId: 'server_anime',
        categoryId: 'cat_anime_text',
        name: 'seasonal-discussion',
        type: 'text',
        topic: 'Discuss ongoing anime seasons! Use ||spoilers|| for key plot points.'
      }
    ],
    members: [CURRENT_USER]
  }
];

export const INITIAL_MESSAGES: Record<string, Message[]> = {
  c_general: [
    {
      id: 'm_welcome',
      channelId: 'c_general',
      authorId: CURRENT_USER.id,
      author: CURRENT_USER,
      content: 'Welcome to Dev Sanctuary! ✨ Feel free to chat, upload files, or create channels.',
      timestamp: 'Today at 12:00 PM',
      reactions: []
    }
  ],
  c_react: [],
  c_showcase: [],
  c_resources: []
};

// No simulated DMs
export const INITIAL_DMS: DirectMessage[] = [];

export const DISCOVERABLE_SERVERS = [
  {
    id: 'disc_1',
    name: 'Creative Designers & Illustrators',
    icon: 'https://api.dicebear.com/7.x/identicon/svg?seed=CreativeDesigners&backgroundColor=5865F2',
    banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    description: 'The community for digital artists, UI/UX prototyping, 3D modeling, and motion graphics.',
    memberCount: 489200,
    category: 'Technology',
    verified: true
  },
  {
    id: 'disc_2',
    name: 'Rust & Systems Programming',
    icon: 'https://api.dicebear.com/7.x/identicon/svg?seed=RustLang&backgroundColor=ED4245',
    banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    description: 'Blazingly fast memory safety without garbage collection. Async, Tokio, embedded systems.',
    memberCount: 92400,
    category: 'Technology',
    verified: true
  },
  {
    id: 'disc_3',
    name: 'Valorant Champions Tour',
    icon: 'https://api.dicebear.com/7.x/identicon/svg?seed=Valorant&backgroundColor=EB459E',
    banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    description: 'Find teammates, discuss live VCT tournaments, strat roulettes, and rank up together.',
    memberCount: 312000,
    category: 'Gaming',
    verified: true
  },
  {
    id: 'disc_4',
    name: 'Synthwave & Cyberpunk Cafe',
    icon: 'https://api.dicebear.com/7.x/identicon/svg?seed=Synthwave&backgroundColor=5865F2',
    banner: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop&q=80',
    description: 'Neon retrospectives, analog synthesizer production, 80s aesthetics and retro gaming.',
    memberCount: 65100,
    category: 'Music',
    verified: false
  },
  {
    id: 'disc_5',
    name: 'Anime & Manga Society',
    icon: 'https://api.dicebear.com/7.x/identicon/svg?seed=AnimeSociety&backgroundColor=FEE75C',
    banner: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    description: 'Weekly episode watch parties, manga chapters breakdowns, cosplay showcases and conventions.',
    memberCount: 145000,
    category: 'Entertainment',
    verified: true
  },
  {
    id: 'disc_6',
    name: 'Indie Game Creators',
    icon: 'https://api.dicebear.com/7.x/identicon/svg?seed=IndieDev&backgroundColor=57F287',
    banner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
    description: 'Godot, Unity, Unreal devs sharing devlogs, playtesting prototypes, and marketing indie games.',
    memberCount: 54000,
    category: 'Gaming',
    verified: true
  }
];
