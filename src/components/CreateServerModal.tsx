import React, { useState, useRef } from 'react';
import { X, ChevronRight, Upload, Sparkles, Gamepad2, GraduationCap, Users2, Palette } from 'lucide-react';
import { User, Server } from '../types/discord';
import confetti from 'canvas-confetti';

interface CreateServerModalProps {
  currentUser: User;
  onClose: () => void;
  onCreateServer: (newServer: Server) => void;
}

export const CreateServerModal: React.FC<CreateServerModalProps> = ({
  currentUser,
  onClose,
  onCreateServer
}) => {
  const [step, setStep] = useState<'template' | 'details'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState('My Own');
  const [serverName, setServerName] = useState(`${currentUser.displayName}'s server`);
  const [serverIcon, setServerIcon] = useState<string>('');
  const iconFileInputRef = useRef<HTMLInputElement>(null);

  const templates = [
    { title: 'Create My Own', icon: Sparkles, desc: 'For an open community or a private room with pals.' },
    { title: 'Gaming', icon: Gamepad2, desc: 'For gaming squads, clip sharing, and late night ranked.' },
    { title: 'School Club', icon: GraduationCap, desc: 'For study sessions, homework help, and classroom buddies.' },
    { title: 'Friends', icon: Users2, desc: 'For hanging out, streaming movies, and sending memes.' },
    { title: 'Artists & Creators', icon: Palette, desc: 'For portfolios, design feedback, and creative works.' }
  ];

  const handleSelectTemplate = (templateTitle: string) => {
    setSelectedTemplate(templateTitle);
    setServerName(`${currentUser.displayName}'s ${templateTitle === 'Create My Own' ? 'Server' : templateTitle}`);
    setStep('details');
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('Image size exceeds 8MB. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setServerIcon(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRandomizeIcon = () => {
    const styles = ['identicon', 'bottts', 'shapes', 'adventurer', 'personas'];
    const chosenStyle = styles[Math.floor(Math.random() * styles.length)];
    const bgColors = ['5865F2', 'EB459E', '23A55A', 'F0B232', '2B1055', '57F287'];
    const chosenBg = bgColors[Math.floor(Math.random() * bgColors.length)];
    const seed = Math.random().toString(36).substring(2, 9);
    setServerIcon(`https://api.dicebear.com/7.x/${chosenStyle}/svg?seed=${seed}&backgroundColor=${chosenBg}`);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverName.trim()) return;

    const serverId = `server_${Date.now()}`;
    const acronym = serverName
      .split(' ')
      .map(w => w[0])
      .join('')
      .slice(0, 3)
      .toUpperCase();

    const finalIcon =
      serverIcon ||
      `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(serverName)}&backgroundColor=5865F2`;

    const newServer: Server = {
      id: serverId,
      name: serverName.trim(),
      icon: finalIcon,
      acronym: acronym || 'SRV',
      description: `Welcome to ${serverName.trim()}! Hang out, talk in voice, and share media.`,
      category: selectedTemplate === 'Gaming' ? 'Gaming' : 'Community',
      memberCount: 1,
      onlineCount: 1,
      categories: [
        { id: `cat_${serverId}_text`, name: 'TEXT CHANNELS' },
        { id: `cat_${serverId}_voice`, name: 'VOICE CHANNELS' }
      ],
      channels: [
        {
          id: `c_${serverId}_general`,
          serverId: serverId,
          categoryId: `cat_${serverId}_text`,
          name: 'general',
          type: 'text',
          topic: 'General discussion for everyone.'
        },
        {
          id: `c_${serverId}_clips`,
          serverId: serverId,
          categoryId: `cat_${serverId}_text`,
          name: 'media-share',
          type: 'text',
          topic: 'Drop your favorite links, screenshots, and artwork!'
        },
        {
          id: `c_${serverId}_voice1`,
          serverId: serverId,
          categoryId: `cat_${serverId}_voice`,
          name: 'Lounge Voice',
          type: 'voice',
          voiceUsers: []
        }
      ],
      members: [currentUser]
    };

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 }
    });

    onCreateServer(newServer);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-[#313338] rounded-2xl shadow-2xl border border-[#232428] overflow-hidden text-[#dbdee1] discord-pop">
        {/* Header */}
        <div className="p-6 text-center relative border-b border-[#232428]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#949ba4] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold text-white tracking-tight">Create Your Server</h2>
          <p className="text-xs text-[#949ba4] mt-1.5 max-w-xs mx-auto">
            Your server is where you and your friends hang out. Make yours and start talking.
          </p>
        </div>

        {/* Step 1: Template selection */}
        {step === 'template' ? (
          <div className="p-5 space-y-2 max-h-[380px] overflow-y-auto">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4] px-1 mb-2">
              Start from a template
            </div>
            {templates.map((tpl) => {
              const Icon = tpl.icon;
              return (
                <button
                  key={tpl.title}
                  onClick={() => handleSelectTemplate(tpl.title)}
                  className="w-full p-3 bg-[#2b2d31] hover:bg-[#35373c] border border-[#232428] rounded-xl flex items-center justify-between text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-[#1e1f22] text-[#5865f2] group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{tpl.title}</div>
                      <div className="text-[11px] text-[#949ba4]">{tpl.desc}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#949ba4] group-hover:translate-x-1 transition-transform" />
                </button>
              );
            })}
          </div>
        ) : (
          /* Step 2: Name & Details */
          <form onSubmit={handleCreate} className="p-6 space-y-5">
            <div className="flex flex-col items-center gap-2">
              <input
                type="file"
                ref={iconFileInputRef}
                accept="image/*"
                onChange={handleIconUpload}
                className="hidden"
              />
              <div
                onClick={() => iconFileInputRef.current?.click()}
                className="w-20 h-20 rounded-[24px] overflow-hidden border-2 border-dashed border-[#5865f2] bg-[#2b2d31] hover:bg-[#35373c] flex flex-col items-center justify-center text-[#5865f2] hover:border-solid cursor-pointer transition-all relative group shadow-md"
              >
                {serverIcon ? (
                  <>
                    <img src={serverIcon} alt="Server Icon" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[9px] font-bold transition-opacity">
                      <Upload className="w-4 h-4 mb-0.5" />
                      <span>CHANGE</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6 mb-1" />
                    <span className="text-[10px] uppercase font-bold text-[#dbdee1]">UPLOAD</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => iconFileInputRef.current?.click()}
                  className="text-xs text-[#5865f2] hover:underline font-semibold cursor-pointer"
                >
                  Upload Image
                </button>
                <span className="text-[#949ba4] text-xs">•</span>
                <button
                  type="button"
                  onClick={handleRandomizeIcon}
                  className="text-xs text-[#dbdee1] hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-[#fee75c]" />
                  <span>Randomize</span>
                </button>
                {serverIcon && (
                  <>
                    <span className="text-[#949ba4] text-xs">•</span>
                    <button
                      type="button"
                      onClick={() => setServerIcon('')}
                      className="text-xs text-[#f23f43] hover:underline font-semibold cursor-pointer"
                    >
                      Reset
                    </button>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b5bac1] mb-1.5">
                Server Name
              </label>
              <input
                type="text"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                autoFocus
                className="w-full bg-[#1e1f22] text-sm text-[#dbdee1] rounded-lg px-3 py-2 border border-[#232428] focus:outline-none focus:border-[#5865f2]"
              />
              <span className="text-[11px] text-[#949ba4] mt-1 block">
                By creating a server, you agree to Discord's Community Guidelines.
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep('template')}
                className="text-xs font-semibold text-[#dbdee1] hover:underline"
              >
                Back
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold rounded-lg shadow-lg transition-colors cursor-pointer"
              >
                Create Server
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
