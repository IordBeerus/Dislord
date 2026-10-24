/**
 * Firestore Rules Unit Test Specification (Phase 0 TDD)
 * Tests coverage for the "Dirty Dozen" security invariants
 */

export interface TestPayload {
  description: string;
  path: string;
  authUid?: string | null;
  method: 'get' | 'list' | 'create' | 'update' | 'delete';
  data?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED' | 'ALLOWED';
}

export const DIRTY_DOZEN_TESTS: TestPayload[] = [
  {
    description: 'Spoofed User Profile Creation: creating profile with mismatched auth UID',
    path: 'users/victim_user_99',
    authUid: 'attacker_1',
    method: 'create',
    data: { id: 'victim_user_99', username: 'victim', displayName: 'Victim', avatar: 'https://avatar.png', status: 'online' },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    description: 'Ghost Fields Injection: injecting role or isAdmin in users doc',
    path: 'users/attacker_1',
    authUid: 'attacker_1',
    method: 'create',
    data: { id: 'attacker_1', username: 'attacker', displayName: 'Attacker', avatar: 'https://avatar.png', status: 'online', isAdmin: true },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    description: 'Unauthenticated Read of Private Messages',
    path: 'directMessages/userA_userB',
    authUid: null,
    method: 'get',
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    description: 'Third-Party DM Snooping: User C reads User A and B DM',
    path: 'directMessages/userA_userB',
    authUid: 'user_c',
    method: 'get',
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    description: 'Message Author Forgery in channel message',
    path: 'servers/server_1/channels/chan_1/messages/msg_1',
    authUid: 'attacker_1',
    method: 'create',
    data: { id: 'msg_1', channelId: 'chan_1', authorId: 'victim_user', content: 'fake msg', timestamp: '2026-10-22' },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    description: 'Server Hijacking: changing ownerId to another user',
    path: 'servers/server_1',
    authUid: 'attacker_1',
    method: 'update',
    data: { id: 'server_1', name: 'Hacked Server', ownerId: 'attacker_1' },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    description: 'Giant Payload: sending 200,000 char message',
    path: 'servers/server_1/channels/chan_1/messages/msg_giant',
    authUid: 'user_1',
    method: 'create',
    data: { id: 'msg_giant', channelId: 'chan_1', authorId: 'user_1', content: 'A'.repeat(5000), timestamp: '2026-10-22' },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    description: 'Malicious Path Variable Injection with invalid characters',
    path: 'servers/invalid$$%^/channels/chan1/messages/msg1',
    authUid: 'user_1',
    method: 'create',
    data: { id: 'msg1', channelId: 'chan1', authorId: 'user_1', content: 'hello', timestamp: '2026-10-22' },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    description: 'Unauthenticated user creating server',
    path: 'servers/server_new',
    authUid: null,
    method: 'create',
    data: { id: 'server_new', name: 'My Server', ownerId: 'someone' },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    description: 'Orphaned Message Write by unauthenticated user',
    path: 'servers/server_1/channels/chan_1/messages/msg_unauth',
    authUid: null,
    method: 'create',
    data: { id: 'msg_unauth', channelId: 'chan_1', authorId: 'anon', content: 'hello', timestamp: '2026-10-22' },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    description: 'Foreign DM message injection by user not in participants',
    path: 'directMessages/userA_userB/messages/msg_foreign',
    authUid: 'user_c',
    method: 'create',
    data: { id: 'msg_foreign', channelId: 'userA_userB', authorId: 'user_c', content: 'sneak peek', timestamp: '2026-10-22' },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    description: 'Immutable authorId change during message update',
    path: 'servers/server_1/channels/chan_1/messages/msg_1',
    authUid: 'user_1',
    method: 'update',
    data: { id: 'msg_1', channelId: 'chan_1', authorId: 'victim_user', content: 'edited text', timestamp: '2026-10-22' },
    expectedResult: 'PERMISSION_DENIED'
  }
];
