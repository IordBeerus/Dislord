import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Unsubscribe
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from './firebase';
import { User, Server, Message, DirectMessage, Attachment, Channel, ChannelCategory } from '../types/discord';
import { INITIAL_SERVERS } from '../data/initialData';
import { sanitizeAttachmentsForFirestore } from '../utils/mediaUtils';

// User Profile sync
export async function syncUserProfile(user: User): Promise<void> {
  const path = `users/${user.id}`;
  try {
    const userRef = doc(db, 'users', user.id);
    await setDoc(
      userRef,
      {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        discriminator: user.discriminator || '0001',
        avatar: user.avatar,
        bannerColor: user.bannerColor || '#5865F2',
        status: user.status || 'online',
        customStatus: user.customStatus || '',
        aboutMe: user.aboutMe || '',
        email: user.email || (auth.currentUser?.email || ''),
        leftServerIds: user.leftServerIds || [],
        isNitro: Boolean(user.isNitro),
        nitroTier: user.nitroTier || 'nitro',
        avatarFrame: user.avatarFrame || 'none',
        customBanner: user.customBanner || '',
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('client is offline')) {
      console.warn('Firestore is currently offline. User profile queued locally.');
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Subscribe to all registered real users
export function subscribeToUsers(callback: (users: User[]) => void): Unsubscribe {
  const path = 'users';
  const q = collection(db, path);
  return onSnapshot(q, (snapshot) => {
    const users: User[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      users.push({
        id: data.id || docSnap.id,
        username: data.username || 'user',
        displayName: data.displayName || data.username || 'User',
        discriminator: data.discriminator || '0000',
        avatar: data.avatar || 'https://api.dicebear.com/7.x/identicon/svg?seed=user',
        bannerColor: data.bannerColor || '#5865F2',
        status: data.status || 'offline',
        customStatus: data.customStatus,
        badges: data.badges || ['Online User'],
        role: 'Member',
        leftServerIds: data.leftServerIds || [],
        isNitro: data.isNitro || false,
        nitroTier: data.nitroTier,
        avatarFrame: data.avatarFrame || 'none',
        customBanner: data.customBanner || ''
      });
    });
    callback(users);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

// Initial seed of servers into Firestore if empty
export async function ensureDefaultServersExist(currentUser: User): Promise<void> {
  try {
    const serversSnap = await getDocs(collection(db, 'servers'));
    if (serversSnap.empty) {
      for (const s of INITIAL_SERVERS) {
        const sRef = doc(db, 'servers', s.id);
        await setDoc(sRef, {
          id: s.id,
          name: s.name,
          ownerId: currentUser.id,
          icon: s.icon,
          acronym: s.acronym,
          description: s.description,
          category: s.category,
          memberCount: 1,
          onlineCount: 1,
          createdAt: new Date().toISOString(),
          channels: s.channels,
          categories: s.categories,
          members: [currentUser]
        });
      }
    }
  } catch (err) {
    console.warn('Could not seed default servers, continuing:', err);
  }
}

// Subscribe to servers
export function subscribeToServers(callback: (servers: Server[]) => void): Unsubscribe {
  const path = 'servers';
  return onSnapshot(collection(db, path), (snapshot) => {
    if (snapshot.empty) {
      return;
    }
    const serversList: Server[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      serversList.push({
        id: data.id || docSnap.id,
        name: data.name,
        icon: data.icon || 'https://api.dicebear.com/7.x/identicon/svg?seed=discord',
        acronym: data.acronym || data.name.slice(0, 2).toUpperCase(),
        banner: data.banner,
        description: data.description || '',
        category: data.category || 'General',
        memberCount: data.memberCount || 1,
        onlineCount: data.onlineCount || 1,
        channels: data.channels || [],
        categories: data.categories || [],
        members: data.members || [],
        roles: data.roles || [],
        boostCount: data.boostCount || 0,
        boostLevel: data.boostLevel || 0,
        boosters: data.boosters || []
      });
    });
    callback(serversList);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

// Create new server in Firestore
export async function createFirestoreServer(server: Server): Promise<void> {
  const path = `servers/${server.id}`;
  try {
    await setDoc(doc(db, 'servers', server.id), {
      id: server.id,
      name: server.name,
      ownerId: server.members[0]?.id || auth.currentUser?.uid || 'user',
      icon: server.icon,
      acronym: server.acronym,
      description: server.description || '',
      category: server.category || 'General',
      memberCount: server.members.length,
      onlineCount: server.onlineCount,
      createdAt: new Date().toISOString(),
      channels: server.channels,
      categories: server.categories,
      members: server.members
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Join server (add member)
export async function joinFirestoreServer(serverId: string, user: User, currentServer?: Server): Promise<void> {
  const path = `servers/${serverId}`;
  try {
    const existingMembers = currentServer?.members || [];
    if (!existingMembers.some(m => m.id === user.id)) {
      const updatedMembers = [...existingMembers, user];
      await updateDoc(doc(db, 'servers', serverId), {
        members: updatedMembers,
        memberCount: updatedMembers.length,
        onlineCount: updatedMembers.filter(m => m.status !== 'offline').length
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Leave server (remove member)
export async function leaveFirestoreServer(serverId: string, userId: string): Promise<void> {
  const path = `servers/${serverId}`;
  try {
    const serverRef = doc(db, 'servers', serverId);
    const snap = await getDoc(serverRef);
    if (snap.exists()) {
      const data = snap.data();
      const existingMembers: User[] = data.members || [];
      const updatedMembers = existingMembers.filter(m => m.id !== userId);
      await updateDoc(serverRef, {
        members: updatedMembers,
        memberCount: Math.max(0, updatedMembers.length),
        onlineCount: updatedMembers.filter(m => m.status !== 'offline').length
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Update user's left server IDs in profile
export async function updateUserLeftServers(userId: string, leftServerIds: string[]): Promise<void> {
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      leftServerIds,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Boost server (Server Boost with level thresholds)
export async function boostFirestoreServer(
  serverId: string,
  userId: string
): Promise<{ boostCount: number; boostLevel: number }> {
  const path = `servers/${serverId}`;
  try {
    const serverRef = doc(db, 'servers', serverId);
    const snap = await getDoc(serverRef);
    let boostCount = 1;
    let boostLevel = 0;
    let boosters: string[] = [userId];

    if (snap.exists()) {
      const data = snap.data();
      boostCount = (data.boostCount || 0) + 1;
      boosters = Array.from(new Set([...(data.boosters || []), userId]));
      boostLevel = boostCount >= 14 ? 3 : boostCount >= 7 ? 2 : boostCount >= 2 ? 1 : 0;

      await updateDoc(serverRef, {
        boostCount,
        boostLevel,
        boosters
      });
    }

    return { boostCount, boostLevel };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    return { boostCount: 1, boostLevel: 0 };
  }
}

// Subscribe to channel messages in real-time
export function subscribeToChannelMessages(
  serverId: string,
  channelId: string,
  callback: (messages: Message[]) => void
): Unsubscribe {
  const path = `servers/${serverId}/channels/${channelId}/messages`;
  const q = query(collection(db, path), limit(150));
  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      messages.push({
        id: data.id || docSnap.id,
        channelId: data.channelId || channelId,
        authorId: data.authorId,
        author: data.author,
        content: data.content || '',
        timestamp: data.timestamp,
        reactions: data.reactions || [],
        attachments: data.attachments || [],
        replyTo: data.replyTo,
        pinned: data.pinned
      });
    });
    // Sort chronologically
    messages.sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1));
    callback(messages);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

// Send channel message
export async function sendChannelMessage(
  serverId: string,
  channelId: string,
  message: Message
): Promise<void> {
  const path = `servers/${serverId}/channels/${channelId}/messages/${message.id}`;
  try {
    const sanitizedAttachments = await sanitizeAttachmentsForFirestore(message.attachments);
    await setDoc(doc(db, 'servers', serverId, 'channels', channelId, 'messages', message.id), {
      id: message.id,
      channelId,
      authorId: message.authorId,
      author: {
        id: message.author.id,
        username: message.author.username,
        displayName: message.author.displayName,
        avatar: message.author.avatar,
        discriminator: message.author.discriminator,
        status: message.author.status
      },
      content: message.content,
      timestamp: message.timestamp,
      reactions: message.reactions || [],
      attachments: sanitizedAttachments,
      pinned: message.pinned || false,
      replyTo: message.replyTo || null
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Subscribe to direct message threads for current user
export function subscribeToDirectMessages(
  userId: string,
  callback: (dms: DirectMessage[]) => void
): Unsubscribe {
  const path = 'directMessages';
  const q = query(collection(db, path), where('participantIds', 'array-contains', userId));
  return onSnapshot(q, (snapshot) => {
    const dms: DirectMessage[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const otherUser = (data.participantUsers || []).find((u: User) => u.id !== userId) || {
        id: data.participantIds.find((id: string) => id !== userId) || 'unknown',
        username: 'friend',
        displayName: 'Friend',
        discriminator: '0000',
        avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=friend',
        status: 'online'
      };
      dms.push({
        id: data.id || docSnap.id,
        recipient: otherUser,
        unreadCount: 0,
        lastMessage: data.lastMessage,
        lastMessageTime: data.lastMessageTime
      });
    });
    callback(dms);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

// Create or get DM thread
export async function createDirectMessageThread(
  currentUser: User,
  targetUser: User
): Promise<string> {
  const sortedIds = [currentUser.id, targetUser.id].sort();
  const threadId = `dm_${sortedIds.join('_')}`;
  const path = `directMessages/${threadId}`;

  try {
    const threadRef = doc(db, 'directMessages', threadId);
    await setDoc(
      threadRef,
      {
        id: threadId,
        participantIds: sortedIds,
        participantUsers: [currentUser, targetUser],
        lastMessage: 'Direct message conversation started',
        lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
    return threadId;
  } catch (error) {
    if (error instanceof Error && error.message.includes('client is offline')) {
      console.warn('Firestore is offline. Thread queued locally.');
      return threadId;
    }
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Subscribe to DM messages in thread
export function subscribeToDMMessages(
  threadId: string,
  callback: (messages: Message[]) => void
): Unsubscribe {
  const path = `directMessages/${threadId}/messages`;
  const q = query(collection(db, path), limit(150));
  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      messages.push({
        id: data.id || docSnap.id,
        channelId: threadId,
        authorId: data.authorId,
        author: data.author,
        content: data.content || '',
        timestamp: data.timestamp,
        reactions: data.reactions || [],
        attachments: data.attachments || [],
        replyTo: data.replyTo
      });
    });
    messages.sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1));
    callback(messages);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

// Send DM message
export async function sendDirectMessage(
  threadId: string,
  message: Message,
  recipientId: string
): Promise<void> {
  const path = `directMessages/${threadId}/messages/${message.id}`;
  try {
    const sanitizedAttachments = await sanitizeAttachmentsForFirestore(message.attachments);
    await setDoc(doc(db, 'directMessages', threadId, 'messages', message.id), {
      id: message.id,
      channelId: threadId,
      authorId: message.authorId,
      author: {
        id: message.author.id,
        username: message.author.username,
        displayName: message.author.displayName,
        avatar: message.author.avatar,
        discriminator: message.author.discriminator,
        status: message.author.status
      },
      content: message.content,
      timestamp: message.timestamp,
      reactions: message.reactions || [],
      attachments: sanitizedAttachments
    });

    // Update parent thread last message snippet
    await updateDoc(doc(db, 'directMessages', threadId), {
      lastMessage: message.content.slice(0, 100) || (message.attachments?.length ? 'Sent an attachment' : ''),
      lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Update server categories in Firestore
export async function updateFirestoreServerCategories(
  serverId: string,
  categories: ChannelCategory[]
): Promise<void> {
  const path = `servers/${serverId}`;
  try {
    await updateDoc(doc(db, 'servers', serverId), {
      categories
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Update server channels in Firestore
export async function updateFirestoreServerChannels(
  serverId: string,
  channels: Channel[]
): Promise<void> {
  const path = `servers/${serverId}`;
  try {
    await updateDoc(doc(db, 'servers', serverId), {
      channels
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Update server details (icon, name, description, etc.) in Firestore
export async function updateFirestoreServerDetails(
  serverId: string,
  updates: Record<string, any>
): Promise<void> {
  const path = `servers/${serverId}`;
  try {
    const docRef = doc(db, 'servers', serverId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      const currentUid = auth.currentUser?.uid;
      const patchData: Record<string, any> = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      // If current server has a local/placeholder owner, associate with signed-in user
      if (currentUid && (!data.ownerId || data.ownerId === 'user_me' || data.ownerId === 'user')) {
        patchData.ownerId = currentUid;
      }
      await updateDoc(docRef, patchData);
    }
  } catch (error) {
    console.warn(`Firestore update for server "${serverId}" handled:`, error);
  }
}

