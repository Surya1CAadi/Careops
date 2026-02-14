import { useState } from 'react'
import { Plug } from 'lucide-react'
import api from '../../services/api'

interface Props {
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}

const INTEGRATIONS = [
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sync your bookings with Google Calendar',
    icon: '📅',
    enabled: false,
    comingSoon: false
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Accept online payments',
    icon: '💳',
    enabled: false,
    comingSoon: false
  },
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'Send SMS notifications to customers',
    icon: '💬',
    enabled: false,
    comingSoon: false
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Sync contacts with your email marketing',
    icon: '📧',
    enabled: false,
    comingSoon: true
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Sync invoices and payments',
    icon: '📊',
    enabled: false,
    comingSoon: true
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Get notifications in your Slack workspace',
    icon: '💼',
    enabled: false,
    comingSoon: true
  }
]

export default function Step7Integrations({ onNext, onBack, onSkip }: Props) {
  const [integrations, setIntegrations] = useState(INTEGRATIONS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleIntegration = (id: string) => {
    setIntegrations(
      integrations.map((i) =>
        i.id === id && !i.comingSoon ? { ...i, enabled: !i.enabled } : i
      )
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const enabledIntegrations = integrations
      .filter((i) => i.enabled)
      .map((i) => ({ id: i.id, name: i.name }))

    try {
      await api.post('/onboarding/integrations', { integrations: enabledIntegrations })
      onNext()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save integration preferences')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Plug className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Connect your tools</h2>
        <p className="text-gray-600">Integrate with your favorite apps (optional)</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                integration.comingSoon
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                  : integration.enabled
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => !integration.comingSoon && toggleIntegration(integration.id)}
            >
              {integration.comingSoon && (
                <span className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded-full">
                  Coming Soon
                </span>
              )}
              <div className="flex items-start space-x-3">
                <div className="text-3xl">{integration.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                    {integration.enabled && !integration.comingSoon && (
                      <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{integration.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> Selecting integrations here will allow you to configure them later. You'll need to provide API keys and authenticate with each service in the Integrations settings.
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
