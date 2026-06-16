import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewFormModal } from './review-form-modal';

describe('ReviewFormModal', () => {
  let component: ReviewFormModal;
  let fixture: ComponentFixture<ReviewFormModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewFormModal],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewFormModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
