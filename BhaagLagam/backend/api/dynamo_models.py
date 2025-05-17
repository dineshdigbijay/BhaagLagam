from pynamodb.models import Model
from pynamodb.attributes import (
    UnicodeAttribute, NumberAttribute, UTCDateTimeAttribute, 
    ListAttribute, MapAttribute, BooleanAttribute
)
from datetime import datetime
import os
import uuid

class SplitMapAttribute(MapAttribute):
    user_email = UnicodeAttribute()
    amount = NumberAttribute()

class UserModel(Model):
    class Meta:
        table_name = 'bhaaglagam_users'
        region = 'us-east-1'
    
    email = UnicodeAttribute(hash_key=True)
    username = UnicodeAttribute()
    password = UnicodeAttribute()
    phone_number = UnicodeAttribute(null=True)
    is_active = BooleanAttribute(default=True)
    date_joined = UTCDateTimeAttribute(default=datetime.now)
    profile_picture = UnicodeAttribute(null=True)

    def to_dict(self):
        return {
            'email': self.email,
            'username': self.username,
            'phone_number': self.phone_number if hasattr(self, 'phone_number') else None,
            'is_active': self.is_active if hasattr(self, 'is_active') else True,
            'date_joined': self.date_joined.isoformat() if hasattr(self, 'date_joined') else None,
            'profile_picture': self.profile_picture if hasattr(self, 'profile_picture') else None
        }

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    def get_username(self):
        return self.email

    def __str__(self):
        return self.email

class GroupModel(Model):
    class Meta:
        table_name = 'bhaaglagam_groups'
        region = 'us-east-1'
    
    id = UnicodeAttribute(hash_key=True)
    name = UnicodeAttribute()
    description = UnicodeAttribute(null=True)
    created_by = UnicodeAttribute()  # User email
    created_at = UTCDateTimeAttribute(default=datetime.now)
    members = ListAttribute(of=UnicodeAttribute)  # List of user emails

class ExpenseModel(Model):
    class Meta:
        table_name = 'bhaaglagam_expenses'
        region = 'us-east-1'
    
    id = UnicodeAttribute(hash_key=True)
    group_id = UnicodeAttribute()
    amount = NumberAttribute()
    description = UnicodeAttribute()
    paid_by = UnicodeAttribute()  # User email
    created_at = UTCDateTimeAttribute(default=datetime.now)
    split_type = UnicodeAttribute(default='EQUAL')  # EQUAL or CUSTOM
    custom_splits = ListAttribute(of=SplitMapAttribute, null=True)  # Only used when split_type is CUSTOM

class ExpenseSplitModel(Model):
    class Meta:
        table_name = 'bhaaglagam_expense_splits'
        region = 'us-east-1'
    
    id = UnicodeAttribute(hash_key=True)
    expense_id = UnicodeAttribute()
    user_email = UnicodeAttribute()
    amount = NumberAttribute()
    paid_status = UnicodeAttribute(default='PENDING')
    created_at = UTCDateTimeAttribute(default=datetime.now)

# Create the tables if they don't exist
def create_tables():
    if not UserModel.exists():
        UserModel.create_table(read_capacity_units=1, write_capacity_units=1, wait=True)
    if not GroupModel.exists():
        GroupModel.create_table(read_capacity_units=1, write_capacity_units=1, wait=True)
    if not ExpenseModel.exists():
        ExpenseModel.create_table(read_capacity_units=1, write_capacity_units=1, wait=True)
    if not ExpenseSplitModel.exists():
        ExpenseSplitModel.create_table(read_capacity_units=1, write_capacity_units=1, wait=True) 