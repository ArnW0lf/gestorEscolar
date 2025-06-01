import { Subject } from './subject.model'; // Import the main Subject model

export interface Teacher {
  id?: number;
  nombre: string;
  especialidad: string;
  correo: string;
  materias?: number[]; // Keep as array of subject IDs for form binding and backend
                       // The actual Subject objects will be fetched for display/selection
}

// SubjectBasic can be removed or kept if used elsewhere, but for teacher form, we'll use Subject[] from SubjectService.
// For clarity, let's assume we'll use Subject[] from SubjectService directly in the form.
// So, SubjectBasic might not be needed in this file anymore.
export interface SubjectBasic { // This was a simplified version
  id: number;
  nombre: string;
  codigo?: string;
}
