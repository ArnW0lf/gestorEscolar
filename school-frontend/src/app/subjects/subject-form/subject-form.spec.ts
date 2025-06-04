import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubjectForm } from './subject-form';

describe('SubjectForm', () => {
  let component: SubjectForm;
  let fixture: ComponentFixture<SubjectForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubjectForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubjectForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
