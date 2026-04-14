import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistoryItem } from '../../../../core/models/items';

@Component({
  selector: 'app-history-details-modal',
  imports: [CommonModule],
  templateUrl: './history-details-modal.html',
  styleUrl: './history-details-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoryDetailsModal {
  open = input(false);
  item = input<HistoryItem | null>(null);

  close = output<void>();

  onClose(): void {
    this.close.emit();
  }
}