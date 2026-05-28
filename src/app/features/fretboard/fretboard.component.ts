import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  DOUBLE_DOT_FRETS,
  FretPosition,
  GUITAR_STRING_CONFIGS,
  SINGLE_DOT_FRETS,
} from '../../core/models/note.model';
import { FretboardService } from '../../core/services/fretboard.service';
import { FretboardStore } from '../../core/store/fretboard.store';
import { ControlsPanelComponent } from './components/controls-panel/controls-panel.component';
import { FretCellComponent } from './components/fret-cell/fret-cell.component';
import { TimerWidgetComponent } from './components/timer-widget/timer-widget.component';

@Component({
  selector: 'app-fretboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatBadgeModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    MatTooltipModule,
    FretCellComponent,
    ControlsPanelComponent,
    TimerWidgetComponent,
  ],
  templateUrl: './fretboard.component.html',
  styleUrl: './fretboard.component.scss',
})
export class FretboardComponent implements OnInit {
  readonly store = inject(FretboardStore);
  private readonly fretboardService = inject(FretboardService);

  readonly guitarStringConfigs = GUITAR_STRING_CONFIGS;
  readonly singleDotFrets = SINGLE_DOT_FRETS;
  readonly doubleDotFrets = DOUBLE_DOT_FRETS;

  /** 2D array: [stringIndex][fretIndex] → FretPosition */
  readonly fretboardPositions = computed(() =>
    this.fretboardService.buildFretboardPositions(this.store.visibleFretCount()),
  );

  /** Array of fret numbers 1..visibleFretCount, used to render fret columns */
  readonly fretNumbers = computed(() =>
    Array.from({ length: this.store.visibleFretCount() }, (_, index) => index + 1),
  );

  ngOnInit(): void {
    // nothing – store provides initial state
  }

  isPositionMarked(position: FretPosition): boolean {
    return this.store.markedPositionKeySet().has(
      this.fretboardService.buildPositionKey(position),
    );
  }

  isGeneratedPosition(position: FretPosition): boolean {
    return this.fretboardService.isSamePosition(
      position,
      this.store.currentGeneratedPosition(),
    );
  }

  onPositionClicked(position: FretPosition): void {
    this.store.onFretPositionClicked(position);
  }

  hasSingleDotMarker(fretNumber: number): boolean {
    return this.singleDotFrets.has(fretNumber);
  }

  hasDoubleDotMarker(fretNumber: number): boolean {
    return this.doubleDotFrets.has(fretNumber);
  }
}
