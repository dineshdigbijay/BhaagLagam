from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'groups', views.GroupViewSet, basename='group')
router.register(r'expenses', views.ExpenseViewSet, basename='expense')
router.register(r'expense-splits', views.ExpenseSplitViewSet, basename='split')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', views.register, name='register'),
    path('auth/login/', views.login, name='login'),
    path('groups/', views.list_groups, name='list_groups'),
    path('groups/create/', views.create_group, name='create_group'),
    path('expenses/create/', views.create_expense, name='create_expense'),
    path('expenses/group/<str:group_id>/', views.list_expenses, name='list_expenses'),
    path('users/me/', views.CurrentUserView.as_view(), name='current_user'),
] 