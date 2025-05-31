from django.core.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from .models import CustomUser

def parent_required(view_func):
    def wrapper(request, *args, **kwargs):
        user = request.user
        if user.role != 'PARENT':
            raise PermissionDenied
        return view_func(request, *args, **kwargs)
    return wrapper