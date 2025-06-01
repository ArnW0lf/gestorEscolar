import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Student } from '../../../models/student.model'; // Adjusted path
import { StudentService } from '../../../services/student.service'; // Adjusted path, .service added
// import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog/confirmation-dialog.component'; // Create this

@Component({
  selector: 'app-student-list',
  templateUrl: './student-list.html', // Adjusted path
  styleUrls: ['./student-list.scss'] // Adjusted path
})
export class StudentListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['id', 'nombre', 'apellido', 'dni', 'grado', 'seccion', 'actions'];
  dataSource: MatTableDataSource<Student> = new MatTableDataSource();
  isLoading = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private studentService: StudentService,
    private router: Router,
    public dialog: MatDialog, // For confirmation dialog
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadStudents();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadStudents(): void {
    this.isLoading = true;
    this.studentService.getStudents().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading students:', err);
        this.snackBar.open('Failed to load students.', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  editStudent(studentId: number): void {
    this.router.navigate(['/students/edit', studentId]); // Ensure this route is configured
  }

  deleteStudent(studentId: number, studentName: string): void {
    // Example of using a confirmation dialog (you'll need to create ConfirmationDialogComponent)
    /*
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
      data: { message: `Are you sure you want to delete student ${studentName}?` }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) { // User confirmed
        this.isLoading = true;
        this.studentService.deleteStudent(studentId).subscribe({
          next: () => {
            this.snackBar.open('Student deleted successfully.', 'Close', { duration: 3000 });
            this.loadStudents(); // Refresh the list
          },
          error: (err) => {
            console.error('Error deleting student:', err);
            this.snackBar.open('Failed to delete student.', 'Close', { duration: 3000 });
            this.isLoading = false;
          }
        });
      }
    });
    */
    // For now, direct delete with confirm for simplicity until dialog is made
    if (confirm(`Are you sure you want to delete student ${studentName} (ID: ${studentId})?`)) {
      this.isLoading = true;
      this.studentService.deleteStudent(studentId).subscribe({
        next: () => {
          this.snackBar.open('Student deleted successfully.', 'Close', { duration: 3000 });
          this.loadStudents(); // Refresh the list
        },
        error: (err) => {
          console.error('Error deleting student:', err);
          this.snackBar.open(`Failed to delete student. ${err.message || ''}`, 'Close', { duration: 5000 });
          this.isLoading = false;
        }
      });
    }
  }

  navigateToCreate(): void {
    this.router.navigate(['/students/new']); // Ensure this route is configured
  }
}
