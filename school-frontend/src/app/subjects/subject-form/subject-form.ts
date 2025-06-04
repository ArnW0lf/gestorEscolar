import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SubjectService } from '../../services/subject.service'; // Corrected: .service
import { Subject } from '../../models/subject.model';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  standalone: true,
  selector: 'app-subject-form',
  templateUrl: './subject-form.html',
  styleUrls: ['./subject-form.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatCardModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ]
})
export class SubjectFormComponent implements OnInit {
  subjectForm: FormGroup;
  isEditMode = false;
  subjectId: number | null = null;
  isLoading = false;
  pageTitle = 'Create Subject';

  // Example for 'grado_asignado' - can be a simple text input or a select
  gradosAsignados: string[] = [
    '1ro Primaria', '2do Primaria', '3ro Primaria', '4to Primaria', '5to Primaria', '6to Primaria',
    '1ro Secundaria', '2do Secundaria', '3ro Secundaria', '4to Secundaria', '5to Secundaria',
    'General' // For subjects applicable to multiple grades or general
  ];


  constructor(
    private fb: FormBuilder,
    private subjectService: SubjectService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private location: Location
  ) {
    this.subjectForm = this.fb.group({
      nombre: ['', Validators.required],
      codigo: ['', Validators.required], // Add custom validator for uniqueness if needed client-side, mostly backend
      grado_asignado: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.isEditMode = data['mode'] === 'edit';
      this.pageTitle = this.isEditMode ? 'Edit Subject' : 'Create Subject';
    });

    if (this.isEditMode) {
      this.isLoading = true;
      this.subjectId = Number(this.route.snapshot.paramMap.get('id'));
      if (this.subjectId && !isNaN(this.subjectId)) {
        this.subjectService.getSubjectById(this.subjectId).subscribe({
          next: (subject) => {
            this.subjectForm.patchValue(subject);
            this.isLoading = false;
          },
          error: (err) => {
            this.snackBar.open('Failed to load subject data.', 'Close', { duration: 3000 });
            console.error(err);
            this.isLoading = false;
            this.router.navigate(['/subjects']);
          }
        });
      } else {
        this.snackBar.open('Invalid subject ID for editing.', 'Close', { duration: 3000 });
        this.router.navigate(['/subjects']);
      }
    }
  }

  onSubmit(): void {
    if (this.subjectForm.invalid) {
      this.subjectForm.markAllAsTouched();
      this.snackBar.open('Please fill all required fields correctly.', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    const subjectData: Subject = this.subjectForm.value;

    const operation = this.isEditMode && this.subjectId
      ? this.subjectService.updateSubject(this.subjectId, subjectData)
      : this.subjectService.createSubject(subjectData);

    operation.subscribe({
      next: () => {
        this.snackBar.open(`Subject ${this.isEditMode ? 'updated' : 'created'} successfully!`, 'Close', { duration: 3000 });
        this.router.navigate(['/subjects']);
      },
      error: (err) => {
        let errorMessage = `Failed to ${this.isEditMode ? 'update' : 'create'} subject.`;
        if (err.error) {
          if (err.error.codigo && Array.isArray(err.error.codigo)) {
            errorMessage += ` Code: ${err.error.codigo.join(', ')}`;
          } else if (err.error.detail) {
            errorMessage += ` ${err.error.detail}`;
          } else if (typeof err.error === 'string') {
            errorMessage += ` ${err.error}`;
          }
          else {
            // Generic way to show all errors from a dictionary
            const errors = Object.entries(err.error).map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`).join('; ');
            if (errors) errorMessage += ` Details: ${errors}`;
          }
        } else if (err.message) {
          errorMessage += ` ${err.message}`;
        }
        this.snackBar.open(errorMessage, 'Close', { duration: 7000 });
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  onCancel(): void {
    this.location.back();
  }
}
