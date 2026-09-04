import { APP_INITIALIZER, ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import { db } from './core/db/app-db';

async function seedCategories(): Promise<void> {
  const count = await db.categories.count();
  if (count > 0) return;
  const now = Date.now();
  await db.categories.bulkAdd([
    { name: 'Work',           color: '#4f8fe0', createdAt: now },
    { name: 'Personal',       color: '#c9a15a', createdAt: now + 1 },
    { name: 'Health',         color: '#dd5b45', createdAt: now + 2 },
    { name: 'Fitness',        color: '#e0b84f', createdAt: now + 3 },
    { name: 'Learning',       color: '#8f6bd6', createdAt: now + 4 },
    { name: 'Finance',        color: '#7c8194', createdAt: now + 5 },
    { name: 'Food & Cooking', color: '#e0b84f', createdAt: now + 6 },
    { name: 'Mental Health',  color: '#4f8fe0', createdAt: now + 7 },
    { name: 'Medical',        color: '#dd5b45', createdAt: now + 8 },
    { name: 'Home',           color: '#c9a15a', createdAt: now + 9 },
  ]);
}

// Remove completed tasks older than 2 weeks to free browser storage
async function cleanupCompletedTasks(): Promise<void> {
  const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
  await db.tasks.filter(t => !!t.completed && (t.completedAt ?? 0) > 0 && (t.completedAt ?? 0) < twoWeeksAgo).delete();
}

function initStorage(): () => Promise<void> {
  return async () => {
    if (navigator.storage?.persist) await navigator.storage.persist();
    await seedCategories();
    await cleanupCompletedTasks();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: APP_INITIALIZER, useFactory: initStorage, multi: true },
    provideRouter(routes),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
