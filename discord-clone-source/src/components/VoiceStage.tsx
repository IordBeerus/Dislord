import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Headphones,
  PhoneOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Music,
  Maximize2,
  Minimize2,
  Radio,
  Sparkles,
  Volume2
} from 'lucide-react';
import { Channel, User } from '../types/discord';
import { playLeaveVoiceSound, playMuteSound, playUnmuteSound, playDeafenSound, playUndeafenSound } from '../utils/audio';

interface VoiceStageProps {
  channel: Channel;
  serverName: string;
  currentUser: User;
  connectedUsers: User[];
  isMuted: boolean;
  isDeafened: boolean;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onDisconnect: () => void;
  onOpenSoundboard: () => void;
}

export const VoiceStage: React.FC<VoiceStageProps> = ({
  channel,
  serverName,
  currentUser,
  connectedUsers,
  isMuted,
  isDeafened,
  onToggleMute,
  onToggleDeafen,
  onDisconnect,
  onOpenSoundboard
}) => {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [speakingUsers, setSpeakingUsers] = useState<Record<string, boolean>>({});

  // Speaking state for connected users
  useEffect(() => {
    const active: Record<string, boolean> = {};
    if (!isMuted) {
      active[currentUser.id] = true;
    }
    setSpeakingUsers(active);
  }, [currentUser.id, isMuted]);

  return (
    <div className="flex-1 h-full bg-[#111214] flex flex-col justify-between p-4 relative overflow-hidden select-none">
      {/* Top Info Bar */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-[#23a55a] animate-pulse" />
          <h2 className="text-white font-bold text-base flex items-center gap-2">
            <span>{channel.name}</span>
            <span className="text-xs text-[#949ba4] font-normal">/ {serverName}</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 bg-[#2b2d31]/80 backdrop-blur-md px-3 py-1 rounded-full text-xs text-[#23a55a] font-semibold border border-[#35373c]">
          <span className="w-2 h-2 rounded-full bg-[#23a55a] animate-ping" />
          <span>RTC Connected (14ms)</span>
        </div>
      </div>

      {/* Main Grid or Screen Share Area */}
      <div className="flex-1 flex items-center justify-center py-4 min-h-0">
        {isScreenSharing ? (
          /* Screen Share View */
          <div className="w-full h-full max-w-5xl rounded-2xl overflow-hidden border border-[#5865f2] relative bg-[#1e1f22] flex flex-col shadow-2xl">
            <div className="h-9 px-4 bg-[#2b2d31] flex items-center justify-between border-b border-[#1f2023]">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <span className="bg-[#f23f43] text-white text-[10px] uppercase font-black px-1.5 py-0.5 rounded">
                  LIVE
                </span>
                <span>{currentUser.displayName}'s Screen (1080p 60FPS)</span>
              </div>
              <button
                onClick={() => setIsScreenSharing(false)}
                className="text-xs text-[#949ba4] hover:text-white"
              >
                Stop Streaming
              </button>
            </div>

            {/* Screen Simulation Content */}
            <div className="flex-1 bg-[#1e1f22] p-6 flex flex-col justify-center items-center text-center space-y-4">
              <div className="w-24 h-24 rounded-2xl bg-[#5865f2]/20 border border-[#5865f2] flex items-center justify-center text-[#5865f2] shadow-inner">
                <Monitor className="w-12 h-12 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Streaming Desktop Screen</h3>
                <p className="text-xs text-[#949ba4] max-w-sm mt-1">
                  You are broadcasting your screen in crystal clear 60 FPS Nitro quality. Participants can hear crisp stereo audio.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Participant Tiles Grid */
          <div className="w-full h-full max-w-5xl grid grid-cols-2 sm:grid-cols-3 gap-4 items-center justify-center">
            {connectedUsers.map((user) => {
              const isSpeaking = speakingUsers[user.id];
              const isSelf = user.id === currentUser.id;
              const userMuted = isSelf ? isMuted : false;
              const userDeafened = isSelf ? isDeafened : false;

              return (
                <div
                  key={user.id}
                  className={`relative aspect-video rounded-2xl bg-[#2b2d31] flex flex-col items-center justify-center transition-all overflow-hidden shadow-lg border-2 ${
                    isSpeaking ? 'border-[#23a55a] shadow-[0_0_15px_rgba(35,165,90,0.4)]' : 'border-[#1f2023]'
                  }`}
                >
                  {/* Video simulation if self and video is on */}
                  {isSelf && isVideoOn ? (
                    <div className="w-full h-full bg-gradient-to-tr from-[#313338] via-[#2b2d31] to-[#383a40] flex flex-col items-center justify-center relative">
                      <div className="w-20 h-20 rounded-full border-4 border-[#23a55a] overflow-hidden">
                        <img
                          src={user.avatar}
                          alt={user.displayName}
                          className="w-full h-full object-cover scale-110"
                        />
                      </div>
                      <span className="absolute top-2 right-2 text-[10px] font-bold bg-black/60 text-[#23a55a] px-2 py-0.5 rounded-full">
                        HD CAM
                      </span>
                    </div>
                  ) : (
                    /* Avatar tile */
                    <div className="relative">
                      <img
                        src={user.avatar}
                        alt={user.displayName}
                        className={`w-20 h-20 rounded-full object-cover shadow-md transition-transform ${
                          isSpeaking ? 'scale-105' : 'scale-100'
                        }`}
                      />
                      {isSpeaking && (
                        <div className="absolute inset-0 rounded-full border-2 border-[#23a55a] animate-ping opacity-60" />
                      )}
                    </div>
                  )}

                  {/* Name tag and mic indicator */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-xs font-semibold text-white">
                    <span className="truncate">{user.displayName} {isSelf && '(You)'}</span>
                    <div className="flex items-center gap-1">
                      {userMuted ? (
                        <MicOff className="w-3.5 h-3.5 text-[#f23f43]" />
                      ) : isSpeaking ? (
                        <Mic className="w-3.5 h-3.5 text-[#23a55a]" />
                      ) : null}
                      {userDeafened && (
                        <div className="relative inline-flex items-center justify-center">
                          <Headphones className="w-3.5 h-3.5 text-[#f23f43]" />
                          <span className="absolute w-4 h-[1.5px] bg-[#f23f43] rotate-45 rounded-full pointer-events-none" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Floating Control Dock */}
      <div className="flex items-center justify-center pb-2 z-10">
        <div className="bg-[#2b2d31]/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-[#35373c] flex items-center gap-4 shadow-2xl">
          {/* Video Toggle */}
          <button
            onClick={() => setIsVideoOn(!isVideoOn)}
            title={isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}
            className={`p-3 rounded-xl transition-all ${
              isVideoOn
                ? 'bg-white text-black'
                : 'bg-[#313338] text-white hover:bg-[#383a40]'
            }`}
          >
            {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Screen Share Toggle */}
          <button
            onClick={() => setIsScreenSharing(!isScreenSharing)}
            title={isScreenSharing ? 'Stop Sharing' : 'Share Your Screen'}
            className={`p-3 rounded-xl transition-all ${
              isScreenSharing
                ? 'bg-[#23a55a] text-white'
                : 'bg-[#313338] text-white hover:bg-[#383a40]'
            }`}
          >
            {isScreenSharing ? <Monitor className="w-5 h-5" /> : <MonitorOff className="w-5 h-5" />}
          </button>

          {/* Mute Toggle */}
          <button
            onClick={() => {
              if (isMuted) playUnmuteSound();
              else playMuteSound();
              onToggleMute();
            }}
            title={isMuted ? 'Unmute' : 'Mute'}
            className={`p-3 rounded-xl transition-all ${
              isMuted
                ? 'bg-[#f23f43] text-white'
                : 'bg-[#313338] text-white hover:bg-[#383a40]'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Deafen Toggle */}
          <button
            onClick={() => {
              if (isDeafened) playUndeafenSound();
              else playDeafenSound();
              onToggleDeafen();
            }}
            title={isDeafened ? 'Undeafen' : 'Deafen'}
            className={`p-3 rounded-xl transition-all relative ${
              isDeafened
                ? 'bg-[#f23f43] text-white'
                : 'bg-[#313338] text-white hover:bg-[#383a40]'
            }`}
          >
            <div className="relative inline-flex items-center justify-center">
              <Headphones className="w-5 h-5" />
              {isDeafened && (
                <span className="absolute w-6 h-[2.5px] bg-white rotate-45 rounded-full pointer-events-none" />
              )}
            </div>
          </button>

          {/* Soundboard Launcher */}
          <button
            onClick={onOpenSoundboard}
            title="Open Soundboard"
            className="p-3 rounded-xl bg-[#313338] text-white hover:bg-[#5865f2] transition-all"
          >
            <Music className="w-5 h-5" />
          </button>

          {/* Disconnect Phone Button */}
          <button
            onClick={() => {
              playLeaveVoiceSound();
              onDisconnect();
            }}
            title="Disconnect"
            className="p-3 rounded-xl bg-[#da373c] hover:bg-[#ba2e33] text-white transition-all shadow-md ml-2"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
