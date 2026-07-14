import { Component, inject, signal } from '@angular/core';
import { CreateUserForm } from './components/create-user-form/create-user-form';
import { Card } from '../../shared/ui/card/card';
import { UserSessionService } from '../../../application/services/user-session.service';
import { ThemeService } from '../../../application/services/theme.service';

@Component({
  selector: 'se-welcome',
  imports: [CreateUserForm, Card],
  templateUrl: './welcome.html',
  styleUrl: './welcome.scss',
})
export class Welcome {
  private userSessionService = inject(UserSessionService);
  private themeService = inject(ThemeService);

  readonly isSubmitting = signal(false);

  createUser(name: string): void {
    if (this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);

    this.userSessionService.createLocalUser(name);
    this.themeService.applyCurrentUserTheme();

    this.isSubmitting.set(false);
  }
}
