export interface AvatarFrameOption {
  id: string;
  name: string;
  description: string;
  ringClass: string;
  borderClass: string;
  glowColor: string;
}

export const AVATAR_FRAMES: AvatarFrameOption[] = [
  {
    id: 'neon_pink',
    name: 'Neon Cyberpunk',
    description: 'Electric magenta ring with an intense hyper-glow',
    ringClass: 'ring-2 ring-[#eb459e] shadow-[0_0_12px_rgba(235,69,158,0.7)]',
    borderClass: 'border-2 border-[#eb459e]',
    glowColor: '#eb459e'
  },
  {
    id: 'cyber_fire',
    name: 'Inferno Flame',
    description: 'Blazing orange & amber aura of raw energy',
    ringClass: 'ring-2 ring-[#f26522] shadow-[0_0_12px_rgba(242,101,34,0.75)]',
    borderClass: 'border-2 border-[#f26522]',
    glowColor: '#f26522'
  },
  {
    id: 'galaxy',
    name: 'Cosmic Nebula',
    description: 'Deep celestial violet and stellar cyan shimmer',
    ringClass: 'ring-2 ring-[#8547c6] shadow-[0_0_12px_rgba(133,71,198,0.75)]',
    borderClass: 'border-2 border-[#8547c6]',
    glowColor: '#8547c6'
  },
  {
    id: 'golden',
    name: 'Sovereign 24K Gold',
    description: 'Royal polished gold ring with prestige shimmer',
    ringClass: 'ring-2 ring-[#ffd700] shadow-[0_0_14px_rgba(255,215,0,0.8)]',
    borderClass: 'border-2 border-[#ffd700]',
    glowColor: '#ffd700'
  },
  {
    id: 'emerald',
    name: 'Matrix Emerald',
    description: 'Bio-luminescent hacker green neon radiance',
    ringClass: 'ring-2 ring-[#57f287] shadow-[0_0_12px_rgba(87,242,135,0.7)]',
    borderClass: 'border-2 border-[#57f287]',
    glowColor: '#57f287'
  }
];

export function getAvatarFrameClass(frameId?: string): string {
  if (!frameId || frameId === 'none') return '';
  const frame = AVATAR_FRAMES.find(f => f.id === frameId);
  return frame ? frame.ringClass : '';
}

export function checkUserHasNitro(user?: { isNitro?: boolean; badges?: string[] } | null): boolean {
  if (!user) return false;
  return Boolean(
    user.isNitro ||
    user.badges?.includes('Nitro Subscriber') ||
    user.badges?.includes('Nitro Booster') ||
    user.badges?.includes('Nitro')
  );
}

export interface NitroBannerPreset {
  id: string;
  name: string;
  background: string;
  isAnimated?: boolean;
  category?: 'animated' | 'gradient';
  badgeLabel?: string;
}

export const NITRO_BANNER_PRESETS: NitroBannerPreset[] = [
  // Animated Nitro Presets
  {
    id: 'animated_borealis',
    name: 'Borealis Aurora',
    background: 'linear-gradient(125deg, #09203f 0%, #1e3c72 25%, #2a5298 50%, #00f2fe 75%, #4facfe 100%)',
    isAnimated: true,
    category: 'animated',
    badgeLabel: 'ANIMATED'
  },
  {
    id: 'animated_synthwave',
    name: 'Neon Synthwave',
    background: 'linear-gradient(135deg, #eb459e 0%, #7928ca 35%, #4338ca 70%, #00f0ff 100%)',
    isAnimated: true,
    category: 'animated',
    badgeLabel: 'ANIMATED'
  },
  {
    id: 'animated_solar_flare',
    name: 'Solar Plasma',
    background: 'linear-gradient(135deg, #ff0844 0%, #ffb199 35%, #f76b1c 70%, #fad961 100%)',
    isAnimated: true,
    category: 'animated',
    badgeLabel: 'ANIMATED'
  },
  {
    id: 'animated_celestial',
    name: 'Celestial Nebula',
    background: 'linear-gradient(135deg, #2e0854 0%, #8547c6 40%, #eb459e 75%, #5865f2 100%)',
    isAnimated: true,
    category: 'animated',
    badgeLabel: 'ANIMATED'
  },
  {
    id: 'animated_matrix',
    name: 'Cyberpunk Grid',
    background: 'linear-gradient(135deg, #051923 0%, #003554 30%, #006466 65%, #57f287 100%)',
    isAnimated: true,
    category: 'animated',
    badgeLabel: 'ANIMATED'
  },
  {
    id: 'animated_prism',
    name: 'Prismatic Hologram',
    background: 'linear-gradient(135deg, #eb459e 0%, #fee75c 25%, #57f287 50%, #5865f2 75%, #eb459e 100%)',
    isAnimated: true,
    category: 'animated',
    badgeLabel: 'ANIMATED'
  },
  // Static Gradient Presets
  {
    id: 'synthwave',
    name: 'Synthwave Sunset',
    background: 'linear-gradient(135deg, #eb459e 0%, #8547c6 50%, #5865f2 100%)',
    category: 'gradient'
  },
  {
    id: 'cyber_noir',
    name: 'Cyber Tokyo',
    background: 'linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)',
    category: 'gradient'
  },
  {
    id: 'deep_space',
    name: 'Deep Cosmos',
    background: 'linear-gradient(135deg, #2b1055 0%, #7597de 100%)',
    category: 'gradient'
  }
];

export function getResolvedUserBanner(user?: {
  customBanner?: string;
  bannerColor?: string;
  isNitro?: boolean;
  badges?: string[];
} | null): {
  background: string;
  isAnimated: boolean;
  hasNitro: boolean;
  className: string;
} {
  const hasNitro = checkUserHasNitro(user);
  const defaultBanner = '#5865F2';

  // If user does not have active Nitro, custom banners and custom colors are disabled (standard Discord blurple)
  if (!hasNitro) {
    return {
      background: defaultBanner,
      isAnimated: false,
      hasNitro: false,
      className: ''
    };
  }

  // Active Nitro user: check custom banner or custom color
  const banner = user?.customBanner || user?.bannerColor || defaultBanner;
  
  // Check if banner is one of our animated presets or contains gradient
  const matchedPreset = NITRO_BANNER_PRESETS.find(p => p.background === banner);
  const isAnimated = Boolean(matchedPreset?.isAnimated || banner.includes('linear-gradient'));

  return {
    background: banner,
    isAnimated,
    hasNitro: true,
    className: isAnimated ? 'nitro-banner-animated nitro-banner-shimmer' : ''
  };
}


export const NITRO_SUPER_EMOJIS = [
  { emoji: '🚀', name: 'Hyper Booster', label: 'nitro_booster' },
  { emoji: '💎', name: 'Shiny Diamond', label: 'nitro_diamond' },
  { emoji: '💖', name: 'Pulsing Heart', label: 'nitro_heart' },
  { emoji: '🔥', name: 'Eternal Fire', label: 'nitro_fire' },
  { emoji: '🌈', name: 'Prismatic Rainbow', label: 'nitro_rainbow' },
  { emoji: '🦄', name: 'Mythic Unicorn', label: 'nitro_unicorn' },
  { emoji: '👾', name: 'Retro Space Invader', label: 'nitro_invader' },
  { emoji: '⚡', name: 'Overcharged Bolt', label: 'nitro_bolt' },
  { emoji: '👑', name: 'Sovereign Crown', label: 'nitro_crown' },
  { emoji: '✨', name: 'Celestial Sparkles', label: 'nitro_sparkles' },
  { emoji: '🐱', name: 'Cosmic Nyan Cat', label: 'nitro_cat' },
  { emoji: '🦜', name: 'Cult Party Parrot', label: 'nitro_parrot' }
];

export function calculateServerBoostLevel(boostCount = 0): {
  level: number;
  nextLevelAt: number;
  progressPercent: number;
  perks: string[];
} {
  if (boostCount >= 14) {
    return {
      level: 3,
      nextLevelAt: 14,
      progressPercent: 100,
      perks: [
        '100MB Upload Limit for all members',
        '250 Custom Emoji Slots',
        '384Kbps Crystal Clear Audio Quality',
        'Custom Vanity Invite Link & Animated Banner'
      ]
    };
  }

  if (boostCount >= 7) {
    const progress = Math.min(100, Math.round(((boostCount - 7) / (14 - 7)) * 100));
    return {
      level: 2,
      nextLevelAt: 14,
      progressPercent: progress,
      perks: [
        '50MB Upload Limit for all members',
        '150 Custom Emoji Slots',
        '256Kbps Superior Audio',
        'Server Banner & 1080p 60fps Go Live'
      ]
    };
  }

  if (boostCount >= 2) {
    const progress = Math.min(100, Math.round(((boostCount - 2) / (7 - 2)) * 100));
    return {
      level: 1,
      nextLevelAt: 7,
      progressPercent: progress,
      perks: [
        '100 Custom Emoji Slots (+50)',
        '128Kbps Enhanced Audio Quality',
        'Animated Server Icon',
        '720p 60fps Stream Quality'
      ]
    };
  }

  const progress = Math.min(100, Math.round((boostCount / 2) * 100));
  return {
    level: 0,
    nextLevelAt: 2,
    progressPercent: progress,
    perks: [
      'Boost to Level 1 (2 boosts needed)',
      '+50 Custom Emoji Slots',
      'Enhanced Voice Bitrate',
      'Animated Server Icon'
    ]
  };
}
