import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './application/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly themeService = inject(ThemeService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.themeService.initializeTheme().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }
}
