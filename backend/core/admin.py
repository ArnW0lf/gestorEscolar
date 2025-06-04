from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Grade, Subject, TeacherSubject, StudentEnrollment, GradeRecord, Attendance

class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    list_editable = ('role',)  # Permite editar el rol directamente desde la lista
    
    # Campos para búsqueda
    search_fields = ('username', 'email', 'first_name', 'last_name', 'dni')
    
    # Campos en el formulario de edición
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Información personal', {'fields': ('first_name', 'last_name', 'email', 'dni', 'birth_date', 'specialty')}),
        ('Relaciones', {'fields': ('children',)}),
        ('Roles y permisos', {
            'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Fechas importantes', {'fields': ('last_login', 'date_joined')}),
    )
    
    # Campos en el formulario de creación
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2', 'email', 'first_name', 'last_name'),
        }),
        ('Información adicional', {
            'fields': ('dni', 'birth_date', 'role', 'specialty', 'children'),
        }),
    )
    
    filter_horizontal = ('groups', 'user_permissions', 'children')

# Registra el modelo CustomUser con la configuración personalizada
admin.site.register(CustomUser, CustomUserAdmin)

# Registra otros modelos
admin.site.register(Grade)
admin.site.register(Subject)
admin.site.register(TeacherSubject)
admin.site.register(StudentEnrollment)
admin.site.register(GradeRecord)
admin.site.register(Attendance)