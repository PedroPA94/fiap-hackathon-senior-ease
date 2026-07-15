import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Header } from './header';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
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

  it('should show the current user name', () => {
    createComponent('Maria Helena');

    expect(getUserName().textContent).toContain('Maria Helena');
  });

  it('should emit menuRequested when the menu button is clicked', () => {
    const menuRequested = vi.fn();
    createComponent();
    component.menuRequested.subscribe(menuRequested);

    getMenuButton().click();

    expect(menuRequested).toHaveBeenCalledOnce();
  });

  it('should emit switchUserRequested when the switch user button is clicked', () => {
    const switchUserRequested = vi.fn();
    createComponent();
    component.switchUserRequested.subscribe(switchUserRequested);

    getSwitchUserButton().click();

    expect(switchUserRequested).toHaveBeenCalledOnce();
  });

  function createComponent(userName = 'Ana Maria'): void {
    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('userName', userName);
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
});
