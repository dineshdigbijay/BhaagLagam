from django.contrib.auth.backends import BaseBackend
from django.contrib.auth.hashers import check_password
from .dynamo_models import UserModel

class DynamoDBAuthBackend(BaseBackend):
    def authenticate(self, request, username=None, password=None, email=None, **kwargs):
        try:
            # Use email if provided, otherwise use username as email
            user_email = email or username
            if not user_email:
                return None

            user = UserModel.get(user_email)
            if check_password(password, user.password):
                return user
        except UserModel.DoesNotExist:
            return None
        return None

    def get_user(self, user_id):
        try:
            return UserModel.get(user_id)
        except UserModel.DoesNotExist:
            return None

    def user_can_authenticate(self, user):
        return user is not None and getattr(user, 'is_active', True) 