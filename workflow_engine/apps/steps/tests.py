from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import TaskDefinition

User = get_user_model()

class TaskDefinitionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.client.force_authenticate(user=self.user)
        self.definition_data = {
            "name": "Test Template",
            "description": "Internal Test",
            "task_type": "document_upload",
            "form_fields": []
        }

    def test_create_task_definition(self):
        response = self.client.post('/api/steps/definitions/', self.definition_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(TaskDefinition.objects.count(), 1)
        self.assertEqual(TaskDefinition.objects.get().name, "Test Template")

    def test_get_task_definitions(self):
        TaskDefinition.objects.create(**self.definition_data)
        response = self.client.get('/api/steps/definitions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check results in paginated response or list
        data = response.json()
        results = data.get('results', data)
        self.assertEqual(len(results), 1)
