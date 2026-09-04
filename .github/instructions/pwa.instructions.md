---
applyTo: "src/**"
---

# PWA Setup & Offline-First Rules

## Initial Setup Commands

```bash
ng add @angular/pwa
```

This generates:
- `src/manifest.webmanifest`
- `src/ngsw-config.json` (service worker config)
- Registers the service worker in `app.config.ts`

## `manifest.webmanifest`

```json
{
  "name": "PrioQueue",
  "short_name": "PrioQueue",
  "description": "Handle your tasks based on priority not on noise",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f9fafb",
  "theme_color": "#2563eb",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "assets/icons/icon-72x72.png", "sizes": "72x72", "type": "image/png" },
    { "src": "assets/icons/icon-96x96.png", "sizes": "96x96", "type": "image/png" },
    { "src": "assets/icons/icon-128x128.png", "sizes": "128x128", "type": "image/png" },
    { "src": "assets/icons/icon-144x144.png", "sizes": "144x144", "type": "image/png" },
    { "src": "assets/icons/icon-152x152.png", "sizes": "152x152", "type": "image/png" },
    { "src": "assets/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "assets/icons/icon-384x384.png", "sizes": "384x384", "type": "image/png" },
    { "src": "assets/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

## Registering the Service Worker (`app.config.ts`)

```ts
import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};
```

## Requesting Persistent Storage (run once on app init)

```ts
import { APP_INITIALIZER } from '@angular/core';

function initPersistentStorage(): () => Promise<void> {
  return async () => {
    if (!navigator.storage?.persist) return;
    const already = await navigator.storage.persisted();
    if (!already) {
      const granted = await navigator.storage.persist();
      if (!granted) {
        console.warn(
          'Persistent storage not granted. Data may be auto-cleared by the browser on low storage. ' +
          'Install the app as a PWA to guarantee persistent storage.'
        );
      }
    }
  };
}

// add to providers array in appConfig
{ provide: APP_INITIALIZER, useFactory: initPersistentStorage, multi: true }
```

## PWA Update Prompt (`pwa.service.ts`)

Notify users when a new version is available:

```ts
import { Injectable, inject, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PwaService {
  private readonly swUpdate = inject(SwUpdate);

  readonly updateAvailable = signal(false);

  constructor() {
    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates
      .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(() => this.updateAvailable.set(true));
  }

  async applyUpdate(): Promise<void> {
    await this.swUpdate.activateUpdate();
    window.location.reload();
  }
}
```

## `ngsw-config.json` — Cache Strategy

```json
{
  "$schema": "./node_modules/@angular/service-worker/config/schema.json",
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app-shell",
      "installMode": "prefetch",
      "resources": {
        "files": ["/favicon.ico", "/index.html", "/manifest.webmanifest", "/*.css", "/*.js"]
      }
    },
    {
      "name": "assets",
      "installMode": "lazy",
      "updateMode": "prefetch",
      "resources": {
        "files": ["/assets/**"]
      }
    }
  ]
}
```

## Offline-First Rules

- **No feature may call a network API.** Data is always read from / written to Dexie (IndexedDB).
- Never show a "You are offline" error page — the app must always work without a connection.
- If checking online status is needed (e.g., for future sync), use `navigator.onLine` and `window.addEventListener('online' / 'offline')`.
- Service worker caches all app shell assets — users get the app instantly on repeat visits.

## Install Prompt

Detect and surface the browser's "Add to Home Screen" prompt:

```ts
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class InstallPromptService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  readonly canInstall = signal(false);

  constructor() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.canInstall.set(true);
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.canInstall.set(false);
    });
  }

  async promptInstall(): Promise<void> {
    if (!this.deferredPrompt) return;
    this.deferredPrompt.prompt();
    await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    this.canInstall.set(false);
  }
}

// Extend the Window type in a global.d.ts file:
// interface BeforeInstallPromptEvent extends Event {
//   prompt(): Promise<void>;
//   userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
// }
```
