import { Routes } from '@angular/router';
import { currentUserGuard } from './core/guards/current-user-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/welcome',
    pathMatch: 'full',
  },
  {
    path: 'welcome',
    loadComponent: () => import('./presentation/features/welcome/welcome').then((m) => m.Welcome),
  },
  {
    path: 'personalization/setup',
    canActivate: [currentUserGuard],
    loadComponent: () =>
      import('./presentation/features/personalization/pages/personalization-setup/personalization-setup').then(
        (m) => m.PersonalizationSetup,
      ),
  },
  {
    path: '',
    canActivate: [currentUserGuard],
    loadComponent: () =>
      import('./presentation/shared/layout/app-shell/app-shell').then((module) => module.AppShell),
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./presentation/features/home/home').then((module) => module.Home),
      },
    ],
  },
];
