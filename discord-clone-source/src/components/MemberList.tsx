import React from 'react';
import { User } from '../types/discord';
import { RoleBadge } from './RoleBadge';
import { NitroBadge } from './NitroBadge';
import { getAvatarFrameClass, checkUserHasNitro } from '../utils/nitroUtils';

interface MemberListProps {
  members: User[];
  onSelectMember: (user: User) => void;
}

export const MemberList: React.FC<MemberListProps> = ({ members, onSelectMember }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-[#23a55a]';
      case 'idle': return 'bg-[#f0b232]';
      case 'dnd': return 'bg-[#f23f43]';
      default: return 'bg-[#80848e]';
    }
  };

  // Group members by online vs offline, and by role
  const onlineMembers = members.filter(m => m.status !== 'offline');
  const offlineMembers = members.filter(m => m.status === 'offline');

  // Group online by role
  const rolesOrder = ['Owner', 'Admin', 'Moderator', 'Creator', 'DJ', 'Member'];
  const groupedOnline: Record<string, User[]> = {};

  onlineMembers.forEach(m => {
    const role = m.role || 'Member';
    if (!groupedOnline[role]) groupedOnline[role] = [];
    groupedOnline[role].push(m);
  });

  return (
    <aside className="w-60 h-full bg-[#2b2d31] flex flex-col shrink-0 select-none border-l border-[#1f2023]/40 overflow-y-auto px-2 py-4 space-y-4">
      {rolesOrder.map(role => {
        const roleUsers = groupedOnline[role];
        if (!roleUsers || roleUsers.length === 0) return null;

        return (
          <div key={role} className="space-y-1">
            <div className="px-2 text-[11px] font-bold uppercase tracking-wider text-[#949ba4]">
              {role.toUpperCase()} — {roleUsers.length}
            </div>
            <div className="space-y-[1px]">
              {roleUsers.map(user => {
                const hasNitro = checkUserHasNitro(user);
                const isBooster = Boolean(user.badges?.includes('Nitro Booster'));
                return (
                  <button
                    key={user.id}
                    onClick={() => onSelectMember(user)}
                    className="w-full flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-[#35373c] text-left transition-colors group cursor-pointer"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={user.avatar}
                        alt={user.displayName}
                        className={`w-8 h-8 rounded-full object-cover ${getAvatarFrameClass(user.avatarFrame)}`}
                      />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#2b2d31] ${getStatusColor(
                          user.status
                        )}`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className="text-[14px] font-medium truncate"
                          style={{ color: user.roleColor || '#dbdee1' }}
                        >
                          {user.displayName}
                        </span>
                        {hasNitro && (
                          <NitroBadge
                            size="xs"
                            isBooster={isBooster}
                            className="inline-flex"
                          />
                        )}
                        <RoleBadge role={user.role} roleColor={user.roleColor} size="sm" />
                      </div>
                      {user.activity ? (
                        <div className="text-[11px] text-[#949ba4] truncate">
                          {user.activity.type} {user.activity.name}
                        </div>
                      ) : user.customStatus ? (
                        <div className="text-[11px] text-[#949ba4] truncate">
                          {user.customStatus}
                        </div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Offline Group */}
      {offlineMembers.length > 0 && (
        <div className="space-y-1">
          <div className="px-2 text-[11px] font-bold uppercase tracking-wider text-[#949ba4]">
            OFFLINE — {offlineMembers.length}
          </div>
          <div className="space-y-[1px] opacity-60 hover:opacity-100 transition-opacity">
            {offlineMembers.map(user => {
              const hasNitro = checkUserHasNitro(user);
              const isBooster = Boolean(user.badges?.includes('Nitro Booster'));
              return (
                <button
                  key={user.id}
                  onClick={() => onSelectMember(user)}
                  className="w-full flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-[#35373c] text-left transition-colors cursor-pointer"
                >
                  <div className="relative shrink-0">
                    <img
                      src={user.avatar}
                      alt={user.displayName}
                      className={`w-8 h-8 rounded-full object-cover grayscale ${getAvatarFrameClass(user.avatarFrame)}`}
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#2b2d31] bg-[#80848e]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[14px] font-medium truncate text-[#949ba4]">
                        {user.displayName}
                      </span>
                      {hasNitro && (
                        <NitroBadge
                          size="xs"
                          isBooster={isBooster}
                          className="inline-flex"
                        />
                      )}
                      <RoleBadge role={user.role} roleColor={user.roleColor} size="sm" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
};
