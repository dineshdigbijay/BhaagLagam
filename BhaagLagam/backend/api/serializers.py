from rest_framework import serializers
import uuid
from decimal import Decimal
from .dynamo_models import UserModel, GroupModel, ExpenseModel, ExpenseSplitModel, SplitMapAttribute

class UserSerializer(serializers.Serializer):
    email = serializers.EmailField()
    username = serializers.CharField()
    phone_number = serializers.CharField(required=False, allow_null=True)
    profile_picture = serializers.CharField(required=False, allow_null=True)
    date_joined = serializers.DateTimeField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)

    def create(self, validated_data):
        user = UserModel(**validated_data)
        user.save()
        return user

class UserRegistrationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(required=False, allow_null=True)
    profile_picture = serializers.CharField(required=False, allow_null=True)

    def create(self, validated_data):
        user = UserModel(**validated_data)
        user.save()
        return user

class GroupSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField()
    description = serializers.CharField(required=False, allow_null=True)
    created_by = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    members = serializers.ListField(child=serializers.CharField(), read_only=True)

    def create(self, validated_data):
        validated_data['id'] = str(uuid.uuid4())
        group = GroupModel(**validated_data)
        group.save()
        return group

class CustomSplitSerializer(serializers.Serializer):
    user_email = serializers.EmailField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)

class ExpenseSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    group_id = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    description = serializers.CharField()
    paid_by = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    split_type = serializers.ChoiceField(choices=['EQUAL', 'CUSTOM'], default='EQUAL')
    custom_splits = CustomSplitSerializer(many=True, required=False)

    def validate(self, data):
        if data.get('split_type') == 'CUSTOM' and not data.get('custom_splits'):
            raise serializers.ValidationError("Custom splits are required when split_type is CUSTOM")
        
        if data.get('split_type') == 'CUSTOM':
            total_split = sum(Decimal(str(split['amount'])) for split in data['custom_splits'])
            if total_split != Decimal(str(data['amount'])):
                raise serializers.ValidationError("Sum of custom splits must equal the total amount")

        return data

    def create(self, validated_data):
        custom_splits = validated_data.pop('custom_splits', None)
        validated_data['id'] = str(uuid.uuid4())
        
        if custom_splits:
            validated_data['custom_splits'] = [
                SplitMapAttribute(user_email=split['user_email'], amount=split['amount'])
                for split in custom_splits
            ]
        
        expense = ExpenseModel(**validated_data)
        expense.save()
        return expense

class ExpenseSplitSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    expense_id = serializers.CharField()
    user_email = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    paid_status = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        validated_data['id'] = str(uuid.uuid4())
        split = ExpenseSplitModel(**validated_data)
        split.save()
        return split 