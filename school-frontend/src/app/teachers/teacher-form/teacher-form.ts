import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TeacherService } from '../../services/teacher.service';
import { Teacher } from '../../models/teacher.model';
import { Subject } from '../../models/subject.model';
import { Location } from '@angular/common';
import { forkJoin, Observable, of } from 'rxjs'; // Added of for forkJoin robustness
import { catchError } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  selector: 'app-teacher-form',
  templateUrl: './teacher-form.html',
  styleUrls: ['./teacher-form.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class TeacherFormComponent implements OnInit {
  teacherForm: FormGroup;
  isEditMode = false;
  teacherId: number | null = null;
  isLoading = false;
  pageTitle = 'Create Teacher';
  availableSubjects: Subject[] = [];

  constructor(
    private fb: FormBuilder,
    private teacherService: TeacherService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private location: Location
  ) {
    this.teacherForm = this.fb.group({
      nombre: ['', Validators.required],
      especialidad: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      materias: [[]] // Array of subject IDs
    });
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.route.data.subscribe(data => {
      this.isEditMode = data['mode'] === 'edit';
      this.pageTitle = this.isEditMode ? 'Edit Teacher' : 'Create Teacher';
    });

    let teacherDataObs: Observable<Teacher | null> = of(null); // Default to null for create mode

    if (this.isEditMode) {
      this.teacherId = Number(this.route.snapshot.paramMap.get('id'));
      if (this.teacherId && !isNaN(this.teacherId)) { // Check if teacherId is a valid number
        teacherDataObs = this.teacherService.getTeacherById(this.teacherId).pipe(
          catchError(err => {
            this.snackBar.open('Failed to load teacher data for editing.', 'Close', { duration: 3000 });
            console.error(err);
            this.router.navigate(['/teachers']);
            return of(null); // Return null or handle error appropriately
          })
        );
      } else {
        this.snackBar.open('Invalid teacher ID for editing.', 'Close', { duration: 3000 });
        this.router.navigate(['/teachers']);
        this.isLoading = false; // Stop loading as we are navigating away
        return;
      }
    }

    // Use forkJoin to load subjects and teacher data (if in edit mode) concurrently
    forkJoin({
      subjects: this.teacherService.getAvailableSubjects(),
      teacher: teacherDataObs // This will be null if not in edit mode or if ID is invalid
    }).subscribe({
      next: (results) => {
        this.availableSubjects = results.subjects;
        if (this.isEditMode && results.teacher) {
          this.teacherForm.patchValue(results.teacher);
          // Ensure 'materias' is patched correctly as an array of IDs
          // If backend gives array of subject objects for teacher details, map them to IDs:
          // Example: this.teacherForm.get('materias')?.setValue(results.teacher.materias.map(m => m.id));
        }
        this.isLoading = false;
      },
      error: (err) => { // This error is for forkJoin itself (e.g., if getAvailableSubjects fails hard)
        this.snackBar.open('Failed to load data for the form.', 'Close', { duration: 3000 });
        console.error(err);
        this.isLoading = false;
        if (!this.isEditMode) { // If creating, subjects are essential, maybe navigate away or disable form
          this.router.navigate(['/teachers']);
        }
        // If editing, teacher data might have loaded if teacherDataObs didn't error out before forkJoin
      }
    });
  }

  onSubmit(): void {
    if (this.teacherForm.invalid) {
      this.teacherForm.markAllAsTouched();
      this.snackBar.open('Please fill all required fields correctly.', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    const teacherData: Teacher = this.teacherForm.value;

    if (this.isEditMode && this.teacherId) {
      this.teacherService.updateTeacher(this.teacherId, teacherData).subscribe({
        next: () => {
          this.snackBar.open('Teacher updated successfully!', 'Close', { duration: 3000 });
          this.router.navigate(['/teachers']);
        },
        error: (err) => this.handleFormError(err, 'update')
      });
    } else {
      this.teacherService.createTeacher(teacherData).subscribe({
        next: () => {
          this.snackBar.open('Teacher created successfully!', 'Close', { duration: 3000 });
          this.router.navigate(['/teachers']);
        },
        error: (err) => this.handleFormError(err, 'create')
      });
    }
  }

  private handleFormError(err: any, action: 'create' | 'update'): void {
    const message = `Failed to ${action} teacher. ${this.getBackendErrorMessage(err)}`;
    this.snackBar.open(message, 'Close', { duration: 7000 });
    console.error(err);
    this.isLoading = false;
  }

  private getBackendErrorMessage(err: any): string {
    if (err.error) {
      // Check for specific field errors (e.g., 'correo')
      if (err.error.correo) {
        return `Email: ${Array.isArray(err.error.correo) ? err.error.correo.join(', ') : err.error.correo}`;
      }
      // Generic error object parsing
      let messages: string[] = [];
      for (const key in err.error) {
        if (Object.prototype.hasOwnProperty.call(err.error, key)) {
          const errorValue = err.error[key];
          if (Array.isArray(errorValue)) {
            messages.push(`${key}: ${errorValue.join(', ')}`);
          } else if (typeof errorValue === 'string') {
            messages.push(`${key}: ${errorValue}`);
          }
        }
      }
      if (messages.length > 0) return messages.join('; ');
    }
    return err.message || 'An unexpected error occurred.';
  }

  onCancel(): void {
    this.location.back();
  }
}
