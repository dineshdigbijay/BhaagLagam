from django.core.management.base import BaseCommand
from api.models import create_tables

class Command(BaseCommand):
    help = 'Creates DynamoDB tables if they do not exist'

    def handle(self, *args, **options):
        self.stdout.write('Creating DynamoDB tables...')
        create_tables()
        self.stdout.write(self.style.SUCCESS('Successfully created DynamoDB tables')) 