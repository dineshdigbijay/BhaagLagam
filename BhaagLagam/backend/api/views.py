from rest_framework import viewsets, status, permissions, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
import uuid
from decimal import Decimal
from .dynamo_models import UserModel, GroupModel, ExpenseModel, ExpenseSplitModel
from .serializers import (
    UserSerializer, UserRegistrationSerializer, GroupSerializer,
    ExpenseSerializer, ExpenseSplitSerializer
)
from django.contrib.auth.hashers import make_password, check_password
import jwt
from datetime import datetime, timedelta
from django.conf import settings

# Authentication helper functions
def generate_token(user):
    payload = {
        'email': user.email,
        'exp': datetime.utcnow() + timedelta(days=1)
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

def verify_token(token):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

class UserRegistrationView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = UserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'user': UserSerializer(user).data,
                'message': 'User registered successfully'
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            user = UserModel.get(request.user.email)
            serializer = UserSerializer(user)
            return Response(serializer.data)
        except UserModel.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class UserViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserRegistrationSerializer
        return UserSerializer

    def list(self, request):
        users = UserModel.scan()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        try:
            user = UserModel.get(pk)
            serializer = UserSerializer(user)
            return Response(serializer.data)
        except UserModel.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['GET'])
    def me(self, request):
        try:
            user = UserModel.get(request.user.email)
            serializer = UserSerializer(user)
            return Response(serializer.data)
        except UserModel.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

class GroupViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        groups = GroupModel.scan(
            filter_condition=GroupModel.members.contains(request.user.email)
        )
        serializer = GroupSerializer(groups, many=True)
        return Response(serializer.data)

    def create(self, request):
        serializer = GroupSerializer(data=request.data)
        if serializer.is_valid():
            group = serializer.save(
                created_by=request.user.email,
                members=[request.user.email]
            )
            return Response(GroupSerializer(group).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['POST'])
    def add_member(self, request, pk=None):
        try:
            group = GroupModel.get(pk)
            user_email = request.data.get('user_email')
            
            if user_email not in group.members:
                group.members.append(user_email)
                group.save()
            
            return Response({'status': 'member added'})
        except GroupModel.DoesNotExist:
            return Response({'error': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)

class ExpenseViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        expenses = ExpenseModel.scan()
        serializer = ExpenseSerializer(expenses, many=True)
        return Response(serializer.data)

    def create(self, request):
        serializer = ExpenseSerializer(data=request.data)
        if serializer.is_valid():
            # Create the expense
            expense = serializer.save(paid_by=request.user.email)
            
            # Create splits based on split type
            if expense.split_type == 'EQUAL':
                group = GroupModel.get(expense.group_id)
                split_amount = Decimal(str(expense.amount)) / len(group.members)
                
                for member_email in group.members:
                    ExpenseSplitModel(
                        id=str(uuid.uuid4()),
                        expense_id=expense.id,
                        user_email=member_email,
                        amount=split_amount
                    ).save()
            else:  # CUSTOM split
                for split in expense.custom_splits:
                    ExpenseSplitModel(
                        id=str(uuid.uuid4()),
                        expense_id=expense.id,
                        user_email=split.user_email,
                        amount=split.amount
                    ).save()
            
            return Response(ExpenseSerializer(expense).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        try:
            expense = ExpenseModel.get(pk)
            serializer = ExpenseSerializer(expense)
            return Response(serializer.data)
        except ExpenseModel.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

class ExpenseSplitViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        splits = ExpenseSplitModel.scan(
            filter_condition=ExpenseSplitModel.user_email == request.user.email
        )
        serializer = ExpenseSplitSerializer(splits, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['POST'])
    def mark_as_paid(self, request, pk=None):
        try:
            split = ExpenseSplitModel.get(pk)
            split.paid_status = 'PAID'
            split.save()
            return Response({'status': 'marked as paid'})
        except ExpenseSplitModel.DoesNotExist:
            return Response({'error': 'Split not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['GET'])
    def summary(self, request):
        # Get splits where user owes money
        owed_splits = ExpenseSplitModel.scan(
            filter_condition=(
                ExpenseSplitModel.user_email == request.user.email &
                ExpenseSplitModel.paid_status == 'PENDING'
            )
        )
        
        # Get splits where others owe the user
        owed_to_user_splits = ExpenseSplitModel.scan(
            filter_condition=(
                ExpenseSplitModel.paid_status == 'PENDING'
            )
        )
        
        # Calculate totals
        total_owed = sum(Decimal(str(split.amount)) for split in owed_splits)
        total_owed_to_user = sum(
            Decimal(str(split.amount)) 
            for split in owed_to_user_splits 
            if ExpenseModel.get(split.expense_id).paid_by == request.user.email
        )

        return Response({
            'total_owed': str(total_owed),
            'total_owed_to_user': str(total_owed_to_user),
            'net_balance': str(total_owed_to_user - total_owed)
        })

# User views
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    try:
        email = request.data.get('email')
        username = request.data.get('username')
        password = request.data.get('password')

        if not all([email, username, password]):
            return Response({
                'error': 'Email, username and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if user already exists
        try:
            UserModel.get(email)
            return Response({
                'error': 'User with this email already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        except UserModel.DoesNotExist:
            pass

        # Create new user
        user = UserModel(
            email=email,
            username=username,
            password=make_password(password),
            date_joined=datetime.now()
        )
        user.save()

        # Generate token
        token = generate_token(user)

        return Response({
            'token': token,
            'user': {
                'email': user.email,
                'username': user.username
            }
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    try:
        email = request.data.get('email')
        password = request.data.get('password')

        if not all([email, password]):
            return Response({
                'error': 'Email and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = UserModel.get(email)
            if not check_password(password, user.password):
                return Response({
                    'error': 'Invalid credentials'
                }, status=status.HTTP_401_UNAUTHORIZED)

            # Generate token
            token = generate_token(user)

            return Response({
                'token': token,
                'user': {
                    'email': user.email,
                    'username': user.username
                }
            })

        except UserModel.DoesNotExist:
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)

    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Group views
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_group(request):
    try:
        # Get the current user's email from the token
        user_email = request.user.email
        
        # Validate required fields
        name = request.data.get('name')
        if not name:
            return Response({'error': 'Group name is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get optional fields
        description = request.data.get('description', '')
        members = request.data.get('members', [])
        
        # Add current user to members if not already included
        if user_email not in members:
            members.append(user_email)
        
        # Create group in DynamoDB
        group = GroupModel(
            id=str(uuid.uuid4()),
            name=name,
            description=description,
            created_by=user_email,
            members=members,
            created_at=datetime.now()
        )
        group.save()
        
        return Response(group.to_dict(), status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def list_groups(request):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'No token provided'}, status=status.HTTP_401_UNAUTHORIZED)
        
        token = auth_header.split(' ')[1]
        payload = verify_token(token)
        if not payload:
            return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
        
        user_email = payload['email']
        groups = []
        for group in GroupModel.scan():
            if user_email in group.members:
                groups.append(group.to_dict())
        
        return Response(groups)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# Expense views
@api_view(['POST'])
def create_expense(request):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'No token provided'}, status=status.HTTP_401_UNAUTHORIZED)
        
        token = auth_header.split(' ')[1]
        payload = verify_token(token)
        if not payload:
            return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
        
        expense = ExpenseModel(
            group_id=request.data['group_id'],
            amount=float(request.data['amount']),
            description=request.data['description'],
            paid_by=payload['email'],
            split_type=request.data['split_type'],
            custom_splits=request.data.get('custom_splits', [])
        )
        expense.save()
        
        return Response(expense.to_dict(), status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def list_expenses(request, group_id):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'No token provided'}, status=status.HTTP_401_UNAUTHORIZED)
        
        token = auth_header.split(' ')[1]
        payload = verify_token(token)
        if not payload:
            return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
        
        expenses = []
        for expense in ExpenseModel.scan():
            if expense.group_id == group_id:
                expenses.append(expense.to_dict())
        
        return Response(expenses)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
