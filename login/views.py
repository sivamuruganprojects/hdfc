from django.shortcuts import render
import pyodbc
from django.http import JsonResponse
from .utils import *
from datetime import datetime,timedelta
from django.views.decorators.csrf import csrf_exempt
import sys
from .transaction_utils import get_transaction_data
from django.views.decorators.http import require_POST



def login_view(request):
    return render(request, 'login.html')


@csrf_exempt
def verify_user(request):
    returnvals = {"status":0,"message" :"error","data":{}}
    if request.method == 'POST':
        user_name = request.POST.get("username")
        user_data = find_user_by_name(user_name)
        if user_data:
            user_id_to_find = user_data.get("id")
            user_security = find_security_by_user_id(user_id_to_find)
            cleaned_result = remove_object_ids(user_security)
            user_data = remove_object_ids(user_data)
            returnvals["status"] = 1 
            returnvals["message"] = "user verified"
            returnvals["data"] = {"user_data":user_data,
                                  "user_security":cleaned_result}
        else:
            returnvals["status"] = 0 
            returnvals["message"] = "Invalid user"
        return JsonResponse(returnvals)
    return JsonResponse({'status': 'fail', 'message': 'Invalid request'})


@csrf_exempt
def verify_password(request):
    if request.method == 'POST':
        name = request.POST.get("username")
        userid = request.POST.get("userID")
        password = request.POST.get("password")
        user={"name":"admin","password":"admin"}
        user_password = get_password_by_user_id(userid)
        user_password = remove_object_ids(user_password)
        if password == user_password:
            status =1 
            message = "success"
        else:
            status=0
            message = "Invalid user"
        return JsonResponse({'status': status, 'message': message})
    return JsonResponse({'status': 'fail', 'message': 'Invalid request'})


from datetime import datetime

def dashboard_view(request):
    try:
        user_id = request.GET.get('userID')
        account_info = remove_object_ids(get_account_by_user_id(user_id))
        transactions = remove_object_ids(get_transactions_by_account(user_id))
        
        # Initialize
        results = []
        opening_balance = closing_balance = 0

        if transactions:
            # 1. Convert string dates to datetime objects
            for txn in transactions:
                txn['date_obj'] = datetime.strptime(txn['txn_date'], '%d/%m/%y')
            
            # 2. Sort chronologically (oldest first)
            transactions_asc = sorted(transactions, key=lambda x: x['date_obj'])
            
            # 3. Calculate running balance forward
            current_balance = 0
            for txn in transactions_asc:
                current_balance += txn['deposit_amt'] - txn['withdrawal_amt']
                txn['running_balance'] = current_balance
            
            # 4. Set opening/closing balances
            opening_balance = transactions_asc[0]['running_balance'] - transactions_asc[0]['deposit_amt'] + transactions_asc[0]['withdrawal_amt']
            closing_balance = transactions_asc[-1]['running_balance']
            
            # 5. Sort for display (newest first)
            results = sorted(transactions_asc, key=lambda x: x['date_obj'], reverse=True)
            
            # 6. Calculate display balances (working backward)
            display_balance = closing_balance
            for txn in results:
                txn['display_balance'] = display_balance
                display_balance += txn['withdrawal_amt'] - txn['deposit_amt']

    except Exception as e:
        print(f'Error processing transactions: {str(e)}')
        # Consider adding error handling/notification here

    return render(request, 'dashboard.html', {
        'results': results,
        'opening_balance': opening_balance,
        'closing_balance': closing_balance,
        'account_info': account_info,
        'userid': user_id,
        'branch_details': remove_object_ids(get_branch_by_code(account_info.get('branch_id')))
    })

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
    return {}



def get_account_by_user_id(user_id):
    accounts = get_user_accounts()
    for account in accounts:
        if account.get("user_id") == int(user_id):
            return account
    return None


def get_user_by_id(user_id):
    users = get_user_data()
    for user in users:
        if user["id"] == int(user_id):
            return user
    return None  


def find_user_by_name(name):
    users = get_user_data()
    for user in users:
        if user.get("full_name") == name:
            return user
    return None

def find_security_by_user_id(user_id):
    """Find and return security details for the given user_id."""
    all_data = get_user_security()
    for entry in all_data:
        if entry.get("user_id") == int(user_id):
            return entry
    return None 

def get_transactions_by_account(account_id):
    all_transactions = get_bank_transactions()
    filtered=[]

    for txn in all_transactions:
        if txn.get("account_id") == int(account_id):
            filtered.append(txn)
    return filtered


def remove_object_ids(data):
    if isinstance(data, dict):
        return {k: remove_object_ids(v) for k, v in data.items() if k != '_id'}
    elif isinstance(data, list):
        return [remove_object_ids(item) for item in data]
    else:
        return data

def dashboard_updated_view(request):
    try:
        user_id = request.GET.get('userID')
        if not user_id:
            return render(request, 'dashboard_updated.html', {'error': 'User ID is required'})
        
        # Get transaction data using common function
        transaction_data = get_transaction_data(user_id)

    
        if transaction_data['status'] == 'error':
            return render(request, 'dashboard_updated.html', {'error': transaction_data['message']})

        return render(request, 'dashboard_updated.html', {
            'userid': user_id,
            'results': transaction_data['transactions'],
            'account_info': transaction_data['account_info'],
            'branch_details': transaction_data['branch_details'],
            'opening_balance': transaction_data['opening_balance'],
            'closing_balance': transaction_data['closing_balance']
        })

    except Exception as e:
        print(f'Error in dashboard_view: {str(e)}', file=sys.stderr)
        return render(request, 'dashboard_updated.html', {'error': 'An error occurred'})
    
@csrf_exempt
@require_POST
def generate_updated_report(request):
    try:
        # Get parameters from POST data
        user_id = request.POST.get('userid')
        from_date = request.POST.get('from_date')
        to_date = request.POST.get('to_date')
        mini_statement = request.POST.get('mini_statement', '0') == '1'
        
        if not user_id:
            return JsonResponse({'status': 'error', 'message': 'User ID is required'}, status=400)
        
        # Get transaction data using common function
        transaction_data = get_transaction_data(
            user_id=user_id,
            from_date=from_date,
            to_date=to_date,
            mini_statement=mini_statement
        )
        
        if transaction_data['status'] == 'error':
            return JsonResponse(transaction_data, status=400)
        
        # Prepare JSON response
        return JsonResponse({
            'status': 'success',
            'data': transaction_data['transactions'],
            'user': transaction_data['user'],
            'branch': transaction_data['branch_details'],
            'account_info': transaction_data['account_info'],
            'from_date': transaction_data['from_date'],
            'to_date': transaction_data['to_date'],
            'withdrawal_count': transaction_data['withdrawal_count'],
            'deposit_count': transaction_data['deposit_count'],
            'no_of_withdrawal': transaction_data['total_withdrawal'],
            'no_of_total_deposit': transaction_data['total_deposit']
        })

    except Exception as e:
        print(f'Error in generate_report: {str(e)}', file=sys.stderr)
        return JsonResponse({
            'status': 'error',
            'message': 'An unexpected error occurred'
        }, status=500)