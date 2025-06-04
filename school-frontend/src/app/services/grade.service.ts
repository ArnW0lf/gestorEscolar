import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs'; // 'of' for mock data
import { catchError, map } from 'rxjs/operators';
import { Grade, GradePayload } from '../models/grade.model';
import { Subject } from '../models/subject.model'; // Assuming Subject model is available
import { Student } from '../models/student.model'; // Assuming Student model is available
import { AuthService } from '../auth/auth.service'; // To get current user info if needed for teacher-specific data

@Injectable({
  providedIn: 'root'
})
export class GradeService {
  private apiUrl = '/api/grades'; // Adjust to your actual backend API endpoint for grades
  private teacherApiUrl = '/api/docente'; // Base URL for teacher-specific data

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Records a new grade
  recordGrade(gradeData: GradePayload): Observable<Grade> {
    return this.http.post<Grade>(`${this.apiUrl}/record/`, gradeData) // Example endpoint
      .pipe(catchError(this.handleError));
  }

  // Fetches subjects assigned to the currently logged-in teacher
  getSubjectsForTeacher(): Observable<Subject[]> {
    // This would ideally be an API call like:
    // return this.http.get<Subject[]>(`${this.teacherApiUrl}/subjects/`)
    //   .pipe(catchError(this.handleError));

    // Mock data for now:
    const mockSubjects: Subject[] = [
      { id: 1, nombre: 'Matemáticas I', codigo: 'MATH-101', grado_asignado: '1ro Secundaria' },
      { id: 2, nombre: 'Lenguaje I', codigo: 'LANG-101', grado_asignado: '1ro Secundaria' },
    ];
    return of(mockSubjects);
  }

  // Fetches students enrolled in a specific subject
  getStudentsForSubject(subjectId: number): Observable<Student[]> {
    // This would ideally be an API call like:
    // return this.http.get<Student[]>(`/api/subjects/${subjectId}/students/`)
    //   .pipe(catchError(this.handleError));

    // Mock data for now:
    const mockStudents: Student[] = [
      { id: 101, nombre: 'Carlos', apellido: 'Perez', dni: '12345678', fecha_nacimiento: '2005-01-15', grado: '1ro Secundaria', seccion: 'A' },
      { id: 102, nombre: 'Ana', apellido: 'Gomez', dni: '87654321', fecha_nacimiento: '2005-03-20', grado: '1ro Secundaria', seccion: 'A' },
      { id: 103, nombre: 'Luis', apellido: 'Fernandez', dni: '11223344', fecha_nacimiento: '2005-02-10', grado: '1ro Secundaria', seccion: 'B' },
    ];
    // Filter mock students by subject (simple mock logic)
    if (subjectId === 1) { // Mock: only Carlos and Ana are in "Matemáticas I"
        return of(mockStudents.slice(0,2));
    } else if (subjectId === 2) { // Mock: only Luis is in "Lenguaje I"
        return of([mockStudents[2]]);
    }
    return of([]);
  }

  // Example: Get grades recorded by the current teacher
  getGradesByTeacher(): Observable<Grade[]> {
    return this.http.get<Grade[]>(`${this.teacherApiUrl}/grades/`) // This endpoint is hypothetical
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
        if (messages) errorMessage += `\nDetails: ${messages}`;
      } else if (typeof error.error === 'string') {
        errorMessage += `\nDetails: ${error.error}`;
      }
    }
    console.error(errorMessage);
    return throwError(() => error);
  }
}
