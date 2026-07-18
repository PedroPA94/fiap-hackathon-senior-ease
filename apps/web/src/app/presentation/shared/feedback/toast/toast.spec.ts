import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Toast } from './toast';
import { ToastService } from './toast.service';

describe('Toast', () => {
  let component: Toast;
  let fixture: ComponentFixture<Toast>;
  let toastService: ToastService;

  beforeEach(async () => {
    vi.useFakeTimers();

    await TestBed.configureTestingModule({
      imports: [Toast],
    }).compileComponents();

    toastService = TestBed.inject(ToastService);
    fixture = TestBed.createComponent(Toast);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should not render a toast when the service is empty', () => {
    fixture.detectChanges();

    expect(getToastElement()).toBeNull();
  });

  it('should render the current message', () => {
    toastService.info('Preferencias atualizadas.');

    fixture.detectChanges();

    expect(getToastElement()?.textContent).toContain('Preferencias atualizadas.');
  });

  it.each([
    ['success', 'toast--success'],
    ['error', 'toast--error'],
    ['info', 'toast--info'],
  ] as const)('should apply the %s variant class', (variant, expectedClass) => {
    toastService[variant]('Mensagem de teste.');

    fixture.detectChanges();

    expect(getToastElement()?.classList.contains(expectedClass)).toBe(true);
  });

  it('should expose assertive alert semantics for errors', () => {
    toastService.error('Erro ao salvar.');

    fixture.detectChanges();

    expect(getToastElement()?.getAttribute('role')).toBe('alert');
    expect(getToastElement()?.getAttribute('aria-live')).toBe('assertive');
    expect(getToastElement()?.getAttribute('aria-atomic')).toBe('true');
  });

  it.each(['success', 'info'] as const)(
    'should expose polite status semantics for %s messages',
    (variant) => {
      toastService[variant]('Operacao concluida.');

      fixture.detectChanges();

      expect(getToastElement()?.getAttribute('role')).toBe('status');
      expect(getToastElement()?.getAttribute('aria-live')).toBe('polite');
      expect(getToastElement()?.getAttribute('aria-atomic')).toBe('true');
    },
  );

  it('should render an accessible close button', () => {
    toastService.info('Mensagem informativa.');

    fixture.detectChanges();

    const closeButton = getCloseButton();
    expect(closeButton?.type).toBe('button');
    expect(closeButton?.getAttribute('aria-label')).toBe('Fechar mensagem');
  });

  it('should dismiss the toast when the close button is clicked', () => {
    const dismissSpy = vi.spyOn(toastService, 'dismiss');
    toastService.error('Mensagem com fechamento manual.');
    fixture.detectChanges();

    getCloseButton()?.click();
    fixture.detectChanges();

    expect(dismissSpy).toHaveBeenCalledOnce();
    expect(getToastElement()).toBeNull();
  });

  it('should replace the rendered content when the service shows a new message', () => {
    toastService.error('Primeira mensagem.');
    fixture.detectChanges();

    toastService.info('Segunda mensagem.');
    fixture.detectChanges();

    expect(getToastElement()?.textContent).not.toContain('Primeira mensagem.');
    expect(getToastElement()?.textContent).toContain('Segunda mensagem.');
  });

  it('should render message markup as text', () => {
    const message = '<img src=x onerror="alert(1)">Mensagem segura';
    toastService.error(message);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.querySelector('.toast__message')?.textContent).toBe(message);
  });

  function getToastElement(): HTMLElement | null {
    return fixture.nativeElement.querySelector('.toast');
  }

  function getCloseButton(): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector('.toast__close');
  }
});
