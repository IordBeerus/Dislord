# Security Specification: Multi-User Chat & Community Security

## 1. Data Invariants
1. **Identity Binding**: Users can only create and mutate their own profile (`/users/{userId}`) where `userId == request.auth.uid`. No user can impersonate another user's ID or change their own immutable identification.
2. **Server Ownership & Moderation**: Servers (`/servers/{serverId}`) can only be deleted or managed by their owner (`ownerId == request.auth.uid`).
3. **Channel Message Integrity**: Messages in `/servers/{serverId}/channels/{channelId}/messages/{messageId}` must have `authorId == request.auth.uid`. A user cannot forge messages authored by other users.
4. **Direct Message Privacy**: A direct message thread (`/directMessages/{dmId}`) can only be read and written by users whose `request.auth.uid` is contained in `participantIds`.
5. **Length and Type Boundaries**: Every string field has strict length limits (e.g. content <= 4000 chars, names <= 100 chars, IDs matching regex `^[a-zA-Z0-9_\\-]+$`).

---

## 2. The "Dirty Dozen" Payloads

1. **Spoofed User Profile Creation**: Creating `/users/victim_user_99` with `auth.uid = attacker_1`.
2. **Ghost Fields Injection**: Adding an unpermitted field `isAdmin: true` into `/users/user_1`.
3. **Unauthenticated Read of Private Messages**: Anonymous read attempt on `/directMessages/userA_userB`.
4. **Third-Party DM Snooping**: User C querying `/directMessages/userA_userB` where C is not in `participantIds`.
5. **Message Author Forgery**: Sending a message to `#general` with `authorId: 'victim_user'` while signed in as `attacker`.
6. **Server Hijacking**: User B updating `/servers/server_1` to change `ownerId` to User B.
7. **Giant Payload / Denial of Wallet**: Sending a chat message with 200,000 characters to crash clients and balloon read costs.
8. **Malicious Path Variable Injection**: Attempting to write to `/servers/invalid$$%^/channels/chan1/messages/msg1` with invalid ID format.
9. **Tampering with Server Creation**: Non-authenticated user attempting to create a server.
10. **Orphaned Message Write**: Creating a channel message with an unauthenticated session.
11. **Foreign DM Injection**: User C writing into `/directMessages/userA_userB/messages/msg1` when C is neither user A nor user B.
12. **Immutable Timestamp Mutation**: Altering message author or channelId during an update.

---

## 3. Security Assertions
- All unauthenticated requests fail with PERMISSION_DENIED.
- Cross-user DM eavesdropping fails with PERMISSION_DENIED.
- Forged message author writes fail with PERMISSION_DENIED.
- Oversized text fields fail with PERMISSION_DENIED.
