import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './application/services/theme.service';
import { Toast } from './presentation/shared/feedback/toast/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly themeService = inject(ThemeService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.themeService.initializeTheme().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }
}
