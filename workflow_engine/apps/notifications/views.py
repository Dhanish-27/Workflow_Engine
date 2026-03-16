from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import Notification
from .serializers import NotificationSerializer, NotificationUpdateSerializer


class NotificationListView(APIView):
    """
    GET /notifications/ - List all notifications for current user
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user).order_by('-created_at')
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)


class NotificationDetailView(APIView):
    """
    GET /notifications/{id}/ - Get single notification
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        notification = get_object_or_404(Notification, pk=pk, user=request.user)
        serializer = NotificationSerializer(notification)
        return Response(serializer.data)


class MarkAsReadView(APIView):
    """
    PATCH /notifications/{id}/read/ - Mark notification as read
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        notification = get_object_or_404(Notification, pk=pk, user=request.user)
        serializer = NotificationUpdateSerializer(notification, data={'is_read': True}, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(NotificationSerializer(notification).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MarkAllReadView(APIView):
    """
    POST /notifications/mark-all-read/ - Mark all notifications as read
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        updated_count = Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({
            'message': f'{updated_count} notifications marked as read',
            'updated_count': updated_count
        })


class UnreadCountView(APIView):
    """
    GET /notifications/unread-count/ - Get count of unread notifications
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': count})
