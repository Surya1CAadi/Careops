import { useState, useEffect } from 'react'
import { Plus, FileText, Edit, Trash2, Eye, X, GripVertical } from 'lucide-react'
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
  type: 'INTAKE' | 'AGREEMENT' | 'DOCUMENT'
  fields: FormField[]
  isActive: boolean
  createdAt: string
  _count: {
    submissions: number
  }
}

export default function Forms() {
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingForm, setEditingForm] = useState<Form | null>(null)
  const [stats, setStats] = useState({
    totalForms: 0,
    activeForms: 0,
    inactiveForms: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0,
    completedSubmissions: 0
  })

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'INTAKE' as 'INTAKE' | 'AGREEMENT' | 'DOCUMENT',
    isActive: true,
    fields: [] as FormField[]
  })

  useEffect(() => {
    fetchForms()
    fetchStats()
  }, [])

  const fetchForms = async () => {
    try {
      setLoading(true)
      const response = await api.get('/forms')
      setForms(response.data.data)
    } catch (error) {
      console.error('Failed to fetch forms:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/forms/stats')
      setStats(response.data.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleAddForm = () => {
    setEditingForm(null)
    setFormData({
      name: '',
      description: '',
      type: 'INTAKE',
      isActive: true,
      fields: []
    })
    setShowModal(true)
  }

  const handleEditForm = (form: Form) => {
    setEditingForm(form)
    setFormData({
      name: form.name,
      description: form.description || '',
      type: form.type,
      isActive: form.isActive,
      fields: form.fields
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.fields.length === 0) {
      alert('Please add at least one field to the form')
      return
    }

    try {
      if (editingForm) {
        await api.put(`/forms/${editingForm.id}`, formData)
      } else {
        await api.post('/forms', formData)
      }
      setShowModal(false)
      fetchForms()
      fetchStats()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save form')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this form?')) return

    try {
      await api.delete(`/forms/${id}`)
      fetchForms()
      fetchStats()
    } catch (error) {
      alert('Failed to delete form')
    }
  }

  const addField = () => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: 'text',
      label: '',
      required: false
    }
    setFormData({
      ...formData,
      fields: [...formData.fields, newField]
    })
  }

  const updateField = (index: number, updates: Partial<FormField>) => {
    const newFields = [...formData.fields]
    newFields[index] = { ...newFields[index], ...updates }
    setFormData({ ...formData, fields: newFields })
  }

  const removeField = (index: number) => {
    setFormData({
      ...formData,
      fields: formData.fields.filter((_, i) => i !== index)
    })
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'INTAKE':
        return 'bg-blue-100 text-blue-800'
      case 'AGREEMENT':
        return 'bg-purple-100 text-purple-800'
      case 'DOCUMENT':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Forms</h1>
          <p className="text-gray-600 mt-1">Create and manage custom forms</p>
        </div>
        <button
          onClick={handleAddForm}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Form</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Forms</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalForms}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.activeForms}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Inactive</p>
          <p className="text-2xl font-bold text-gray-600 mt-1">{stats.inactiveForms}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Submissions</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.totalSubmissions}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pendingSubmissions}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.completedSubmissions}</p>
        </div>
      </div>

      {/* Forms List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading forms...</div>
        ) : forms.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No forms yet</p>
            <button
              onClick={handleAddForm}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Your First Form
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {forms.map((form) => (
              <div key={form.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{form.name}</h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(form.type)}`}>
                        {form.type}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        form.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {form.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {form.description && (
                      <p className="text-sm text-gray-600 mb-3">{form.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{form.fields.length} fields</span>
                      <span>{form._count.submissions} submissions</span>
                      <span>Created {new Date(form.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditForm(form)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit form"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => window.open(`/forms/${form.id}/submissions`, '_blank')}
                      className="p-2 text-green-600 hover:bg-green-50 rounded"
                      title="View submissions"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(form.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Delete form"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingForm ? 'Edit Form' : 'Create New Form'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Form Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Form Details</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Form Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Client Intake Form"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief description of this form"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Form Type *</label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="INTAKE">Intake</option>
                      <option value="AGREEMENT">Agreement</option>
                      <option value="DOCUMENT">Document</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.isActive ? 'active' : 'inactive'}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Form Builder */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Form Fields</h3>
                  <button
                    type="button"
                    onClick={addField}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Field</span>
                  </button>
                </div>

                {formData.fields.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500">No fields added yet. Click "Add Field" to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.fields.map((field, index) => (
                      <div key={field.id} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-start space-x-3">
                          <GripVertical className="w-5 h-5 text-gray-400 mt-2 cursor-move" />
                          <div className="flex-1 space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Field Type</label>
                                <select
                                  value={field.type}
                                  onChange={(e) => updateField(index, { type: e.target.value as any })}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="text">Text</option>
                                  <option value="email">Email</option>
                                  <option value="phone">Phone</option>
                                  <option value="number">Number</option>
                                  <option value="date">Date</option>
                                  <option value="textarea">Textarea</option>
                                  <option value="select">Select</option>
                                  <option value="checkbox">Checkbox</option>
                                  <option value="radio">Radio</option>
                                </select>
                              </div>
                              <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Label</label>
                                <input
                                  type="text"
                                  value={field.label}
                                  onChange={(e) => updateField(index, { label: e.target.value })}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                  placeholder="Field label"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Placeholder</label>
                                <input
                                  type="text"
                                  value={field.placeholder || ''}
                                  onChange={(e) => updateField(index, { placeholder: e.target.value })}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                  placeholder="Optional placeholder text"
                                />
                              </div>
                              <div className="flex items-center space-x-4 pt-5">
                                <label className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={field.required}
                                    onChange={(e) => updateField(index, { required: e.target.checked })}
                                    className="rounded border-gray-300"
                                  />
                                  <span className="text-sm text-gray-700">Required</span>
                                </label>
                              </div>
                            </div>

                            {(field.type === 'select' || field.type === 'radio') && (
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Options (one per line)
                                </label>
                                <textarea
                                  value={(field.options || []).join('\n')}
                                  onChange={(e) => updateField(index, { 
                                    options: e.target.value.split('\n').filter(o => o.trim())
                                  })}
                                  rows={3}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                                />
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeField(index)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingForm ? 'Update Form' : 'Create Form'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
