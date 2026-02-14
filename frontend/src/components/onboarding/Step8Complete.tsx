import { useState } from 'react'
import { CheckCircle, Sparkles } from 'lucide-react'
import api from '../../services/api'

interface Props {
  onNext: () => void
}

export default function Step8Complete({ onNext }: Props) {
  const [loading, setLoading] = useState(false)

  const handleComplete = async () => {
    setLoading(true)
    try {
      await api.post('/onboarding/complete')
      onNext()
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
      // Still navigate even if API call fails
      onNext()
    }
  }

  return (
    <div className="max-w-2xl mx-auto text-center py-8">
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6 animate-bounce">
          <CheckCircle className="w-16 h-16 text-green-600" />
        </div>
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          🎉 You're all set!
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Your CareOps workspace is ready to go
        </p>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 mb-8">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Sparkles className="w-6 h-6 text-indigo-600" />
          <h3 className="text-xl font-semibold text-gray-900">What's Next?</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-white rounded-lg p-4 text-left">
            <div className="text-2xl mb-2">📇</div>
            <h4 className="font-semibold text-gray-900 mb-1">Add Your Contacts</h4>
            <p className="text-sm text-gray-600">
              Import your customer list or add contacts manually
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 text-left">
            <div className="text-2xl mb-2">📅</div>
            <h4 className="font-semibold text-gray-900 mb-1">Create Bookings</h4>
            <p className="text-sm text-gray-600">
              Schedule appointments and manage your calendar
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 text-left">
            <div className="text-2xl mb-2">📋</div>
            <h4 className="font-semibold text-gray-900 mb-1">Build Forms</h4>
            <p className="text-sm text-gray-600">
              Create custom forms to collect information
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 text-left">
            <div className="text-2xl mb-2">📊</div>
            <h4 className="font-semibold text-gray-900 mb-1">Track Everything</h4>
            <p className="text-sm text-gray-600">
              Monitor your business metrics on the dashboard
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <button
          onClick={handleComplete}
          disabled={loading}
          className="w-full md:w-auto px-12 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
        >
          {loading ? 'Setting up...' : 'Go to Dashboard'}
        </button>

        <p className="text-sm text-gray-500">
          You can always access the onboarding guide from Settings
        </p>
      </div>

      <div className="mt-12 pt-8 border-t border-gray-200">
        <p className="text-sm text-gray-600 mb-2">Need help getting started?</p>
        <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
          Check out our Quick Start Guide →
        </a>
      </div>
    </div>
  )
}
