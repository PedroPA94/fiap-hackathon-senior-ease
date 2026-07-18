import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import type { UserProfile } from '@senior-ease/core';
import { Observable, of } from 'rxjs';
import type { Mock } from 'vitest';

import { UserSessionService } from '../../../../application/services/user-session.service';
import { AppShell } from './app-shell';

@Component({
  template: '<h1 class="routed-content">Conteúdo da rota</h1>',
})
class RoutedContent {}

describe('AppShell', () => {
  let component: AppShell;
  let fixture: ComponentFixture<AppShell>;
  let router: Router;
  let userSessionService: UserSessionServiceMock;

  beforeEach(async () => {
    userSessionService = createUserSessionServiceMock();

    await TestBed.configureTestingModule({
      imports: [AppShell],
      providers: [
        provideRouter([
          { path: 'home', component: RoutedContent },
          { path: 'personalization', component: RoutedContent },
          { path: 'activities', component: RoutedContent },
          { path: 'welcome', component: RoutedContent },
        ]),
        { provide: UserSessionService, useValue: userSessionService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(AppShell);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    renderComponent();

    expect(component).toBeTruthy();
  });

  it('should render the header, navigation menu and router outlet', () => {
    renderComponent();

    expect(fixture.nativeElement.querySelector('se-header')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('se-navigation-menu')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
  });

  it('should expose an identifiable and programmatically focusable main content region', () => {
    renderComponent();

    const mainContent = getMainContent();
    expect(mainContent.id).toBe('main-content');
    expect(mainContent.getAttribute('tabindex')).toBe('-1');
  });

  it('should render routed content inside the main region', async () => {
    renderComponent();

    await navigateTo('/home');

    expect(getMainContent().querySelector('.routed-content')?.textContent).toContain(
      'Conteúdo da rota',
    );
  });

  it('should keep the navigation menu closed by default', () => {
    renderComponent();

    expect(isMenuOpen()).toBe(false);
    expect(getMenuButton().getAttribute('aria-expanded')).toBe('false');
    expect(getBackdrop()).toBeNull();
  });

  it('should open and close the navigation menu from the header button', () => {
    renderComponent();

    getMenuButton().click();
    fixture.detectChanges();

    expect(isMenuOpen()).toBe(true);
    expect(getMenuButton().getAttribute('aria-expanded')).toBe('true');
    expect(getBackdrop()).toBeTruthy();

    getMenuButton().click();
    fixture.detectChanges();

    expect(isMenuOpen()).toBe(false);
    expect(getMenuButton().getAttribute('aria-expanded')).toBe('false');
  });

  it('should close the navigation menu when the backdrop is clicked', () => {
    renderComponent();
    openMenu();

    getBackdrop()?.click();
    fixture.detectChanges();

    expect(isMenuOpen()).toBe(false);
    expect(getBackdrop()).toBeNull();
  });

  it('should close the navigation menu when Escape is pressed', () => {
    renderComponent();
    openMenu();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(isMenuOpen()).toBe(false);
    expect(getMenuButton().getAttribute('aria-expanded')).toBe('false');
  });

  it('should close the navigation menu when a navigation item is selected', () => {
    renderComponent();
    openMenu();

    getNavigationLinks()[0].click();
    fixture.detectChanges();

    expect(isMenuOpen()).toBe(false);
  });

  function renderComponent(): void {
    fixture.detectChanges();
  }

  async function navigateTo(url: string): Promise<void> {
    await router.navigateByUrl(url);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function openMenu(): void {
    getMenuButton().click();
    fixture.detectChanges();
  }

  function getMainContent(): HTMLElement {
    return fixture.nativeElement.querySelector('.app-shell__content')!;
  }

  function getMenuButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.header__menu-button')!;
  }

  function getBackdrop(): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector('.navigation-menu__backdrop');
  }

  function getNavigationLinks(): HTMLAnchorElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.navigation-menu__item'));
  }

  function isMenuOpen(): boolean {
    return fixture.nativeElement
      .querySelector('.navigation-menu')
      .classList.contains('navigation-menu--open');
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

type UserSessionServiceMock = {
  getCurrentUserProfile: Mock<() => Observable<UserProfile | null>>;
  clearCurrentUser: Mock<() => void>;
};
