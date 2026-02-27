import { CommentAuthor } from '../types/comments';

const STORAGE_KEY = 'vibe-kibana-user';

const COLOR_PALETTE = [
  '#0d99ff',
  '#f24822',
  '#14ae5c',
  '#9747ff',
  '#ffcd29',
  '#ff6b6b',
  '#00b8d9',
  '#36b37e',
  '#ff8f73',
  '#6554c0',
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function colorFromName(name: string): string {
  return COLOR_PALETTE[hashString(name.toLowerCase().trim()) % COLOR_PALETTE.length];
}

function generateId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getUserIdentity(): CommentAuthor | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CommentAuthor;
    if (!parsed.id || !parsed.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setUserIdentity(name: string): CommentAuthor {
  const existing = getUserIdentity();
  const author: CommentAuthor = {
    id: existing?.id || generateId(),
    name: name.trim(),
    color: colorFromName(name),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(author));
  return author;
}

export function updateUserName(newName: string): CommentAuthor {
  const existing = getUserIdentity();
  const author: CommentAuthor = {
    id: existing?.id || generateId(),
    name: newName.trim(),
    color: colorFromName(newName),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(author));
  return author;
}

export { getInitials };
