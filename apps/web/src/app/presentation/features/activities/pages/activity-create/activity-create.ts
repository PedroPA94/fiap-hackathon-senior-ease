import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'se-activity-create',
  templateUrl: './activity-create.html',
  styleUrl: '../activity-placeholder.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityCreate {}
