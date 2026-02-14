import { useState } from 'react'
import { Clock } from 'lucide-react'
import api from '../../services/api'

interface Props {
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

interface DayHours {
  enabled: boolean
  start: string
  end: string
}

export default function Step2BusinessHours({ onNext, onBack, onSkip }: Props) {
  const [hours, setHours] = useState<Record<string, DayHours>>({
    Monday: { enabled: true, start: '09:00', end: '17:00' },
    Tuesday: { enabled: true, start: '09:00', end: '17:00' },
    Wednesday: { enabled: true, start: '09:00', end: '17:00' },
    Thursday: { enabled: true, start: '09:00', end: '17:00' },
    Friday: { enabled: true, start: '09:00', end: '17:00' },
    Saturday: { enabled: false, start: '09:00', end: '17:00' },
    Sunday: { enabled: false, start: '09:00', end: '17:00' }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.post('/onboarding/business-hours', { businessHours: hours })
      onNext()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save business hours')
    } finally {
      setLoading(false)
    }
  }

  const toggleDay = (day: string) => {
    setHours({
      ...hours,
      [day]: { ...hours[day], enabled: !hours[day].enabled }
    })
  }

  const updateTime = (day: string, field: 'start' | 'end', value: string) => {
    setHours({
      ...hours,
      [day]: { ...hours[day], [field]: value }
    })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Clock className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Set your business hours</h2>
        <p className="text-gray-600">When are you available to serve customers?</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {DAYS.map((day) => (
          <div key={day} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              checked={hours[day].enabled}
              onChange={() => toggleDay(day)}
              className="w-5 h-5 text-blue-600 rounded"
            />
            <span className="w-28 font-medium text-gray-900">{day}</span>
            {hours[day].enabled ? (
              <div className="flex items-center space-x-3 flex-1">
                <input
                  type="time"
                  value={hours[day].start}
                  onChange={(e) => updateTime(day, 'start', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="time"
                  value={hours[day].end}
                  onChange={(e) => updateTime(day, 'end', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            ) : (
              <span className="text-gray-400 italic">Closed</span>
            )}
          </div>
        ))}

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
