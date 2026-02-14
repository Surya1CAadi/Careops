import { useState } from 'react'
import { Building2 } from 'lucide-react'
import api from '../../services/api'

interface Props {
  onNext: () => void
  onSkip: () => void
}

const INDUSTRIES = [
  'Healthcare',
  'Home Services',
  'Professional Services',
  'Retail',
  'Hospitality',
  'Construction',
  'Automotive',
  'Beauty & Wellness',
  'Education',
  'Other'
]

const TEAM_SIZES = ['Just me', '2-5', '6-10', '11-25', '26-50', '50+']

export default function Step1WorkspaceDetails({ onNext, onSkip }: Props) {
  const [formData, setFormData] = useState({
    businessName: '',
    industry: '',
    teamSize: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.post('/onboarding/workspace-details', formData)
      onNext()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save workspace details')
    } finally {
      setLoading(false)
    }
  }

  const isValid = formData.businessName && formData.industry && formData.teamSize

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Building2 className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Tell us about your business</h2>
        <p className="text-gray-600">Help us customize your experience</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Name *
          </label>
          <input
            type="text"
            value={formData.businessName}
            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Acme Services"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Industry *
          </label>
          <select
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select your industry</option>
            {INDUSTRIES.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Team Size *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {TEAM_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setFormData({ ...formData, teamSize: size })}
                className={`px-4 py-3 border-2 rounded-lg text-sm font-medium transition-all ${
                  formData.teamSize === size
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone
          </label>
          <input
            type="text"
            value={formData.timezone}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
            readOnly
          />
        </div>

        <div className="flex items-center justify-between pt-6">
          <button
            type="button"
            onClick={onSkip}
            className="px-6 py-2 text-gray-600 hover:text-gray-800"
          >
            Skip for now
          </button>
          <button
            type="submit"
            disabled={!isValid || loading}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  )
}
