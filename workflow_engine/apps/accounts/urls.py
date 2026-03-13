from django.urls import path
from .views import (
    RegisterUserView, 
    LoginView, 
    CurrentUserView,
    UserListView,
    UserDetailView
)

urlpatterns = [
    # Authentication
    path("login/", LoginView.as_view(), name="login"),
    path("me/", CurrentUserView.as_view(), name="current-user"),
    
    # User Management
    path("register/", RegisterUserView.as_view(), name="register-user"),
    path("users/", UserListView.as_view(), name="user-list"),
    path("users/<int:pk>/", UserDetailView.as_view(), name="user-detail"),
]
