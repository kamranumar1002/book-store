import { useEffect, useMemo, useState } from 'react';
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiPackage,
  FiSearch,
  FiShoppingBag,
  FiUser,
} from 'react-icons/fi';
import Loading from '../../../components/Loading';
import {
  useGetAdminOrderQuery,
  useGetAdminOrdersQuery,
  useUpdateAdminOrderStatusMutation,
} from '../../../redux/features/admin/adminApi';

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered'];
const STATUS_META = {
  pending: { label: 'Pending', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  processing: { label: 'Processing', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  shipped: { label: 'Shipped', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  delivered: { label: 'Delivered', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
};

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

const formatStatus = (status = '') => {
  const normalized = (status || '').toLowerCase();
  if (!normalized) return 'Pending';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const statusPillClass = (status = '') => {
  const normalized = (status || '').toLowerCase();
  return STATUS_META[normalized]?.className || STATUS_META.pending.className;
};

const toStatusIndex = (status = '') => {
  const normalized = (status || '').toLowerCase();
  const statusIndex = ORDER_STATUSES.indexOf(normalized);
  return statusIndex >= 0 ? statusIndex : 0;
};

const ManageOrders = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [statusDraft, setStatusDraft] = useState({});

  const queryArgs = useMemo(
    () => ({ status: statusFilter, search: searchTerm, limit: 50 }),
    [statusFilter, searchTerm]
  );

  const { data, isLoading, isError, error } = useGetAdminOrdersQuery(queryArgs);
  const orders = useMemo(() => data?.orders ?? [], [data]);

  const {
    data: selectedOrderDetails,
    isFetching: isOrderDetailsLoading,
    isError: isOrderDetailsError,
  } = useGetAdminOrderQuery(selectedOrderId, {
    skip: !selectedOrderId,
  });

  const selectedOrder = selectedOrderDetails?.order;

  const [updateAdminOrderStatus, { isLoading: isStatusUpdating }] =
    useUpdateAdminOrderStatusMutation();

  useEffect(() => {
    const nextDraft = {};
    orders.forEach((order) => {
      nextDraft[order._id] = order.status;
    });
    setStatusDraft(nextDraft);

    if (!selectedOrderId && orders.length > 0) {
      setSelectedOrderId(orders[0]._id);
      return;
    }

    if (selectedOrderId && !orders.some((order) => order._id === selectedOrderId)) {
      setSelectedOrderId(orders[0]?._id || '');
    }
  }, [orders, selectedOrderId]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setSearchTerm(searchInput.trim());
  };

  const handleUpdateStatus = async (orderId) => {
    const nextStatus = (statusDraft[orderId] || '').toLowerCase();
    if (!ORDER_STATUSES.includes(nextStatus)) {
      alert('Please select a valid status first.');
      return;
    }

    try {
      await updateAdminOrderStatus({ orderId, status: nextStatus }).unwrap();
      alert('Order status updated successfully.');
    } catch (mutationError) {
      const message = mutationError?.data?.message || 'Failed to update order status.';
      alert(message);
    }
  };

  const metrics = {
    total: orders.length,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    revenue: 0,
  };

  orders.forEach((order) => {
    const normalizedStatus = (order?.status || 'pending').toLowerCase();
    if (Object.prototype.hasOwnProperty.call(metrics, normalizedStatus)) {
      metrics[normalizedStatus] += 1;
    }
    metrics.revenue += Number(order?.totalPrice || 0);
  });

  const timeline = selectedOrderDetails?.timeline || ORDER_STATUSES.map((step, index) => ({
    step,
    done: index <= toStatusIndex(selectedOrder?.status),
    current: index === toStatusIndex(selectedOrder?.status),
  }));

  const selectedStatus = selectedOrderId
    ? (statusDraft[selectedOrderId] || selectedOrder?.status || '').toLowerCase()
    : '';
  const selectedStatusChanged =
    !!selectedOrder && selectedStatus && selectedStatus !== (selectedOrder.status || '').toLowerCase();

  const selectedItemsCount = Array.isArray(selectedOrder?.items)
    ? selectedOrder.items.reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0)
    : 0;

  const selectedCustomerInitial = (selectedOrder?.name || 'U').charAt(0).toUpperCase();

  if (isLoading) return <Loading />;
  if (isError) {
    return (
      <div className="card-surface p-4 text-red-700">
        {error?.data?.message || 'Failed to load order management data.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Operations Hub</p>
            <h2 className="text-2xl md:text-3xl font-semibold mt-1">Orders And Tracking Control Center</h2>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl">
              Monitor checkout flow, update fulfillment status instantly, and inspect shipment timelines
              with a production-grade operations view.
            </p>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-right min-w-[220px]">
            <p className="text-xs uppercase tracking-wide text-slate-300">Filtered Order Value</p>
            <p className="text-2xl font-semibold mt-1">{formatCurrency(metrics.revenue)}</p>
            <p className="text-xs text-slate-300 mt-1">{metrics.total.toLocaleString()} orders in view</p>
          </div>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <article className="card-surface p-4 bg-white">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Orders</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{metrics.total.toLocaleString()}</p>
        </article>
        <article className="card-surface p-4 bg-white">
          <p className="text-xs uppercase tracking-wide text-slate-500">Pending</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{metrics.pending.toLocaleString()}</p>
        </article>
        <article className="card-surface p-4 bg-white">
          <p className="text-xs uppercase tracking-wide text-slate-500">Processing</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{metrics.processing.toLocaleString()}</p>
        </article>
        <article className="card-surface p-4 bg-white">
          <p className="text-xs uppercase tracking-wide text-slate-500">Shipped</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{metrics.shipped.toLocaleString()}</p>
        </article>
        <article className="card-surface p-4 bg-white">
          <p className="text-xs uppercase tracking-wide text-slate-500">Delivered</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{metrics.delivered.toLocaleString()}</p>
        </article>
      </section>

      <section className="card-surface p-4 bg-white">
        <form onSubmit={handleSearchSubmit} className="grid lg:grid-cols-[1fr_220px_auto] gap-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              type="text"
              placeholder="Search by order ID, customer, email, or phone"
              className="w-full rounded-md border border-slate-200 pl-10 pr-3 py-2"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-md border border-slate-200 px-3 py-2"
          >
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {formatStatus(status)}
              </option>
            ))}
          </select>

          <button type="submit" className="admin-btn-primary rounded-md px-4 py-2">
            Apply Filters
          </button>
        </form>
      </section>

      <section className="grid xl:grid-cols-[1.45fr_1fr] gap-6 items-start">
        <article className="card-surface bg-white overflow-hidden">
          <header className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Order Queue</h3>
              <p className="text-xs text-slate-500">Select an order to inspect details and tracking progress.</p>
            </div>
            <span className="text-xs text-slate-500">{metrics.total.toLocaleString()} orders</span>
          </header>

          <div className="max-h-[46rem] overflow-y-auto divide-y divide-slate-100">
            {orders.length === 0 ? (
              <div className="px-5 py-10 text-sm text-slate-500">No orders found for the current filter.</div>
            ) : (
              orders.map((order) => {
                const currentStatus = (order.status || '').toLowerCase();
                const nextStatus = (statusDraft[order._id] || currentStatus).toLowerCase();
                const hasStatusChanged = nextStatus !== currentStatus;
                const isSelected = selectedOrderId === order._id;
                const orderItemsCount = (order.items || []).reduce(
                  (sum, item) => sum + (Number(item?.quantity) || 0),
                  0
                );

                return (
                  <div
                    key={order._id}
                    className={`px-5 py-4 transition-colors ${isSelected ? 'bg-slate-50' : 'bg-white hover:bg-slate-50/70'}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <button
                        onClick={() => setSelectedOrderId(order._id)}
                        className="!bg-transparent !text-left !text-slate-900 !p-0 hover:!text-slate-700"
                      >
                        <p className="font-semibold text-sm">#{String(order._id).slice(-8)}</p>
                        <p className="text-xs text-slate-500 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
                      </button>

                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusPillClass(order.status)}`}
                      >
                        {formatStatus(order.status)}
                      </span>
                    </div>

                    <div className="mt-3 grid sm:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">Customer</p>
                        <p className="font-medium text-slate-800">{order.name}</p>
                        <p className="text-xs text-slate-500 break-all">{order.email}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">Order Size</p>
                        <p className="font-medium text-slate-800">{orderItemsCount} items</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">Order Value</p>
                        <p className="font-medium text-slate-800">{formatCurrency(order.totalPrice)}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <select
                        value={statusDraft[order._id] || order.status}
                        onChange={(event) =>
                          setStatusDraft((prev) => ({
                            ...prev,
                            [order._id]: event.target.value,
                          }))
                        }
                        className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs capitalize"
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {formatStatus(status)}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => handleUpdateStatus(order._id)}
                        disabled={!hasStatusChanged || isStatusUpdating}
                        className={`rounded-md px-3 py-1.5 text-xs ${
                          hasStatusChanged && !isStatusUpdating
                            ? 'admin-btn-primary'
                            : 'admin-btn-disabled'
                        }`}
                      >
                        Save Status
                      </button>

                      {!isSelected && (
                        <button
                          onClick={() => setSelectedOrderId(order._id)}
                          className="admin-btn-secondary rounded-md px-3 py-1.5 text-xs"
                        >
                          Open Tracking
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </article>

        <aside className="card-surface p-5 bg-white xl:sticky xl:top-24">
          <h3 className="text-lg font-semibold text-slate-900">Order Tracking</h3>
          <p className="text-xs text-slate-500 mt-1">Detailed fulfillment and shipment status.</p>

          {!selectedOrderId && (
            <p className="text-sm text-slate-500 mt-5">Select an order from the queue to inspect details.</p>
          )}

          {selectedOrderId && isOrderDetailsLoading && (
            <p className="text-sm text-slate-500 mt-5">Loading order details...</p>
          )}

          {selectedOrderId && !isOrderDetailsLoading && isOrderDetailsError && (
            <p className="text-sm text-red-600 mt-5">Unable to load selected order details.</p>
          )}

          {selectedOrder && !isOrderDetailsLoading && (
            <div className="space-y-5 mt-5 text-sm">
              <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Order ID</p>
                    <p className="font-semibold text-slate-900 break-all mt-1">{selectedOrder._id}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusPillClass(selectedOrder.status)}`}>
                    {formatStatus(selectedOrder.status)}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="rounded-lg bg-white border border-slate-200 p-2">
                    <p className="text-slate-500">Items</p>
                    <p className="font-semibold text-slate-900 mt-0.5">{selectedItemsCount}</p>
                  </div>
                  <div className="rounded-lg bg-white border border-slate-200 p-2">
                    <p className="text-slate-500">Total</p>
                    <p className="font-semibold text-slate-900 mt-0.5">{formatCurrency(selectedOrder.totalPrice)}</p>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <select
                    value={selectedStatus || selectedOrder.status}
                    onChange={(event) =>
                      setStatusDraft((prev) => ({
                        ...prev,
                        [selectedOrder._id]: event.target.value,
                      }))
                    }
                    className="flex-1 rounded-md border border-slate-200 px-2.5 py-2 text-xs capitalize"
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {formatStatus(status)}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder._id)}
                    disabled={!selectedStatusChanged || isStatusUpdating}
                    className={`rounded-md px-3 py-2 text-xs ${
                      selectedStatusChanged && !isStatusUpdating
                        ? 'admin-btn-primary'
                        : 'admin-btn-disabled'
                    }`}
                  >
                    Save
                  </button>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 p-4">
                <h4 className="text-xs uppercase tracking-wide text-slate-500 mb-3">Tracking Timeline</h4>
                <div className="relative">
                  <div className="absolute left-[10px] top-0 bottom-0 w-px bg-slate-200" />
                  <div className="space-y-4">
                    {timeline.map((step) => (
                      <div key={step.step} className="relative flex items-start gap-3">
                        <span
                          className={`relative z-10 mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                            step.done ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {step.done ? '✓' : '•'}
                        </span>
                        <div>
                          <p className={`capitalize ${step.current ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                            {step.step}
                          </p>
                          {step.current && (
                            <p className="text-xs text-slate-500">Current stage</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="grid gap-3">
                <div className="rounded-xl border border-slate-200 p-4">
                  <h4 className="text-xs uppercase tracking-wide text-slate-500 mb-2">Customer</h4>
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white font-semibold">
                      {selectedCustomerInitial}
                    </span>
                    <div>
                      <p className="font-medium text-slate-900 flex items-center gap-1.5">
                        <FiUser className="h-3.5 w-3.5 text-slate-500" />
                        {selectedOrder.name}
                      </p>
                      <p className="text-slate-600 break-all">{selectedOrder.email}</p>
                      <p className="text-slate-600">{selectedOrder.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <h4 className="text-xs uppercase tracking-wide text-slate-500 mb-2">Shipping Address</h4>
                  <p className="text-slate-700 flex items-start gap-1.5">
                    <FiMapPin className="h-4 w-4 mt-0.5 text-slate-500" />
                    <span>
                      {selectedOrder?.address?.street}, {selectedOrder?.address?.city}, {selectedOrder?.address?.state}, {selectedOrder?.address?.country}, {selectedOrder?.address?.zipcode}
                    </span>
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <h4 className="text-xs uppercase tracking-wide text-slate-500 mb-2">Order Meta</h4>
                  <div className="space-y-2 text-slate-700">
                    <p className="flex items-center gap-2">
                      <FiCalendar className="h-4 w-4 text-slate-500" />
                      Created: {new Date(selectedOrder.createdAt).toLocaleString()}
                    </p>
                    <p className="flex items-center gap-2">
                      <FiClock className="h-4 w-4 text-slate-500" />
                      Updated: {new Date(selectedOrder.updatedAt).toLocaleString()}
                    </p>
                    <p className="flex items-center gap-2">
                      <FiShoppingBag className="h-4 w-4 text-slate-500" />
                      Total: {formatCurrency(selectedOrder.totalPrice)}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 p-4">
                <h4 className="text-xs uppercase tracking-wide text-slate-500 mb-3">Items</h4>
                <ul className="space-y-2">
                  {(selectedOrder.items || []).map((item, index) => (
                    <li
                      key={`${item.productId}-${index}`}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                    >
                      <p className="font-medium text-slate-900 flex items-center gap-2">
                        <FiPackage className="h-4 w-4 text-slate-500" />
                        {item.title || 'Untitled Product'}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        Qty: {item.quantity} · Price: {formatCurrency(item.price)}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
};

export default ManageOrders;
