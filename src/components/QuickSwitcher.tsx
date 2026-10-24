import React, { useState, useEffect } from 'react';
import { Search, Hash, Volume2, Users, Compass, ChevronRight } from 'lucide-react';
import { Server, Channel, User, DirectMessage } from '../types/discord';

interface QuickSwitcherProps {
  servers: Server[];
  directMessages: DirectMessage[];
  members: Record<string, User>;
  onClose: () => void;
  onNavigate: (serverId: string | null, channelId?: string, dmId?: string) => void;
}

export const QuickSwitcher: React.FC<QuickSwitcherProps> = ({
  servers,
  directMessages,
  members,
  onClose,
  onNavigate
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Generate searchable list
  const items: Array<{
    id: string;
    type: 'channel' | 'server' | 'user' | 'dm';
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    action: () => void;
  }> = [];

  // Add channels
  servers.forEach(srv => {
    srv.channels.forEach(ch => {
      items.push({
        id: `ch_${ch.id}`,
        type: 'channel',
        title: ch.name,
        subtitle: srv.name,
        icon: ch.type === 'voice' ? <Volume2 className="w-4 h-4 text-[#23a55a]" /> : <Hash className="w-4 h-4 text-[#949ba4]" />,
        action: () => {
          onNavigate(srv.id, ch.id);
          onClose();
        }
      });
    });
  });

  // Add servers
  servers.forEach(srv => {
    items.push({
      id: `srv_${srv.id}`,
      type: 'server',
      title: srv.name,
      subtitle: `${srv.memberCount.toLocaleString()} members`,
      icon: <Compass className="w-4 h-4 text-[#5865f2]" />,
      action: () => {
        onNavigate(srv.id, srv.channels[0]?.id);
        onClose();
      }
    });
  });

  // Add DMs & friends
  directMessages.forEach(dm => {
    items.push({
      id: `dm_${dm.id}`,
      type: 'dm',
      title: dm.recipient.displayName,
      subtitle: `@${dm.recipient.username}`,
      icon: (
        <img
          src={dm.recipient.avatar}
          alt={dm.recipient.displayName}
          className="w-4 h-4 rounded-full"
        />
      ),
      action: () => {
        onNavigate(null, undefined, dm.id);
        onClose();
      }
    });
  });

  const filtered = items.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.subtitle.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filtered, selectedIndex, onClose]);

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-start justify-center pt-28 p-4 z-50">
      <div className="w-full max-w-lg bg-[#2b2d31] rounded-2xl shadow-2xl border border-[#1f2023] overflow-hidden text-[#dbdee1] discord-pop">
        {/* Input */}
        <div className="p-4 bg-[#1e1f22] border-b border-[#232428] flex items-center gap-3">
          <Search className="w-5 h-5 text-[#949ba4]" />
          <input
            type="text"
            placeholder="Where would you like to go? (Ctrl+K)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            autoFocus
            className="w-full bg-transparent text-sm text-[#dbdee1] placeholder-[#80848e] focus:outline-none"
          />
          <kbd className="text-[10px] bg-[#2b2d31] text-[#949ba4] px-1.5 py-0.5 rounded border border-[#35373c]">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="p-2 max-h-80 overflow-y-auto space-y-1">
          {filtered.length > 0 ? (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                    isSelected ? 'bg-[#5865f2] text-white' : 'text-[#dbdee1] hover:bg-[#35373c]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="shrink-0">{item.icon}</div>
                    <span className="font-semibold truncate">{item.title}</span>
                    <span
                      className={`text-xs truncate ${
                        isSelected ? 'text-white/80' : 'text-[#949ba4]'
                      }`}
                    >
                      {item.subtitle}
                    </span>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 ${isSelected ? 'opacity-100' : 'opacity-0'}`}
                  />
                </button>
              );
            })
          ) : (
            <div className="text-center py-8 text-xs text-[#949ba4]">
              Can't seem to find anything matching "{query}"
            </div>
          )}
        </div>

        {/* Helper footer */}
        <div className="px-4 py-2 bg-[#232428] border-t border-[#1f2023] flex items-center justify-between text-[11px] text-[#949ba4]">
          <span>Tip: Use ↑ ↓ arrows to navigate and Enter to jump</span>
          <div className="flex items-center gap-2">
            <span>Jump to channel</span>
          </div>
        </div>
      </div>
    </div>
  );
};
