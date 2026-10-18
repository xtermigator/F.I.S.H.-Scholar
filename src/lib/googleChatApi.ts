export interface GoogleChatSpace {
  name: string; // e.g. "spaces/AAAA..."
  displayName?: string;
  spaceType?: 'SPACE' | 'GROUP_CHAT' | 'DIRECT_MESSAGE';
  type?: 'ROOM' | 'DM';
  spaceDetails?: {
    description?: string;
    guidelines?: string;
  };
  spaceHistoryState?: string;
  singleUserBotDm?: boolean;
}

export interface GoogleChatSender {
  name: string;
  displayName: string;
  avatarUrl?: string;
  type?: string;
  email?: string;
}

export interface GoogleChatMessage {
  name: string;
  sender?: GoogleChatSender;
  createTime?: string;
  text?: string;
  formattedText?: string;
  thread?: {
    name?: string;
  };
  annotations?: any[];
  emojiReactionSummaries?: Array<{
    emoji?: { unicode?: string };
    reactionCount?: number;
  }>;
}

export interface GoogleChatMember {
  name: string;
  state?: string;
  role?: string;
  member?: {
    name: string;
    displayName?: string;
    avatarUrl?: string;
    type?: string;
  };
}

const CHAT_BASE_URL = 'https://chat.googleapis.com/v1';

export async function fetchChatSpaces(accessToken: string): Promise<GoogleChatSpace[]> {
  const res = await fetch(`${CHAT_BASE_URL}/spaces`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Failed to fetch spaces (${res.status})`);
  }

  const data = await res.json();
  return data.spaces || [];
}

export async function createChatSpace(
  accessToken: string,
  displayName: string,
  description?: string
): Promise<GoogleChatSpace> {
  const body: any = {
    displayName,
    spaceType: 'SPACE'
  };

  if (description) {
    body.spaceDetails = { description };
  }

  const res = await fetch(`${CHAT_BASE_URL}/spaces`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Failed to create space (${res.status})`);
  }

  return res.json();
}

export async function fetchChatMessages(
  accessToken: string,
  spaceName: string,
  pageSize = 50
): Promise<GoogleChatMessage[]> {
  const url = `${CHAT_BASE_URL}/${spaceName}/messages?pageSize=${pageSize}&orderBy=createTime desc`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Failed to fetch messages (${res.status})`);
  }

  const data = await res.json();
  // Reverse so oldest first in chat stream
  return (data.messages || []).reverse();
}

export async function sendChatMessage(
  accessToken: string,
  spaceName: string,
  text: string
): Promise<GoogleChatMessage> {
  const res = await fetch(`${CHAT_BASE_URL}/${spaceName}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Failed to send message (${res.status})`);
  }

  return res.json();
}

export async function deleteChatMessage(
  accessToken: string,
  messageName: string
): Promise<void> {
  const res = await fetch(`${CHAT_BASE_URL}/${messageName}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Failed to delete message (${res.status})`);
  }
}

export async function fetchChatMembers(
  accessToken: string,
  spaceName: string
): Promise<GoogleChatMember[]> {
  const res = await fetch(`${CHAT_BASE_URL}/${spaceName}/members`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Failed to fetch members (${res.status})`);
  }

  const data = await res.json();
  return data.memberships || [];
}
