from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import Grade, Subject, Attendance
from rest_framework.test import APIClient  # <-- Importa APIClient
from rest_framework import status
from django.urls import reverse

User = get_user_model()

class ViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()  # <-- ¡Importante! Crea el cliente API aquí
        self.parent_user = User.objects.create_user(
            username='parent1',
            password='testpass123',
            role='PARENT'
        )
        self.student = User.objects.create_user(
            username='student1',
            password='testpass123',
            role='STUDENT',
            dni='11111111'
        )
        self.other_student = User.objects.create_user(
            username='otherstudent',
            password='testpass123',
            role='STUDENT',
            dni='22222222'
        )

    def test_parent_view_permissions(self):
        """Testear que padres no pueden ver otros estudiantes"""
        self.client.force_authenticate(user=self.parent_user)
        
        # Usa reverse para obtener la URL
        url = reverse('student-detail', kwargs={'student_id': self.other_student.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_parent_can_view_own_child(self):
        """Testear que padres pueden ver sus hijos"""
        self.parent_user.children.add(self.student)
        self.client.force_authenticate(user=self.parent_user)
        
        url = reverse('student-detail', kwargs={'student_id': self.student.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)