# backend/scripts/index_policies.py
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from service.rag_service import RAGService
from dotenv import load_dotenv
load_dotenv()

def index_sample_policies():
    """Index sample bank policies."""
    rag = RAGService()
    
    documents = [
        {
            "id": "policy_accounts_001", #Unique identifier
            "text": """MyBank Pro Account Types and Features    

SAVINGS ACCOUNT
- Interest Rate: 2.5% APY (Annual Percentage Yield)
- Minimum Balance: $100
- Monthly Fee: $0 (no monthly maintenance fee)
- Features: Online banking, mobile app, ATM access
- Withdrawal Limit: 6 per month (federal regulation)
- FDIC Insured up to $250,000

CHECKING ACCOUNT
- Interest Rate: 0.1% APY
- Minimum Balance: $25
- Monthly Fee: $0 (waived with any direct deposit)
- Features: Unlimited transactions, debit card, check writing, overdraft protection
- Free ATM withdrawals at 50,000+ locations nationwide
- Free online bill pay
- FDIC Insured up to $250,000

PREMIUM ACCOUNT
- Interest Rate: 3.0% APY
- Minimum Balance: $5,000
- Monthly Fee: $15 (waived with $10,000 minimum balance)
- Features: All checking features plus free wire transfers, priority customer service
- Travel insurance included
- ATM fee reimbursement worldwide
- Free cashier's checks and money orders
- Dedicated relationship manager
- FDIC Insured up to $250,000""",
            "metadata": {"category": "accounts", "type": "policy", "topic": "account_types"}
        }, #Extra info for filtering/search
        {
            "id": "policy_limits_001",
            "text": """MyBank Pro Transaction Limits

DAILY LIMITS
- ATM Withdrawal: $500 (Standard), $1,000 (Premium)
- Debit Card Purchase: $2,500 (Standard), $5,000 (Premium)
- Online Transfer: $2,500 per day
- Mobile Check Deposit: $1,000 per check, $3,000 per day
- Zelle/P2P Payments: $1,500 per day

MONTHLY LIMITS
- ACH Transfers: $10,000 per month
- Wire Transfers: $25,000 per month (Premium unlimited)
- Total Debit Card Purchases: $50,000 per month

SPECIAL REQUESTS
- Limits can be temporarily increased by calling customer service at 1-800-MYBANK-PRO
- Permanent limit increases require account review
- Business accounts have higher limits available
- International transfers require 24-hour advance notice""",
            "metadata": {"category": "limits", "type": "policy", "topic": "transaction_limits"}
        },
        {
            "id": "policy_security_001",
            "text": """MyBank Pro Security Features

AUTHENTICATION
- Two-Factor Authentication (2FA): SMS or authenticator app required
- Biometric Login: Fingerprint and Face ID on mobile devices
- Strong Password Requirements: Minimum 8 characters with uppercase, lowercase, number, and special character
- Login alerts sent to email and mobile app

ENCRYPTION & DATA PROTECTION
- All data encrypted with military-grade AES-256 encryption
- TLS 1.3 for all network communications
- End-to-end encryption for sensitive transactions
- Secure data centers with 24/7 monitoring

FRAUD PROTECTION
- Real-time fraud monitoring and instant alerts
- Zero liability for unauthorized transactions
- Automatic card lock if suspicious activity detected
- Travel notifications to prevent false declines
- $0 fraud liability guarantee

ACCOUNT SECURITY FEATURES
- Instant transaction alerts via email/SMS
- Login notifications from new devices
- Automatic timeout after 10 minutes of inactivity
- Secure message center for sensitive communications
- Ability to freeze/unfreeze debit card instantly from app""",
            "metadata": {"category": "security", "type": "policy", "topic": "security_features"}
        },
        {
            "id": "policy_fees_001",
            "text": """MyBank Pro Fee Schedule

ACCOUNT MAINTENANCE FEES
- Savings Account: $0 monthly
- Checking Account: $0 monthly
- Premium Account: $15 monthly (waived with $10,000 minimum balance)
- Overdraft Fee: $35 per occurrence (maximum 3 per day)
- NSF (Non-Sufficient Funds): $35 per item
- Stop Payment: $30 per request
- Account Closure (within 90 days): $25 early closure fee

TRANSACTION FEES
- Domestic Wire (Outgoing): $25
- International Wire (Outgoing): $45
- Wire Transfer (Incoming): Free
- Cashier's Check: $10 (Free for Premium accounts)
- Money Order: $5 (Free for Premium accounts)
- Foreign Transaction Fee: 3% (waived for Premium)

ATM FEES
- MyBank Pro ATMs: Free unlimited
- Out-of-Network ATMs: $3.00 per transaction (reimbursed for Premium)
- International ATM: $5.00 + 3% foreign transaction fee (reimbursed for Premium)

OTHER FEES
- Rush Debit Card Replacement: $15
- Paper Statement: $2 per month (Free with e-statements)
- Check Orders: Varies by style ($10-$25)
- Account Research/Copy Requests: $25 per hour
- Returned Mail: $5 per occurrence""",
            "metadata": {"category": "fees", "type": "policy", "topic": "fee_schedule"}
        },
        {
            "id": "faq_001",
            "text": """MyBank Pro Frequently Asked Questions

HOW TO OPEN AN ACCOUNT
Q: How do I open an account?
A: You can open an account online at mybankpro.com in under 10 minutes. You'll need:
   - Government-issued photo ID (driver's license or passport)
   - Social Security number or Tax ID
   - Initial deposit: $100 for Savings, $25 for Checking, $5,000 for Premium
   - Valid email address and phone number

FDIC INSURANCE
Q: Is my money insured?
A: Yes! All MyBank Pro accounts are FDIC insured up to $250,000 per depositor, per account ownership category. This means your deposits are protected even if the bank fails.

MULTIPLE ACCOUNTS
Q: Can I have multiple accounts?
A: Absolutely! You can have multiple savings, checking, and premium accounts with no limit. Many customers maintain separate accounts for different savings goals.

MOBILE DEPOSITS
Q: How do I deposit checks?
A: Three convenient options:
   1. Mobile check deposit through our app (available within 1 business day)
   2. Deposit at any MyBank Pro ATM (immediate availability for first $200)
   3. Visit any branch location during business hours

PASSWORD RESET
Q: What if I forget my password?
A: Click "Forgot Password" on the login page. You'll receive a password reset link via email, or you can answer your security questions. For additional help, call 1-800-MYBANK-PRO.

LOST OR STOLEN CARD
Q: How do I report a lost or stolen card?
A: Take these steps immediately:
   1. Call our 24/7 fraud hotline: 1-800-FRAUD-00
   2. Use the mobile app to instantly freeze your card
   3. We'll rush ship a replacement card (arrives in 2-3 business days)
   4. Emergency cash available at any branch with ID

FOREIGN TRANSACTIONS
Q: Are there foreign transaction fees?
A: Standard and Checking accounts: 3% foreign transaction fee
   Premium accounts: No foreign transaction fees
   All accounts: Real-time currency conversion at competitive rates""",
            "metadata": {"category": "faq", "type": "general", "topic": "common_questions"}
        },
        {
            "id": "support_001",
            "text": """MyBank Pro Customer Support

CONTACT METHODS
- Phone Support: 1-800-MYBANK-PRO (1-800-692-2657)
  * Standard Support: Monday-Friday 8AM-8PM EST, Saturday 9AM-5PM EST
  * Premium Support: 24/7 dedicated line with priority routing
  * Fraud Hotline: 24/7 emergency support at 1-800-FRAUD-00

- Digital Support:
  * Live Chat: Available on website and mobile app during business hours
  * Email: support@mybankpro.com (response within 24 hours)
  * Secure Message: Through online banking (most secure for sensitive information)
  * Mobile App: In-app messaging with real-time support

- Branch Support:
  * Find nearest branch: mybankpro.com/locations
  * Over 500 branches nationwide
  * Extended hours at select locations
  * Appointment scheduling available

SERVICES AVAILABLE
- Account assistance and troubleshooting
- Card activation, replacement, and PIN reset
- Fraud reporting and dispute resolution
- Password reset and security question updates
- Transaction disputes and chargebacks
- Account upgrades and product information
- General banking questions and guidance

AVERAGE RESPONSE TIMES
- Phone: Immediate (average wait time under 2 minutes)
- Live Chat: Under 2 minutes
- Email: Within 24 hours (usually same business day)
- Secure Message: Within 1 business day
- Social Media: Within 4 hours during business hours""",
            "metadata": {"category": "support", "type": "contact", "topic": "customer_service"}
        }
    ]
    
    print(f"Indexing {len(documents)} policy documents...")
    rag.index_text_documents(documents)
    print("Successfully indexed all bank policies.")
    print("\nIndexed documents:")
    for doc in documents:
        print(f"  - {doc['id']}: {doc['metadata']['topic']}")
    
    # Test retrieval
    print("\nTesting retrieval...")
    test_query = "What are the account types?"
    docs = rag.retriever.invoke(test_query)
    print(f"Found {len(docs)} relevant documents for: '{test_query}'")

if __name__ == "__main__":
    index_sample_policies()