import { Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { from } from 'rxjs';
import { liveQuery } from 'dexie';
import { db } from '../db/app-db';
import { Task } from '../../features/tasks/models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  readonly tasks = toSignal(
    from(liveQuery(() => db.tasks.orderBy('createdAt').reverse().toArray())),
    { initialValue: [] as Task[] }
  );

  readonly activeTasks = toSignal(
    from(liveQuery(() => db.tasks.orderBy('createdAt').reverse().filter(t => !t.completed).toArray())),
    { initialValue: [] as Task[] }
  );

  readonly completedTasks = toSignal(
    from(liveQuery(async () => {
      const tasks = await db.tasks.filter(t => !!t.completed).toArray();
      return tasks.sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
    })),
    { initialValue: [] as Task[] }
  );

  async add(task: Omit<Task, 'id'>): Promise<number> {
    return db.tasks.add(task);
  }

  async update(id: number, changes: Partial<Task>): Promise<void> {
    await db.tasks.update(id, { ...changes, updatedAt: Date.now() });
  }

  async delete(id: number): Promise<void> {
    await db.tasks.delete(id);
  }

  async markComplete(id: number, completed: boolean): Promise<void> {
    await db.tasks.update(id, {
      completed,
      completedAt: completed ? Date.now() : 0,
      updatedAt: Date.now(),
    });
  }
}
