import { ChangeDetectionStrategy, Component, booleanAttribute, input, output } from '@angular/core';

@Component({
  selector: 'se-header',
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  readonly userName = input.required<string>();

  readonly menuRequested = output<void>();
  readonly switchUserRequested = output<void>();

  protected requestMenu(): void {
    this.menuRequested.emit();
  }

  protected requestUserSwitch(): void {
    this.switchUserRequested.emit();
  }
}
