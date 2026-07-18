import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  inject,
  input,
  output,
} from '@angular/core';
import { UserSessionService } from '../../../../application/services/user-session.service';
import { Router } from '@angular/router';
import { map } from 'rxjs/internal/operators/map';
import { AsyncPipe } from '@angular/common';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'se-header',
  templateUrl: './header.html',
  styleUrl: './header.scss',
  imports: [AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  private userSessionService = inject(UserSessionService);
  private router = inject(Router);

  readonly menuOpen = input(false);
  readonly menuRequested = output<void>();

  readonly userName$ = this.userSessionService.getCurrentUserProfile().pipe(
    map((userProfile) => userProfile?.name ?? 'Usuário'),
    catchError(() => of('Usuário')),
  );

  switchUser(): void {
    this.userSessionService.clearCurrentUser();
    void this.router.navigateByUrl('/welcome');
  }

  requestMenu(): void {
    this.menuRequested.emit();
  }
}
