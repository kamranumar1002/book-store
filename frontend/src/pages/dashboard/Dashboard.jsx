import React from 'react';
import {
  FiAlertTriangle,
  FiBookOpen,
  FiClock,
  FiDollarSign,
  FiShoppingBag,
  FiUsers,
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import Loading from '../../components/Loading';
import { useGetAdminStatsQuery } from '../../redux/features/admin/adminApi';

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

const formatMonthLabel = (value = '') => {
  const [year, month] = value.split('-');
  if (!year || !month) return value || 'Unknown';
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
};

const statusPillClass = (status = '') => {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'delivered') return 'bg-emerald-100 text-emerald-700';
  if (normalized === 'shipped') return 'bg-blue-100 text-blue-700';
  if (normalized === 'processing') return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-700';
};

const Dashboard = () => {
  const { data, isLoading, isError, error } = useGetAdminStatsQuery();

  if (isLoading) return <Loading />;
  if (isError) {
    return (
      <div className="card-surface p-4 text-red-700">
        {error?.data?.message || 'Failed to load admin dashboard data.'}
      </div>
    );
  }

  const monthlySales = data?.monthlySales || [];
  const recentOrders = data?.recentOrders || [];
  const maxMonthlySales =
    monthlySales.reduce((max, item) => Math.max(max, Number(item?.totalSales) || 0), 0) || 1;

  const statCards = [
    {
      key: 'sales',
      title: 'Total Revenue',
      value: formatCurrency(data?.totalSales),
      subtitle: 'Across all completed and active orders',
      icon: FiDollarSign,
    },
    {
      key: 'orders',
      title: 'Total Orders',
      value: Number(data?.totalOrders || 0).toLocaleString(),
      subtitle: `${Number(data?.pendingOrders || 0).toLocaleString()} pending`,
      icon: FiShoppingBag,
    },
    {
      key: 'inventory',
      title: 'Total Products',
      value: Number(data?.totalBooks || 0).toLocaleString(),
      subtitle: `${Number(data?.trendingBooks || 0).toLocaleString()} trending`,
      icon: FiBookOpen,
    },
    {
      key: 'users',
      title: 'Registered Users',
      value: Number(data?.totalUsers || 0).toLocaleString(),
      subtitle: 'Customer accounts in the system',
      icon: FiUsers,
    },
    {
      key: 'pending',
      title: 'Pending Orders',
      value: Number(data?.pendingOrders || 0).toLocaleString(),
      subtitle: 'Needs processing by operations',
      icon: FiClock,
    },
    {
      key: 'stock',
      title: 'Low Stock Alerts',
      value: Number(data?.lowStockBooks || 0).toLocaleString(),
      subtitle: 'Products with stock less than or equal to 5',
      icon: FiAlertTriangle,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.key} className="card-surface p-5 bg-gradient-to-br from-white to-slate-50">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">{card.title}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{card.subtitle}</p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid xl:grid-cols-[1.4fr_1fr] gap-6">
        <article className="card-surface p-5 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
              <p className="text-sm text-slate-500">Live activity from the latest checkouts.</p>
            </div>
            <Link
              to="/dashboard/manage-orders"
              className="admin-btn-secondary inline-flex items-center px-3 py-2 rounded-md text-sm"
            >
              Manage Orders
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-sm text-slate-500">No recent orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="py-2 pr-3 font-medium">Order</th>
                    <th className="py-2 pr-3 font-medium">Customer</th>
                    <th className="py-2 pr-3 font-medium">Amount</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="border-b border-slate-100 last:border-b-0">
                      <td className="py-3 pr-3">
                        <p className="font-medium text-slate-800">#{String(order._id).slice(-6)}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </td>
                      <td className="py-3 pr-3">
                        <p className="text-slate-700">{order.name}</p>
                        <p className="text-xs text-slate-500">{order.email}</p>
                      </td>
                      <td className="py-3 pr-3 font-medium text-slate-800">
                        {formatCurrency(order.totalPrice)}
                      </td>
                      <td className="py-3 pr-3">
                        <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusPillClass(order.status)}`}>
                          {order.status || 'pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="card-surface p-5 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Monthly Performance</h2>
              <p className="text-sm text-slate-500">Revenue and volume trend per month.</p>
            </div>
          </div>

          {monthlySales.length === 0 ? (
            <p className="text-sm text-slate-500">No monthly sales data available yet.</p>
          ) : (
            <div className="space-y-3">
              {monthlySales.map((month) => {
                const monthSales = Number(month?.totalSales || 0);
                const percentage = Math.max(4, (monthSales / maxMonthlySales) * 100);
                return (
                  <div key={month._id}>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>{formatMonthLabel(month._id)}</span>
                      <span>
                        {formatCurrency(monthSales)} · {Number(month?.totalOrders || 0)} orders
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-slate-900 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 grid sm:grid-cols-2 gap-2">
            <Link
              to="/dashboard/manage-books"
              className="admin-btn-secondary text-center text-sm px-3 py-2 rounded-md"
            >
              Open Inventory
            </Link>
            <Link
              to="/dashboard/manage-users"
              className="admin-btn-secondary text-center text-sm px-3 py-2 rounded-md"
            >
              Open Users
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}

export default Dashboard