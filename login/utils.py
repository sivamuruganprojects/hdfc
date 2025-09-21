# utils.py


from pymongo import MongoClient
from bson.json_util import dumps


def get_db_connection():
		mongo_con = {'host': 'localhost', 'port': 27017, 'db': 'mydatabase'}	
		connection = MongoClient(mongo_con['host'],mongo_con['port'] or 27019)
		db = connection[mongo_con['db']]
		return db

def get_user_data():
    db = get_db_connection()
    users_cursor = db.users.find()  # Assuming your collection is named 'users'
    users_list = list(users_cursor)  # Converts BSON to JSON
    return users_list



def get_user_credentials():
    db = get_db_connection()
    crential_cursor = db.credentials.find()  
    credential_list = list(crential_cursor) 
    return credential_list

def get_user_security():
    db = get_db_connection()
    security_cursor = db.security_data.find()  
    security_list = list(security_cursor) 
    return security_list

def get_account_branches():
    db = get_db_connection()
    branch_cursor = db.branches.find()  
    branch_list = list(branch_cursor) 
    return branch_list

def get_user_accounts():
    db = get_db_connection()
    account_cursor = db.account_details.find()  
    account_list = list(account_cursor) 
    return account_list

def get_bank_transactions():
    db = get_db_connection()
    transaction_cursor = db.transactions.find()  
    transaction_list = list(transaction_cursor) 
    return transaction_list
   