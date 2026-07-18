import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { NavigationMenu, type NavigationMenuItem } from './navigation-menu';

@Component({
  template: '',
})
class EmptyRoute {}

describe('NavigationMenu', () => {
  let component: NavigationMenu;
  let fixture: ComponentFixture<NavigationMenu>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationMenu],
      providers: [
        provideRouter([
          { path: 'home', component: EmptyRoute },
          { path: 'home/details', component: EmptyRoute },
          { path: 'personalization', component: EmptyRoute },
          { path: 'personalization/setup', component: EmptyRoute },
          { path: 'activities', component: EmptyRoute },
        ]),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(NavigationMenu);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    renderComponent();

    expect(component).toBeTruthy();
  });

  it('should render the default navigation items and routes', () => {
    renderComponent();

    expect(getLinkLabels()).toEqual(['Início', 'Personalização', 'Atividades']);
    expect(getLinks().map((link) => link.getAttribute('href'))).toEqual([
      '/home',
      '/personalization',
      '/activities',
    ]);
  });

  it('should identify the navigation landmark accessibly', () => {
    renderComponent();

    expect(fixture.nativeElement.querySelector('nav')?.getAttribute('aria-label')).toBe(
      'Navegação principal',
    );
    expect(getMenuElement().id).toBe('main-navigation-menu');
  });

  it('should remain closed and not render a backdrop by default', () => {
    renderComponent();

    expect(getMenuElement().classList.contains('navigation-menu--open')).toBe(false);
    expect(getBackdrop()).toBeNull();
  });

  it('should open the drawer and render an accessible backdrop', () => {
    fixture.componentRef.setInput('open', true);

    renderComponent();

    expect(getMenuElement().classList.contains('navigation-menu--open')).toBe(true);
    expect(getBackdrop()?.type).toBe('button');
    expect(getBackdrop()?.getAttribute('aria-label')).toBe('Fechar menu principal');
    expect(getBackdrop()?.getAttribute('tabindex')).toBe('-1');
  });

  it('should emit closed when the backdrop is clicked', () => {
    const closedSpy = vi.fn();
    component.closed.subscribe(closedSpy);
    fixture.componentRef.setInput('open', true);
    renderComponent();

    getBackdrop()?.click();

    expect(closedSpy).toHaveBeenCalledOnce();
  });

  it('should emit closed on Escape only while the menu is open', () => {
    const closedSpy = vi.fn();
    component.closed.subscribe(closedSpy);
    renderComponent();

    pressEscape();
    expect(closedSpy).not.toHaveBeenCalled();

    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    pressEscape();

    expect(closedSpy).toHaveBeenCalledOnce();
  });

  it('should emit closed when a navigation item is clicked', () => {
    const closedSpy = vi.fn();
    component.closed.subscribe(closedSpy);
    renderComponent();

    getLinks()[0].click();

    expect(closedSpy).toHaveBeenCalledOnce();
  });

  it('should render custom navigation items instead of the defaults', () => {
    const customItems: readonly NavigationMenuItem[] = [
      { label: 'Perfil', route: '/personalization' },
      { label: 'Configurações', route: '/personalization/setup' },
    ];
    fixture.componentRef.setInput('items', customItems);

    renderComponent();

    expect(getLinkLabels()).toEqual(['Perfil', 'Configurações']);
    expect(getLinks().map((link) => link.getAttribute('href'))).toEqual([
      '/personalization',
      '/personalization/setup',
    ]);
  });

  it('should mark the current exact route as active and expose aria-current', async () => {
    renderComponent();

    await navigateTo('/home');

    const homeLink = getLinks()[0];
    expect(homeLink.classList.contains('navigation-menu__item--active')).toBe(true);
    expect(homeLink.getAttribute('aria-current')).toBe('page');
  });

  it('should not mark an exact parent link as active on a child route', async () => {
    renderComponent();

    await navigateTo('/home/details');

    const homeLink = getLinks()[0];
    expect(homeLink.classList.contains('navigation-menu__item--active')).toBe(false);
    expect(homeLink.hasAttribute('aria-current')).toBe(false);
  });

  it('should mark a non-exact parent link as active on a child route', async () => {
    fixture.componentRef.setInput('items', [
      {
        label: 'Personalização',
        route: '/personalization',
      },
    ] satisfies readonly NavigationMenuItem[]);
    renderComponent();

    await navigateTo('/personalization/setup');

    const personalizationLink = getLinks()[0];
    expect(personalizationLink.classList.contains('navigation-menu__item--active')).toBe(true);
    expect(personalizationLink.getAttribute('aria-current')).toBe('page');
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

  function getMenuElement(): HTMLElement {
    return fixture.nativeElement.querySelector('.navigation-menu')!;
  }

  function getBackdrop(): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector('.navigation-menu__backdrop');
  }

  function getLinks(): HTMLAnchorElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.navigation-menu__item'));
  }

  function getLinkLabels(): string[] {
    return getLinks().map((link) => link.textContent?.trim() ?? '');
  }

  function pressEscape(): void {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  }
});
