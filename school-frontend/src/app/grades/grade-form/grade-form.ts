import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GradeService } from '../../services/grade.service'; // Corrected import
import { GradePayload } from '../../models/grade.model';
import { Subject } from '../../models/subject.model';
import { Student } from '../../models/student.model';
import { Observable, of } from 'rxjs';
import { startWith, switchMap, catchError, tap } from 'rxjs/operators';

@Component({
  selector: 'app-grade-form',
  templateUrl: './grade-form.html', // Use .html
  styleUrls: ['./grade-form.scss']  // Use .scss
})
export class GradeFormComponent implements OnInit {
  gradeForm: FormGroup;
  isLoading = false;
  isStudentsLoading = false; // Separate loading for students based on subject selection

  subjects$: Observable<Subject[]> = of([]);
  students$: Observable<Student[]> = of([]);

  constructor(
    private fb: FormBuilder,
    private gradeService: GradeService,
    private snackBar: MatSnackBar
  ) {
    this.gradeForm = this.fb.group({
      subject_id: [null, Validators.required],
      student_id: [{ value: null, disabled: true }, Validators.required], // Disabled until subject is selected
      grade_value: [null, [Validators.required, Validators.min(0), Validators.max(100)]],
      description: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.isLoading = true; // For initial subject loading
    this.subjects$ = this.gradeService.getSubjectsForTeacher().pipe(
      tap(() => this.isLoading = false), // Turn off main loader after subjects are processed
      catchError(err => {
        this.snackBar.open('Failed to load subjects for teacher.', 'Close', { duration: 3000 });
        this.isLoading = false;
        return of([]);
      })
    );

    this.gradeForm.get('subject_id')?.valueChanges.subscribe(subjectId => {
      const studentControl = this.gradeForm.get('student_id');
      studentControl?.reset();
      if (subjectId) {
        this.isStudentsLoading = true;
        studentControl?.enable();
        this.students$ = this.gradeService.getStudentsForSubject(subjectId).pipe(
          tap(() => this.isStudentsLoading = false),
          catchError(err => {
            this.snackBar.open(`Failed to load students for selected subject. ${err.message || ''}`, 'Close', { duration: 3000 });
            this.isStudentsLoading = false;
            studentControl?.disable();
            return of([]);
          })
        );
      } else {
        studentControl?.disable();
        this.students$ = of([]);
      }
    });
  }

  onSubmit(): void {
    if (this.gradeForm.invalid) {
      this.gradeForm.markAllAsTouched();
      this.snackBar.open('Please fill all required fields correctly.', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading = true; // For submission process
    const gradePayload: GradePayload = this.gradeForm.value;

    this.gradeService.recordGrade(gradePayload).subscribe({
      next: (recordedGrade) => {
        this.snackBar.open(`Grade recorded successfully for student ID ${recordedGrade.student}!`, 'Close', { duration: 3000 });
        this.gradeForm.reset();
        this.gradeForm.get('subject_id')?.setValue(null);
        this.gradeForm.get('student_id')?.disable(); // Ensure student field is disabled after reset
        this.isLoading = false;
      },
      error: (err) => {
        let errorMessage = 'Failed to record grade.';
        if (err.error) {
            const errors = Object.entries(err.error).map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`).join('; ');
            if (errors) errorMessage += ` Details: ${errors}`;
        } else if (err.message) {
            errorMessage += ` ${err.message}`;
        }
        this.snackBar.open(errorMessage, 'Close', { duration: 7000 });
        this.isLoading = false;
      }
    });
  }

  onCancel(): void {
    this.gradeForm.reset();
    this.gradeForm.get('subject_id')?.setValue(null);
    this.gradeForm.get('student_id')?.disable(); // Ensure student field is disabled
    this.students$ = of([]); // Clear student dropdown
  }
}
