'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  created_at: string;
  last_login?: string;
  is_admin: boolean;
  is_banned: boolean;
  listings_count: number;
  total_clicks: number;
  reputation_score: number;
  verified: boolean;
}

interface UserFilter {
  search: string;
  status: 'all' | 'active' | 'banned' | 'admins';
  sortBy: 'created_at' | 'last_login' | 'listings_count' | 'reputation_score';
  sortOrder: 'asc' | 'desc';
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<UserFilter>({
    search: '',
    status: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: filter.search,
        status: filter.status,
        sortBy: filter.sortBy,
        sortOrder: filter.sortOrder
      });
      
      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUsers(data.users);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (action: 'ban' | 'unban' | 'make_admin' | 'remove_admin', userId?: string) => {
    const targetUsers = userId ? [userId] : Array.from(selectedUsers);
    if (targetUsers.length === 0) return;

    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/users/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          user_ids: targetUsers
        })
      });

      if (response.ok) {
        await fetchUsers(); // Refresh the list
        setSelectedUsers(new Set()); // Clear selection
        alert(`Action "${action}" completed successfully for ${targetUsers.length} user(s)`);
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error performing user action:', error);
      alert('Error performing action');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const selectAllUsers = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (user: User) => {
    if (user.is_banned) {
      return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">🚫 Banned</span>;
    }
    if (user.is_admin) {
      return <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">👑 Admin</span>;
    }
    if (user.verified) {
      return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">✅ Verified</span>;
    }
    return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">👤 User</span>;
  };

  const getReputationColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center">
              <Link href="/admin" className="text-gray-500 hover:text-gray-700 mr-2">
                ← Back to Dashboard
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">👥 User Management</h1>
            <p className="text-gray-600">Manage community members and permissions</p>
          </div>
          <div className="text-sm text-gray-500">
            Total Users: <span className="font-medium text-gray-900">{users.length}</span>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search users..."
              value={filter.search}
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filter.status}
              onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Users</option>
              <option value="active">Active Only</option>
              <option value="banned">Banned Only</option>
              <option value="admins">Admins Only</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={filter.sortBy}
              onChange={(e) => setFilter(prev => ({ ...prev, sortBy: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="created_at">Join Date</option>
              <option value="last_login">Last Login</option>
              <option value="listings_count">Listings Count</option>
              <option value="reputation_score">Reputation</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <select
              value={filter.sortOrder}
              onChange={(e) => setFilter(prev => ({ ...prev, sortOrder: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-800">
              <strong>{selectedUsers.size}</strong> user(s) selected
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleUserAction('ban')}
                disabled={actionLoading}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-red-400"
              >
                🚫 Ban Selected
              </button>
              <button
                onClick={() => handleUserAction('unban')}
                disabled={actionLoading}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-green-400"
              >
                ✅ Unban Selected
              </button>
              <button
                onClick={() => handleUserAction('make_admin')}
                disabled={actionLoading}
                className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:bg-purple-400"
              >
                👑 Make Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === users.length && users.length > 0}
                    onChange={selectAllUsers}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reputation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className={`hover:bg-gray-50 ${selectedUsers.has(user.id) ? 'bg-blue-50' : ''}`}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="text-2xl mr-3">
                        {user.is_admin ? '👑' : user.verified ? '✅' : '👤'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.email}</div>
                        <div className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(user)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      <div>{user.listings_count} listings</div>
                      <div className="text-gray-500">{user.total_clicks} total clicks</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`text-sm font-medium ${getReputationColor(user.reputation_score)}`}>
                      {user.reputation_score}%
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {formatDate(user.created_at)}
                    </div>
                    {user.last_login && (
                      <div className="text-sm text-gray-500">
                        Last: {formatDate(user.last_login)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      {!user.is_banned ? (
                        <button
                          onClick={() => handleUserAction('ban', user.id)}
                          disabled={actionLoading}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Ban
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUserAction('unban', user.id)}
                          disabled={actionLoading}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          Unban
                        </button>
                      )}
                      
                      {!user.is_admin ? (
                        <button
                          onClick={() => handleUserAction('make_admin', user.id)}
                          disabled={actionLoading}
                          className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                        >
                          Make Admin
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUserAction('remove_admin', user.id)}
                          disabled={actionLoading}
                          className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                        >
                          Remove Admin
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="text-3xl mr-4">👥</div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{users.length}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="text-3xl mr-4">👑</div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.is_admin).length}
              </div>
              <div className="text-sm text-gray-600">Administrators</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="text-3xl mr-4">🚫</div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.is_banned).length}
              </div>
              <div className="text-sm text-gray-600">Banned Users</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="text-3xl mr-4">⭐</div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(users.reduce((sum, u) => sum + u.reputation_score, 0) / users.length || 0)}%
              </div>
              <div className="text-sm text-gray-600">Avg Reputation</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
        <h3 className="text-lg font-semibold text-purple-900 mb-4">⚡ Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-purple-200">
            <div className="text-center">
              <div className="text-2xl mb-2">📧</div>
              <div className="text-sm font-medium text-gray-900">Send Announcement</div>
              <div className="text-xs text-gray-600">Email all users</div>
            </div>
          </button>

          <button className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-purple-200">
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm font-medium text-gray-900">Export User Data</div>
              <div className="text-xs text-gray-600">Download CSV report</div>
            </div>
          </button>

          <button className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-purple-200">
            <div className="text-center">
              <div className="text-2xl mb-2">🛡️</div>
              <div className="text-sm font-medium text-gray-900">Security Audit</div>
              <div className="text-xs text-gray-600">Review permissions</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
} 