from django.apps import AppConfig

class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        # Solo ejecuta en producción o cuando todas las apps estén listas
        import os
        if os.environ.get('RUN_MAIN') or os.environ.get('RUN_WORKER'):
            from .models import ParentPermissions
            ParentPermissions.create()