import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Check,
  Zap,
  Rocket,
  Shield,
  Crown,
  Smile,
  Volume2,
  Tv,
  Layers,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Server } from '../types/discord';
import { calculateServerBoostLevel } from '../utils/nitroUtils';
import { playNitroSound, playBoostSound } from '../utils/audio';

interface NitroModalProps {
  onClose: () => void;
  onUpgradeNitro: (tier: 'basic' | 'nitro') => void;
  onBoostServer?: (serverId: string) => void;
  isNitro: boolean;
  currentServer?: Server | null;
}

export const NitroModal: React.FC<NitroModalProps> = ({
  onClose,
  onUpgradeNitro,
  onBoostServer,
  isNitro,
  currentServer
}) => {
  const [selectedTier, setSelectedTier] = useState<'basic' | 'nitro'>('nitro');
  const [activeTab, setActiveTab] = useState<'perks' | 'boost'>('perks');
  const [boostSuccess, setBoostSuccess] = useState(false);

  const boostStats = calculateServerBoostLevel(currentServer?.boostCount || 0);

  const handleSubscribe = (tier: 'basic' | 'nitro') => {
    playNitroSound();
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.55 },
      colors: ['#eb459e', '#5865f2', '#fee75c', '#57f287']
    });
    onUpgradeNitro(tier);
  };

  const handleBoost = () => {
    if (!currentServer || !onBoostServer) return;
    playBoostSound();
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#eb459e', '#ff73fa', '#ffffff', '#5865f2']
    });
    setBoostSuccess(true);
    onBoostServer(currentServer.id);
    setTimeout(() => setBoostSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl bg-[#313338] rounded-2xl shadow-2xl border border-[#232428] overflow-hidden text-[#dbdee1] discord-pop relative flex flex-col max-h-[90vh]">
        {/* Banner with gradient & shimmer */}
        <div className="h-40 bg-gradient-to-r from-[#4f545c] via-[#8547c6] to-[#eb459e] p-6 relative flex flex-col justify-end shrink-0 select-none">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg">
              <Sparkles className="w-8 h-8 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-white tracking-tight">
                  DISCORD NITRO
                </h2>
                {isNitro ? (
                  <span className="text-xs font-bold uppercase tracking-wider bg-[#57f287] text-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <Check className="w-3 h-3 stroke-[3]" /> Active
                  </span>
                ) : (
                  <span className="text-xs font-bold uppercase tracking-wider bg-white text-[#eb459e] px-2 py-0.5 rounded-full">
                    Special Demo Access
                  </span>
                )}
              </div>
              <p className="text-white/80 text-xs mt-0.5">
                {isNitro
                  ? 'All Nitro perks, custom animated frames, super emojis & soundboard unlocked!'
                  : 'Unleash avatar frames, custom gradient banners, super emojis, and 2 Free Server Boosts.'}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-4 border-b border-[#232428] flex items-center gap-4 bg-[#2b2d31]">
          <button
            onClick={() => setActiveTab('perks')}
            className={`pb-3 text-xs font-bold tracking-wide transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'perks'
                ? 'border-[#eb459e] text-white'
                : 'border-transparent text-[#949ba4] hover:text-[#dbdee1]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nitro Perks & Plans</span>
          </button>
          <button
            onClick={() => setActiveTab('boost')}
            className={`pb-3 text-xs font-bold tracking-wide transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'boost'
                ? 'border-[#eb459e] text-white'
                : 'border-transparent text-[#949ba4] hover:text-[#dbdee1]'
            }`}
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>Server Boosting {currentServer ? `(${currentServer.name})` : ''}</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {activeTab === 'perks' ? (
            <>
              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-[#2b2d31] rounded-xl border border-[#232428] text-center space-y-1">
                  <div className="w-8 h-8 mx-auto rounded-lg bg-[#eb459e]/20 text-[#eb459e] flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-white text-xs">Avatar Frames</div>
                  <div className="text-[11px] text-[#949ba4]">5 animated glow frames</div>
                </div>
                <div className="p-3 bg-[#2b2d31] rounded-xl border border-[#232428] text-center space-y-1">
                  <div className="w-8 h-8 mx-auto rounded-lg bg-[#5865f2]/20 text-[#5865f2] flex items-center justify-center">
                    <Smile className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-white text-xs">Super Emojis</div>
                  <div className="text-[11px] text-[#949ba4]">12 exclusive animated emojis</div>
                </div>
                <div className="p-3 bg-[#2b2d31] rounded-xl border border-[#232428] text-center space-y-1">
                  <div className="w-8 h-8 mx-auto rounded-lg bg-[#57f287]/20 text-[#57f287] flex items-center justify-center">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-white text-xs">VIP Soundboard</div>
                  <div className="text-[11px] text-[#949ba4]">Laser, vine boom, level up</div>
                </div>
              </div>

              {/* Nitro Plans */}
              <div className="grid grid-cols-2 gap-4">
                {/* Nitro Basic */}
                <div
                  onClick={() => setSelectedTier('basic')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all space-y-3 relative ${
                    selectedTier === 'basic'
                      ? 'bg-[#2b2d31] border-[#5865f2] ring-1 ring-[#5865f2]'
                      : 'bg-[#2b2d31]/60 border-[#35373c] hover:border-[#4e5058]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-base">Nitro Basic</span>
                    <span className="text-xs text-[#949ba4] font-semibold">$2.99/mo</span>
                  </div>
                  <ul className="space-y-2 text-xs text-[#dbdee1]">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#23a55a] shrink-0" />
                      <span>Custom emojis & Super Emojis everywhere</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#23a55a] shrink-0" />
                      <span>50MB file uploads</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#23a55a] shrink-0" />
                      <span>Nitro Badge displayed on profile</span>
                    </li>
                  </ul>
                </div>

                {/* Nitro Full */}
                <div
                  onClick={() => setSelectedTier('nitro')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all space-y-3 relative overflow-hidden ${
                    selectedTier === 'nitro'
                      ? 'bg-gradient-to-b from-[#eb459e]/15 to-[#2b2d31] border-[#eb459e] ring-1 ring-[#eb459e]'
                      : 'bg-[#2b2d31]/60 border-[#35373c] hover:border-[#4e5058]'
                  }`}
                >
                  <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold uppercase bg-gradient-to-r from-[#eb459e] to-[#8547c6] text-white px-2 py-0.5 rounded-full shadow">
                    <Crown className="w-3 h-3" /> Full Perks
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-base">Nitro</span>
                    <span className="text-xs text-[#949ba4] font-semibold">$9.99/mo</span>
                  </div>
                  <ul className="space-y-2 text-xs text-[#dbdee1]">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#23a55a] shrink-0" />
                      <span><strong>Animated Avatar Frames</strong> & glowing aura</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#23a55a] shrink-0" />
                      <span><strong>Custom Profile Banners & Themes</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#23a55a] shrink-0" />
                      <span><strong>2 Free Server Boosts</strong> (+30% extra)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#23a55a] shrink-0" />
                      <span>All VIP Soundboard tracks unlocked</span>
                    </li>
                  </ul>
                </div>
              </div>
            </>
          ) : (
            /* Server Boost Tab */
            <div className="space-y-5">
              {currentServer ? (
                <>
                  <div className="p-4 bg-[#2b2d31] rounded-xl border border-[#232428] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={currentServer.icon}
                          alt={currentServer.name}
                          className="w-10 h-10 rounded-xl object-cover"
                        />
                        <div>
                          <div className="font-bold text-white text-sm">{currentServer.name}</div>
                          <div className="text-xs text-[#949ba4] flex items-center gap-1">
                            <Rocket className="w-3.5 h-3.5 text-[#eb459e]" />
                            <span>{currentServer.boostCount || 0} Total Boosts</span>
                          </div>
                        </div>
                      </div>

                      <div className="px-3 py-1 bg-gradient-to-r from-[#eb459e] to-[#5865f2] rounded-full text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md">
                        <Rocket className="w-3.5 h-3.5" />
                        <span>Level {boostStats.level}</span>
                      </div>
                    </div>

                    {/* Progress Bar to next level */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#949ba4]">
                          {boostStats.level === 3
                            ? 'Server is at maximum Boost Level 3! 🎉'
                            : `${currentServer.boostCount || 0} / ${boostStats.nextLevelAt} boosts for Level ${boostStats.level + 1}`}
                        </span>
                        <span className="font-bold text-white">{boostStats.progressPercent}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-[#1e1f22] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#5865f2] via-[#8547c6] to-[#eb459e] transition-all duration-500 rounded-full"
                          style={{ width: `${boostStats.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Unlocked Perks list */}
                  <div className="p-4 bg-[#232428] rounded-xl border border-[#1f2023] space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#949ba4]">
                      Level {boostStats.level} Server Perks:
                    </div>
                    <ul className="grid grid-cols-2 gap-2 text-xs text-[#dbdee1]">
                      {boostStats.perks.map((perk, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-[#57f287] shrink-0" />
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {boostSuccess && (
                    <div className="p-3 bg-[#57f287]/20 border border-[#57f287] rounded-xl text-center text-xs font-bold text-[#57f287] animate-bounce">
                      🚀 Server boosted successfully! Level updated and celebration shared.
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-[#949ba4] text-xs">
                  Please select a server first to apply a Server Boost!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-[#2b2d31] border-t border-[#232428] flex items-center justify-between shrink-0">
          <div className="text-xs text-[#949ba4]">
            {isNitro ? '✨ Active subscription: perks are live!' : 'Instant activation for your account'}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#dbdee1] hover:underline cursor-pointer"
            >
              Close
            </button>

            {activeTab === 'perks' ? (
              <button
                onClick={() => handleSubscribe(selectedTier)}
                className="px-5 py-2.5 bg-gradient-to-r from-[#eb459e] to-[#5865f2] hover:opacity-90 text-white text-xs font-bold rounded-lg shadow-lg flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>{isNitro ? 'Update / Re-activate Nitro' : 'Activate Nitro (Instant)'}</span>
              </button>
            ) : (
              <button
                onClick={handleBoost}
                disabled={!currentServer}
                className="px-5 py-2.5 bg-gradient-to-r from-[#eb459e] to-[#ff73fa] hover:opacity-90 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-lg flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer"
              >
                <Rocket className="w-4 h-4" />
                <span>Boost {currentServer?.name || 'Server'} (+1)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
