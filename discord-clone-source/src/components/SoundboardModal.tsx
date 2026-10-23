import React from 'react';
import { Volume2, X, Sparkles, Lock, Zap } from 'lucide-react';
import { playSoundboard } from '../utils/audio';

interface SoundboardModalProps {
  onClose: () => void;
  onSendSoundToChat?: (soundName: string, icon: string) => void;
  isNitro?: boolean;
  onOpenNitro?: () => void;
}

const SOUNDS = [
  { id: 'airhorn', name: 'Airhorn', icon: '📢', color: 'from-[#5865F2] to-[#4752C4]' },
  { id: 'quack', name: 'Quack', icon: '🦆', color: 'from-[#FEE75C] to-[#E5C938]' },
  { id: 'badumtss', name: 'Ba-Dum-Tss', icon: '🥁', color: 'from-[#EB459E] to-[#C93B85]' },
  { id: 'tada', name: 'Tada Fanfare', icon: '🎺', color: 'from-[#57F287] to-[#3BA55D]' },
  { id: 'golfclap', name: 'Golf Clap', icon: '👏', color: 'from-[#ED4245] to-[#C03537]' },
  { id: 'cricket', name: 'Cricket Chirp', icon: '🦗', color: 'from-[#9B59B6] to-[#8E44AD]' },
  { id: 'wow', name: 'Anime Wow', icon: '✨', color: 'from-[#3498DB] to-[#2980B9]' }
];

const NITRO_SOUNDS = [
  { id: 'vineboom', name: 'Vine Boom', icon: '💥', color: 'from-[#eb459e] to-[#ff73fa]' },
  { id: 'laser', name: 'Laser Blaster', icon: '🔫', color: 'from-[#ff4500] to-[#eb459e]' },
  { id: 'levelup', name: 'Level Up', icon: '🆙', color: 'from-[#57f287] to-[#5865f2]' },
  { id: 'bassdrop', name: 'Bass Drop', icon: '🎛️', color: 'from-[#8547c6] to-[#5865f2]' }
];

export const SoundboardModal: React.FC<SoundboardModalProps> = ({
  onClose,
  onSendSoundToChat,
  isNitro = false,
  onOpenNitro
}) => {
  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-lg bg-[#313338] rounded-2xl shadow-2xl border border-[#232428] overflow-hidden text-[#dbdee1] discord-pop max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-[#2b2d31] flex items-center justify-between border-b border-[#232428] shrink-0">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-[#5865f2]" />
            <h2 className="font-bold text-white text-base">Discord Soundboard</h2>
          </div>
          <button onClick={onClose} className="text-[#949ba4] hover:text-white p-1 rounded-md cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sound buttons scrollable grid */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Nitro VIP Sounds Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black tracking-wider text-[#eb459e] uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nitro VIP Soundboard Tracks</span>
              </span>
              {!isNitro && onOpenNitro && (
                <button
                  onClick={onOpenNitro}
                  className="text-[11px] text-[#eb459e] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                >
                  <Lock className="w-3 h-3" /> Unlock with Nitro
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {NITRO_SOUNDS.map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => {
                    if (isNitro) {
                      playSoundboard(sound.id);
                      if (onSendSoundToChat) onSendSoundToChat(sound.name, sound.icon);
                    } else if (onOpenNitro) {
                      onOpenNitro();
                    }
                  }}
                  className={`relative group flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${sound.color} text-white shadow-md transition-all cursor-pointer ${
                    isNitro
                      ? 'hover:scale-[1.03] active:scale-95'
                      : 'opacity-70 hover:opacity-100 ring-1 ring-white/20'
                  }`}
                >
                  <span className="text-2xl group-hover:scale-125 transition-transform">{sound.icon}</span>
                  <div className="text-left flex-1 min-w-0">
                    <div className="font-bold text-sm leading-tight truncate">{sound.name}</div>
                    <div className="text-[10px] opacity-90 flex items-center gap-1">
                      {isNitro ? (
                        <>
                          <Sparkles className="w-3 h-3" />
                          <span>VIP Sound</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3" />
                          <span>Requires Nitro</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Standard Sounds Section */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-[#949ba4]">
              Community Sounds
            </div>

            <div className="grid grid-cols-2 gap-3">
              {SOUNDS.map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => {
                    playSoundboard(sound.id);
                    if (onSendSoundToChat) onSendSoundToChat(sound.name, sound.icon);
                  }}
                  className={`relative group flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${sound.color} text-white shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer`}
                >
                  <span className="text-2xl group-hover:scale-125 transition-transform">{sound.icon}</span>
                  <div className="text-left flex-1 min-w-0">
                    <div className="font-semibold text-sm leading-tight truncate">{sound.name}</div>
                    <div className="text-[10px] opacity-80 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Play sound</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#2b2d31] border-t border-[#232428] flex items-center justify-between shrink-0">
          <span className="text-xs text-[#949ba4]">
            {isNitro ? '✨ All Nitro VIP sounds active' : 'Click any sound to play in chat'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
