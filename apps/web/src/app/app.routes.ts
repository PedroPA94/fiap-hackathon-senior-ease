import { Routes } from '@angular/router';

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
];
