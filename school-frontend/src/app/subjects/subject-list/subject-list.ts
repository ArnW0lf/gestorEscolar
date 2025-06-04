import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subject } from '../../models/subject.model';
import { SubjectService } from '../../services/subject.service'; // Corrected: .service
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog';

@Component({
  selector: 'app-subject-list',
  templateUrl: './subject-list.html', // Use .html
  styleUrls: ['./subject-list.scss']  // Use .scss
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
  ) {}

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
        this.snackBar.open('Failed to load subjects.', 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
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
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
      data: {
        title: 'Confirm Deletion',
        message: `Are you sure you want to delete subject "${subjectName}"? This action cannot be undone.`,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        this.subjectService.deleteSubject(subjectId).subscribe({
          next: () => {
            this.snackBar.open('Subject deleted successfully!', 'Close', { duration: 3000 });
            this.loadSubjects(); // Refresh the list
          },
          error: (err) => {
            this.isLoading = false;
            let errorMessage = 'Error deleting subject.';
            // Attempt to get a more specific message from backend if available
            if (err.error && typeof err.error.message === 'string' && err.error.message.length > 0) {
              errorMessage = err.error.message;
            } else if (err.error && typeof err.error === 'string' && err.error.length > 0){
                errorMessage = err.error;
            } else if (typeof err.message === 'string' && err.message.length > 0) {
                 errorMessage = err.message;
            }
            this.snackBar.open(errorMessage, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
            console.error('Error deleting subject:', err);
          }
        });
      }
    });
  }

  navigateToCreate(): void {
    this.router.navigate(['/subjects/new']);
  }
}
