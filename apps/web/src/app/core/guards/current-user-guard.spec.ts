import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import type { EntityId } from '@senior-ease/core';
import type { Mock } from 'vitest';

import { UserSessionService } from '../../application/services/user-session.service';
import { currentUserGuard } from './current-user-guard';

describe('currentUserGuard', () => {
  let router: RouterMock;
  let userSessionService: UserSessionServiceMock;

  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => currentUserGuard(...guardParameters));

  beforeEach(() => {
    router = createRouterMock();
    userSessionService = createUserSessionServiceMock();

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: UserSessionService, useValue: userSessionService },
      ],
    });
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });

  it('should allow activation when there is a current user', () => {
    userSessionService.getCurrentUserId.mockReturnValue('user-1');

    const result = executeGuard({} as never, {} as never);

    expect(result).toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('should redirect to welcome when there is no current user', () => {
    const redirectTree = {} as UrlTree;
    userSessionService.getCurrentUserId.mockReturnValue(null);
    router.createUrlTree.mockReturnValue(redirectTree);

    const result = executeGuard({} as never, {} as never);

    expect(result).toBe(redirectTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/welcome']);
  });

  function createRouterMock(): RouterMock {
    return {
      createUrlTree: vi.fn(),
    };
  }

  function createUserSessionServiceMock(): UserSessionServiceMock {
    return {
      getCurrentUserId: vi.fn(() => null),
    };
  }
});

type RouterMock = {
  createUrlTree: Mock<(commands: unknown[]) => UrlTree>;
};

type UserSessionServiceMock = {
  getCurrentUserId: Mock<() => EntityId | null>;
};
