export interface Student {
  id?: number; // Optional for creation, present for existing students
  nombre: string;
  apellido: string;
  dni: string;
  fecha_nacimiento: string; // Consider using Date type and transforming, but string is simpler for forms
  grado: string;
  seccion: string;
}
