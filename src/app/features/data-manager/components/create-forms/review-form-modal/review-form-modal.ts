import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReviewFormValue } from '../../../models/forms';

@Component({
  selector: 'app-review-form-modal',
  imports: [FormsModule],
  templateUrl: './review-form-modal.html',
  styleUrl: './review-form-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReviewFormModal {
  open = input(false);
  title = input('Add review');
  form = input.required<ReviewFormValue>();
  saving = input(false);
  isEditing = input(false);

  close = output<void>();
  submit = output<void>();
  fieldChange = output<{ key: keyof ReviewFormValue; value: ReviewFormValue[keyof ReviewFormValue] }>();

  onClose(): void {
    if (this.saving()) {
      return;
    }

    this.close.emit();
  }

  onSubmit(): void {
    this.submit.emit();
  }

  onTextFieldChange<K extends keyof ReviewFormValue>(key: K, value: ReviewFormValue[K]): void {
    this.fieldChange.emit({ key, value });
  }

  onRatingLabelChange(index: number, value: string): void { 
    const updatedRatings = this.form().ratings.map((rating, currentIndex) =>  
      currentIndex === index ? { ...rating, label: value } : rating);
    
    this.fieldChange.emit({ key: 'ratings', value: updatedRatings });
  }

  onRatingScoreChange(index: number, value: string): void {
    const parsedValue = value === '' ? null : Number(value);

    const updatedRatings = this.form().ratings.map((rating, currentIndex) =>
      currentIndex === index
        ? { ...rating, score: Number.isFinite(parsedValue) ? parsedValue : null }
        : rating
    );

    this.fieldChange.emit({ key: 'ratings', value: updatedRatings });
  }

  onAddRating(): void {
    const updatedRatings = [
      ...this.form().ratings,
      { label: '', score: null }
    ];

    this.fieldChange.emit({ key: 'ratings', value: updatedRatings });
  }

  onRemoveRating(index: number): void {
    const updatedRatings = this.form().ratings.filter((_, currentIndex) => currentIndex !== index);

    this.fieldChange.emit({
      key: 'ratings',
      value: updatedRatings.length > 0 ? updatedRatings : [{ label: '', score: null }]
    });
  }
}
