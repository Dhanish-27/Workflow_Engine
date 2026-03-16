from django.urls import path
from .views import (
    NotificationListView,
    NotificationDetailView,
    MarkAsReadView,
    MarkAllReadView,
    UnreadCountView
)

urlpatterns = [
    # List all notifications for current user
    path("", NotificationListView.as_view(), name="notification-list"),
    
    # Get single notification
    path("<uuid:pk>/", NotificationDetailView.as_view(), name="notification-detail"),
    
    # Mark notification as read
    path("<uuid:pk>/read/", MarkAsReadView.as_view(), name="mark-as-read"),
    
    # Mark all notifications as read
    path("mark-all-read/", MarkAllReadView.as_view(), name="mark-all-read"),
    
    # Get unread count
    path("unread-count/", UnreadCountView.as_view(), name="unread-count"),
]
