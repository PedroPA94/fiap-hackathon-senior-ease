import type { Routes } from '@angular/router';
import { currentUserGuard } from './core/guards/current-user-guard';
import { onboardingCompletedGuard } from './core/guards/onboarding-completed-guard';
import { onboardingSetupGuard } from './core/guards/onboarding-setup-guard';

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
    canActivate: [currentUserGuard, onboardingSetupGuard],
    loadComponent: () =>
      import('./presentation/features/personalization/pages/personalization-setup/personalization-setup').then(
        (m) => m.PersonalizationSetup,
      ),
  },
  {
    path: '',
    canActivate: [currentUserGuard, onboardingCompletedGuard],
    loadComponent: () =>
      import('./presentation/shared/layout/app-shell/app-shell').then((module) => module.AppShell),
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./presentation/features/home/home').then((module) => module.Home),
      },
      {
        path: 'activities',
        loadComponent: () =>
          import('./presentation/features/activities/pages/activities/activities').then(
            (module) => module.Activities,
          ),
      },
      {
        path: 'activities/new',
        loadComponent: () =>
          import(
            './presentation/features/activities/pages/activity-create/activity-create'
          ).then((module) => module.ActivityCreate),
      },
      {
        path: 'activities/:activityId',
        loadComponent: () =>
          import(
            './presentation/features/activities/pages/activity-details/activity-details'
          ).then((module) => module.ActivityDetails),
      },
      {
        path: 'personalization',
        loadComponent: () =>
          import(
            './presentation/features/personalization/pages/personalization/personalization'
          ).then((module) => module.Personalization),
      },
    ],
  },
];
