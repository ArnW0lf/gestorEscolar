import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subject } from '../../models/subject.model';
import { SubjectService } from '../../services/subject.service';
// Importa los módulos de Angular Material y CommonModule:
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatOptionModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-subject-list',
  templateUrl: './subject-list.html',
  styleUrls: ['./subject-list.scss'],
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
    MatTooltipModule,
    MatDialogModule,
    MatOptionModule,
    MatChipsModule,
    ReactiveFormsModule
  ]
})
export class SubjectListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['id', 'nombre', 'codigo', 'grado_asignado', 'actions'];
  dataSource: MatTableDataSource<Subject> = new MatTableDataSource();
  isLoading = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private subjectService: SubjectService,
    private router: Router,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadSubjects();
  }

  loadSubjects(): void {
    this.isLoading = true;
    this.subjectService.getSubjects().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading subjects:', err);
        this.snackBar.open('Failed to load subjects.', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.dataSource) {
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

  editSubject(subjectId: number): void {
    this.router.navigate(['/subjects/edit', subjectId]);
  }

  deleteSubject(subjectId: number, subjectName: string): void {
    // Replace with ConfirmationDialogComponent later
    if (confirm(`Are you sure you want to delete subject ${subjectName} (ID: ${subjectId})? This could affect existing teacher assignments or student records.`)) {
      this.isLoading = true;
      this.subjectService.deleteSubject(subjectId).subscribe({
        next: () => {
          this.snackBar.open('Subject deleted successfully.', 'Close', { duration: 3000 });
          this.loadSubjects(); // Refresh
        },
        error: (err) => {
          // Check if err.error and err.error.detail exist, otherwise use a generic message
          const detail = err.error && err.error.detail ? err.error.detail : 'Please try again later.';
          const errorMsg = `Failed to delete subject. ${detail}`;
          this.snackBar.open(errorMsg, 'Close', { duration: 5000 });
          this.isLoading = false;
        }
      });
    }
  }

  navigateToCreate(): void {
    this.router.navigate(['/subjects/new']);
  }
}
