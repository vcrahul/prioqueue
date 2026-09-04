import { Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { from } from 'rxjs';
import { liveQuery } from 'dexie';
import { db } from '../db/app-db';
import { Category } from '../../features/tasks/models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  readonly categories = toSignal(
    from(liveQuery(() => db.categories.orderBy('name').toArray())),
    { initialValue: [] as Category[] }
  );

  async add(name: string, color: string): Promise<number> {
    return db.categories.add({ name, color, createdAt: Date.now() });
  }

  async update(id: number, changes: Partial<Category>): Promise<void> {
    await db.categories.update(id, changes);
  }

  async delete(id: number): Promise<void> {
    await db.categories.delete(id);
  }
}
