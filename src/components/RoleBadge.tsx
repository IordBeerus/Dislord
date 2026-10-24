import React from 'react';
import { Check } from 'lucide-react';

interface RoleBadgeProps {
  role?: string;
  roleColor?: string;
  size?: 'sm' | 'md';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, roleColor, size = 'sm' }) => {
  if (!role) return null;
  const lower = role.toLowerCase().trim();

  const isSmall = size === 'sm';
  const textClass = isSmall ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

  if (lower === 'owner') {
    return (
      <span className={`inline-flex items-center gap-1 rounded font-bold bg-[#FEE75C]/15 border border-[#FEE75C]/40 text-[#FEE75C] shadow-xs select-none ${textClass}`}>
        <span className="text-[11px]">👑</span>
        <span>Owner</span>
      </span>
    );
  }

  if (lower === 'admin') {
    return (
      <span className={`inline-flex items-center gap-1 rounded font-bold bg-[#EB459E]/15 border border-[#EB459E]/40 text-[#EB459E] shadow-xs select-none ${textClass}`}>
        <span>🛡️</span>
        <span>Admin</span>
      </span>
    );
  }

  if (lower === 'moderator' || lower === 'mod') {
    return (
      <span className={`inline-flex items-center gap-1 rounded font-bold bg-[#57F287]/15 border border-[#57F287]/40 text-[#57F287] shadow-xs select-none ${textClass}`}>
        <span>🔨</span>
        <span>Mod</span>
      </span>
    );
  }

  if (lower === 'bot') {
    return (
      <span className={`inline-flex items-center gap-0.5 rounded font-bold bg-[#5865F2] text-white shadow-xs select-none ${textClass}`}>
        <Check className="w-2.5 h-2.5" />
        <span>BOT</span>
      </span>
    );
  }

  if (lower === 'creator') {
    return (
      <span className={`inline-flex items-center gap-1 rounded font-bold bg-[#3498DB]/15 border border-[#3498DB]/40 text-[#3498DB] shadow-xs select-none ${textClass}`}>
        <span>✨</span>
        <span>Creator</span>
      </span>
    );
  }

  if (lower === 'dj') {
    return (
      <span className={`inline-flex items-center gap-1 rounded font-bold bg-[#9B59B6]/15 border border-[#9B59B6]/40 text-[#9B59B6] shadow-xs select-none ${textClass}`}>
        <span>🎵</span>
        <span>DJ</span>
      </span>
    );
  }

  if (lower === 'member' || lower === '@everyone') {
    return (
      <span className={`inline-flex items-center rounded font-semibold bg-[#949BA4]/15 border border-[#949BA4]/30 text-[#949BA4] select-none ${textClass}`}>
        Member
      </span>
    );
  }

  // Any other role with custom color
  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-bold select-none border ${textClass}`}
      style={{
        backgroundColor: `${roleColor || '#5865F2'}20`,
        borderColor: `${roleColor || '#5865F2'}50`,
        color: roleColor || '#5865F2'
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: roleColor || '#5865F2' }} />
      <span>{role}</span>
    </span>
  );
};
