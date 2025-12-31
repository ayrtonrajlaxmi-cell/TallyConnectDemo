import { useState, useEffect } from 'react';
import { Download, TrendingUp, TrendingDown } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface MonthlyData {
  month: string;
  turnover: number;
  expense: number;
  profit: number;
}

export function MonthlySummary() {
  // ✅ State for selected year
  const [selectedYear, setSelectedYear] = useState('2025');
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch monthly data whenever selectedYear changes
  useEffect(() => {
    fetchMonthlySummary();
  }, [selectedYear]);

  // ✅ Fetch data function
  const fetchMonthlySummary = async () => {
    try {
      setLoading(true);
      console.log('Selected year:', selectedYear);

      const response = await fetch(
        `http://localhost:4000/api/reports/monthly-summary?year=${selectedYear}`
      );

      if (!response.ok) {
        const err = await response.json();
        console.error('API error:', err);
        setMonthlyData([]); // clear previous data
        return;
      }

      const data = await response.json();
      console.log('API data:', data);
      setMonthlyData(data || []);
    } catch (error) {
      console.error('Error fetching monthly summary:', error);
      setMonthlyData([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Calculate totals
  const totalTurnover = monthlyData.reduce((sum, m) => sum + m.turnover, 0);
  const totalExpense = monthlyData.reduce((sum, m) => sum + m.expense, 0);
  const totalProfit = monthlyData.reduce((sum, m) => sum + m.profit, 0);
  const profitMargin = totalTurnover
    ? ((totalProfit / totalTurnover) * 100).toFixed(2)
    : '0.00';

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-gray-600 dark:text-gray-300">
        Loading monthly summary...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-gray-900 dark:text-white">
            Monthly Summary
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Analyze your financial performance month-wise
          </p>
        </div>

        <div className="flex gap-2">
          {/* Year selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>

          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Turnover */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Turnover</p>
          <p className="text-2xl text-gray-900 dark:text-white mt-2">
            ₹{(totalTurnover / 100000).toFixed(2)}L
          </p>
          <div className="flex items-center gap-1 mt-2 text-sm text-green-600 dark:text-green-400">
            <TrendingUp className="w-4 h-4" />
            +15.2%
          </div>
        </div>

        {/* Expense */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Expense</p>
          <p className="text-2xl text-gray-900 dark:text-white mt-2">
            ₹{(totalExpense / 100000).toFixed(2)}L
          </p>
          <div className="flex items-center gap-1 mt-2 text-sm text-red-600 dark:text-red-400">
            <TrendingDown className="w-4 h-4" />
            +12.8%
          </div>
        </div>

        {/* Profit */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Profit</p>
          <p className="text-2xl text-gray-900 dark:text-white mt-2">
            ₹{(totalProfit / 100000).toFixed(2)}L
          </p>
          <div className="flex items-center gap-1 mt-2 text-sm text-green-600 dark:text-green-400">
            <TrendingUp className="w-4 h-4" />
            +18.5%
          </div>
        </div>

        {/* Margin */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Profit Margin</p>
          <p className="text-2xl text-gray-900 dark:text-white mt-2">{profitMargin}%</p>
          <div className="flex items-center gap-1 mt-2 text-sm text-green-600 dark:text-green-400">
            <TrendingUp className="w-4 h-4" />
            +2.3%
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="mb-4 text-gray-900 dark:text-white">Monthly Comparison</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="turnover" fill="#3B82F6" />
              <Bar dataKey="expense" fill="#EF4444" />
              <Bar dataKey="profit" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="mb-4 text-gray-900 dark:text-white">Profit Trend</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-xs uppercase">Month</th>
              <th className="px-6 py-4 text-right text-xs uppercase">Turnover</th>
              <th className="px-6 py-4 text-right text-xs uppercase">Expense</th>
              <th className="px-6 py-4 text-right text-xs uppercase">Profit</th>
              <th className="px-6 py-4 text-right text-xs uppercase">Margin %</th>
            </tr>
          </thead>
          <tbody>
            {monthlyData.map((m) => {
              const margin = m.turnover > 0 ? ((m.profit / m.turnover) * 100).toFixed(2) : '0.00';
              return (
                <tr key={m.month}>
                  <td className="px-6 py-4">{m.month} {selectedYear}</td>
                  <td className="px-6 py-4 text-right">₹{m.turnover.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">₹{m.expense.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">₹{m.profit.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">{margin}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}