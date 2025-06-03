from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.core.validators import MinValueValidator, MaxValueValidator

class CustomUser(AbstractUser):
    ROLES = (
        ('ADMIN', 'Administrador'),
        ('TEACHER', 'Docente'),
        ('STUDENT', 'Alumno'),
        ('PARENT', 'Padre'),
    )
    role = models.CharField(max_length=10, choices=ROLES)
    dni = models.CharField(max_length=20, unique=True, null=True, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    children = models.ManyToManyField('self', blank=True, limit_choices_to={'role': 'STUDENT'}, symmetrical=False)
    specialty = models.CharField(max_length=100, null=True, blank=True) # Field for teacher's specialty
    email = models.EmailField(unique=True, null=False, blank=False)  # Hacemos el email único y requerido
    username = models.CharField(max_length=150, unique=True, null=True, blank=True)  # Hacemos el username opcional

    USERNAME_FIELD = 'email'  # Usamos email como campo de autenticación
    REQUIRED_FIELDS = ['role']  # Campos requeridos además del email y password

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    def save(self, *args, **kwargs):
        if not self.username:
            self.username = self.email  # Si no se proporciona username, usar el email
        super().save(*args, **kwargs)

class Grade(models.Model):  # Representa un grado escolar
    name = models.CharField(max_length=50)
    section = models.CharField(max_length=1)
    
    class Meta:
        unique_together = ('name', 'section')
    
    def __str__(self):
        return f"{self.name} {self.section}"
    
class Subject(models.Model): # Representa una materia
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    grades = models.ManyToManyField(Grade, related_name='subjects')
    
    def __str__(self):
        return self.name

class TeacherSubject(models.Model): # Relaciona un docente con una materia
    teacher = models.ForeignKey(CustomUser, on_delete=models.CASCADE, limit_choices_to={'role': 'TEACHER'})
    subject = models.ForeignKey('Subject', on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ('teacher', 'subject')
    
    def __str__(self):
        return f"{self.teacher} - {self.subject}"

class StudentEnrollment(models.Model): # Relaciona un alumno con un grado escolar
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, limit_choices_to={'role': 'STUDENT'})
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE)
    year = models.PositiveIntegerField()
    
    class Meta:
        unique_together = ('student', 'year')
    
    def __str__(self):
        return f"{self.student} - {self.grade} ({self.year})"

class GradeRecord(models.Model): # Representa una calificación de un alumno en una materia
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, limit_choices_to={'role': 'STUDENT'})
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    exam_type = models.CharField(max_length=50)
    grade = models.DecimalField(max_digits=5, decimal_places=2)
    date = models.DateField(auto_now_add=True)

    class Meta:
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.student} - {self.subject}: {self.grade}"

class Attendance(models.Model): # Representa la asistencia de un alumno a una clase
    STATUS_CHOICES = (
        ('P', 'Presente'),
        ('A', 'Ausente'),
        ('J', 'Justificado'),
    )
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, limit_choices_to={'role': 'STUDENT'})
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    date = models.DateField()
    status = models.CharField(max_length=1, choices=STATUS_CHOICES)
    notes = models.TextField(blank=True)
    
    class Meta: # Relaciona un alumno con una materia y una fecha
        unique_together = ('student', 'subject', 'date')
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.student.username} - {self.subject.name} ({self.date}): {self.get_status_display()}"

class ParentPermissions:
    @classmethod
    def create(cls):
        content_type = ContentType.objects.get_for_model(CustomUser)
        
        Permission.objects.get_or_create(
            codename='view_child_grades',
            name='Can view child grades',
            content_type=content_type
        )
        
        Permission.objects.get_or_create(
            codename='view_child_attendance',
            name='Can view child attendance',
            content_type=content_type
        )

class Participation(models.Model):
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, limit_choices_to={'role': 'STUDENT'})
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    date = models.DateField()
    description = models.TextField()
    participation_type = models.CharField(max_length=20, choices=[
        ('ACTIVE', 'Participación Activa'),
        ('HOMEWORK', 'Entrega de Tarea'),
        ('PROJECT', 'Proyecto'),
        ('QUESTION', 'Pregunta'),
        ('OTHER', 'Otro')
    ])
    score = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(100)])
    
    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.student} - {self.subject} ({self.date})"

class AcademicPeriod(models.Model):
    name = models.CharField(max_length=50)
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class StudentPerformancePrediction(models.Model):
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, limit_choices_to={'role': 'STUDENT'})
    period = models.ForeignKey(AcademicPeriod, on_delete=models.CASCADE)
    prediction_date = models.DateTimeField(auto_now_add=True)
    predicted_score = models.FloatField()
    performance_category = models.CharField(max_length=20, choices=[
        ('LOW', 'Bajo Rendimiento'),
        ('MEDIUM', 'Rendimiento Medio'),
        ('HIGH', 'Alto Rendimiento')
    ])
    confidence_score = models.FloatField()
    features_used = models.JSONField()  # Almacena las variables usadas para la predicción

    class Meta:
        ordering = ['-prediction_date']

    def __str__(self):
        return f"Predicción para {self.student} - {self.period}"

class DashboardMetrics(models.Model):
    period = models.ForeignKey(AcademicPeriod, on_delete=models.CASCADE)
    calculation_date = models.DateTimeField(auto_now=True)
    total_students = models.IntegerField()
    average_grade = models.FloatField()
    attendance_rate = models.FloatField()
    participation_rate = models.FloatField()
    metrics_data = models.JSONField()  # Almacena métricas adicionales en formato JSON

    class Meta:
        ordering = ['-calculation_date']

    def __str__(self):
        return f"Métricas del {self.period} - {self.calculation_date.date()}"

# Create your models here.
