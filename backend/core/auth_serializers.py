from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import CustomUser

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Añadir claims personalizados
        token['role'] = user.role
        token['email'] = user.email
        token['full_name'] = f"{user.first_name} {user.last_name}"
        
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Añadir datos adicionales a la respuesta
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'role': self.user.role,
            'full_name': f"{self.user.first_name} {self.user.last_name}"
        }
        
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer