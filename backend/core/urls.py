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

urlpatterns = [

    path('', include(router.urls)),
    path('register/', views.UserViewSet.as_view({'post': 'create'}), name='register'),
    path('login/', obtain_auth_token, name='login'),
]