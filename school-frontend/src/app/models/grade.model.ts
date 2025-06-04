export interface Grade {
  id?: number;
  student: number; // Student ID
  subject: number; // Subject ID
  grade: number;   // The numerical grade (e.g., 0-100)
  description?: string; // e.g., "Examen Parcial", "Homework 1"
  date_recorded?: string; // Optional, backend might auto-set
  // Add any other relevant fields from your backend
}

// Interface for grade submission payload if different
export interface GradePayload {
  student_id: number;
  subject_id: number;
  grade_value: number;
  description: string;
}
