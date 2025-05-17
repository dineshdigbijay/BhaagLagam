from api.dynamo_models import UserModel
import uuid

def init_app():
    # Create superuser if it doesn't exist
    try:
        UserModel.get('admin@bhaaglagam.com')
        print("Superuser already exists")
    except UserModel.DoesNotExist:
        user = UserModel(
            email='admin@bhaaglagam.com',
            username='admin',
            password='admin123',  # In production, use a secure password
            is_active=True
        )
        user.save()
        print("Superuser created successfully")

if __name__ == "__main__":
    init_app() 