import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import Step1WorkspaceDetails from '../components/onboarding/Step1WorkspaceDetails'
import Step2BusinessHours from '../components/onboarding/Step2BusinessHours'
import Step3Services from '../components/onboarding/Step3Services'
import Step4Notifications from '../components/onboarding/Step4Notifications'
import Step5Automations from '../components/onboarding/Step5Automations'
import Step6TeamInvites from '../components/onboarding/Step6TeamInvites'
import Step7Integrations from '../components/onboarding/Step7Integrations'
import Step8Complete from '../components/onboarding/Step8Complete'
import api from '../services/api'

const STEPS = [
  { id: 1, title: 'Workspace Details', description: 'Tell us about your business' },
  { id: 2, title: 'Business Hours', description: 'When are you available?' },
  { id: 3, title: 'Services', description: 'What do you offer?' },
  { id: 4, title: 'Notifications', description: 'Stay informed' },
  { id: 5, title: 'Automations', description: 'Save time with automation' },
  { id: 6, title: 'Team Members', description: 'Invite your team' },
  { id: 7, title: 'Integrations', description: 'Connect your tools' },
  { id: 8, title: 'All Set!', description: 'Your workspace is ready' }
]

export default function Onboarding() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkOnboardingStatus()
  }, [])

  const checkOnboardingStatus = async () => {
    try {
      const response = await api.get('/onboarding/status')
      const { currentStep: savedStep, isCompleted } = response.data.data

      if (isCompleted) {
        navigate('/dashboard')
        return
      }

      setCurrentStep(savedStep || 1)
    } catch (error) {
      console.error('Failed to check onboarding status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (currentStep < 8) {
      setCurrentStep(currentStep + 1)
    } else {
      navigate('/dashboard')
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    handleNext()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Welcome to CareOps</h1>
            <span className="text-sm text-gray-600">Step {currentStep} of 8</span>
          </div>
          
          {/* Steps indicator */}
          <div className="flex items-center space-x-2">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex-1">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      step.id < currentStep
                        ? 'bg-green-500'
                        : step.id === currentStep
                        ? 'bg-blue-600'
                        : 'bg-gray-300'
                    }`}
                  />
                </div>
                {index < STEPS.length - 1 && <div className="w-2" />}
              </div>
            ))}
          </div>

          {/* Step labels */}
          <div className="mt-4 grid grid-cols-8 gap-2">
            {STEPS.map((step) => (
              <div key={step.id} className="text-center">
                <div className="flex items-center justify-center mb-1">
                  {step.id < currentStep ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <div
                      className={`w-5 h-5 rounded-full border-2 ${
                        step.id === currentStep
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-gray-300'
                      }`}
                    />
                  )}
                </div>
                <p
                  className={`text-xs ${
                    step.id === currentStep ? 'text-blue-600 font-semibold' : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {currentStep === 1 && <Step1WorkspaceDetails onNext={handleNext} onSkip={handleSkip} />}
          {currentStep === 2 && <Step2BusinessHours onNext={handleNext} onBack={handleBack} onSkip={handleSkip} />}
          {currentStep === 3 && <Step3Services onNext={handleNext} onBack={handleBack} onSkip={handleSkip} />}
          {currentStep === 4 && <Step4Notifications onNext={handleNext} onBack={handleBack} onSkip={handleSkip} />}
          {currentStep === 5 && <Step5Automations onNext={handleNext} onBack={handleBack} onSkip={handleSkip} />}
          {currentStep === 6 && <Step6TeamInvites onNext={handleNext} onBack={handleBack} onSkip={handleSkip} />}
          {currentStep === 7 && <Step7Integrations onNext={handleNext} onBack={handleBack} onSkip={handleSkip} />}
          {currentStep === 8 && <Step8Complete onNext={handleNext} />}
        </div>
      </div>
    </div>
  )
}
