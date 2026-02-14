import { useState } from 'react'
import { Bell } from 'lucide-react'
import api from '../../services/api'

interface Props {
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}

export default function Step4Notifications({ onNext, onBack, onSkip }: Props) {
  const [emailNotifications, setEmailNotifications] = useState({
    newBooking: true,
    bookingCancellation: true,
    formSubmission: true,
    customerMessage: true,
    dailyReport: false
  })

  const [smsNotifications, setSmsNotifications] = useState({
    newBooking: false,
    bookingReminder: false,
    customerMessage: false
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.post('/onboarding/notifications', {
        emailNotifications,
        smsNotifications
      })
      onNext()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save notification preferences')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Bell className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Stay informed</h2>
        <p className="text-gray-600">Choose how you want to be notified</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Notifications</h3>
          <div className="space-y-3">
            {[
              { key: 'newBooking', label: 'New booking received', description: 'Get notified when a customer books an appointment' },
              { key: 'bookingCancellation', label: 'Booking cancellation', description: 'Know when a booking is cancelled' },
              { key: 'formSubmission', label: 'Form submission', description: 'Receive alerts for new form submissions' },
              { key: 'customerMessage', label: 'Customer messages', description: 'Get notified about new messages from customers' },
              { key: 'dailyReport', label: 'Daily summary report', description: 'Receive a daily summary of your activities' }
            ].map((item) => (
              <label key={item.key} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotifications[item.key as keyof typeof emailNotifications]}
                  onChange={(e) =>
                    setEmailNotifications({
                      ...emailNotifications,
                      [item.key]: e.target.checked
                    })
                  }
                  className="w-5 h-5 text-blue-600 rounded mt-0.5"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{item.label}</div>
                  <div className="text-sm text-gray-500">{item.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">SMS Notifications</h3>
          <div className="space-y-3">
            {[
              { key: 'newBooking', label: 'New booking received', description: 'Get SMS when a customer books' },
              { key: 'bookingReminder', label: 'Booking reminders', description: 'Receive reminders before appointments' },
              { key: 'customerMessage', label: 'Customer messages', description: 'Get SMS for urgent customer messages' }
            ].map((item) => (
              <label key={item.key} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={smsNotifications[item.key as keyof typeof smsNotifications]}
                  onChange={(e) =>
                    setSmsNotifications({
                      ...smsNotifications,
                      [item.key]: e.target.checked
                    })
                  }
                  className="w-5 h-5 text-blue-600 rounded mt-0.5"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{item.label}</div>
                  <div className="text-sm text-gray-500">{item.description}</div>
                </div>
              </label>
            ))}
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
