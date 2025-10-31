'use client';

import { useState, useEffect } from 'react';
import { UserRole } from '@pg-prepaid/types';

interface Member {
  id: string;
  user: {
    id: string;
    email: string;
    isActive: boolean;
  };
  roles: UserRole[];
  joinedAt: string;
  invitedBy: {
    id: string;
    email: string;
  } | null;
  invitedAt?: string;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoles, setInviteRoles] = useState<UserRole[]>([UserRole.VIEWER]);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/v1/organizations/members');
      if (response.ok) {
        const data = await response.json();
        setMembers(data.data.members);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  };

  const inviteUser = async () => {
    if (!inviteEmail.trim() || inviting) return;

    setInviting(true);
    try {
      const response = await fetch('/api/v1/organizations/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          roles: inviteRoles,
        }),
      });

      if (response.ok) {
        setShowInviteDialog(false);
        setInviteEmail('');
        setInviteRoles([UserRole.VIEWER]);
        fetchMembers(); // Refresh the list
        alert('User invited successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to invite user. Please try again.');
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setInviting(false);
    }
  };

  const toggleRole = (role: UserRole) => {
    if (inviteRoles.includes(role)) {
      setInviteRoles(inviteRoles.filter((r) => r !== role));
    } else {
      setInviteRoles([...inviteRoles, role]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organization Members</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage who has access to your organization
          </p>
        </div>
        <button
          onClick={() => setShowInviteDialog(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
        >
          Invite Member
        </button>
      </div>

      <div className="bg-white rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Roles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invited By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {member.user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-1">
                      {member.roles.map((role) => (
                        <span
                          key={role}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            role === UserRole.ADMIN
                              ? 'bg-purple-100 text-purple-800'
                              : role === UserRole.OPERATOR
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.invitedBy?.email || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.user.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {member.user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Dialog */}
      {showInviteDialog && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => !inviting && setShowInviteDialog(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Invite User to Organization</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="inviteEmail"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={inviting}
                  placeholder="user@example.com"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  User must already have an account to be invited
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Roles
                </label>
                <div className="space-y-2">
                  {Object.values(UserRole).map((role) => (
                    <label key={role} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={inviteRoles.includes(role)}
                        onChange={() => toggleRole(role)}
                        disabled={inviting}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 capitalize">{role}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => setShowInviteDialog(false)}
                disabled={inviting}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={inviteUser}
                disabled={!inviteEmail.trim() || inviteRoles.length === 0 || inviting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {inviting && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                {inviting ? 'Inviting...' : 'Invite User'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
