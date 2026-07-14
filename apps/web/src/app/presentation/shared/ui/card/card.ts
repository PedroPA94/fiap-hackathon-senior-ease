import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type CardSpacing = 'regular' | 'small';

@Component({
  selector: 'se-card',
  templateUrl: './card.html',
  styleUrl: './card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Card {
  readonly spacing = input<CardSpacing>('regular');
}
