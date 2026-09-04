import { Injectable } from '@angular/core';
import { db } from '../db/app-db';
import type { Task } from '../../features/tasks/models/task.model';
import type { Category } from '../../features/tasks/models/category.model';
import type { Profile } from '../../features/profile/models/profile.model';

@Injectable({ providedIn: 'root' })
export class ExportImportService {
  async exportAll(): Promise<void> {
    const [tasks, categories, profiles] = await Promise.all([
      db.tasks.toArray(),
      db.categories.toArray(),
      db.profiles.toArray(),
    ]);
    const payload = { version: 1, exportedAt: new Date().toISOString(), tasks, categories, profiles };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prioqueue-full-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async importAll(file: File): Promise<{ tasks: number; categories: number; profiles: number }> {
    const text = await file.text();
    const payload = JSON.parse(text);
    if (!Array.isArray(payload.tasks)) throw new Error('Invalid backup file format.');

    const tasks: Task[] = payload.tasks ?? [];
    const categories: Category[] = payload.categories ?? [];
    const profiles: Profile[] = payload.profiles ?? [];

    await db.transaction('rw', db.tasks, db.categories, db.profiles, async () => {
      await db.tasks.bulkPut(tasks);
      await db.categories.bulkPut(categories);
      await db.profiles.bulkPut(profiles);
    });

    return { tasks: tasks.length, categories: categories.length, profiles: profiles.length };
  }

  async hasData(): Promise<boolean> {
    return (await db.tasks.count()) > 0;
  }
}
