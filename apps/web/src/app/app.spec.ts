import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { createAccessibilityTheme } from '@senior-ease/tokens';

import { App } from './app';
import { ThemeService } from './application/services/theme.service';

describe('App', () => {
  const themeServiceMock = {
    initializeTheme: vi
      .fn<ThemeService['initializeTheme']>()
      .mockReturnValue(of(createAccessibilityTheme())),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), { provide: ThemeService, useValue: themeServiceMock }],
    }).compileComponents();

    themeServiceMock.initializeTheme.mockClear();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should initialize the theme on startup', () => {
    const fixture = TestBed.createComponent(App);

    fixture.detectChanges();

    expect(themeServiceMock.initializeTheme).toHaveBeenCalledOnce();
  });

  it('should render the router outlet and exactly one global toast', () => {
    const fixture = TestBed.createComponent(App);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('se-toast')).toHaveLength(1);
  });
});
