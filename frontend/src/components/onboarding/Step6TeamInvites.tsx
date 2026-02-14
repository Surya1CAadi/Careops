import { useState } from 'react'
import { Users, Plus, Trash2 } from 'lucide-react'
import api from '../../services/api'

interface Props {
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}

interface Invite {
  id: string
  email: string
  role: 'STAFF' | 'OWNER'
}

export default function Step6TeamInvites({ onNext, onBack, onSkip }: Props) {
  const [invites, setInvites] = useState<Invite[]>([
    { id: '1', email: '', role: 'STAFF' }
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addInvite = () => {
    setInvites([
      ...invites,
      { id: Date.now().toString(), email: '', role: 'STAFF' }
    ])
  }

  const removeInvite = (id: string) => {
    if (invites.length > 1) {
      setInvites(invites.filter((i) => i.id !== id))
    }
  }

  const updateInvite = (id: string, field: keyof Invite, value: string) => {
    setInvites(
      invites.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Filter out empty invites
    const validInvites = invites.filter((i) => i.email)

    try {
      await api.post('/onboarding/team-invites', { invites: validInvites })
      onNext()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save team invites')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Users className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Invite your team</h2>
        <p className="text-gray-600">Collaborate with your team members</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {invites.map((invite, index) => (
          <div key={invite.id} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Team Member {index + 1}</h3>
              {invites.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeInvite(invite.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={invite.email}
                  onChange={(e) => updateInvite(invite.id, 'email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="colleague@example.com"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={invite.role}
                  onChange={(e) => updateInvite(invite.id, 'role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="STAFF">Staff - Limited access</option>
                  <option value="OWNER">Owner - Full access</option>
                </select>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addInvite}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Another Team Member</span>
        </button>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Invitations will be sent after you complete the onboarding process. Team members will receive an email with instructions to join your workspace.
          </p>
        </div>

        <div className="flex items-center justify-between pt-6">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 text-gray-600 hover:text-gray-800"
          >
            Back
          </button>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onSkip}
              className="px-6 py-2 text-gray-600 hover:text-gray-800"
            >
              Skip for now
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
