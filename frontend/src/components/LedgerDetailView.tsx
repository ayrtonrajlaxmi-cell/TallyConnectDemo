import { useState } from 'react';
import { ArrowLeft, Download, Printer, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface LedgerDetailViewProps {
  ledgerId: string;
  onBack: () => void;
}

const ledgerDetails = {
  '1': { name: 'ABC Suppliers Ltd.', type: 'Cr', openingBalance: 125000, outstanding: 85000 },
  '2': { name: 'XYZ Traders', type: 'Dr', openingBalance: 95000, outstanding: 75000 },
};

const vouchers = [
  { id: 'V001', date: '2025-11-15', type: 'Purchase', refNo: 'PUR/2025/001', debit: 45000, credit: 0, balance: 45000, status: 'Pending' },
  { id: 'V002', date: '2025-11-20', type: 'Payment', refNo: 'PAY/2025/012', debit: 0, credit: 20000, balance: 25000, status: 'Cleared' },
  { id: 'V003', date: '2025-11-28', type: 'Purchase', refNo: 'PUR/2025/008', debit: 30000, credit: 0, balance: 55000, status: 'Pending' },
  { id: 'V004', date: '2025-12-02', type: 'Payment', refNo: 'PAY/2025/015', debit: 0, credit: 15000, balance: 40000, status: 'Cleared' },
  { id: 'V005', date: '2025-12-05', type: 'Purchase', refNo: 'PUR/2025/015', debit: 50000, credit: 0, balance: 90000, status: 'Pending' },
];

const ageingData = [
  { range: '0-30 days', amount: 35000, color: '#10B981' },
  { range: '31-60 days', amount: 25000, color: '#F59E0B' },
  { range: '61-90 days', amount: 15000, color: '#EF4444' },
  { range: '90+ days', amount: 10000, color: '#DC2626' },
];

export function LedgerDetailView({ ledgerId, onBack }: LedgerDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'vouchers' | 'invoices' | 'bills' | 'ageing'>('vouchers');
  const ledger = ledgerDetails[ledgerId as keyof typeof ledgerDetails] || ledgerDetails['1'];

  const totalDebit = vouchers.reduce((sum, v) => sum + v.debit, 0);
  const totalCredit = vouchers.reduce((sum, v) => sum + v.credit, 0);

  const tabs = [
    { id: 'vouchers', label: 'Voucher List' },
    { id: 'invoices', label: 'Invoice-wise' },
    { id: 'bills', label: 'Pending & Cleared Bills' },
    { id: 'ageing', label: 'Ageing Analysis' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl text-gray-900 dark:text-white">{ledger.name}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Ledger Account Details</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Account Type</p>
          <p className="text-2xl text-gray-900 dark:text-white mt-2">
            {ledger.type === 'Dr' ? 'Debit' : 'Credit'}
          </p>
          <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs ${
            ledger.type === 'Dr'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
          }`}>
            {ledger.type}
          </span>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Opening Balance</p>
          <p className="text-2xl text-gray-900 dark:text-white mt-2">
            ₹{ledger.openingBalance.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Debit</p>
          <p className="text-2xl text-green-600 dark:text-green-400 mt-2">
            ₹{totalDebit.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Credit</p>
          <p className="text-2xl text-red-600 dark:text-red-400 mt-2">
            ₹{totalCredit.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-4 text-sm whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'vouchers' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs text-gray-600 dark:text-gray-300 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-600 dark:text-gray-300 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-600 dark:text-gray-300 uppercase">Ref No.</th>
                    <th className="px-4 py-3 text-right text-xs text-gray-600 dark:text-gray-300 uppercase">Debit</th>
                    <th className="px-4 py-3 text-right text-xs text-gray-600 dark:text-gray-300 uppercase">Credit</th>
                    <th className="px-4 py-3 text-right text-xs text-gray-600 dark:text-gray-300 uppercase">Balance</th>
                    <th className="px-4 py-3 text-center text-xs text-gray-600 dark:text-gray-300 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {vouchers.map((voucher) => (
                    <tr key={voucher.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{voucher.date}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{voucher.type}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{voucher.refNo}</td>
                      <td className="px-4 py-3 text-sm text-right text-green-600 dark:text-green-400">
                        {voucher.debit > 0 ? `₹${voucher.debit.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-600 dark:text-red-400">
                        {voucher.credit > 0 ? `₹${voucher.credit.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                        ₹{voucher.balance.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${
                          voucher.status === 'Cleared'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                            : 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400'
                        }`}>
                          {voucher.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-sm text-gray-900 dark:text-white">Total</td>
                    <td className="px-4 py-3 text-sm text-right text-green-600 dark:text-green-400">
                      ₹{totalDebit.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-red-600 dark:text-red-400">
                      ₹{totalCredit.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                      ₹{ledger.outstanding.toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {activeTab === 'ageing' && (
            <div>
              <h3 className="text-gray-900 dark:text-white mb-4">Ageing Analysis</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ageingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis dataKey="range" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                    {ageingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                {ageingData.map((bucket, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{bucket.range}</p>
                    <p className="text-xl text-gray-900 dark:text-white mt-2">
                      ₹{bucket.amount.toLocaleString()}
                    </p>
                    <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full" 
                        style={{ 
                          width: `${(bucket.amount / 85000) * 100}%`,
                          backgroundColor: bucket.color 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">Invoice-wise transaction details will be displayed here.</p>
            </div>
          )}

          {activeTab === 'bills' && (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">Pending and cleared bills will be displayed here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
