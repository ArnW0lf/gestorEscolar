from rest_framework.permissions import BasePermission
from .models import TeacherSubject

class IsAdminOrTeacherOfSubjectObject(BasePermission):
    """
    Custom permission to only allow admins or teachers of the subject to access/modify an object.
    Assumes the object being accessed has a 'subject' attribute.
    """

    def has_object_permission(self, request, view, obj):
        # Admin users have full access
        if request.user.is_staff or request.user.role == 'ADMIN':
            return True

        # Teachers can access/modify if they are assigned to the subject of the object
        if request.user.role == 'TEACHER':
            if hasattr(obj, 'subject') and obj.subject is not None:
                return TeacherSubject.objects.filter(teacher=request.user, subject=obj.subject).exists()
            # If the object itself is a Subject instance (e.g. if used for SubjectViewSet)
            elif hasattr(obj, 'pk') and obj.__class__.__name__ == 'Subject':
                 return TeacherSubject.objects.filter(teacher=request.user, subject=obj).exists()
        return False

class IsAdminOrTeacherOfSubjectObjectAttendance(BasePermission):
    """
    Custom permission tailored for Attendance objects.
    Grants access if the user is an ADMIN or a TEACHER assigned to the subject of the Attendance record.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff or request.user.role == 'ADMIN':
            return True

        if request.user.role == 'TEACHER':
            # obj is an Attendance instance, which has a 'subject' ForeignKey
            if hasattr(obj, 'subject') and obj.subject is not None:
                return TeacherSubject.objects.filter(teacher=request.user, subject=obj.subject).exists()
        return False
