import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StudentService } from '../../../services/student.service'; // Adjusted path, .service added
import { Student } from '../../../models/student.model'; // Adjusted path
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  standalone: true,
  selector: 'app-student-form',
  templateUrl: './student-form.html',
  styleUrls: ['./student-form.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule
  ]
})
export class StudentFormComponent implements OnInit {
  studentForm: FormGroup;
  isEditMode = false;
  studentId: number | null = null;
  isLoading = false;
  pageTitle = 'Create Student';

  // Dummy data for Grado and Sección - replace with actual data source if needed
  grados: string[] = ['1ro Primaria', '2do Primaria', '3ro Primaria', '4to Primaria', '5to Primaria', '6to Primaria', '1ro Secundaria', '2do Secundaria', '3ro Secundaria', '4to Secundaria', '5to Secundaria'];
  secciones: string[] = ['A', 'B', 'C', 'D'];

  constructor(
    private fb: FormBuilder,
    private studentService: StudentService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private location: Location
  ) {
    this.studentForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      dni: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]], // Example: 8-digit DNI
      fecha_nacimiento: ['', Validators.required],
      grado: ['', Validators.required],
      seccion: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.isEditMode = data['mode'] === 'edit';
      this.pageTitle = this.isEditMode ? 'Edit Student' : 'Create Student';
    });

    if (this.isEditMode) {
      this.isLoading = true;
      this.studentId = Number(this.route.snapshot.paramMap.get('id'));
      if (this.studentId) {
        this.studentService.getStudentById(this.studentId).subscribe({
          next: (student) => {
            // Ensure fecha_nacimiento is in a format the datepicker can handle (e.g., YYYY-MM-DD or Date object)
            // If it's already a string like 'YYYY-MM-DD', it should be fine.
            // If it's a Date object from backend, also fine. If different, transform it.
            this.studentForm.patchValue(student);
            this.isLoading = false;
          },
          error: (err) => {
            this.snackBar.open('Failed to load student data.', 'Close', { duration: 3000 });
            console.error(err);
            this.isLoading = false;
            this.router.navigate(['/students']); // Or show error and stay
          }
        });
      }
    }
  }

  onSubmit(): void {
    if (this.studentForm.invalid) {
      this.studentForm.markAllAsTouched(); // Show validation errors
      this.snackBar.open('Please fill all required fields correctly.', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    const studentData: Student = this.studentForm.value;

    // Format fecha_nacimiento if necessary before sending to backend
    // For example, if your backend expects 'YYYY-MM-DD' and datepicker gives a Date object:
    if (
      studentData.fecha_nacimiento &&
      Object.prototype.toString.call(studentData.fecha_nacimiento) === '[object Date]'
    ) {
      studentData.fecha_nacimiento = ((studentData.fecha_nacimiento as unknown) as Date).toISOString().split('T')[0];
    } else if (
      studentData.fecha_nacimiento &&
      typeof studentData.fecha_nacimiento === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(studentData.fecha_nacimiento)
    ) {
      // Already in correct format, do nothing
    } else if (
      studentData.fecha_nacimiento &&
      typeof studentData.fecha_nacimiento === 'string'
    ) {
      // Try to parse and format if it's a string but not in the correct format
      const date = new Date(studentData.fecha_nacimiento);
      if (!isNaN(date.getTime())) {
        studentData.fecha_nacimiento = date.toISOString().split('T')[0];
      }
    }


    if (this.isEditMode && this.studentId) {
      this.studentService.updateStudent(this.studentId, studentData).subscribe({
        next: () => {
          this.snackBar.open('Student updated successfully!', 'Close', { duration: 3000 });
          this.router.navigate(['/students']);
        },
        error: (err) => {
          this.snackBar.open(`Failed to update student. ${err.message || ''}`, 'Close', { duration: 5000 });
          console.error(err);
          this.isLoading = false;
        }
      });
    } else {
      this.studentService.createStudent(studentData).subscribe({
        next: () => {
          this.snackBar.open('Student created successfully!', 'Close', { duration: 3000 });
          this.router.navigate(['/students']);
        },
        error: (err) => {
          this.snackBar.open(`Failed to create student. ${this.getBackendErrorMessage(err)}`, 'Close', { duration: 5000 });
          console.error(err);
          this.isLoading = false;
        }
      });
    }
  }

  private getBackendErrorMessage(err: any): string {
    if (err.error) {
      if (typeof err.error.dni === 'string') return err.error.dni; // Example for specific DNI error
      if (Array.isArray(err.error.dni)) return err.error.dni.join(', ');

      let messages: string[] = [];
      for (const key in err.error) {
        if (Object.prototype.hasOwnProperty.call(err.error, key) && Array.isArray(err.error[key])) {
          messages.push(`${key}: ${err.error[key].join(', ')}`);
        } else if (typeof err.error[key] === 'string') {
          messages.push(`${key}: ${err.error[key]}`);
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
