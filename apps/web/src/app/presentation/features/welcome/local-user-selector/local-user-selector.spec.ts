import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { LocalUser } from '../../../../application/models/local-user';
import { LocalUserSelector } from './local-user-selector';

describe('LocalUserSelector', () => {
  let component: LocalUserSelector;
  let fixture: ComponentFixture<LocalUserSelector>;

  const users: LocalUser[] = [
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
    await TestBed.configureTestingModule({
      imports: [LocalUserSelector],
    }).compileComponents();

    fixture = TestBed.createComponent(LocalUserSelector);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('users', users);
    await fixture.whenStable();
  });

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should render the available local users', () => {
    fixture.detectChanges();

    const userButtons = getUserButtons();

    expect(fixture.nativeElement.textContent).toContain('Quem está usando?');
    expect(userButtons).toHaveLength(2);
    expect(userButtons[0].textContent).toContain('Maria Helena');
    expect(userButtons[0].textContent).toContain('Continuar com este perfil');
    expect(userButtons[1].textContent).toContain('Joao Pedro');
  });

  it('should emit the selected user id when a user is clicked', () => {
    const userSelected = vi.fn<(userId: string) => void>();
    component.userSelected.subscribe(userSelected);
    fixture.detectChanges();

    getUserButtons()[1].click();

    expect(userSelected).toHaveBeenCalledWith('user-2');
  });

  it('should emit when creating a new user is requested', () => {
    const createNewRequested = vi.fn<() => void>();
    component.createNewRequested.subscribe(createNewRequested);
    fixture.detectChanges();

    getCreateButton().click();

    expect(createNewRequested).toHaveBeenCalledOnce();
  });

  it('should disable actions and mark the loading user as busy', () => {
    const userSelected = vi.fn<(userId: string) => void>();
    const createNewRequested = vi.fn<() => void>();
    component.userSelected.subscribe(userSelected);
    component.createNewRequested.subscribe(createNewRequested);
    fixture.componentRef.setInput('loadingUserId', 'user-1');
    fixture.detectChanges();

    const userButtons = getUserButtons();
    userButtons[0].click();
    getCreateButton().click();

    expect(userButtons[0].disabled).toBe(true);
    expect(userButtons[0].getAttribute('aria-busy')).toBe('true');
    expect(userButtons[1].disabled).toBe(true);
    expect(getCreateButton().disabled).toBe(true);
    expect(userSelected).not.toHaveBeenCalled();
    expect(createNewRequested).not.toHaveBeenCalled();
  });

  function getUserButtons(): HTMLButtonElement[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('.user-selector__user'),
    ) as HTMLButtonElement[];
  }

  function getCreateButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('se-button button') as HTMLButtonElement;
  }
});
