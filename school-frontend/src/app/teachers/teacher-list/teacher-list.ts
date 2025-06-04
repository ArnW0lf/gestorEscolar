import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Teacher } from '../../models/teacher.model';
import { Subject } from '../../models/subject.model';
import { TeacherService } from '../../services/teacher.service';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  standalone: true,
  selector: 'app-teacher-list',
  templateUrl: './teacher-list.html',
  styleUrls: ['./teacher-list.scss'],
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatChipsModule
  ]
})
export class TeacherListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['id', 'nombre', 'especialidad', 'correo', 'materias', 'actions'];
  dataSource: MatTableDataSource<Teacher> = new MatTableDataSource();
  isLoading = true;
  availableSubjects: Subject[] = []; // To map subject IDs to names

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private teacherService: TeacherService,
    private router: Router,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadSubjectsAndThenTeachers();
  }

  loadSubjectsAndThenTeachers(): void {
    this.isLoading = true;
    // First load available subjects to map IDs to names (if your backend stores IDs for materias)
    this.teacherService.getAvailableSubjects().subscribe({
      next: (subjects) => {
        this.availableSubjects = subjects;
        this.loadTeachers(); // Now load teachers
      },
      error: (err) => {
        console.error('Error loading subjects:', err);
        this.snackBar.open('Failed to load subject data for mapping. Teachers list might show IDs.', 'Close', { duration: 3000 });
        this.loadTeachers(); // Still try to load teachers
      }
    });
  }

  loadTeachers(): void {
    this.teacherService.getTeachers().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading teachers:', err);
        this.snackBar.open('Failed to load teachers.', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.dataSource) { // Check if dataSource is initialized
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  getSubjectNames(subjectIds: number[] | string[] | undefined): string {
    if (!subjectIds || !this.availableSubjects.length) return 'N/A';
    return subjectIds.map(id => {
      // Attempt to match by ID (number) or by code/name (string)
      const subject = this.availableSubjects.find(s => s.id === Number(id) || s.codigo === String(id) || s.nombre === String(id));
      return subject ? subject.nombre : String(id);
    }).join(', ');
  }

  editTeacher(teacherId: number): void {
    this.router.navigate(['/teachers/edit', teacherId]);
  }

  deleteTeacher(teacherId: number, teacherName: string): void {
    // Replace with ConfirmationDialogComponent later
    if (confirm(`Are you sure you want to delete teacher ${teacherName} (ID: ${teacherId})?`)) {
      this.isLoading = true;
      this.teacherService.deleteTeacher(teacherId).subscribe({
        next: () => {
          this.snackBar.open('Teacher deleted successfully.', 'Close', { duration: 3000 });
          this.loadTeachers(); // Refresh the list
        },
        error: (err) => {
          this.snackBar.open(`Failed to delete teacher. ${err.message || ''}`, 'Close', { duration: 5000 });
          this.isLoading = false;
        }
      });
    }
  }

  navigateToCreate(): void {
    this.router.navigate(['/teachers/new']);
  }
}
