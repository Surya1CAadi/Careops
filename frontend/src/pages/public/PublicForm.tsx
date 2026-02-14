import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import api from '../../services/api'

interface FormField {
  id: string
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'number' | 'date'
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
}

interface Form {
  id: string
  name: string
  description?: string
  type: string
  fields: FormField[]
  isActive: boolean
}

export default function PublicForm() {
  const { formId } = useParams()
  const [form, setForm] = useState<Form | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({})

  // For demo purposes, we'll use a temporary contact ID
  // In a real scenario, you'd collect contact info or have them login
  const [contactInfo, setContactInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  })
  const [showContactForm, setShowContactForm] = useState(true)

  useEffect(() => {
    if (formId) {
      fetchForm()
    }
  }, [formId])

  const fetchForm = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/forms/public/${formId}`)
      setForm(response.data.data)
      if (!response.data.data.isActive) {
        setError('This form is no longer accepting submissions.')
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Form not found')
    } finally {
      setLoading(false)
    }
  }

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (contactInfo.firstName && contactInfo.lastName && contactInfo.email) {
      setShowContactForm(false)
    }
  }

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData({
      ...formData,
      [fieldId]: value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // In a real scenario, you would first create/find the contact
      // For now, we'll mock a contact ID
      const contactPayload = {
        firstName: contactInfo.firstName,
        lastName: contactInfo.lastName,
        email: contactInfo.email,
        phone: contactInfo.phone,
        source: 'FORM'
      }

      // Create contact first
      const contactResponse = await api.post('/contacts', contactPayload)
      const contactId = contactResponse.data.data.id

      // Submit form
      await api.post(`/forms/${formId}/submit`, {
        contactId,
        data: formData
      })

      setSubmitted(true)
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to submit form')
    } finally {
      setSubmitting(false)
    }
  }

  const renderField = (field: FormField) => {
    const commonProps = {
      required: field.required,
      className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    }

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'number':
        return (
          <input
            type={field.type}
            placeholder={field.placeholder}
            value={formData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            {...commonProps}
          />
        )
      
      case 'date':
        return (
          <input
            type="date"
            value={formData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            {...commonProps}
          />
        )
      
      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder}
            value={formData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            rows={4}
            {...commonProps}
          />
        )
      
      case 'select':
        return (
          <select
            value={formData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            {...commonProps}
          >
            <option value="">Select an option...</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        )
      
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData[field.id] || false}
              onChange={(e) => handleFieldChange(field.id, e.target.checked)}
              className="rounded border-gray-300"
            />
            <label className="text-sm text-gray-700">{field.label}</label>
          </div>
        )
      
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={formData[field.id] === option}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className="border-gray-300"
                />
                <label className="text-sm text-gray-700">{option}</label>
              </div>
            ))}
          </div>
        )
      
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="card max-w-2xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card max-w-2xl mx-auto">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 text-center">{error}</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="card max-w-2xl mx-auto">
        <div className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-gray-600 text-center">
            Your form has been submitted successfully. We'll be in touch soon.
          </p>
        </div>
      </div>
    )
  }

  if (showContactForm) {
    return (
      <div className="card max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{form?.name}</h1>
        {form?.description && (
          <p className="text-gray-600 mb-6">{form.description}</p>
        )}

        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-xl font-semibold mb-4">Your Information</h2>
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={contactInfo.firstName}
                  onChange={(e) => setContactInfo({ ...contactInfo, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={contactInfo.lastName}
                  onChange={(e) => setContactInfo({ ...contactInfo, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={contactInfo.email}
                onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={contactInfo.phone}
                onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Continue to Form
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="card max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{form?.name}</h1>
      {form?.description && (
        <p className="text-gray-600 mb-6">{form.description}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {form?.fields.map((field) => (
          <div key={field.id}>
            {field.type !== 'checkbox' && (
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
            )}
            {renderField(field)}
          </div>
        ))}

        <div className="flex items-center justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => setShowContactForm(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{submitting ? 'Submitting...' : 'Submit Form'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
