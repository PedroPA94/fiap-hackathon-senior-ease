import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { EntityId, UserProfile } from '@senior-ease/core';
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

  it('should create a local user and apply the current user theme', async () => {
    createComponent();

    await component.createUser('Ana Maria');

    expect(userSessionService.createLocalUser).toHaveBeenCalledWith('Ana Maria');
    expect(themeService.applyCurrentUserTheme).toHaveBeenCalledOnce();
  });

  it('should ignore duplicate create submissions while a user is being created', async () => {
    let resolveCreateUser!: () => void;
    userSessionService.createLocalUser.mockReturnValue(
      new Promise((resolve) => {
        resolveCreateUser = () => resolve(createUserProfile('user-3', 'Ana Maria'));
      }),
    );
    createComponent();

    const firstSubmission = component.createUser('Ana Maria');
    const secondSubmission = component.createUser('Ana Maria');

    resolveCreateUser();
    await Promise.all([firstSubmission, secondSubmission]);

    expect(userSessionService.createLocalUser).toHaveBeenCalledOnce();
    expect(themeService.applyCurrentUserTheme).toHaveBeenCalledOnce();
  });

  it('should select a local user and apply the current user theme', async () => {
    userSessionService.listLocalUsers.mockReturnValue(localUsers);
    createComponent();

    await selectUser('user-2');

    expect(userSessionService.selectLocalUser).toHaveBeenCalledWith('user-2');
    expect(themeService.applyCurrentUserTheme).toHaveBeenCalledOnce();
  });

  it('should refresh the local user list when selecting a user fails', async () => {
    const refreshedUsers = [localUsers[1]];
    userSessionService.listLocalUsers
      .mockReturnValueOnce(localUsers)
      .mockReturnValue(refreshedUsers);
    userSessionService.selectLocalUser.mockRejectedValue(new Error('User not found'));
    createComponent();

    await selectUser('user-1');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Maria Helena');
    expect(fixture.nativeElement.textContent).toContain('Joao Pedro');
    expect(themeService.applyCurrentUserTheme).not.toHaveBeenCalled();
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

  async function selectUser(userId: EntityId): Promise<void> {
    await (
      component as unknown as {
        selectUser(userId: EntityId): Promise<void>;
      }
    ).selectUser(userId);
  }

  function createUserSessionServiceMock(): UserSessionServiceMock {
    return {
      listLocalUsers: vi.fn(() => []),
      createLocalUser: vi.fn(async (name: string) => createUserProfile('user-3', name)),
      selectLocalUser: vi.fn(async (userId: EntityId) => createUserProfile(userId, 'Selected User')),
    };
  }

  function createThemeServiceMock(): ThemeServiceMock {
    return {
      applyCurrentUserTheme: vi.fn(async () => undefined),
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
  createLocalUser: Mock<(name: string) => Promise<UserProfile>>;
  selectLocalUser: Mock<(userId: EntityId) => Promise<UserProfile>>;
};

type ThemeServiceMock = {
  applyCurrentUserTheme: Mock<() => Promise<void>>;
};
