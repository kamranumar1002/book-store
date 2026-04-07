import { useEffect, useMemo, useState } from 'react';
import Loading from '../../../components/Loading';
import { useAuth } from '../../../context/AuthContext';
import {
  useDeleteAdminUserMutation,
  useGetAdminUsersQuery,
  useUpdateAdminUserRoleMutation,
} from '../../../redux/features/admin/adminApi';

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

const roleBadgeClass = (role = '') =>
  role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700';

const ManageUsers = () => {
  const { currentUser } = useAuth();

  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [roleDraft, setRoleDraft] = useState({});

  const queryArgs = useMemo(() => ({ search: searchTerm, role: roleFilter }), [searchTerm, roleFilter]);

  const { data: users = [], isLoading, isError, error } = useGetAdminUsersQuery(queryArgs);
  const [updateAdminUserRole, { isLoading: isRoleUpdating }] = useUpdateAdminUserRoleMutation();
  const [deleteAdminUser, { isLoading: isDeletingUser }] = useDeleteAdminUserMutation();

  useEffect(() => {
    const nextRoles = {};
    users.forEach((user) => {
      nextRoles[user._id] = user.role;
    });
    setRoleDraft(nextRoles);
  }, [users]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setSearchTerm(searchInput.trim());
  };

  const handleSaveRole = async (user) => {
    if (!user?._id) return;

    if (String(user._id) === String(currentUser?.id)) {
      alert('You cannot change your own role.');
      return;
    }

    const selectedRole = (roleDraft[user._id] || '').toLowerCase();
    if (!selectedRole) {
      alert('Please choose a role.');
      return;
    }

    try {
      await updateAdminUserRole({ userId: user._id, role: selectedRole }).unwrap();
      alert('User role updated successfully.');
    } catch (mutationError) {
      const message = mutationError?.data?.message || 'Failed to update user role.';
      alert(message);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!user?._id) return;

    const confirmed = window.confirm(`Delete user ${user.username}? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteAdminUser(user._id).unwrap();
      alert('User deleted successfully.');
    } catch (mutationError) {
      const message = mutationError?.data?.message || 'Failed to delete user.';
      alert(message);
    }
  };

  if (isLoading) return <Loading />;
  if (isError) {
    return (
      <div className="card-surface p-4 text-red-700">
        {error?.data?.message || 'Failed to load users.'}
      </div>
    );
  }

  const adminCount = users.filter((user) => user.role === 'admin').length;
  const customerCount = users.filter((user) => user.role === 'user').length;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-semibold text-slate-900">User Management</h2>
        <p className="text-sm text-slate-500">
          Manage account roles, monitor customer activity, and keep access control organized.
        </p>
      </section>

      <section className="grid sm:grid-cols-3 gap-4">
        <article className="card-surface p-4 bg-white">
          <p className="text-sm text-slate-500">Total Accounts</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{users.length.toLocaleString()}</p>
        </article>
        <article className="card-surface p-4 bg-white">
          <p className="text-sm text-slate-500">Admin Accounts</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{adminCount.toLocaleString()}</p>
        </article>
        <article className="card-surface p-4 bg-white">
          <p className="text-sm text-slate-500">Customer Accounts</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{customerCount.toLocaleString()}</p>
        </article>
      </section>

      <section className="card-surface p-4 bg-white">
        <form onSubmit={handleSearchSubmit} className="grid md:grid-cols-[1fr_220px_auto] gap-3">
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            type="text"
            placeholder="Search by username"
            className="rounded-md border border-slate-200 px-3 py-2"
          />

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="rounded-md border border-slate-200 px-3 py-2"
          >
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>

          <button type="submit" className="admin-btn-primary rounded-md px-4 py-2">
            Apply Filters
          </button>
        </form>
      </section>

      <section className="card-surface bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Orders</th>
                <th className="px-4 py-3 font-medium">Lifetime Value</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-slate-500">
                    No users match your filter.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const selectedRole = roleDraft[user._id] || user.role;
                  const roleChanged = selectedRole !== user.role;
                  const isSelf = String(user._id) === String(currentUser?.id);

                  return (
                    <tr key={user._id} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800 break-all">{user.username}</p>
                        {isSelf && <p className="text-xs text-slate-500">Current session</p>}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full capitalize ${roleBadgeClass(user.role)}`}>
                            {user.role}
                          </span>
                          <select
                            value={selectedRole}
                            onChange={(event) =>
                              setRoleDraft((prev) => ({
                                ...prev,
                                [user._id]: event.target.value,
                              }))
                            }
                            disabled={isSelf}
                            className="rounded-md border border-slate-200 px-2 py-1 text-xs"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-slate-700">{Number(user.totalOrders || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-700">{formatCurrency(user.totalSpent)}</td>

                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleSaveRole(user)}
                          disabled={!roleChanged || isSelf || isRoleUpdating}
                          className={`px-3 py-1 rounded-md ${
                            roleChanged && !isSelf && !isRoleUpdating
                              ? 'admin-btn-primary'
                              : 'admin-btn-disabled'
                          }`}
                        >
                          Save Role
                        </button>

                        <button
                          onClick={() => handleDeleteUser(user)}
                          disabled={isSelf || user.role === 'admin' || isDeletingUser}
                          className={`px-3 py-1 rounded-md ${
                            !isSelf && user.role !== 'admin' && !isDeletingUser
                              ? 'admin-btn-danger'
                              : 'admin-btn-disabled'
                          }`}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ManageUsers;
