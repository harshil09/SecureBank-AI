// frontend/src/components/Dashboard/AccountCard.jsx
export default function AccountCard({ account }) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-gray-600 text-sm">{account.account_type}</p>
            <p className="text-gray-500 text-xs">****{account.account_id.toString().slice(-4)}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs ${
            account.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {account.status}
          </span>
        </div>
  
        <div className="mb-4">
          <p className="text-gray-600 text-sm mb-1">Available Balance</p>
          <p className="text-3xl font-bold">${account.balance.toFixed(2)}</p>
        </div>
  
        <div className="flex gap-2">
          <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
            Transfer
          </button>
          <button className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300">
            Details
          </button>
        </div>
      </div>
    );
  }