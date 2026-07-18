import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { defaultAccessibilityPreferences, type UserProfile } from '@senior-ease/core';
import { Observable, of } from 'rxjs';
import type { Mock } from 'vitest';

import { AccessibilityPreferencesService } from '../../../../../application/services/accessibility-preferences.service';
import { UserSessionService } from '../../../../../application/services/user-session.service';
import { PersonalizationSetup } from './personalization-setup';

describe('PersonalizationSetup', () => {
  const accessibilityPreferencesServiceMock = {
    getPreferences: vi
      .fn<AccessibilityPreferencesService['getPreferences']>()
      .mockReturnValue(of(defaultAccessibilityPreferences)),
  };

  let component: PersonalizationSetup;
  let fixture: ComponentFixture<PersonalizationSetup>;
  let router: RouterMock;
  let userSessionService: UserSessionServiceMock;

  beforeEach(async () => {
    router = createRouterMock();
    userSessionService = createUserSessionServiceMock();

    await TestBed.configureTestingModule({
      imports: [PersonalizationSetup],
      providers: [
        { provide: Router, useValue: router },
        { provide: UserSessionService, useValue: userSessionService },
        {
          provide: AccessibilityPreferencesService,
          useValue: accessibilityPreferencesServiceMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PersonalizationSetup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  function createRouterMock(): RouterMock {
    return {
      navigateByUrl: vi.fn(() => Promise.resolve(true)),
    };
  }

  function createUserSessionServiceMock(): UserSessionServiceMock {
    return {
      getCurrentUserProfile: vi.fn(() => of(createUserProfile())),
      clearCurrentUser: vi.fn(),
    };
  }

  function createUserProfile(): UserProfile {
    return {
      id: 'user-1',
      name: 'Maria Helena',
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
