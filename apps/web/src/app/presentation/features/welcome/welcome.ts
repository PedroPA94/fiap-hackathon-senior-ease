import { Component, computed, inject, signal } from '@angular/core';
import { CreateUserForm } from './components/create-user-form/create-user-form';
import { Card } from '../../shared/ui/card/card';
import { UserSessionService } from '../../../application/services/user-session.service';
import { ThemeService } from '../../../application/services/theme.service';
import { LocalUserSelector } from './local-user-selector/local-user-selector';
import { EntityId } from '@senior-ease/core';
import { LocalUser } from '../../../application/models/local-user';
import { Button } from '../../shared/ui/button/button';

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

  protected readonly mode = signal<WelcomeMode>('create-user');
  protected readonly isCreatingUser = signal(false);
  protected readonly loadingUserId = signal<EntityId | null>(null);

  protected readonly localUsers = signal<LocalUser[]>([]);
  protected readonly hasLocalUsers = computed(() => this.localUsers().length > 0);

  ngOnInit(): void {
    const users = this.userSessionService.listLocalUsers();

    this.localUsers.set(users);
    this.mode.set(users.length > 0 ? 'select-user' : 'create-user');
  }

  showCreateUser(): void {
    this.mode.set('create-user');
  }

  showUserSelection(): void {
    this.mode.set('select-user');
  }

  async createUser(name: string): Promise<void> {
    if (this.isCreatingUser()) {
      return;
    }

    this.isCreatingUser.set(true);

    await this.userSessionService.createLocalUser(name);
    await this.themeService.applyCurrentUserTheme();

    this.isCreatingUser.set(false);
  }

  protected async selectUser(userId: EntityId): Promise<void> {
    if (this.loadingUserId()) {
      return;
    }

    this.loadingUserId.set(userId);

    try {
      await this.userSessionService.selectLocalUser(userId);
      await this.themeService.applyCurrentUserTheme();
    } catch {
      this.localUsers.set(this.userSessionService.listLocalUsers());
    } finally {
      this.loadingUserId.set(null);
    }
  }
}
