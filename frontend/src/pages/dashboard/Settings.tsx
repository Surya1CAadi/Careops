import { useState, useEffect } from 'react'
import { Building2, User, Users, Key, Save, Trash2, UserPlus } from 'lucide-react'
import api from '../../services/api'

interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  workspace: {
    id: string
    name: string
  }
}

interface TeamMember {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  createdAt: string
}

type Tab = 'workspace' | 'profile' | 'team' | 'security'

export default function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>('workspace')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Workspace form
  const [workspaceName, setWorkspaceName] = useState('')
  const [timezone, setTimezone] = useState('')

  // Profile form
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Invite form
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteFirstName, setInviteFirstName] = useState('')
  const [inviteLastName, setInviteLastName] = useState('')
  const [inviteRole, setInviteRole] = useState('STAFF')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const [workspaceRes, profileRes, teamRes] = await Promise.all([
        api.get('/settings/workspace'),
        api.get('/settings/profile'),
        api.get('/settings/team')
      ])

      const workspaceData = workspaceRes.data.data
      setWorkspaceName(workspaceData.name || '')
      setTimezone(workspaceData.timezone || '')

      const profileData = profileRes.data.data
      setProfile(profileData)
      setFirstName(profileData.firstName || '')
      setLastName(profileData.lastName || '')
      setEmail(profileData.email || '')

      setTeamMembers(teamRes.data.data || [])
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveWorkspaceSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      await api.put('/settings/workspace', {
        name: workspaceName,
        timezone
      })
      alert('Workspace settings updated successfully')
      fetchSettings()
    } catch (error: any) {
      console.error('Failed to save workspace settings:', error)
      alert(error.response?.data?.error || 'Failed to save workspace settings')
    } finally {
      setSaving(false)
    }
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      await api.put('/settings/profile', {
        firstName,
        lastName,
        email
      })
      alert('Profile updated successfully')
      fetchSettings()
    } catch (error: any) {
      console.error('Failed to save profile:', error)
      alert(error.response?.data?.error || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }

    try {
      setSaving(true)
      await api.post('/settings/profile/password', {
        currentPassword,
        newPassword
      })
      alert('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('Failed to change password:', error)
      alert(error.response?.data?.error || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const inviteTeamMember = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const response = await api.post('/settings/team/invite', {
        email: inviteEmail,
        firstName: inviteFirstName,
        lastName: inviteLastName,
        role: inviteRole
      })
      alert(response.data.message || 'Team member invited successfully')
      setShowInviteModal(false)
      setInviteEmail('')
      setInviteFirstName('')
      setInviteLastName('')
      setInviteRole('STAFF')
      fetchSettings()
    } catch (error: any) {
      console.error('Failed to invite team member:', error)
      alert(error.response?.data?.error || 'Failed to invite team member')
    } finally {
      setSaving(false)
    }
  }

  const updateMemberRole = async (memberId: string, newRole: string) => {
    if (!confirm(`Are you sure you want to change this member's role to ${newRole}?`)) {
      return
    }

    try {
      await api.put(`/settings/team/${memberId}/role`, { role: newRole })
      alert('Role updated successfully')
      fetchSettings()
    } catch (error: any) {
      console.error('Failed to update role:', error)
      alert(error.response?.data?.error || 'Failed to update role')
    }
  }

  const removeMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) {
      return
    }

    try {
      await api.delete(`/settings/team/${memberId}`)
      alert('Team member removed successfully')
      fetchSettings()
    } catch (error: any) {
      console.error('Failed to remove team member:', error)
      alert(error.response?.data?.error || 'Failed to remove team member')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    )
  }

  const tabs = [
    { id: 'workspace' as Tab, label: 'Workspace', icon: Building2 },
    { id: 'profile' as Tab, label: 'Profile', icon: User },
    { id: 'team' as Tab, label: 'Team', icon: Users },
    { id: 'security' as Tab, label: 'Security', icon: Key },
  ]

  const isOwner = profile?.role === 'OWNER'

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Workspace Settings */}
      {activeTab === 'workspace' && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Workspace Settings</h2>
          {!isOwner && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
              Only workspace owners can edit these settings
            </div>
          )}
          <form onSubmit={saveWorkspaceSettings} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Workspace Name
              </label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                disabled={!isOwner}
                className="input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                disabled={!isOwner}
                className="input w-full"
              >
                <option value="">Select timezone</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="America/Anchorage">Alaska Time (AKT)</option>
                <option value="Pacific/Honolulu">Hawaii Time (HST)</option>
              </select>
            </div>

            {isOwner && (
              <button type="submit" disabled={saving} className="btn btn-primary">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </form>
        </div>
      )}

      {/* Profile Settings */}
      {activeTab === 'profile' && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Profile Settings</h2>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input w-full"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input w-full"
                required
              />
            </div>

            <div className="bg-gray-50 px-4 py-3 rounded">
              <div className="text-sm text-gray-600">
                <strong>Role:</strong> {profile?.role}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                <strong>Workspace:</strong> {profile?.workspace.name}
              </div>
            </div>

            <button type="submit" disabled={saving} className="btn btn-primary">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      )}

      {/* Team Management */}
      {activeTab === 'team' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Team Members</h2>
            {isOwner && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="btn btn-primary"
              >
                <UserPlus className="w-4 h-4" />
                Invite Member
              </button>
            )}
          </div>

          {!isOwner && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
              Only workspace owners can manage team members
            </div>
          )}

          <div className="space-y-3">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-medium">
                    {member.firstName[0]}{member.lastName[0]}
                  </div>
                  <div>
                    <div className="font-medium">
                      {member.firstName} {member.lastName}
                      {member.id === profile?.id && (
                        <span className="ml-2 text-xs text-gray-500">(You)</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">{member.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isOwner && member.id !== profile?.id ? (
                    <>
                      <select
                        value={member.role}
                        onChange={(e) => updateMemberRole(member.id, e.target.value)}
                        className="px-3 py-1 border rounded text-sm"
                      >
                        <option value="STAFF">Staff</option>
                        <option value="OWNER">Owner</option>
                      </select>
                      <button
                        onClick={() => removeMember(member.id)}
                        className="text-red-600 hover:text-red-700"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm">
                      {member.role}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Change Password</h2>
          <form onSubmit={changePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input w-full"
                required
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 6 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input w-full"
                required
                minLength={6}
              />
            </div>

            <button type="submit" disabled={saving} className="btn btn-primary">
              <Key className="w-4 h-4" />
              {saving ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Invite Team Member</h3>
            <form onSubmit={inviteTeamMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="input w-full"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={inviteFirstName}
                    onChange={(e) => setInviteFirstName(e.target.value)}
                    className="input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={inviteLastName}
                    onChange={(e) => setInviteLastName(e.target.value)}
                    className="input w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="input w-full"
                >
                  <option value="STAFF">Staff</option>
                  <option value="OWNER">Owner</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary flex-1">
                  {saving ? 'Inviting...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
