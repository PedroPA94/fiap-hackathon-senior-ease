import { TestBed } from '@angular/core/testing';

import { createAccessibilityTheme } from '@senior-ease/tokens';

import { App } from './app';
import { ThemeService } from './application/services/theme.service';

describe('App', () => {
  const themeServiceMock = {
    initializeTheme: vi.fn<ThemeService['initializeTheme']>().mockResolvedValue(
      createAccessibilityTheme(),
    ),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [{ provide: ThemeService, useValue: themeServiceMock }],
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
});
