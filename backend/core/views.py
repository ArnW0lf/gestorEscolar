from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import ListView
from django.shortcuts import get_object_or_404
from .models import GradeRecord, Attendance, CustomUser  
from .models import *
from .serializers import *
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, Http404

# Custom Permissions
from .permissions import IsAdminOrTeacherOfSubjectObject, IsAdminOrTeacherOfSubjectObjectAttendance


User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action == 'list_students' or self.action == 'list_teachers':
            permission_classes = [IsAdminUser]
        elif self.action == 'create':
            # AllowAny for general registration. Specific role validation (student/teacher)
            # and associated permissions for those roles are handled post-creation
            # or by serializer validation logic if role is provided.
            permission_classes = [AllowAny]
        elif self.action in ['update', 'partial_update', 'destroy']:
            instance = self.get_object_or_none()
            if instance and (instance.role == 'STUDENT' or instance.role == 'TEACHER'):
                # Only Admin can modify/delete students or teachers
                permission_classes = [IsAdminUser]
            elif instance: # Modifying other roles (e.g. PARENT, or self)
                # This part depends on overall app policy.
                # For now, let's assume Admin for any modification if not self,
                # or IsAuthenticated if users can modify their own (non-student/teacher) profiles.
                # Sticking to IsAdminUser for simplicity as per previous logic for students.
                permission_classes = [IsAdminUser]
            else: # Should not happen if get_object_or_none works as expected for valid pk
                permission_classes = [IsAdminUser]
        else: # list (all users), retrieve (any user)
            permission_classes = [IsAuthenticated] # General listing/retrieval for authenticated users
        return [permission() for permission in permission_classes]

    def get_object_or_none(self):
        try:
            return self.get_object()
        except (AssertionError, Http404): # Http404 is from DRF's get_object
            return None

    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def list_students(self, request):
        queryset = User.objects.filter(role='STUDENT')

        grade_id = request.query_params.get('grade_id')
        year = request.query_params.get('year')

        if grade_id:
            queryset = queryset.filter(studentenrollment__grade_id=grade_id)
        if year:
            queryset = queryset.filter(studentenrollment__year=year)

        # Ensure distinct students if multiple enrollments could cause duplicates
        # (e.g. if a student could be enrolled in multiple sections of the same grade in a year, though unlikely)
        queryset = queryset.distinct()

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def list_teachers(self, request):
        teachers = User.objects.filter(role='TEACHER')
        page = self.paginate_queryset(teachers)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(teachers, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            user = serializer.save()

            message = "Usuario registrado exitosamente"
            if user.role == 'STUDENT':
                message = "Alumno registrado exitosamente."
            elif user.role == 'TEACHER':
                message = "Docente registrado exitosamente."

            from rest_framework.authtoken.models import Token
            token, created = Token.objects.get_or_create(user=user)

            return Response({
                "message": message,
                "token": token.key,
                "user_id": user.id,
                "role": user.role
            }, status=status.HTTP_201_CREATED)

        except serializers.ValidationError as e:
            # Using e.detail directly as it should be a dict from serializer
            # e.g. {"field_name": ["Error message."]} or {"error": "Non field error"}
            error_detail = e.detail
            # Check for specific error messages from UserSerializer's validate method
            if isinstance(error_detail, dict) and 'error' in error_detail:
                if "El alumno ya está registrado con este DNI." in error_detail['error']:
                    return Response({"error": "El alumno ya está registrado"}, status=status.HTTP_400_BAD_REQUEST)
                if "Complete todos los datos del alumno" in error_detail['error']:
                    return Response({"error": error_detail['error']}, status=status.HTTP_400_BAD_REQUEST) # Return the specific message
                if "Correo ya registrado" in error_detail['error']:
                    return Response({"error": "Correo ya registrado"}, status=status.HTTP_400_BAD_REQUEST)
                if "Complete todos los datos obligatorios del docente" in error_detail['error']:
                     return Response({"error": error_detail['error']}, status=status.HTTP_400_BAD_REQUEST) # Return the specific message

            # Fallback for other validation errors (e.g. field-specific like invalid email format)
            return Response(error_detail, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        role_display_name = instance.get_role_display() # e.g. "Alumno", "Docente"
        is_student_or_teacher = instance.role in ['STUDENT', 'TEACHER']

        # Permission check already handled by get_permissions.
        # Additional check for non-admin users trying to delete important roles can be added if necessary.
        # For example, if request.user.role != 'ADMIN' and is_student_or_teacher:
        #    return Response({"error": f"No tiene permiso para eliminar este {role_display_name}."}, status=status.HTTP_403_FORBIDDEN)
        
        self.perform_destroy(instance)
        
        message = f"{role_display_name} eliminado exitosamente." \
            if is_student_or_teacher else "Usuario eliminado exitosamente."

        return Response({"message": message}, status=status.HTTP_204_NO_CONTENT)

class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer
    permission_classes = [IsAdminUser] # Changed from IsAuthenticated

class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsAdminUser] # Restricted to Admin users

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def enrolled_students(self, request, pk=None):
        subject = self.get_object()
        grade_ids = subject.grades.values_list('id', flat=True)

        # Consider current year for enrollment if applicable.
        # For now, all students ever enrolled in the subject's grades.
        # current_year = datetime.date.today().year # Example
        # student_ids = StudentEnrollment.objects.filter(
        # grade_id__in=grade_ids, year=current_year
        # ).values_list('student_id', flat=True).distinct()

        student_ids = StudentEnrollment.objects.filter(grade_id__in=grade_ids).values_list('student_id', flat=True).distinct()

        students = User.objects.filter(id__in=student_ids, role='STUDENT')

        # Permission check: if user is a teacher, are they assigned to this subject?
        # Admins can see all. Other roles might be denied or have different logic.
        if request.user.role == 'TEACHER':
            if not TeacherSubject.objects.filter(teacher=request.user, subject=subject).exists():
                return Response({"error": "No tiene permiso para ver los alumnos de esta materia."}, status=status.HTTP_403_FORBIDDEN)
        elif request.user.role not in ['ADMIN']: # Add other roles if they should be allowed
             # If not ADMIN or authorized TEACHER, deny.
             # This check might be too simplistic if e.g. students could see classmates.
             # For now, only Admin and assigned teachers.
            pass # Let it fall through if admin, handled by IsAuthenticated + specific teacher check


        serializer = UserSerializer(students, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(
                {"message": "Materia creada exitosamente.", "data": serializer.data},
                status=status.HTTP_201_CREATED,
                headers=headers
            )
        except serializers.ValidationError as e:
            # Check if the error is for the 'code' field and if it's our custom message
            if 'code' in e.detail and any("Ya existe una materia con este código." in error for error in e.detail['code']):
                return Response({"error": "Ya existe una materia con este código."}, status=status.HTTP_400_BAD_REQUEST)
            # For other validation errors, let DRF handle the response
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)

class TeacherSubjectViewSet(viewsets.ModelViewSet):
    queryset = TeacherSubject.objects.all()
    serializer_class = TeacherSubjectSerializer
    permission_classes = [IsAdminUser] # Restricted to Admin users

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {"message": "Docente asignado a la materia exitosamente.", "data": serializer.data},
            status=status.HTTP_201_CREATED,
            headers=headers
        )

class StudentEnrollmentViewSet(viewsets.ModelViewSet):
    queryset = StudentEnrollment.objects.all()
    serializer_class = StudentEnrollmentSerializer
    permission_classes = [IsAdminUser] # Changed from IsAuthenticated

class GradeRecordViewSet(viewsets.ModelViewSet):
    # queryset = GradeRecord.objects.all() # Replaced by get_queryset
    serializer_class = GradeRecordSerializer
    # permission_classes = [IsAuthenticated] # Base permission, will be handled by get_permissions

    def get_permissions(self):
        if self.action in ['list', 'by_student', 'by_subject']:
            # get_queryset handles filtering for these, IsAuthenticated is enough as a base.
            # create has its own specific permission logic inside the method.
            self.permission_classes = [IsAuthenticated]
        elif self.action == 'create':
             self.permission_classes = [IsAuthenticated] # Logic is inside create method
        elif self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAdminOrTeacherOfSubjectObject]
        else:
            self.permission_classes = [IsAdminUser] # Default to Admin for any other actions
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        queryset = GradeRecord.objects.all()

        if user.role == 'ADMIN':
            pass # Admin sees all
        elif user.role == 'TEACHER':
            taught_subjects = Subject.objects.filter(teachersubject__teacher=user)
            queryset = queryset.filter(subject__in=taught_subjects)
        elif user.role == 'STUDENT':
            queryset = queryset.filter(student=user)
        elif user.role == 'PARENT':
            queryset = queryset.filter(student__in=user.children.all())
        else:
            return GradeRecord.objects.none() # Or raise PermissionDenied

        # Apply query parameter filters
        student_id = self.request.query_params.get('student_id')
        subject_id = self.request.query_params.get('subject_id')
        grade_id = self.request.query_params.get('grade_id') # Grade of the student
        teacher_id = self.request.query_params.get('teacher_id') # Teacher of the subject

        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)

        if grade_id:
            # Filter by students enrolled in a specific grade
            # This requires a subquery or joining through StudentEnrollment
            # For simplicity, assuming student_id is used for specific student grades.
            # A direct filter on GradeRecord for grade_id of student would be:
            queryset = queryset.filter(student__studentenrollment__grade_id=grade_id)
            # If year is also important for enrollment in that grade:
            # enrollment_year = self.request.query_params.get('enrollment_year')
            # if enrollment_year:
            #     queryset = queryset.filter(student__studentenrollment__grade_id=grade_id,
            #                                student__studentenrollment__year=enrollment_year)


        if teacher_id:
            # Filter by records where the subject is taught by a specific teacher
            queryset = queryset.filter(subject__teachersubject__teacher_id=teacher_id)

        return queryset.distinct()


    def create(self, request, *args, **kwargs):
        if not (request.user.role == 'TEACHER' or request.user.role == 'ADMIN'):
            return Response(
                {"error": "No tiene permiso para registrar notas."},
                status=status.HTTP_403_FORBIDDEN
            )

        subject_id = request.data.get('subject_id')
        if not subject_id:
            return Response({"error": "El campo subject_id es obligatorio."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            subject = Subject.objects.get(pk=subject_id)
        except Subject.DoesNotExist:
            return Response({"error": "La materia especificada no existe."}, status=status.HTTP_400_BAD_REQUEST)

        if request.user.role == 'TEACHER':
            is_assigned_to_subject = TeacherSubject.objects.filter(teacher=request.user, subject=subject).exists()
            if not is_assigned_to_subject:
                return Response(
                    {"error": "No tiene permiso para registrar notas para esta materia."},
                    status=status.HTTP_403_FORBIDDEN
                )

        # Proceed with standard creation process
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True) # This will also call serializer.validate_grade
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {"message": "Nota registrada exitosamente.", "data": serializer.data},
            status=status.HTTP_201_CREATED,
            headers=headers
        )
    
    @action(detail=False, methods=['get'])
    def by_student(self, request):
        student_id = request.query_params.get('student_id')
        if not student_id:
            return Response({'error': 'student_id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        records = self.queryset.filter(student_id=student_id)
        serializer = self.get_serializer(records, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_subject(self, request):
        subject_id = request.query_params.get('subject_id')
        if not subject_id:
            return Response({'error': 'subject_id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        records = self.queryset.filter(subject_id=subject_id)
        serializer = self.get_serializer(records, many=True)
        return Response(serializer.data)

class AttendanceViewSet(viewsets.ModelViewSet):
    # queryset = Attendance.objects.all() # Replaced by get_queryset
    serializer_class = AttendanceSerializer
    # permission_classes = [IsAuthenticated] # Base permission, will be handled by get_permissions

    def get_permissions(self):
        if self.action in ['list', 'by_date']:
             # get_queryset and by_date's internal logic will handle filtering.
            self.permission_classes = [IsAuthenticated]
        elif self.action in ['create', 'bulk_create']:
            self.permission_classes = [IsAuthenticated] # Logic is inside create/bulk_create methods
        elif self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAdminOrTeacherOfSubjectObjectAttendance]
        else:
            self.permission_classes = [IsAdminUser] # Default to Admin
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        queryset = Attendance.objects.all()

        if user.role == 'ADMIN':
            pass # Admin sees all
        elif user.role == 'TEACHER':
            taught_subjects = Subject.objects.filter(teachersubject__teacher=user)
            queryset = queryset.filter(subject__in=taught_subjects)
        elif user.role == 'STUDENT':
            queryset = queryset.filter(student=user)
        elif user.role == 'PARENT':
            queryset = queryset.filter(student__in=user.children.all())
        else:
            return Attendance.objects.none() # Or raise PermissionDenied

        # Apply query parameter filters if any (e.g. for admin use)
        student_id = self.request.query_params.get('student_id')
        subject_id = self.request.query_params.get('subject_id')
        date = self.request.query_params.get('date')

        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)
        if date:
            queryset = queryset.filter(date=date)

        return queryset.distinct()

    def create(self, request, *args, **kwargs):
        if not (request.user.role == 'TEACHER' or request.user.role == 'ADMIN'):
            return Response(
                {"error": "No tiene permiso para registrar asistencia."},
                status=status.HTTP_403_FORBIDDEN
            )

        subject_id = request.data.get('subject_id')
        if not subject_id: # Should be caught by serializer, but good for early exit
            return Response({"error": "El campo subject_id es obligatorio."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            subject = Subject.objects.get(pk=subject_id)
        except Subject.DoesNotExist:
            return Response({"error": "La materia especificada no existe."}, status=status.HTTP_400_BAD_REQUEST)

        if request.user.role == 'TEACHER':
            is_assigned_to_subject = TeacherSubject.objects.filter(teacher=request.user, subject=subject).exists()
            if not is_assigned_to_subject:
                return Response(
                    {"error": "No tiene permiso para registrar asistencia para esta materia."},
                    status=status.HTTP_403_FORBIDDEN
                )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {"message": "Asistencia registrada exitosamente.", "data": serializer.data},
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    @action(detail=False, methods=['get'])
    def by_date(self, request):
        date_param = request.query_params.get('date')
        subject_id_param = request.query_params.get('subject_id')
        
        if not date_param or not subject_id_param:
            return Response(
                {'error': 'Los parámetros date y subject_id son obligatorios.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            subject = Subject.objects.get(pk=subject_id_param)
        except Subject.DoesNotExist:
            return Response({"error": "La materia especificada no existe."}, status=status.HTTP_400_BAD_REQUEST)

        if request.user.role == 'TEACHER':
            is_assigned_to_subject = TeacherSubject.objects.filter(teacher=request.user, subject=subject).exists()
            if not is_assigned_to_subject:
                return Response(
                    {"error": "No tiene permiso para ver la asistencia de esta materia."},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif request.user.role != 'ADMIN': # if not TEACHER and not ADMIN
             return Response(
                {"error": "No tiene permiso para ver esta asistencia."},
                status=status.HTTP_403_FORBIDDEN
            )

        attendances = self.queryset.filter(date=date_param, subject_id=subject_id_param)
        serializer = self.get_serializer(attendances, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        if not (request.user.role == 'TEACHER' or request.user.role == 'ADMIN'):
            return Response(
                {"error": "No tiene permiso para registrar asistencias."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Simplified permission check: assume all items in bulk are for the same subject.
        # Get subject_id from the first item in the request data.
        if not isinstance(request.data, list) or not request.data:
            return Response({"error": "Request data debe ser una lista no vacía de asistencias."}, status=status.HTTP_400_BAD_REQUEST)

        first_item_subject_id = request.data[0].get('subject_id')
        if not first_item_subject_id:
            return Response({"error": "El campo subject_id es obligatorio en los registros de asistencia."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            subject = Subject.objects.get(pk=first_item_subject_id)
        except Subject.DoesNotExist:
            return Response({"error": f"La materia especificada ({first_item_subject_id}) no existe."}, status=status.HTTP_400_BAD_REQUEST)

        if request.user.role == 'TEACHER':
            is_assigned_to_subject = TeacherSubject.objects.filter(teacher=request.user, subject=subject).exists()
            if not is_assigned_to_subject:
                return Response(
                    {"error": "No tiene permiso para registrar asistencias para esta materia."},
                    status=status.HTTP_403_FORBIDDEN
                )

        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {"message": "Asistencias registradas exitosamente.", "data": serializer.data},
            status=status.HTTP_201_CREATED,
            headers=headers
        )
    

class ChildGradesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'PARENT':
            return Response(
                {"detail": "Acceso no autorizado"}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        grades = GradeRecord.objects.filter(student__in=request.user.children.all())
        serializer = GradeRecordSerializer(grades, many=True)
        return Response(serializer.data)
    
class ChildAttendanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'PARENT':
            return Response(
                {"detail": "Acceso no autorizado"}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        attendance = Attendance.objects.filter(student__in=request.user.children.all())
        serializer = AttendanceSerializer(attendance, many=True)
        return Response(serializer.data)
    
class StudentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        student = get_object_or_404(CustomUser, id=student_id, role='STUDENT')
        
        if request.user.role == 'PARENT':
            if not request.user.children.filter(id=student.id).exists():
                return Response(
                    {"detail": "No tiene permiso para ver este estudiante"},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Agrega tu lógica de serialización aquí
        serializer = UserSerializer(student)
        return Response(serializer.data, status=status.HTTP_200_OK)

class ParentStudentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'PARENT':
            return Response(
                {"detail": "Acceso no autorizado"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        children = request.user.children.all()
        serializer = UserSerializer(children, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)