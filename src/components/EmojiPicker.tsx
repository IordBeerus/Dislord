import React, { useState } from 'react';
import { Search, Smile, Heart, Coffee, Gamepad2, Lightbulb, Flag, Sparkles, Lock, Zap } from 'lucide-react';
import { ServerEmoji } from '../types/discord';
import { NITRO_SUPER_EMOJIS } from '../utils/nitroUtils';

interface EmojiPickerProps {
  serverEmojis?: ServerEmoji[];
  serverName?: string;
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
  isNitro?: boolean;
  onOpenNitro?: () => void;
}

const EMOJI_CATEGORIES = [
  {
    name: 'Discord Custom',
    emojis: ['🚀', '✨', '🔥', '🎉', '💯', '👾', '🤖', '⚡', '💎', '🌈', '👑', '🛡️', '⚔️', '🪄', '🍕', '🎮']
  },
  {
    name: 'Smileys & Emotion',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐']
  },
  {
    name: 'Gestures & People',
    emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪']
  },
  {
    name: 'Hearts & Vibes',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️']
  },
  {
    name: 'Activities & Gaming',
    emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏐', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂']
  }
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  serverEmojis,
  serverName,
  onSelectEmoji,
  onClose,
  isNitro = false,
  onOpenNitro
}) => {
  const [search, setSearch] = useState('');

  const filteredCategories = EMOJI_CATEGORIES.map(cat => ({
    ...cat,
    emojis: cat.emojis.filter(e => !search || e.includes(search))
  })).filter(cat => cat.emojis.length > 0);

  const filteredServerEmojis = (serverEmojis || []).filter(e =>
    !search || e.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredNitroEmojis = NITRO_SUPER_EMOJIS.filter(e =>
    !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.emoji.includes(search)
  );

  return (
    <div className="w-80 max-h-96 bg-[#2b2d31] rounded-lg shadow-2xl border border-[#1f2023] flex flex-col overflow-hidden text-[#dbdee1] discord-pop z-50">
      {/* Header Search */}
      <div className="p-2.5 border-b border-[#1f2023] bg-[#232428]">
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Search emoji..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="w-full bg-[#1e1f22] text-xs text-[#dbdee1] placeholder-[#80848e] rounded px-3 py-1.5 pl-8 focus:outline-none focus:ring-1 focus:ring-[#5865f2]"
          />
          <Search className="w-3.5 h-3.5 text-[#80848e] absolute left-2.5" />
        </div>
      </div>

      {/* Emoji List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Nitro Exclusive Super Emojis */}
        {filteredNitroEmojis.length > 0 && (
          <div className="space-y-1.5 pb-2 border-b border-[#1f2023]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black tracking-wider text-[#eb459e] uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Nitro Super Emojis</span>
              </span>
              {!isNitro && onOpenNitro && (
                <button
                  onClick={onOpenNitro}
                  className="text-[10px] text-[#eb459e] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                >
                  <Lock className="w-2.5 h-2.5" /> Unlock
                </button>
              )}
            </div>

            <div className="grid grid-cols-6 gap-1">
              {filteredNitroEmojis.map((e, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (isNitro) {
                      onSelectEmoji(e.emoji);
                      onClose();
                    } else if (onOpenNitro) {
                      onOpenNitro();
                    }
                  }}
                  title={isNitro ? e.name : `${e.name} (Requires Nitro)`}
                  className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center text-xl transition-all relative group cursor-pointer ${
                    isNitro
                      ? 'hover:bg-[#eb459e]/20 hover:scale-125'
                      : 'opacity-60 hover:opacity-100 hover:bg-[#35373c]'
                  }`}
                >
                  <span>{e.emoji}</span>
                  {!isNitro && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#eb459e] text-white rounded-full flex items-center justify-center text-[8px] font-bold shadow-xs">
                      ⚡
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Server Emojis if any */}
        {filteredServerEmojis.length > 0 && (
          <div className="space-y-1.5 pb-2 border-b border-[#1f2023]">
            <div className="text-[11px] font-bold tracking-wider text-[#5865f2] uppercase">
              {serverName ? `${serverName} Emojis` : 'Server Custom Emojis'}
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {filteredServerEmojis.map((e) => (
                <button
                  key={e.id}
                  onClick={() => {
                    onSelectEmoji(`:${e.name}: `);
                    onClose();
                  }}
                  title={`:${e.name}:`}
                  className="w-10 h-10 p-1.5 rounded-lg hover:bg-[#35373c] flex flex-col items-center justify-center hover:scale-110 transition-transform group cursor-pointer"
                >
                  <img src={e.url} alt={e.name} className="w-6 h-6 object-contain" />
                </button>
              ))}
            </div>
          </div>
        )}

        {filteredCategories.map((cat) => (
          <div key={cat.name} className="space-y-1.5">
            <div className="text-[11px] font-bold tracking-wider text-[#949ba4] uppercase">
              {cat.name}
            </div>
            <div className="grid grid-cols-8 gap-1">
              {cat.emojis.map((emoji, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSelectEmoji(emoji);
                    onClose();
                  }}
                  className="w-8 h-8 rounded hover:bg-[#35373c] flex items-center justify-center text-lg hover:scale-125 transition-transform cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}

        {filteredCategories.length === 0 && filteredNitroEmojis.length === 0 && (
          <div className="text-center py-8 text-xs text-[#949ba4]">
            No emojis found
          </div>
        )}
      </div>

      {/* Footer bar */}
      <div className="h-9 px-3 bg-[#232428] border-t border-[#1f2023] flex items-center justify-between text-xs text-[#949ba4]">
        <span>{isNitro ? '✨ Nitro Emojis Unlocked' : 'Click an emoji to send'}</span>
        <button onClick={onClose} className="hover:text-white cursor-pointer">Esc</button>
      </div>
    </div>
  );
};
