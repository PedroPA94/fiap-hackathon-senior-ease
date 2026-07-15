import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { UserSessionService } from '../../application/services/user-session.service';

export const currentUserGuard: CanActivateFn = () => {
  const userSessionService = inject(UserSessionService);
  const router = inject(Router);

  return userSessionService.getCurrentUserId() ? true : router.createUrlTree(['/welcome']);
};
