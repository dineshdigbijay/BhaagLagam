import os
import boto3
from botocore.exceptions import ClientError

def create_tables():
    # Get AWS credentials from environment variables
    aws_access_key_id = os.getenv('AWS_ACCESS_KEY_ID')
    aws_secret_access_key = os.getenv('AWS_SECRET_ACCESS_KEY')
    region = os.getenv('AWS_DEFAULT_REGION', 'us-east-1')

    if not aws_access_key_id or not aws_secret_access_key:
        print("Error: AWS credentials not found in environment variables")
        return

    try:
        dynamodb = boto3.resource(
            'dynamodb',
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            region_name=region
        )

        # Create tables
        tables = [
            {
                'TableName': 'bhaaglagam_users',
                'KeySchema': [
                    {'AttributeName': 'email', 'KeyType': 'HASH'}
                ],
                'AttributeDefinitions': [
                    {'AttributeName': 'email', 'AttributeType': 'S'}
                ],
                'ProvisionedThroughput': {
                    'ReadCapacityUnits': 5,
                    'WriteCapacityUnits': 5
                }
            },
            {
                'TableName': 'bhaaglagam_groups',
                'KeySchema': [
                    {'AttributeName': 'id', 'KeyType': 'HASH'}
                ],
                'AttributeDefinitions': [
                    {'AttributeName': 'id', 'AttributeType': 'S'}
                ],
                'ProvisionedThroughput': {
                    'ReadCapacityUnits': 5,
                    'WriteCapacityUnits': 5
                }
            },
            {
                'TableName': 'bhaaglagam_expenses',
                'KeySchema': [
                    {'AttributeName': 'id', 'KeyType': 'HASH'}
                ],
                'AttributeDefinitions': [
                    {'AttributeName': 'id', 'AttributeType': 'S'},
                    {'AttributeName': 'group_id', 'AttributeType': 'S'}
                ],
                'GlobalSecondaryIndexes': [
                    {
                        'IndexName': 'group_id_index',
                        'KeySchema': [
                            {'AttributeName': 'group_id', 'KeyType': 'HASH'}
                        ],
                        'Projection': {
                            'ProjectionType': 'ALL'
                        },
                        'ProvisionedThroughput': {
                            'ReadCapacityUnits': 5,
                            'WriteCapacityUnits': 5
                        }
                    }
                ],
                'ProvisionedThroughput': {
                    'ReadCapacityUnits': 5,
                    'WriteCapacityUnits': 5
                }
            }
        ]

        for table in tables:
            try:
                table_obj = dynamodb.create_table(**table)
                print(f"Created table {table['TableName']}")
                table_obj.wait_until_exists()
            except ClientError as e:
                if e.response['Error']['Code'] == 'ResourceInUseException':
                    print(f"Table {table['TableName']} already exists")
                else:
                    raise e

    except Exception as e:
        print(f"Error creating tables: {str(e)}")

if __name__ == '__main__':
    create_tables() 