from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Grade, Subject, TeacherSubject, StudentEnrollment, GradeRecord, Attendance

# Configuración avanzada para CustomUser
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser')
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email', 'dni', 'birth_date')}),
        ('Permissions', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    filter_horizontal = ('groups', 'user_permissions', 'children')
if not admin.site.is_registered(CustomUser):
    class CustomUserAdmin(UserAdmin):
        list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_staff')
        list_filter = ('role', 'is_staff', 'is_superuser')
        fieldsets = (
            (None, {'fields': ('username', 'password')}),
            ('Personal info', {'fields': ('first_name', 'last_name', 'email', 'dni', 'birth_date')}),
            ('Permissions', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
            ('Important dates', {'fields': ('last_login', 'date_joined')}),
        )
        filter_horizontal = ('groups', 'user_permissions', 'children')
    
    admin.site.register(CustomUser, CustomUserAdmin)

# Registra otros modelos solo si no están registrados
models_to_register = [Grade, Subject, TeacherSubject, StudentEnrollment, GradeRecord, Attendance]

for model in models_to_register:
    if not admin.site.is_registered(model):
        admin.site.register(model)

# Registra todos los modelos
