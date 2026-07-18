import { TestBed } from '@angular/core/testing';

import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start without a toast', () => {
    expect(service.toast()).toBeNull();
  });

  it('should show a normalized success toast and dismiss it after 6000 ms', () => {
    service.success('  Preferencias salvas.  ');

    expect(service.toast()).toMatchObject({
      message: 'Preferencias salvas.',
      variant: 'success',
    });
    expect(service.toast()?.id).toBeDefined();

    vi.advanceTimersByTime(5999);
    expect(service.toast()).not.toBeNull();

    vi.advanceTimersByTime(1);
    expect(service.toast()).toBeNull();
  });

  it('should show an info toast and dismiss it after 6000 ms', () => {
    service.info('Novas informacoes disponiveis.');

    expect(service.toast()?.variant).toBe('info');

    vi.advanceTimersByTime(6000);
    expect(service.toast()).toBeNull();
  });

  it('should keep an error toast visible until it is dismissed or replaced', () => {
    service.error('Nao foi possivel salvar.');

    vi.advanceTimersByTime(12000);

    expect(service.toast()).toMatchObject({
      message: 'Nao foi possivel salvar.',
      variant: 'error',
    });
  });

  it('should dismiss the current toast', () => {
    service.error('Erro ao carregar.');

    service.dismiss();

    expect(service.toast()).toBeNull();
  });

  it('should replace the current toast with a new message', () => {
    service.error('Primeira mensagem.');

    service.info('Segunda mensagem.');

    expect(service.toast()).toMatchObject({
      message: 'Segunda mensagem.',
      variant: 'info',
    });
  });

  it('should prevent an old timer from dismissing a newer toast', () => {
    service.success('Primeira mensagem.');
    vi.advanceTimersByTime(3000);

    service.error('Mensagem mais recente.');
    vi.advanceTimersByTime(3000);

    expect(service.toast()).toMatchObject({
      message: 'Mensagem mais recente.',
      variant: 'error',
    });
  });

  it('should cancel the timer when dismiss is called', () => {
    service.success('Mensagem temporaria.');

    service.dismiss();
    vi.advanceTimersByTime(6000);

    expect(service.toast()).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(['', '   ', '\n\t'])('should ignore an empty message: %j', (message) => {
    service.success(message);

    expect(service.toast()).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('should preserve the current toast when an empty message is ignored', () => {
    service.error('Mensagem atual.');

    service.info('   ');

    expect(service.toast()?.message).toBe('Mensagem atual.');
  });

  it('should assign different ids to successive messages', () => {
    service.error('Primeira mensagem.');
    const firstId = service.toast()?.id;

    service.error('Segunda mensagem.');
    const secondId = service.toast()?.id;

    expect(firstId).toBeDefined();
    expect(secondId).toBeDefined();
    expect(secondId).not.toBe(firstId);
  });
});
