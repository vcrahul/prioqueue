import Dexie, { type Table } from 'dexie';
import type { Task } from '../../features/tasks/models/task.model';
import type { Category } from '../../features/tasks/models/category.model';
import type { Profile } from '../../features/profile/models/profile.model';
import type { Setting } from '../models/setting.model';

class AppDatabase extends Dexie {
  tasks!: Table<Task>;
  categories!: Table<Category>;
  profiles!: Table<Profile>;
  settings!: Table<Setting>;

  constructor() {
    super('PrioQueueDB');
    this.version(1).stores({
      tasks:      '++id, profileId, categoryId, dueDate, createdAt',
      categories: '++id, name',
      profiles:   '++id, name',
      settings:   '++id, &key',
    });
  }
}

export const db = new AppDatabase();
