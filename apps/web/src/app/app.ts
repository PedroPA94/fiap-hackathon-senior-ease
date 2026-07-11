import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { defaultAccessibilityPreferences } from '@senior-ease/core';
import { createAccessibilityTheme } from '@senior-ease/tokens';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('web');

  protected readonly themePreview = createAccessibilityTheme(defaultAccessibilityPreferences);
}
