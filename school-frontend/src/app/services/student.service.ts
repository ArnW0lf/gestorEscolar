import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Student } from '../models/student.model'; // Adjust path if necessary

@Injectable({
  providedIn: 'root' // No change if it's already root
})
export class StudentService {
  private apiUrl = '/api/students'; // Adjust to your actual backend API endpoint for students

  constructor(private http: HttpClient) {}

  getStudents(): Observable<Student[]> {
    return this.http.get<Student[]>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  getStudentById(id: number): Observable<Student> {
    return this.http.get<Student>(`${this.apiUrl}/${id}/`) // Assuming Django REST Framework detail URL
      .pipe(catchError(this.handleError));
  }

  createStudent(student: Student): Observable<Student> {
    return this.http.post<Student>(this.apiUrl + '/', student) // Assuming DRF list URL for POST
      .pipe(catchError(this.handleError));
  }

  updateStudent(id: number, student: Student): Observable<Student> {
    return this.http.put<Student>(`${this.apiUrl}/${id}/`, student) // Assuming DRF detail URL for PUT
      .pipe(catchError(this.handleError));
  }

  deleteStudent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/`) // Assuming DRF detail URL for DELETE
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side errors
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side errors
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      if (error.error && typeof error.error === 'object') {
        // Try to get specific error messages from backend if available
        const errors = error.error;
        const messages = Object.keys(errors)
          .map(key => `${key}: ${errors[key]}`)
          .join('\n');
        if (messages) {
          errorMessage += `\nDetails: ${messages}`;
        }
      }
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
