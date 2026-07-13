import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { defaultAccessibilityPreferences } from '@senior-ease/core';
import { createAccessibilityTheme } from '@senior-ease/tokens';
import { ThemeService } from './application/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly themeService = inject(ThemeService);

  ngOnInit(): void {
    this.themeService.initializeTheme();
  }
}
