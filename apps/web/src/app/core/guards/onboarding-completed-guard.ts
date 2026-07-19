import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';

import { UserSessionService } from '../../application/services/user-session.service';

export const onboardingCompletedGuard: CanActivateFn = () => {
  const userSessionService = inject(UserSessionService);
  const router = inject(Router);
  const currentUserId = userSessionService.getCurrentUserId();

  if (!currentUserId) {
    return router.createUrlTree(['/welcome']);
  }

  return userSessionService.hasCompletedOnboarding(currentUserId)
    ? true
    : router.createUrlTree(['/personalization/setup']);
};
