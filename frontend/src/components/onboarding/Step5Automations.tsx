import { useState } from 'react'
import { Zap } from 'lucide-react'
import api from '../../services/api'

interface Props {
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}

const AUTOMATION_TEMPLATES = [
  {
    id: 'booking-confirmation',
    name: 'Booking Confirmation',
    description: 'Automatically send confirmation email when a booking is created',
    trigger: 'booking.created',
    actions: [{ type: 'send_email', template: 'booking_confirmation' }],
    enabled: true
  },
  {
    id: 'booking-reminder',
    name: 'Booking Reminder',
    description: 'Send reminder 24 hours before appointment',
    trigger: 'booking.upcoming',
    actions: [{ type: 'send_email', template: 'booking_reminder', delay: '24h' }],
    enabled: true
  },
  {
    id: 'follow-up',
    name: 'Follow-up Message',
    description: 'Send follow-up email 24 hours after appointment',
    trigger: 'booking.completed',
    actions: [{ type: 'send_email', template: 'follow_up', delay: '24h' }],
    enabled: false
  },
  {
    id: 'new-contact-welcome',
    name: 'Welcome New Contacts',
    description: 'Send welcome email when a new contact is added',
    trigger: 'contact.created',
    actions: [{ type: 'send_email', template: 'welcome' }],
    enabled: false
  },
  {
    id: 'form-autoresponder',
    name: 'Form Auto-responder',
    description: 'Automatically reply when someone submits a form',
    trigger: 'form.submitted',
    actions: [{ type: 'send_email', template: 'form_response' }],
    enabled: true
  }
]

export default function Step5Automations({ onNext, onBack, onSkip }: Props) {
  const [automations, setAutomations] = useState(AUTOMATION_TEMPLATES)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleAutomation = (id: string) => {
    setAutomations(
      automations.map((a) =>
        a.id === id ? { ...a, enabled: !a.enabled } : a
      )
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const enabledAutomations = automations.filter((a) => a.enabled)

    try {
      await api.post('/onboarding/automations', { automations: enabledAutomations })
      onNext()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save automation preferences')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Zap className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Save time with automation</h2>
        <p className="text-gray-600">Let CareOps handle repetitive tasks for you</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {automations.map((automation) => (
          <div
            key={automation.id}
            className={`p-4 border-2 rounded-lg transition-all ${
              automation.enabled
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <label className="flex items-start space-x-4 cursor-pointer">
              <input
                type="checkbox"
                checked={automation.enabled}
                onChange={() => toggleAutomation(automation.id)}
                className="w-5 h-5 text-blue-600 rounded mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-gray-900">{automation.name}</h3>
                  {automation.enabled && (
                    <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{automation.description}</p>
              </div>
            </label>
          </div>
        ))}

        <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <Zap className="w-5 h-5 text-indigo-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-indigo-900">Pro Tip</p>
              <p className="text-sm text-indigo-700 mt-1">
                You can customize these automations later and create your own workflows in the Automations section.
              </p>
            </div>
          </div>
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
