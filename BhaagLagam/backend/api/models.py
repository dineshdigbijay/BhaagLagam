from pynamodb.models import Model
from pynamodb.attributes import (
    UnicodeAttribute, NumberAttribute, UTCDateTimeAttribute, 
    ListAttribute, MapAttribute, BooleanAttribute, JSONAttribute
)
from datetime import datetime
import uuid

class User(Model):
    class Meta:
        table_name = 'bhaaglagam_users'
        region = 'us-east-1'
        
    email = UnicodeAttribute(hash_key=True)
    username = UnicodeAttribute()
    password = UnicodeAttribute()
    first_name = UnicodeAttribute(null=True)
    last_name = UnicodeAttribute(null=True)
    profile_picture = UnicodeAttribute(null=True)
    created_at = UTCDateTimeAttribute(default=datetime.now)
    
    def to_dict(self):
        return {
            'email': self.email,
            'username': self.username,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'profile_picture': self.profile_picture,
            'created_at': self.created_at.isoformat()
        }

class Group(Model):
    class Meta:
        table_name = 'bhaaglagam_groups'
        region = 'us-east-1'
        
    id = UnicodeAttribute(hash_key=True, default=lambda: str(uuid.uuid4()))
    name = UnicodeAttribute()
    description = UnicodeAttribute(null=True)
    created_by = UnicodeAttribute()  # User email
    members = ListAttribute(of=UnicodeAttribute)  # List of user emails
    created_at = UTCDateTimeAttribute(default=datetime.now)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'created_by': self.created_by,
            'members': self.members,
            'created_at': self.created_at.isoformat()
        }

class Expense(Model):
    class Meta:
        table_name = 'bhaaglagam_expenses'
        region = 'us-east-1'
        
    id = UnicodeAttribute(hash_key=True, default=lambda: str(uuid.uuid4()))
    group_id = UnicodeAttribute()
    amount = NumberAttribute()
    description = UnicodeAttribute()
    paid_by = UnicodeAttribute()  # User email
    split_among = ListAttribute(of=UnicodeAttribute)  # List of user emails
    created_at = UTCDateTimeAttribute(default=datetime.now)
    
    def to_dict(self):
        return {
            'id': self.id,
            'group_id': self.group_id,
            'amount': float(self.amount),
            'description': self.description,
            'paid_by': self.paid_by,
            'split_among': self.split_among,
            'created_at': self.created_at.isoformat()
        }

# Create the tables if they don't exist
def create_tables():
    """Create DynamoDB tables if they don't exist"""
    if not User.exists():
        User.create_table(read_capacity_units=1, write_capacity_units=1, wait=True)
    if not Group.exists():
        Group.create_table(read_capacity_units=1, write_capacity_units=1, wait=True)
    if not Expense.exists():
        Expense.create_table(read_capacity_units=1, write_capacity_units=1, wait=True)
