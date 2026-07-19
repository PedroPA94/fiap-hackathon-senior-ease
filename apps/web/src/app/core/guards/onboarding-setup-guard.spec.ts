import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree, type CanActivateFn } from '@angular/router';
import type { EntityId } from '@senior-ease/core';
import type { Mock } from 'vitest';

import { UserSessionService } from '../../application/services/user-session.service';
import { onboardingSetupGuard } from './onboarding-setup-guard';

describe('onboardingSetupGuard', () => {
  let router: Router;
  let userSessionService: UserSessionServiceMock;

  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => onboardingSetupGuard(...guardParameters));

  beforeEach(() => {
    userSessionService = {
      getCurrentUserId: vi.fn(() => null),
      hasCompletedOnboarding: vi.fn(() => false),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: UserSessionService, useValue: userSessionService },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('redirects to welcome when there is no current user', () => {
    const result = executeGuard({} as never, {} as never);

    expectRedirect(result, '/welcome');
    expect(userSessionService.hasCompletedOnboarding).not.toHaveBeenCalled();
  });

  it('allows pending users to access setup', () => {
    userSessionService.getCurrentUserId.mockReturnValue('user-1');

    expect(executeGuard({} as never, {} as never)).toBe(true);
    expect(userSessionService.hasCompletedOnboarding).toHaveBeenCalledWith('user-1');
  });

  it('redirects completed users to home', () => {
    userSessionService.getCurrentUserId.mockReturnValue('user-1');
    userSessionService.hasCompletedOnboarding.mockReturnValue(true);
    const result = executeGuard({} as never, {} as never);

    expectRedirect(result, '/home');
  });

  function expectRedirect(result: ReturnType<CanActivateFn>, expectedUrl: string): void {
    expect(result).toBeInstanceOf(UrlTree);

    if (result instanceof UrlTree) {
      expect(router.serializeUrl(result)).toBe(expectedUrl);
    }
  }
});

type UserSessionServiceMock = {
  getCurrentUserId: Mock<() => EntityId | null>;
  hasCompletedOnboarding: Mock<(userId?: EntityId) => boolean>;
};
