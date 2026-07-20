import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export type NavigationMenuItem = {
  label: string;
  route: string;
  exact?: boolean;
};

const DEFAULT_NAVIGATION_ITEMS: readonly NavigationMenuItem[] = [
  {
    label: 'Início',
    route: '/home',
    exact: true,
  },
  {
    label: 'Personalização',
    route: '/personalization',
    exact: true,
  },
  {
    label: 'Atividades',
    route: '/activities',
    exact: false,
  },
];

@Component({
  selector: 'se-navigation-menu',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navigation-menu.html',
  styleUrl: './navigation-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationMenu {
  readonly open = input(false);

  readonly items = input<readonly NavigationMenuItem[]>(DEFAULT_NAVIGATION_ITEMS);

  readonly closed = output<void>();

  @HostListener('document:keydown.escape')
  protected handleEscape(): void {
    if (!this.open()) {
      return;
    }

    this.close();
  }

  protected close(): void {
    this.closed.emit();
  }

  protected handleNavigation(): void {
    /*
     * No desktop, o evento não causa mudança visual relevante.
     * No mobile e tablet, fecha o drawer após a navegação.
     */
    this.close();
  }
}
