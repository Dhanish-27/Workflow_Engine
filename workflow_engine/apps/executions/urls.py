from django.urls import path
from .views import StartExecution

urlpatterns = [
    path("start/<uuid:workflow_id>/", StartExecution.as_view(), name="start-execution"),
]
