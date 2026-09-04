import { Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { from } from 'rxjs';
import { liveQuery } from 'dexie';
import { db } from '../db/app-db';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  readonly userName = toSignal(
    from(liveQuery(async () => {
      const row = await db.settings.where('key').equals('userName').first();
      return row?.value ?? '';
    })),
    { initialValue: '' }
  );

  readonly delegateName = toSignal(
    from(liveQuery(async () => {
      const row = await db.settings.where('key').equals('delegateName').first();
      return row?.value ?? 'Delegate';
    })),
    { initialValue: 'Delegate' }
  );

  readonly deleteName = toSignal(
    from(liveQuery(async () => {
      const row = await db.settings.where('key').equals('deleteName').first();
      return row?.value ?? 'Drop them';
    })),
    { initialValue: 'Drop them' }
  );

  async setUserName(name: string): Promise<void> { await this.set('userName', name.trim()); }
  async setDelegateName(name: string): Promise<void> { await this.set('delegateName', name || 'Delegate'); }
  async setDeleteName(name: string): Promise<void> { await this.set('deleteName', name || 'Drop them'); }

  private async set(key: string, value: string): Promise<void> {
    const existing = await db.settings.where('key').equals(key).first();
    if (existing?.id != null) {
      await db.settings.update(existing.id, { value });
    } else {
      await db.settings.add({ key, value });
    }
  }
}

