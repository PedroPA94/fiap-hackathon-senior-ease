import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, concatMap, finalize } from 'rxjs';
import { CreateUserForm } from './components/create-user-form/create-user-form';
import { Card } from '../../shared/ui/card/card';
import { UserSessionService } from '../../../application/services/user-session.service';
import { ThemeService } from '../../../application/services/theme.service';
import { LocalUserSelector } from './local-user-selector/local-user-selector';
import { EntityId } from '@senior-ease/core';
import { LocalUser } from '../../../application/models/local-user';
import { Button } from '../../shared/ui/button/button';
import { Router } from '@angular/router';

type WelcomeMode = 'select-user' | 'create-user';

@Component({
  selector: 'se-welcome',
  imports: [CreateUserForm, LocalUserSelector, Card, Button],
  templateUrl: './welcome.html',
  styleUrl: './welcome.scss',
})
export class Welcome {
  private userSessionService = inject(UserSessionService);
  private themeService = inject(ThemeService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  protected readonly mode = signal<WelcomeMode>('create-user');
  protected readonly isCreatingUser = signal(false);
  protected readonly loadingUserId = signal<EntityId | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly localUsers = signal<LocalUser[]>([]);
  protected readonly hasLocalUsers = computed(() => this.localUsers().length > 0);

  ngOnInit(): void {
    const users = this.userSessionService.listLocalUsers();

    this.localUsers.set(users);
    this.mode.set(users.length > 0 ? 'select-user' : 'create-user');
  }

  showCreateUser(): void {
    this.errorMessage.set(null);
    this.mode.set('create-user');
  }

  showUserSelection(): void {
    this.errorMessage.set(null);
    this.mode.set('select-user');
  }

  createUser(name: string): void {
    if (this.isCreatingUser()) {
      return;
    }

    this.isCreatingUser.set(true);
    this.errorMessage.set(null);

    this.userSessionService
      .createLocalUser(name)
      .pipe(
        concatMap(() => this.themeService.applyCurrentUserTheme()),
        catchError(() => {
          this.errorMessage.set('Não foi possível criar o perfil. Tente novamente.');

          return EMPTY;
        }),
        finalize(() => this.isCreatingUser.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ next: () => this.navigateToPersonalization() });
  }

  protected selectUser(userId: EntityId): void {
    if (this.loadingUserId()) {
      return;
    }

    this.loadingUserId.set(userId);
    this.errorMessage.set(null);

    this.userSessionService
      .selectLocalUser(userId)
      .pipe(
        concatMap(() => this.themeService.applyCurrentUserTheme()),
        catchError(() => {
          this.localUsers.set(this.userSessionService.listLocalUsers());
          this.errorMessage.set('Não foi possível abrir este perfil. Selecione outro usuário.');

          return EMPTY;
        }),
        finalize(() => this.loadingUserId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ next: () => this.navigateToPersonalization() });
  }

  private navigateToPersonalization(): void {
    this.router.navigate(['/personalization']);
  }
}
