from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import *

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'email', 'role', 'dni', 'first_name', 'last_name', 'birth_date', 'specialty']
        extra_kwargs = {
            'password': {'write_only': True},
            'role': {'required': True},
            # DNI is not always required, only for students.
            # 'dni': {'required': True}
        }

    def validate(self, data):
        # Get role from data if available, or from instance if it's an update
        role = data.get('role', getattr(self.instance, 'role', None))

        if role == 'STUDENT':
            # Use existing validation for students and ensure it uses `data` for potentially updated fields
            required_student_fields = ['first_name', 'last_name', 'dni', 'birth_date']
            missing_student_fields = [field for field in required_student_fields if not data.get(field, getattr(self.instance, field, None) if self.instance else None)]
            if missing_student_fields:
                raise serializers.ValidationError({"error": f"Complete todos los datos del alumno: {', '.join(missing_student_fields)}"})

            dni = data.get('dni', getattr(self.instance, 'dni', None) if self.instance else None)
            if dni:
                query = User.objects.filter(dni=dni)
                if self.instance:
                    query = query.exclude(pk=self.instance.pk)
                if query.exists():
                    raise serializers.ValidationError({"error": "El alumno ya está registrado con este DNI."})

        elif role == 'TEACHER':
            required_teacher_fields = ['first_name', 'last_name', 'email']
            missing_teacher_fields = [field for field in required_teacher_fields if not data.get(field, getattr(self.instance, field, None) if self.instance else None)]
            if missing_teacher_fields:
                raise serializers.ValidationError({"error": f"Complete todos los datos obligatorios del docente: {', '.join(missing_teacher_fields)}"})

            email = data.get('email', getattr(self.instance, 'email', None) if self.instance else None)
            if not email: # Should be caught by missing_teacher_fields, but as a safeguard
                raise serializers.ValidationError({"error": "El campo email es obligatorio para docentes."})

            # Check for email uniqueness
            query = User.objects.filter(email=email)
            if self.instance: # If updating, exclude self
                query = query.exclude(pk=self.instance.pk)
            if query.exists():
                raise serializers.ValidationError({"error": "Correo ya registrado"})

        return data

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = '__all__'

class SubjectSerializer(serializers.ModelSerializer):
    grades = serializers.PrimaryKeyRelatedField(
        queryset=Grade.objects.all(),
        many=True,
        required=False # Or True, depending on whether grades must be assigned at creation
    )

    class Meta:
        model = Subject
        fields = ['id', 'name', 'code', 'grades'] # Ensure all required fields are listed

    def validate_code(self, value):
        # Check for uniqueness, excluding self if instance exists (update operation)
        query = Subject.objects.filter(code=value)
        if self.instance:
            query = query.exclude(pk=self.instance.pk)
        if query.exists():
            raise serializers.ValidationError("Ya existe una materia con este código.")
        return value

class TeacherSubjectSerializer(serializers.ModelSerializer):
    teacher = UserSerializer(read_only=True)
    teacher_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='TEACHER'), 
        source='teacher', 
        write_only=True
    )
    subject = SubjectSerializer(read_only=True)
    subject_id = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(), 
        source='subject', 
        write_only=True
    )
    
    class Meta:
        model = TeacherSubject
        fields = '__all__'

class StudentEnrollmentSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='STUDENT'), 
        source='student', 
        write_only=True
    )
    grade = GradeSerializer(read_only=True)
    grade_id = serializers.PrimaryKeyRelatedField(
        queryset=Grade.objects.all(), 
        source='grade', 
        write_only=True
    )
    
    class Meta:
        model = StudentEnrollment
        fields = '__all__'

class GradeRecordSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='STUDENT'), 
        source='student', 
        write_only=True
    )
    subject = SubjectSerializer(read_only=True)
    subject_id = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(), 
        source='subject', 
        write_only=True
    )
    
    class Meta:
        model = GradeRecord
        fields = '__all__'
    
    def validate_grade(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("La nota debe estar entre 0 y 100")
        return value

class AttendanceSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='STUDENT'), 
        source='student', 
        write_only=True
    )
    subject = SubjectSerializer(read_only=True)
    subject_id = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(), 
        source='subject', 
        write_only=True
    )
    
    class Meta:
        model = Attendance
        fields = '__all__'