"""
URL configuration for bhaaglagam project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from api.views import (
    register, login, create_group, get_groups,
    get_group_details, update_group, delete_group
)

urlpatterns = [
    path('api/auth/register/', register, name='register'),
    path('api/auth/login/', login, name='login'),
    path('api/groups/', create_group, name='create_group'),
    path('api/groups/<str:group_id>/', get_group_details, name='get_group_details'),
    path('api/groups/<str:group_id>/update/', update_group, name='update_group'),
    path('api/groups/<str:group_id>/delete/', delete_group, name='delete_group'),
    path('api/', include('api.urls')),
    
    # Serve static files
    re_path(r'^static/(?P<path>.*)$', serve, {'document_root': settings.STATIC_ROOT}),
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
    
    # Serve frontend files
    path('', TemplateView.as_view(template_name='index.html')),
    path('login.html', TemplateView.as_view(template_name='login.html')),
    path('dashboard.html', TemplateView.as_view(template_name='dashboard.html')),
    path('groups.html', TemplateView.as_view(template_name='groups.html')),
    path('expenses.html', TemplateView.as_view(template_name='expenses.html')),
    path('profile.html', TemplateView.as_view(template_name='profile.html')),
]

# Add static and media serving for development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
