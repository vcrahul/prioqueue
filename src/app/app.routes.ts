import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'today', pathMatch: 'full' },
  {
    path: 'today',
    loadComponent: () => import('./features/today/today.component').then(m => m.TodayComponent),
  },
  {
    path: 'matrix',
    loadComponent: () => import('./features/matrix/matrix.component').then(m => m.MatrixComponent),
  },
  {
    path: 'tasks',
    loadComponent: () => import('./features/tasks/task-list/task-list.component').then(m => m.TaskListComponent),
  },
  {
    path: 'tasks/add',
    loadComponent: () => import('./features/tasks/task-form/task-form.component').then(m => m.TaskFormComponent),
    data: { hideBottomNav: true },
  },
  {
    path: 'tasks/edit/:id',
    loadComponent: () => import('./features/tasks/task-form/task-form.component').then(m => m.TaskFormComponent),
    data: { hideBottomNav: true },
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
  },
  { path: '**', redirectTo: 'today' },
];
