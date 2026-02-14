import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Eye, User, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import api from '../../services/api'

interface Contact {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
}

interface Booking {
  id: string
  title: string
  startTime: string
}

interface Submission {
  id: string
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE'
  data: Record<string, any>
  submittedAt?: string
  dueDate?: string
  createdAt: string
  contact: Contact
  booking?: Booking
}

interface Form {
  id: string
  name: string
  description?: string
  type: string
  fields: Array<{
    id: string
    type: string
    label: string
    required: boolean
  }>
}

export default function FormSubmissions() {
  const { formId } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState<Form | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    if (formId) {
      fetchForm()
      fetchSubmissions()
    }
  }, [formId, filterStatus])

  const fetchForm = async () => {
    try {
      const response = await api.get(`/forms/${formId}`)
      setForm(response.data.data)
    } catch (error) {
      console.error('Failed to fetch form:', error)
    }
  }

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      const url = filterStatus === 'all' 
        ? `/forms/${formId}/submissions`
        : `/forms/${formId}/submissions?status=${filterStatus}`
      const response = await api.get(url)
      setSubmissions(response.data.data)
    } catch (error) {
      console.error('Failed to fetch submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (!form || submissions.length === 0) return

    // Create CSV headers
    const headers = ['Submission ID', 'Contact', 'Email', 'Status', 'Submitted At']
    form.fields.forEach(field => headers.push(field.label))

    // Create CSV rows
    const rows = submissions.map(sub => {
      const row = [
        sub.id,
        `${sub.contact.firstName} ${sub.contact.lastName}`,
        sub.contact.email || '',
        sub.status,
        sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : 'Not submitted'
      ]
      
      form.fields.forEach(field => {
        row.push(sub.data?.[field.id] || '')
      })
      
      return row
    })

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${form.name}-submissions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'OVERDUE':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4" />
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />
      case 'OVERDUE':
        return <AlertCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/forms')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{form?.name || 'Form Submissions'}</h1>
            <p className="text-gray-600 mt-1">{submissions.length} total submissions</p>
          </div>
        </div>
        <button
          onClick={exportToCSV}
          disabled={submissions.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700">Filter by status:</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Submissions</option>
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Completed</option>
          <option value="OVERDUE">Overdue</option>
        </select>
      </div>

      {/* Submissions List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading submissions...</div>
        ) : submissions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No submissions found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="p-6 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedSubmission(submission)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold text-gray-900">
                          {submission.contact.firstName} {submission.contact.lastName}
                        </span>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center space-x-1 ${getStatusColor(submission.status)}`}>
                        {getStatusIcon(submission.status)}
                        <span>{submission.status}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      {submission.contact.email && <span>{submission.contact.email}</span>}
                      {submission.contact.phone && <span>{submission.contact.phone}</span>}
                      {submission.submittedAt && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Submitted {new Date(submission.submittedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Submission Details</h2>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Contact Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p><span className="font-medium">Name:</span> {selectedSubmission.contact.firstName} {selectedSubmission.contact.lastName}</p>
                  {selectedSubmission.contact.email && (
                    <p><span className="font-medium">Email:</span> {selectedSubmission.contact.email}</p>
                  )}
                  {selectedSubmission.contact.phone && (
                    <p><span className="font-medium">Phone:</span> {selectedSubmission.contact.phone}</p>
                  )}
                </div>
              </div>

              {/* Submission Status */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Status</h3>
                <span className={`inline-flex items-center space-x-1 px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedSubmission.status)}`}>
                  {getStatusIcon(selectedSubmission.status)}
                  <span>{selectedSubmission.status}</span>
                </span>
              </div>

              {/* Submission Data */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Form Responses</h3>
                <div className="space-y-4">
                  {form?.fields.map((field) => (
                    <div key={field.id} className="border-b border-gray-200 pb-3 last:border-0">
                      <p className="text-sm font-medium text-gray-700 mb-1">{field.label}</p>
                      <p className="text-gray-900">
                        {selectedSubmission.data?.[field.id] || <span className="text-gray-400 italic">No response</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timestamps */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Timestamps</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <p><span className="font-medium">Created:</span> {new Date(selectedSubmission.createdAt).toLocaleString()}</p>
                  {selectedSubmission.submittedAt && (
                    <p><span className="font-medium">Submitted:</span> {new Date(selectedSubmission.submittedAt).toLocaleString()}</p>
                  )}
                  {selectedSubmission.dueDate && (
                    <p><span className="font-medium">Due Date:</span> {new Date(selectedSubmission.dueDate).toLocaleString()}</p>
                  )}
                </div>
              </div>

              {/* Booking Info if available */}
              {selectedSubmission.booking && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Associated Booking</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium">{selectedSubmission.booking.title}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(selectedSubmission.booking.startTime).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
