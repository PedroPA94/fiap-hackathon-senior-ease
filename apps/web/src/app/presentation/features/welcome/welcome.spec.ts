import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import type { EntityId, UserProfile } from '@senior-ease/core';
import { createAccessibilityTheme, type AccessibilityTheme } from '@senior-ease/tokens';
import { Observable, of, Subject, throwError } from 'rxjs';
import type { Mock } from 'vitest';

import type { LocalUser } from '../../../application/models/local-user';
import { ThemeService } from '../../../application/services/theme.service';
import { UserSessionService } from '../../../application/services/user-session.service';
import { Welcome } from './welcome';

describe('Welcome', () => {
  let component: Welcome;
  let fixture: ComponentFixture<Welcome>;
  let userSessionService: UserSessionServiceMock;
  let themeService: ThemeServiceMock;
  let router: RouterMock;

  const localUsers: LocalUser[] = [
    {
      id: 'user-1',
      name: 'Maria Helena',
      lastAccessedAt: '2026-07-14T10:00:00.000Z',
    },
    {
      id: 'user-2',
      name: 'Joao Pedro',
      lastAccessedAt: '2026-07-13T10:00:00.000Z',
    },
  ];

  beforeEach(async () => {
    userSessionService = createUserSessionServiceMock();
    themeService = createThemeServiceMock();
    router = createRouterMock();

    await TestBed.configureTestingModule({
      imports: [Welcome],
      providers: [
        {
          provide: UserSessionService,
          useValue: userSessionService,
        },
        {
          provide: ThemeService,
          useValue: themeService,
        },
        {
          provide: Router,
          useValue: router,
        },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    createComponent();

    expect(component).toBeTruthy();
  });

  it('should start in create-user mode when there are no local users', () => {
    userSessionService.listLocalUsers.mockReturnValue([]);

    createComponent();

    expect(userSessionService.listLocalUsers).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.textContent).toContain('Vamos começar?');
    expect(fixture.nativeElement.querySelector('se-create-user-form')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('se-local-user-selector')).toBeFalsy();
    expect(getBackButton()).toBeNull();
  });

  it('should start in select-user mode when local users exist', () => {
    userSessionService.listLocalUsers.mockReturnValue(localUsers);

    createComponent();

    expect(fixture.nativeElement.textContent).toContain('Quem está usando?');
    expect(fixture.nativeElement.textContent).toContain('Maria Helena');
    expect(fixture.nativeElement.textContent).toContain('Joao Pedro');
    expect(fixture.nativeElement.querySelector('se-local-user-selector')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('se-create-user-form')).toBeFalsy();
  });

  it('should switch from user selection to the create-user form', () => {
    userSessionService.listLocalUsers.mockReturnValue(localUsers);
    createComponent();

    getCreateNewButton().click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('se-create-user-form')).toBeTruthy();
    expect(getBackButton()?.textContent).toContain('Voltar para os perfis existentes');
  });

  it('should switch back to user selection when there are local users', () => {
    userSessionService.listLocalUsers.mockReturnValue(localUsers);
    createComponent();

    getCreateNewButton().click();
    fixture.detectChanges();
    getBackButton()!.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('se-local-user-selector')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('se-create-user-form')).toBeFalsy();
  });

  it('should create a local user and apply the current user theme', () => {
    createComponent();

    component.createUser('Ana Maria');

    expect(userSessionService.createLocalUser).toHaveBeenCalledWith('Ana Maria');
    expect(themeService.applyCurrentUserTheme).toHaveBeenCalledOnce();
    expect(router.navigate).toHaveBeenCalledWith(['/personalization']);
  });

  it('should ignore duplicate create submissions while a user is being created', () => {
    const createUserSubject = new Subject<UserProfile>();
    userSessionService.createLocalUser.mockReturnValue(createUserSubject.asObservable());
    createComponent();

    component.createUser('Ana Maria');
    component.createUser('Ana Maria');

    createUserSubject.next(createUserProfile('user-3', 'Ana Maria'));
    createUserSubject.complete();

    expect(userSessionService.createLocalUser).toHaveBeenCalledOnce();
    expect(themeService.applyCurrentUserTheme).toHaveBeenCalledOnce();
    expect(router.navigate).toHaveBeenCalledOnce();
  });

  it('should show an error and stay on welcome when creating a user fails', () => {
    userSessionService.createLocalUser.mockReturnValue(
      throwError(() => new Error('Create failed')),
    );
    createComponent();

    component.createUser('Ana Maria');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Não foi possível criar o perfil. Tente novamente.',
    );
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should select a local user and apply the current user theme', () => {
    userSessionService.listLocalUsers.mockReturnValue(localUsers);
    createComponent();

    selectUser('user-2');

    expect(userSessionService.selectLocalUser).toHaveBeenCalledWith('user-2');
    expect(themeService.applyCurrentUserTheme).toHaveBeenCalledOnce();
    expect(router.navigate).toHaveBeenCalledWith(['/personalization']);
  });

  it('should refresh the local user list when selecting a user fails', () => {
    const refreshedUsers = [localUsers[1]];
    userSessionService.listLocalUsers
      .mockReturnValueOnce(localUsers)
      .mockReturnValue(refreshedUsers);
    userSessionService.selectLocalUser.mockReturnValue(
      throwError(() => new Error('User not found')),
    );
    createComponent();

    selectUser('user-1');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Maria Helena');
    expect(fixture.nativeElement.textContent).toContain('Joao Pedro');
    expect(fixture.nativeElement.textContent).toContain(
      'Não foi possível abrir este perfil. Selecione outro usuário.',
    );
    expect(themeService.applyCurrentUserTheme).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(Welcome);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function getCreateNewButton(): HTMLButtonElement {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];

    return buttons.find((button) => button.textContent?.includes('Criar novo usuário') ?? false)!;
  }

  function getBackButton(): HTMLButtonElement | null {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];

    return (
      buttons.find(
        (button) => button.textContent?.includes('Voltar para os perfis existentes') ?? false,
      ) ?? null
    );
  }

  function selectUser(userId: EntityId): void {
    (
      component as unknown as {
        selectUser(userId: EntityId): void;
      }
    ).selectUser(userId);
  }

  function createUserSessionServiceMock(): UserSessionServiceMock {
    return {
      listLocalUsers: vi.fn(() => []),
      createLocalUser: vi.fn((name: string) => of(createUserProfile('user-3', name))),
      selectLocalUser: vi.fn((userId: EntityId) => of(createUserProfile(userId, 'Selected User'))),
    };
  }

  function createThemeServiceMock(): ThemeServiceMock {
    return {
      applyCurrentUserTheme: vi.fn(() => of(createAccessibilityTheme())),
    };
  }

  function createRouterMock(): RouterMock {
    return {
      navigate: vi.fn(() => Promise.resolve(true)),
    };
  }

  function createUserProfile(id: EntityId, name: string): UserProfile {
    return {
      id,
      name,
      createdAt: '2026-07-14T10:00:00.000Z',
      updatedAt: '2026-07-14T10:00:00.000Z',
    };
  }
});

type UserSessionServiceMock = {
  listLocalUsers: Mock<() => LocalUser[]>;
  createLocalUser: Mock<(name: string) => Observable<UserProfile>>;
  selectLocalUser: Mock<(userId: EntityId) => Observable<UserProfile>>;
};

type ThemeServiceMock = {
  applyCurrentUserTheme: Mock<() => Observable<AccessibilityTheme>>;
};

type RouterMock = {
  navigate: Mock<(commands: unknown[]) => Promise<boolean>>;
};
