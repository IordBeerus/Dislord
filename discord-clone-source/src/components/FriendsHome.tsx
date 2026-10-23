import React, { useState } from 'react';
import { Users, Search, MessageSquare, MoreVertical, Check, UserPlus, Sparkles, Gamepad2, Music } from 'lucide-react';
import { User } from '../types/discord';
import confetti from 'canvas-confetti';

interface FriendsHomeProps {
  friends: User[];
  onOpenDmWithUser: (user: User) => void;
  onSelectMember: (user: User) => void;
  onAddFriend: (username: string) => boolean;
}

export const FriendsHome: React.FC<FriendsHomeProps> = ({
  friends,
  onOpenDmWithUser,
  onSelectMember,
  onAddFriend
}) => {
  const [activeTab, setActiveTab] = useState<'online' | 'all' | 'pending' | 'blocked' | 'add'>('online');
  const [search, setSearch] = useState('');
  const [addFriendInput, setAddFriendInput] = useState('');
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-[#23a55a]';
      case 'idle': return 'bg-[#f0b232]';
      case 'dnd': return 'bg-[#f23f43]';
      default: return 'bg-[#80848e]';
    }
  };

  const filteredFriends = friends.filter((f) => {
    if (activeTab === 'online') {
      if (f.status === 'offline') return false;
    }
    if (search) {
      const matchName = f.displayName.toLowerCase().includes(search.toLowerCase());
      const matchUser = f.username.toLowerCase().includes(search.toLowerCase());
      if (!matchName && !matchUser) return false;
    }
    return true;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddSuccess(null);
    setAddError(null);
    if (!addFriendInput.trim()) return;

    const res = onAddFriend(addFriendInput.trim());
    if (res) {
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.5 } });
      setAddSuccess(`Success! Your friend request to ${addFriendInput.trim()} was sent.`);
      setAddFriendInput('');
    } else {
      setAddError(`Hm, didn't work. Double check that the username is spelled correctly.`);
    }
  };

  return (
    <div className="flex-1 h-full bg-[#313338] flex flex-col min-w-0 select-none">
      {/* Top Header Bar */}
      <div className="h-12 px-4 border-b border-[#1f2023] flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-bold text-white text-sm pr-4 border-r border-[#3f4147]">
            <Users className="w-5 h-5 text-[#80848e]" />
            <span>Friends</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('online')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === 'online' ? 'bg-[#35373c] text-white' : 'text-[#b5bac1] hover:text-[#dbdee1]'
              }`}
            >
              Online
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === 'all' ? 'bg-[#35373c] text-white' : 'text-[#b5bac1] hover:text-[#dbdee1]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === 'pending' ? 'bg-[#35373c] text-white' : 'text-[#b5bac1] hover:text-[#dbdee1]'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveTab('blocked')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === 'blocked' ? 'bg-[#35373c] text-white' : 'text-[#b5bac1] hover:text-[#dbdee1]'
              }`}
            >
              Blocked
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`px-2 py-0.5 rounded transition-colors ${
                activeTab === 'add'
                  ? 'bg-transparent text-[#23a55a]'
                  : 'bg-[#23a55a] text-white hover:bg-[#1f9250]'
              }`}
            >
              Add Friend
            </button>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left List / Tab View */}
        <div className="flex-1 flex flex-col overflow-hidden px-8 py-6">
          {activeTab === 'add' ? (
            /* Add Friend Form */
            <div className="max-w-xl space-y-4">
              <div>
                <h2 className="text-base font-bold text-white uppercase tracking-wide">
                  Add Friend
                </h2>
                <p className="text-xs text-[#949ba4] mt-1">
                  You can add friends with their Discord username or tag.
                </p>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-3">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={addFriendInput}
                    onChange={(e) => setAddFriendInput(e.target.value)}
                    placeholder="Enter a username to add as a friend (e.g. your_friend#1234 or username)"
                    className="w-full bg-[#1e1f22] text-xs text-white rounded-lg px-4 py-3 pr-36 border border-[#1f2023] focus:outline-none focus:border-[#5865f2]"
                  />
                  <button
                    type="submit"
                    disabled={!addFriendInput.trim()}
                    className="absolute right-2 px-4 py-1.5 bg-[#5865f2] disabled:opacity-50 hover:bg-[#4752c4] text-white text-xs font-semibold rounded transition-colors cursor-pointer"
                  >
                    Send Friend Request
                  </button>
                </div>

                {addSuccess && (
                  <p className="text-xs text-[#23a55a] font-medium">{addSuccess}</p>
                )}
                {addError && (
                  <p className="text-xs text-[#f23f43] font-medium">{addError}</p>
                )}
              </form>

              <div className="border-t border-[#35373c] pt-6 mt-6">
                <div className="flex items-center gap-3 p-4 bg-[#2b2d31] rounded-xl border border-[#1f2023]">
                  <Sparkles className="w-8 h-8 text-[#5865f2]" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Find your gaming or study crew</h4>
                    <p className="text-xs text-[#949ba4]">
                      Explore public Discord communities from the discovery tab on the sidebar.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Friends List */
            <div className="flex-1 flex flex-col overflow-hidden space-y-4">
              {/* Search */}
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#1e1f22] text-xs text-[#dbdee1] placeholder-[#80848e] rounded-md px-3 py-2 pl-9 focus:outline-none focus:ring-1 focus:ring-[#5865f2]"
                />
                <Search className="w-4 h-4 text-[#80848e] absolute left-3" />
              </div>

              {/* Friends Count Title */}
              <div className="text-[11px] font-bold text-[#949ba4] uppercase tracking-wider">
                {activeTab.toUpperCase()} — {filteredFriends.length}
              </div>

              {/* Friends Rows */}
              <div className="flex-1 overflow-y-auto space-y-1">
                {filteredFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#35373c] border-t border-[#35373c]/30 group transition-colors"
                  >
                    <div
                      onClick={() => onSelectMember(friend)}
                      className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={friend.avatar}
                          alt={friend.displayName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#313338] ${getStatusColor(
                            friend.status
                          )}`}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                          <span className="truncate">{friend.displayName}</span>
                          <span className="text-xs text-[#949ba4] font-normal">
                            @{friend.username}
                          </span>
                        </div>
                        <div className="text-xs text-[#949ba4] truncate">
                          {friend.activity ? (
                            <span>{friend.activity.type} {friend.activity.name}</span>
                          ) : (
                            <span className="capitalize">{friend.status}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenDmWithUser(friend)}
                        title="Message"
                        className="w-9 h-9 rounded-full bg-[#2b2d31] hover:bg-[#111214] text-[#b5bac1] hover:text-white flex items-center justify-center transition-colors shadow-xs"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onSelectMember(friend)}
                        title="More"
                        className="w-9 h-9 rounded-full bg-[#2b2d31] hover:bg-[#111214] text-[#b5bac1] hover:text-white flex items-center justify-center transition-colors shadow-xs"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {filteredFriends.length === 0 && (
                  <div className="text-center py-16 text-xs text-[#949ba4] space-y-2">
                    <p>Wumpus is waiting on friends. You can add them using the Add Friend tab!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right "Active Now" Column (Discord desktop view) */}
        <div className="w-80 h-full border-l border-[#1f2023]/40 p-4 space-y-4 overflow-y-auto hidden lg:block">
          <h3 className="text-base font-bold text-white">Active Now</h3>

          <div className="space-y-3">
            {friends.filter(f => f.activity).map(f => (
              <div
                key={f.id}
                onClick={() => onSelectMember(f)}
                className="p-3 bg-[#2b2d31] hover:bg-[#35373c] border border-[#1f2023] rounded-xl space-y-2 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={f.avatar}
                    alt={f.displayName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{f.displayName}</div>
                    <div className="text-[11px] text-[#949ba4] truncate">{f.activity?.type}</div>
                  </div>
                </div>

                <div className="bg-[#1e1f22] p-2.5 rounded-lg flex items-center gap-2">
                  {f.activity?.type.includes('Listening') ? (
                    <Music className="w-4 h-4 text-[#1db954] shrink-0" />
                  ) : (
                    <Gamepad2 className="w-4 h-4 text-[#5865f2] shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{f.activity?.name}</div>
                    {f.activity?.details && (
                      <div className="text-[10px] text-[#949ba4] truncate">{f.activity.details}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
