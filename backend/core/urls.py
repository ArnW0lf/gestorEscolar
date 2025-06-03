from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from rest_framework.authtoken.views import obtain_auth_token

router = DefaultRouter()
# Elimina el registro de users del router si vas a manejarlo por separado
router.register(r'users', views.UserViewSet, basename='users')
router.register(r'grades', views.GradeViewSet)
router.register(r'subjects', views.SubjectViewSet)
router.register(r'teacher-subjects', views.TeacherSubjectViewSet)
router.register(r'enrollments', views.StudentEnrollmentViewSet)
router.register(r'grades-records', views.GradeRecordViewSet, basename='graderecord')
router.register(r'attendances', views.AttendanceViewSet, basename='attendance')
router.register(r'participations', views.ParticipationViewSet, basename='participation')
router.register(r'academic-periods', views.AcademicPeriodViewSet)
router.register(r'predictions', views.StudentPerformancePredictionViewSet, basename='prediction')
router.register(r'dashboard', views.DashboardViewSet, basename='dashboard')

urlpatterns = [
    path('', include(router.urls)),
    path('login/', views.EmailTokenObtainView.as_view(), name='login'),
    
    # Nuevos endpoints específicos para registro
    path('register/student/', views.RegisterStudentView.as_view(), name='register-student'),
    path('register/teacher/', views.RegisterTeacherView.as_view(), name='register-teacher'),
    path('register/parent/', views.RegisterParentView.as_view(), name='register-parent'),
]