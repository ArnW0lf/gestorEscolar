"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.authtoken import views as auth_views
from core.views import StudentDetailView, ParentStudentView, ChildGradesView, ChildAttendanceView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),  # Incluye todas las rutas API
    path('api-token-auth/', auth_views.obtain_auth_token),
    
    # Rutas específicas para padres
    path('api/parent/grades/', ChildGradesView.as_view(), name='parent-grades'),
    path('api/parent/attendance/', ChildAttendanceView.as_view(), name='parent-attendance'),
    
    # Rutas para estudiantes
    path('api/students/<int:student_id>/', StudentDetailView.as_view(), name='student-detail'),
    path('api/parent/my-children/', ParentStudentView.as_view(), name='parent-children'),
]