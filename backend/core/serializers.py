from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from .models import *

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'email', 'role', 'dni', 'first_name', 'last_name', 'birth_date', 'specialty']
        extra_kwargs = {
            'password': {'write_only': True},
            'role': {'required': True},
            'dni': {'required': False}  # Lo manejamos en la validación
        }

    def validate_dni(self, value):
        """
        Validación específica para el campo DNI.
        """
        if value:
            # Verificar que el DNI solo contenga números
            if not value.isdigit():
                raise serializers.ValidationError("El DNI debe contener solo números.")
            
            # Verificar la longitud del DNI (por ejemplo, entre 7 y 10 dígitos)
            if len(value) < 7 or len(value) > 10:
                raise serializers.ValidationError("El DNI debe tener entre 7 y 10 dígitos.")
            
            # Verificar si el DNI ya existe
            request = self.context.get('request')
            if request and request.method == 'POST':  # Si es una creación nueva
                if User.objects.filter(dni=value).exists():
                    raise serializers.ValidationError("Ya existe un usuario registrado con este DNI.")
            else:  # Si es una actualización
                if self.instance and User.objects.exclude(pk=self.instance.pk).filter(dni=value).exists():
                    raise serializers.ValidationError("Ya existe un usuario registrado con este DNI.")
        return value

    def validate(self, data):
        # Get role from data if available, or from instance if it's an update
        role = data.get('role', getattr(self.instance, 'role', None))

        if role == 'STUDENT':
            # Validación para estudiantes
            required_student_fields = ['first_name', 'last_name', 'dni', 'birth_date']
            missing_student_fields = [field for field in required_student_fields if not data.get(field, getattr(self.instance, field, None) if self.instance else None)]
            if missing_student_fields:
                raise serializers.ValidationError({
                    "error": f"Complete todos los datos del alumno: {', '.join(missing_student_fields)}"
                })

            # Validación del DNI para estudiantes
            dni = data.get('dni')
            if not dni:
                raise serializers.ValidationError({
                    "error": "El DNI es obligatorio para estudiantes."
                })

        elif role == 'TEACHER':
            required_teacher_fields = ['first_name', 'last_name', 'email']
            missing_teacher_fields = [field for field in required_teacher_fields if not data.get(field, getattr(self.instance, field, None) if self.instance else None)]
            if missing_teacher_fields:
                raise serializers.ValidationError({
                    "error": f"Complete todos los datos obligatorios del docente: {', '.join(missing_teacher_fields)}"
                })

        # Validación del email
        email = data.get('email')
        if email:
            # Verificar si el email ya existe
            query = User.objects.filter(email=email)
            if self.instance:
                query = query.exclude(pk=self.instance.pk)
            if query.exists():
                raise serializers.ValidationError({
                    "error": "Ya existe un usuario registrado con este correo electrónico."
                })

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

class EmailAuthTokenSerializer(serializers.Serializer):
    email = serializers.EmailField(label="Email")
    password = serializers.CharField(
        label="Password",
        style={'input_type': 'password'},
        trim_whitespace=False,
        write_only=True
    )
    token = serializers.CharField(read_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            try:
                user = User.objects.get(email=email)
                if user.check_password(password):
                    if not user.is_active:
                        msg = 'Usuario desactivado.'
                        raise serializers.ValidationError(msg, code='authorization')
                    attrs['user'] = user
                    return attrs
                else:
                    msg = 'No se puede iniciar sesión con las credenciales proporcionadas.'
                    raise serializers.ValidationError(msg, code='authorization')
            except User.DoesNotExist:
                msg = 'No se puede iniciar sesión con las credenciales proporcionadas.'
                raise serializers.ValidationError(msg, code='authorization')
        else:
            msg = 'Debe incluir "email" y "password".'
            raise serializers.ValidationError(msg, code='authorization')

class ParticipationSerializer(serializers.ModelSerializer):
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
        model = Participation
        fields = '__all__'

    def validate_score(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("La puntuación debe estar entre 0 y 100")
        return value

class AcademicPeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicPeriod
        fields = '__all__'

    def validate(self, data):
        if data['start_date'] >= data['end_date']:
            raise serializers.ValidationError({
                "error": "La fecha de inicio debe ser anterior a la fecha de fin"
            })
        return data

class StudentPerformancePredictionSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    period = AcademicPeriodSerializer(read_only=True)

    class Meta:
        model = StudentPerformancePrediction
        fields = '__all__'

class DashboardMetricsSerializer(serializers.ModelSerializer):
    period = AcademicPeriodSerializer(read_only=True)

    class Meta:
        model = DashboardMetrics
        fields = '__all__'