import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service'; // Correct path
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { StudentService } from '../services/student.service';
import { TeacherService } from '../services/teacher.service';
import { SubjectService } from '../services/subject.service';

@Component({
  selector: 'app-home',
  standalone: true, // Already set
  imports: [ // Already populated
    CommonModule,
    MatCardModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './home.html', // Original: ./home.component.html
  styleUrls: ['./home.scss'] // Original: ./home.component.scss
})
export class HomeComponent implements OnInit {
  userRole: string | null = null;
  studentCount = 0;
  teacherCount = 0;
  subjectCount = 0;
  isLoading = true;

  constructor(
    private authService: AuthService,
    private studentService: StudentService,
    private teacherService: TeacherService,
    private subjectService: SubjectService
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();
    if (this.userRole === 'Admin') {
      this.isLoading = true;
      // Use Promise.all to wait for all counts
      Promise.all([
        this.studentService.getStudents({ active: '', direction: '', page: 0, pageSize: 1 } as any).toPromise(), // Using 'as any' for params type flexibility
        this.teacherService.getTeachers({ active: '', direction: '', page: 0, pageSize: 1 } as any).toPromise(),
        this.subjectService.getSubjects({ active: '', direction: '', page: 0, pageSize: 1 } as any).toPromise()
      ]).then(([studentRes, teacherRes, subjectRes]) => {
        // Assuming response structure is { data: [], totalItems: number } or an array for non-paginated
        // For getStudents, getTeachers, getSubjects that return Observable<Student[]>, Observable<Teacher[]>, etc.
        // and if they don't support pagination for count, we get the full list and use .length
        // If they support pagination like { items: [], totalItems: number }, use totalItems
        // The provided services seem to return Observable<Entity[]> directly or paginated {data: Entity[], totalItems: number}
        // Let's assume a paginated structure for now, as it's more robust for counts.
        // If not, studentRes.length would be the fallback.

        this.studentCount = studentRes?.totalItems ?? (Array.isArray(studentRes?.data) ? studentRes.data.length : (Array.isArray(studentRes) ? studentRes.length : 0));
        this.teacherCount = teacherRes?.totalItems ?? (Array.isArray(teacherRes?.data) ? teacherRes.data.length : (Array.isArray(teacherRes) ? teacherRes.length : 0));
        this.subjectCount = subjectRes?.totalItems ?? (Array.isArray(subjectRes?.data) ? subjectRes.data.length : (Array.isArray(subjectRes) ? subjectRes.length : 0));

      }).catch(error => {
        console.error('Error loading dashboard data:', error);
        // Optionally show a snackbar error here
        // e.g., this.snackBar.open('Failed to load dashboard data.', 'Close', { duration: 3000 });
      }).finally(() => {
        this.isLoading = false;
      });
    } else {
      this.isLoading = false; // Not an admin, no data to load
    }
  }
}
