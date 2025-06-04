import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Subject } from '../models/subject.model'; // Adjust path if necessary

@Injectable({
  providedIn: 'root'
})
export class SubjectService {
  private apiUrl = '/api/subjects'; // Adjust to your actual backend API endpoint

  constructor(private http: HttpClient) {}

  getSubjects(): Observable<Subject[]> {
    return this.http.get<Subject[]>(this.apiUrl + '/') // Assuming DRF list endpoint
      .pipe(catchError(this.handleError));
  }

  getSubjectById(id: number): Observable<Subject> {
    return this.http.get<Subject>(`${this.apiUrl}/${id}/`)
      .pipe(catchError(this.handleError));
  }

  createSubject(subject: Subject): Observable<Subject> {
    return this.http.post<Subject>(this.apiUrl + '/', subject)
      .pipe(catchError(this.handleError));
  }

  updateSubject(id: number, subject: Subject): Observable<Subject> {
    return this.http.put<Subject>(`${this.apiUrl}/${id}/`, subject)
      .pipe(catchError(this.handleError));
  }

  deleteSubject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      if (error.error && typeof error.error === 'object') {
        const errors = error.error;
        const messages = Object.keys(errors)
          .map(key => `${key}: ${Array.isArray(errors[key]) ? errors[key].join(', ') : errors[key]}`)
          .join('\n');
        if (messages) {
          errorMessage += `\nDetails: ${messages}`;
        }
      } else if (typeof error.error === 'string') {
        errorMessage += `\nDetails: ${error.error}`;
      }
    }
    console.error(errorMessage);
    // It's often better to return an error that the component can understand and display
    // For example, by re-throwing the error object or a custom error object.
    return throwError(() => error); // Propagate the error object
  }
}
