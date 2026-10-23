import { Message } from '../types/discord';

export const MESSAGE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Extracts or estimates the epoch millisecond timestamp of a message.
 */
export function getMessageTimestamp(msg: Message): number {
  // 1. Explicit numeric createdAt
  if (typeof msg.createdAt === 'number' && !isNaN(msg.createdAt)) {
    return msg.createdAt;
  }

  // 2. Explicit string createdAt
  if (typeof msg.createdAt === 'string') {
    const parsed = Date.parse(msg.createdAt);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }

  // 3. Extract epoch millisecond timestamp embedded in message ID (e.g., msg_1792719838370_gqd6q)
  if (msg.id) {
    const idMatch = msg.id.match(/(?:msg_|att_|^)(\d{10,13})(?:_|$)/);
    if (idMatch) {
      const parsedNum = parseInt(idMatch[1], 10);
      // Valid epoch timestamp between years ~2020 and 2040
      if (parsedNum >= 1577836800000 && parsedNum <= 2208988800000) {
        return parsedNum;
      }
    }
  }

  // 4. Parse string timestamp
  if (msg.timestamp) {
    // If standard ISO or RFC date string
    const parsedDate = Date.parse(msg.timestamp);
    if (!isNaN(parsedDate)) {
      return parsedDate;
    }

    // Discord-like relative formats: "Today at HH:MM AM/PM"
    if (msg.timestamp.toLowerCase().includes('today at')) {
      const timePart = msg.timestamp.split(/today at\s+/i)[1];
      if (timePart) {
        const todayDate = new Date();
        const parsedTime = Date.parse(`${todayDate.toDateString()} ${timePart}`);
        if (!isNaN(parsedTime)) {
          return parsedTime;
        }
      }
      return Date.now();
    }

    // Discord-like relative formats: "Yesterday at HH:MM AM/PM"
    if (msg.timestamp.toLowerCase().includes('yesterday at')) {
      const timePart = msg.timestamp.split(/yesterday at\s+/i)[1];
      const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (timePart) {
        const parsedTime = Date.parse(`${yesterdayDate.toDateString()} ${timePart}`);
        if (!isNaN(parsedTime)) {
          return parsedTime;
        }
      }
      return yesterdayDate.getTime();
    }
  }

  // Welcome / system announcement messages stay preserved
  if (msg.id === 'm_welcome' || msg.isSystem) {
    return Date.now();
  }

  // Default fallback to current time to prevent premature deletion of unparseable items
  return Date.now();
}

/**
 * Checks whether a message is older than the specified maxAge (default 24 hours).
 */
export function isMessageOlderThan(
  msg: Message,
  maxAgeMs = MESSAGE_TTL_MS,
  now = Date.now()
): boolean {
  // Always preserve seed/welcome messages
  if (msg.id === 'm_welcome' || msg.isSystem) {
    return false;
  }

  const msgTime = getMessageTimestamp(msg);
  return now - msgTime > maxAgeMs;
}

/**
 * Filters out messages older than 24 hours across all channels/threads in a messages dictionary.
 */
export function pruneMessagesOlderThan(
  messagesMap: Record<string, Message[]>,
  maxAgeMs = MESSAGE_TTL_MS,
  now = Date.now()
): { pruned: Record<string, Message[]>; removedCount: number } {
  const pruned: Record<string, Message[]> = {};
  let removedCount = 0;

  for (const [channelKey, msgList] of Object.entries(messagesMap)) {
    if (!Array.isArray(msgList)) {
      pruned[channelKey] = [];
      continue;
    }

    const filtered = msgList.filter((msg) => {
      const isExpired = isMessageOlderThan(msg, maxAgeMs, now);
      if (isExpired) {
        removedCount++;
        return false;
      }
      return true;
    });

    // If channel had messages and all expired, keep welcome message for c_general so channel is not blank
    if (filtered.length === 0 && channelKey === 'c_general' && msgList.length > 0) {
      const welcome = msgList.find((m) => m.id === 'm_welcome');
      if (welcome) {
        filtered.push(welcome);
        removedCount--;
      }
    }

    pruned[channelKey] = filtered;
  }

  return { pruned, removedCount };
}

/**
 * Directly inspects and prunes expired messages from localStorage if present.
 */
export function pruneLocalStorageMessages(
  key = 'discord_clone_messages',
  maxAgeMs = MESSAGE_TTL_MS,
  now = Date.now()
): number {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return 0;

    const parsed = JSON.parse(raw) as Record<string, Message[]>;
    if (!parsed || typeof parsed !== 'object') return 0;

    const { pruned, removedCount } = pruneMessagesOlderThan(parsed, maxAgeMs, now);

    if (removedCount > 0) {
      localStorage.setItem(key, JSON.stringify(pruned));
    }

    return removedCount;
  } catch (err) {
    console.warn('Failed to prune expired messages from localStorage:', err);
    return 0;
  }
}
