import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/home/home').then((m) => m.HomeComponent),
  },
  {
    path: 'summary',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/summary/summary').then((m) => m.SummaryComponent),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/settings/settings').then((m) => m.SettingsComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then((m) => m.LoginComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
