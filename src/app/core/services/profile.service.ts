import { Injectable, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { from } from 'rxjs';
import { liveQuery } from 'dexie';
import { db } from '../db/app-db';
import { Profile } from '../../features/profile/models/profile.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  readonly profiles = toSignal(
    from(liveQuery(() => db.profiles.toArray().then(ps => ps.sort((a, b) => a.createdAt - b.createdAt)))),
    { initialValue: [] as Profile[] }
  );

  readonly selectedProfileId = signal<number | null>(null);

  readonly selectedProfile = computed(() => {
    const id = this.selectedProfileId();
    if (id === null) return null;
    return this.profiles().find(p => p.id === id) ?? null;
  });

  selectProfile(id: number | null): void {
    this.selectedProfileId.set(id);
  }

  async add(name: string, color: string): Promise<number> {
    return db.profiles.add({ name, color, createdAt: Date.now() });
  }

  async update(id: number, changes: Partial<Profile>): Promise<void> {
    await db.profiles.update(id, changes);
  }

  async delete(id: number): Promise<void> {
    await db.profiles.delete(id);
    if (this.selectedProfileId() === id) this.selectedProfileId.set(null);
  }
}
