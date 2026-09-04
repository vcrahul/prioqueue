export type EMQuadrant = 'do' | 'decide' | 'delegate' | 'delete';

export interface Task {
  id?: number;
  name: string;
  categoryId?: number;
  profileId?: number;
  dueDate?: string;
  reminderTime?: string;
  urgent: boolean;
  important: boolean;
  completed?: boolean;
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export function getQuadrant(urgent: boolean, important: boolean): EMQuadrant {
  if (urgent && important) return 'do';
  if (!urgent && important) return 'decide';
  if (urgent && !important) return 'delegate';
  return 'delete';
}

export const QUADRANT_META: Record<EMQuadrant, { label: string; color: string; softColor: string; description: string; icon: string }> = {
  do:       { label: 'Do it now',       color: 'var(--do)',       softColor: 'var(--do-soft)',       description: 'urgent and important',          icon: 'zap' },
  decide:   { label: 'Schedule',        color: 'var(--decide)',   softColor: 'var(--decide-soft)',   description: 'less urgent, important',         icon: 'calendar' },
  delegate: { label: 'Delegate',        color: 'var(--delegate)', softColor: 'var(--delegate-soft)', description: 'urgent, less important',         icon: 'user' },
  delete:   { label: 'Drop altogether', color: 'var(--delete)',   softColor: 'var(--delete-soft)',   description: 'less urgent, less important',    icon: 'trash' },
};
