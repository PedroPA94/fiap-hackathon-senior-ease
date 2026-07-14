import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './application/services/theme.service';
import { Button } from './presentation/shared/ui/button/button';
import { TextInput } from './presentation/shared/ui/text-input/text-input';
import { Card } from './presentation/shared/ui/card/card';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Button, TextInput, Card],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly themeService = inject(ThemeService);

  ngOnInit(): void {
    this.themeService.initializeTheme();
  }

  onButtonClick(): void {
    console.log('Button clicked!');
  }
}
