import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Circle } from 'lucide-react'
import toast from 'react-hot-toast'

const ONBOARDING_STEPS = [
  { step: 1, title: 'Create Workspace', description: 'Basic business information' },
  { step: 2, title: 'Email & SMS Setup', description: 'Connect communication channels' },
  { step: 3, title: 'Contact Form', description: 'Create lead capture form' },
  { step: 4, title: 'Booking Setup', description: 'Configure services and availability' },
  { step: 5, title: 'Forms Setup', description: 'Upload intake forms and documents' },
  { step: 6, title: 'Inventory Setup', description: 'Add resources and stock items' },
  { step: 7, title: 'Add Staff', description: 'Invite team members' },
  { step: 8, title: 'Activate', description: 'Go live with your workspace' },
]

export default function Onboarding() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const currentStep = user?.workspace?.onboardingStep || 0

  if (currentStep >= 8) {
    navigate('/')
    return null
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <h1 className="text-3xl font-bold mb-2">Setup Your Workspace</h1>
        <p className="text-gray-600 mb-8">
          Complete these steps to activate your CareOps platform
        </p>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-gray-600">
              {currentStep} of {ONBOARDING_STEPS.length} completed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / ONBOARDING_STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {ONBOARDING_STEPS.map((step) => (
            <div
              key={step.step}
              className={`flex items-start p-4 rounded-lg border-2 transition-colors ${
                step.step <= currentStep
                  ? 'border-green-500 bg-green-50'
                  : step.step === currentStep + 1
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="mr-4 mt-1">
                {step.step <= currentStep ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </div>
              {step.step === currentStep + 1 && (
                <button
                  onClick={() => toast.info('Feature coming soon!')}
                  className="btn btn-primary"
                >
                  Start
                </button>
              )}
            </div>
          ))}
        </div>

        {currentStep === 8 && (
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/')}
              className="btn btn-primary px-8 py-3 text-lg"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
