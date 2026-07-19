import { currentUserGuard } from './core/guards/current-user-guard';
import { onboardingCompletedGuard } from './core/guards/onboarding-completed-guard';
import { onboardingSetupGuard } from './core/guards/onboarding-setup-guard';
import { routes } from './app.routes';

describe('app routes onboarding protection', () => {
  it('keeps welcome public', () => {
    const welcomeRoute = routes.find((route) => route.path === 'welcome');

    expect(welcomeRoute).toBeDefined();
    expect(welcomeRoute?.canActivate).toBeUndefined();
  });

  it('protects setup outside AppShell for pending users only', () => {
    const setupRoute = routes.find((route) => route.path === 'personalization/setup');
    const shellRoute = routes.find((route) => route.path === '' && route.children);

    expect(setupRoute).toBeDefined();
    expect(setupRoute?.canActivate).toEqual([currentUserGuard, onboardingSetupGuard]);
    expect(shellRoute?.children?.some((route) => route.path === 'personalization/setup')).toBe(
      false,
    );
  });

  it('protects AppShell once for all current and future internal routes', () => {
    const shellRoute = routes.find((route) => route.path === '' && route.children);

    expect(shellRoute?.canActivate).toEqual([currentUserGuard, onboardingCompletedGuard]);
    expect(shellRoute?.children?.some((route) => route.path === 'home')).toBe(true);
    expect(shellRoute?.children?.some((route) => route.path === 'personalization')).toBe(true);
  });
});
