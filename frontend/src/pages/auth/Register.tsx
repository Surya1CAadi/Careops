import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    workspaceName: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    contactEmail: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const { register } = useAuthStore()
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      const { confirmPassword, ...registerData } = formData
      await register(registerData)
      toast.success('Registration successful!')
      navigate('/onboarding')
    } catch (error: any) {
      toast.error(error.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-center mb-6">Create Your Workspace</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">First Name</label>
            <input
              type="text"
              name="firstName"
              className="input"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="label">Last Name</label>
            <input
              type="text"
              name="lastName"
              className="input"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div>
          <label className="label">Email</label>
          <input
            type="email"
            name="email"
            className="input"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              name="password"
              className="input"
              value={formData.password}
              onChange={handleChange}
              minLength={8}
              required
            />
          </div>
          <div>
            <label className="label">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              className="input"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="border-t pt-4 mt-4">
          <h3 className="font-semibold mb-3">Workspace Details</h3>
          
          <div className="space-y-4">
            <div>
              <label className="label">Business Name</label>
              <input
                type="text"
                name="workspaceName"
                className="input"
                value={formData.workspaceName}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="label">Contact Email</label>
              <input
                type="email"
                name="contactEmail"
                className="input"
                value={formData.contactEmail}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="label">Timezone</label>
              <input
                type="text"
                name="timezone"
                className="input"
                value={formData.timezone}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary w-full"
        >
          {isLoading ? 'Creating...' : 'Create Workspace'}
        </button>
      </form>

      <p className="text-center mt-4 text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-600 hover:underline">
          Login
        </Link>
      </p>
    </div>
  )
}
