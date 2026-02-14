import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useEffect } from 'react'

// Layouts
import AuthLayout from './layouts/AuthLayout'
import DashboardLayout from './layouts/DashboardLayout'
import PublicLayout from './layouts/PublicLayout'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Dashboard Pages
import Dashboard from './pages/dashboard/Dashboard'
import Onboarding from './pages/Onboarding'
import Inbox from './pages/dashboard/Inbox'
import Bookings from './pages/dashboard/Bookings'
import Contacts from './pages/dashboard/Contacts'
import Forms from './pages/dashboard/Forms'
import FormSubmissions from './pages/dashboard/FormSubmissions'
import Inventory from './pages/dashboard/Inventory'
import Settings from './pages/dashboard/Settings'

// Public Pages
import PublicBooking from './pages/public/PublicBooking'
import PublicContact from './pages/public/PublicContact'
import PublicForm from './pages/public/PublicForm'

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

// Onboarding Check Component
const OnboardingCheck = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore()
  
  if (user?.workspace && (user.workspace.onboardingStep ?? 0) < 8 && user?.role === 'OWNER') {
    return <Navigate to="/onboarding" replace />
  }
  
  return <>{children}</>
}

function App() {
  const { initializeAuth } = useAuthStore()

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Onboarding Route (standalone, no layout) */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />

        {/* Dashboard Routes */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/dashboard"
            element={
              <OnboardingCheck>
                <Dashboard />
              </OnboardingCheck>
            }
          />
          <Route
            path="/inbox"
            element={
              <OnboardingCheck>
                <Inbox />
              </OnboardingCheck>
            }
          />
          <Route
            path="/bookings"
            element={
              <OnboardingCheck>
                <Bookings />
              </OnboardingCheck>
            }
          />
          <Route
            path="/contacts"
            element={
              <OnboardingCheck>
                <Contacts />
              </OnboardingCheck>
            }
          />
          <Route
            path="/forms"
            element={
              <OnboardingCheck>
                <Forms />
              </OnboardingCheck>
            }
          />
          <Route
            path="/forms/:formId/submissions"
            element={
              <OnboardingCheck>
                <FormSubmissions />
              </OnboardingCheck>
            }
          />
          <Route
            path="/inventory"
            element={
              <OnboardingCheck>
                <Inventory />
              </OnboardingCheck>
            }
          />
          <Route
            path="/settings"
            element={
              <OnboardingCheck>
                <Settings />
              </OnboardingCheck>
            }
          />
        </Route>

        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/book/:workspaceId" element={<PublicBooking />} />
          <Route path="/contact/:workspaceId" element={<PublicContact />} />
          <Route path="/form/:formId" element={<PublicForm />} />
        </Route>

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
