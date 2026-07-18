import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import type { UserProfile } from '@senior-ease/core';
import { Observable, of, throwError } from 'rxjs';
import type { Mock } from 'vitest';

import { UserSessionService } from '../../../../application/services/user-session.service';
import { Header } from './header';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;
  let router: RouterMock;
  let userSessionService: UserSessionServiceMock;

  beforeEach(async () => {
    router = createRouterMock();
    userSessionService = createUserSessionServiceMock();

    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        { provide: Router, useValue: router },
        { provide: UserSessionService, useValue: userSessionService },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    createComponent();

    expect(component).toBeTruthy();
  });

  it('should show the SeniorEase logo', () => {
    createComponent();

    expect(fixture.nativeElement.textContent).toContain('SeniorEase');
  });

  it('should show the current user name from the session', () => {
    userSessionService.getCurrentUserProfile.mockReturnValue(of(createUserProfile('Maria Helena')));

    createComponent();

    expect(getUserName().textContent).toContain('Maria Helena');
  });

  it('should show a fallback user name when there is no current user profile', () => {
    userSessionService.getCurrentUserProfile.mockReturnValue(of(null));

    createComponent();

    expect(getUserName().textContent).toContain('Usuário');
  });

  it('should show a fallback user name when loading the current user profile fails', () => {
    userSessionService.getCurrentUserProfile.mockReturnValue(
      throwError(() => new Error('Profile not found')),
    );

    createComponent();

    expect(getUserName().textContent).toContain('Usuário');
  });

  it('should render the menu button with an accessible label', () => {
    createComponent();

    expect(getMenuButton().getAttribute('aria-label')).toBe('Abrir menu principal');
  });

  it('should clear the current user and navigate to welcome when switching users', () => {
    createComponent();

    getSwitchUserButton().click();

    expect(userSessionService.clearCurrentUser).toHaveBeenCalledOnce();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/welcome');
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function getUserName(): HTMLElement {
    return fixture.nativeElement.querySelector('.header__user-name')!;
  }

  function getMenuButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.header__menu-button')!;
  }

  function getSwitchUserButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.header__switch-user')!;
  }

  function createRouterMock(): RouterMock {
    return {
      navigateByUrl: vi.fn(() => Promise.resolve(true)),
    };
  }

  function createUserSessionServiceMock(): UserSessionServiceMock {
    return {
      getCurrentUserProfile: vi.fn(() => of(createUserProfile('Ana Maria'))),
      clearCurrentUser: vi.fn(),
    };
  }

  function createUserProfile(name: string): UserProfile {
    return {
      id: 'user-1',
      name,
      createdAt: '2026-07-14T10:00:00.000Z',
      updatedAt: '2026-07-14T10:00:00.000Z',
    };
  }
});

type RouterMock = {
  navigateByUrl: Mock<(url: string) => Promise<boolean>>;
};

type UserSessionServiceMock = {
  getCurrentUserProfile: Mock<() => Observable<UserProfile | null>>;
  clearCurrentUser: Mock<() => void>;
};
