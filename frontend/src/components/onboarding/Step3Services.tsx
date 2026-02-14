import { useState } from 'react'
import { Package, Plus, Trash2 } from 'lucide-react'
import api from '../../services/api'

interface Props {
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}

interface Service {
  id: string
  name: string
  description: string
  price: string
}

export default function Step3Services({ onNext, onBack, onSkip }: Props) {
  const [services, setServices] = useState<Service[]>([
    { id: '1', name: '', description: '', price: '' }
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addService = () => {
    setServices([
      ...services,
      { id: Date.now().toString(), name: '', description: '', price: '' }
    ])
  }

  const removeService = (id: string) => {
    if (services.length > 1) {
      setServices (services.filter((s) => s.id !== id))
    }
  }

  const updateService = (id: string, field: keyof Service, value: string) => {
    setServices(
      services.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Filter out empty services
    const validServices = services.filter((s) => s.name && s.price)

    if (validServices.length === 0) {
      setError('Please add at least one service')
      setLoading(false)
      return
    }

    try {
      await api.post('/onboarding/services', { services: validServices })
      onNext()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save services')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Package className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">What services do you offer?</h2>
        <p className="text-gray-600">Add the services or products you provide</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {services.map((service, index) => (
          <div key={service.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Service {index + 1}</h3>
              {services.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeService(service.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  value={service.name}
                  onChange={(e) => updateService(service.id, 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Haircut"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={service.price}
                    onChange={(e) => updateService(service.id, 'price', e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={service.description}
                onChange={(e) => updateService(service.id, 'description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your service..."
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addService}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Another Service</span>
        </button>

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
