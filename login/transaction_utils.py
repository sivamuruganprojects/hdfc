# transaction_utils.py
from datetime import datetime
import sys
from .utils import *

from datetime import datetime
import sys
from .utils import *

def parse_transaction_date(date_str):
    """Handle DD/MM/YY date format from transactions"""
    try:
        return datetime.strptime(date_str, "%d/%m/%y").date()
    except ValueError:
        try:
            # Fallback to YYYY-MM-DD format if needed
            return datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            # Final fallback to current date
            return datetime.now().date()

def get_transaction_data(user_id, from_date=None, to_date=None, mini_statement=False):
    """
    Common function to get transaction data with balance calculations
    Args:
        user_id: User ID to fetch transactions for
        from_date: Start date in DD-MM-YYYY format (optional)
        to_date: End date in DD-MM-YYYY format (optional)
        mini_statement: Boolean flag for mini statement (default False)
    Returns:
        Dictionary containing all transaction data and calculated values
    """
    print(f"\n=== DEBUG START ===")
    print(f"Input params - user_id: {user_id}, from_date: {from_date}, to_date: {to_date}, mini_statement: {mini_statement}")
    
    try:
        # Initialize response structure
        response = {
            'status': 'success',
            'user_id': user_id,
            'account_info': {},
            'user': {},
            'branch_details': {},
            'transactions': [],
            'opening_balance': 0,
            'closing_balance': 0,
            'from_date': None,
            'to_date': None,
            'withdrawal_count': 0,
            'deposit_count': 0,
            'total_withdrawal': 0,
            'total_deposit': 0
        }

        # Get account and user data
        account_info = remove_object_ids(get_account_by_user_id(user_id)) or {}
        user = remove_object_ids(get_user_by_id(user_id)) or {}
        branch_details = remove_object_ids(get_branch_by_code(account_info.get('branch_id'))) or {}

        # Get all transactions for the account
        all_transactions = remove_object_ids(get_transactions_by_account(user_id)) or []
        print(f"Found {len(all_transactions)} transactions for account {user_id}")
        
        # Filter transactions by date if needed
        filtered_transactions = all_transactions
        
        if not mini_statement and from_date and to_date:
            try:
                from_date_dt = datetime.strptime(from_date, "%d-%m-%Y").date()
                to_date_dt = datetime.strptime(to_date, "%d-%m-%Y").date()
                
                filtered_transactions = [
                    txn for txn in all_transactions
                    if from_date_dt <= parse_transaction_date(txn["txn_date"]) <= to_date_dt
                ]
                print(f"Filtered to {len(filtered_transactions)} transactions between {from_date} and {to_date}")
            except Exception as e:
                print(f"Date filtering error: {str(e)}")
                response['status'] = 'error'
                response['message'] = f'Date filtering error: {str(e)}'
                return response
        elif mini_statement:
            # Get last 20 transactions for mini statement
            filtered_transactions = sorted(
                all_transactions,
                key=lambda x: parse_transaction_date(x["txn_date"]),
                reverse=True
            )[:20]
            print(f"Got {len(filtered_transactions)} transactions for mini statement")

        # Calculate transaction stats
        withdrawal_count = sum(1 for txn in filtered_transactions if float(txn.get('withdrawal_amt', 0)) > 0)
        deposit_count = sum(1 for txn in filtered_transactions if float(txn.get('deposit_amt', 0)) > 0)
        total_withdrawal = sum(float(txn.get('withdrawal_amt', 0)) for txn in filtered_transactions)
        total_deposit = sum(float(txn.get('deposit_amt', 0)) for txn in filtered_transactions)

        # Calculate running balances
        if filtered_transactions:
            # Sort chronologically for balance calculation
            transactions_asc = sorted(
                filtered_transactions,
                key=lambda x: parse_transaction_date(x["txn_date"])
            )
            
            # Calculate running balance
            running_balance = 0
            for txn in transactions_asc:
                deposit = float(txn.get('deposit_amt', 0))
                withdrawal = float(txn.get('withdrawal_amt', 0))
                running_balance += deposit - withdrawal
                txn['running_balance'] = running_balance
            
            # Set opening balance (balance before first transaction)
            first_txn = transactions_asc[0]
            response['opening_balance'] = (
                first_txn['running_balance'] -
                float(first_txn.get('deposit_amt', 0)) + 
                float(first_txn.get('withdrawal_amt', 0))
            )
            
            # Set closing balance (last running balance)
            response['closing_balance'] = transactions_asc[-1]['running_balance']
            
            # Sort for display (newest first)
            response['transactions'] = sorted(
                transactions_asc,
                key=lambda x: parse_transaction_date(x["txn_date"]),
                reverse=True
            )
            
            # Set date range
            response['from_date'] = parse_transaction_date(transactions_asc[0]['txn_date']).strftime("%d-%m-%Y")
            response['to_date'] = parse_transaction_date(transactions_asc[-1]['txn_date']).strftime("%d-%m-%Y")

        # Update response with all data
        response.update({
            'account_info': account_info,
            'user': user,
            'branch_details': branch_details,
            'withdrawal_count': withdrawal_count,
            'deposit_count': deposit_count,
            'total_withdrawal': total_withdrawal,
            'total_deposit': total_deposit,
            'account_no': account_info.get('account_no', '')
        })

        print(f"Final balances - Opening: {response['opening_balance']}, Closing: {response['closing_balance']}")
        return response

    except Exception as e:
        print(f'Error in get_transaction_data: {str(e)}', file=sys.stderr)
        return {
            'status': 'error',
            'message': f'An error occurred: {str(e)}'
        }
def get_password_by_user_id(user_id):
    credentials = get_user_credentials()
    for user in credentials:
        if user.get("user_id") == int(user_id):
            return user["password_hash"]
    return None  # or raise an exception or custom message


def get_branch_by_code(branch_code):
    branches = get_account_branches()
    for branch in branches:
        if branch.get("id") == int(branch_code):
            return branch
    return {}  # Return empty dict if no match found



def get_account_by_user_id(user_id):
    accounts = get_user_accounts()
    for account in accounts:
        if account.get("user_id") == int(user_id):
            return account
    return None


def get_user_by_id(user_id):
    users = get_user_data()
    for user in users:
        # print(user['id'],type(user['id']))
        # print(user_id, type(user_id))
        if user["id"] == int(user_id):
            return user
    return None  


def find_user_by_name(name):
    users = get_user_data()
    # print('111111111111',users)
    for user in users:
        # print('USER---',user.get("full_name"))
        if user.get("full_name") == name:
            return user
    return None

def find_security_by_user_id(user_id):
    """Find and return security details for the given user_id."""
    all_data = get_user_security()
    for entry in all_data:
        # print('entry-----',entry)
        # print('type-----',type(entry.get("user_id")),entry.get("user_id"))
        # print('userid-----',type(user_id),user_id)
        if entry.get("user_id") == int(user_id):
            return entry
    return None  # if not found

def get_transactions_by_account(account_id):
    # print('accountid---',account_id)
    all_transactions = get_bank_transactions()
    filtered=[]
    # print('all data transaction ----',all_transactions)

    for txn in all_transactions:
        # print('all data transaction1111 ----',txn.get("account_id"))
        # print('all data transaction 22222----',account_id)
        if txn.get("account_id") == int(account_id):
            filtered.append(txn)
    # print('&&&&&&&&&&&&&&----',filtered)
    return filtered


def remove_object_ids(data):
    if isinstance(data, dict):
        return {k: remove_object_ids(v) for k, v in data.items() if k != '_id'}
    elif isinstance(data, list):
        return [remove_object_ids(item) for item in data]
    else:
        return data