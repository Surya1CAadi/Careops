import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import {
  Calendar,
  Users,
  FileText,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare,
  TrendingUp,
} from 'lucide-react'

interface DashboardMetrics {
  bookings: {
    today: any[]
    upcoming: any[]
    completedCount: number
    noShowCount: number
  }
  leads: {
    newInquiries: number
    ongoingConversations: number
    unansweredMessages: number
  }
  forms: {
    pending: number
    overdue: number
    completed: number
  }
  inventory: {
    lowStockItems: any[]
    alertCount: number
  }
  alerts: any[]
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const response = await api.get('/dashboard/metrics')
      return response.data.data as DashboardMetrics
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Today's Bookings"
          value={data?.bookings.today.length || 0}
          icon={Calendar}
          color="blue"
        />
        <MetricCard
          title="New Inquiries"
          value={data?.leads.newInquiries || 0}
          icon={MessageSquare}
          color="green"
        />
        <MetricCard
          title="Pending Forms"
          value={data?.forms.pending || 0}
          icon={FileText}
          color="yellow"
        />
        <MetricCard
          title="Low Stock Items"
          value={data?.inventory.alertCount || 0}
          icon={Package}
          color="red"
        />
      </div>

      {/* Alerts Section */}
      {data && data.alerts.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
              Active Alerts
            </h2>
          </div>
          <div className="space-y-2">
            {data.alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className="flex items-start p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{alert.title}</p>
                  <p className="text-sm text-gray-600">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Bookings */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Today's Schedule</h2>
          {data?.bookings.today.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No bookings today</p>
          ) : (
            <div className="space-y-3">
              {data?.bookings.today.slice(0, 5).map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {booking.contact ? `${booking.contact.firstName} ${booking.contact.lastName}` : 'No contact'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {booking.bookingType?.name || booking.title}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{booking.startTime}</p>
                    <span
                      className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                        booking.status === 'CONFIRMED'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity / Stats */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
          <div className="space-y-4">
            <StatRow
              label="Ongoing Conversations"
              value={data?.leads.ongoingConversations || 0}
              icon={MessageSquare}
            />
            <StatRow
              label="Unanswered Messages"
              value={data?.leads.unansweredMessages || 0}
              icon={Clock}
              highlight={data && data.leads.unansweredMessages > 0}
            />
            <StatRow
              label="Overdue Forms"
              value={data?.forms.overdue || 0}
              icon={AlertTriangle}
              highlight={data && data.forms.overdue > 0}
            />
            <StatRow
              label="Completed Bookings (30d)"
              value={data?.bookings.completedCount || 0}
              icon={CheckCircle}
            />
            <StatRow
              label="No-Shows (30d)"
              value={data?.bookings.noShowCount || 0}
              icon={XCircle}
            />
          </div>
        </div>
      </div>

      {/* Upcoming Bookings */}
      {data && data.bookings.upcoming.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Upcoming Bookings</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium text-gray-600">
                    Date
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">
                    Time
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">
                    Contact
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">
                    Service
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.bookings.upcoming.map((booking) => (
                  <tr key={booking.id} className="border-b last:border-0">
                    <td className="py-3 px-3">
                      {new Date(booking.startTime).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3">{booking.startTime}</td>
                    <td className="py-3 px-3">
                      {booking.contact ? `${booking.contact.firstName} ${booking.contact.lastName}` : 'No contact'}
                    </td>
                    <td className="py-3 px-3">{booking.bookingType?.name || booking.title}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                          booking.status === 'CONFIRMED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string
  value: number
  icon: any
  color: string
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

function StatRow({
  label,
  value,
  icon: Icon,
  highlight = false,
}: {
  label: string
  value: number
  icon: any
  highlight?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg ${
        highlight ? 'bg-yellow-50' : 'bg-gray-50'
      }`}
    >
      <div className="flex items-center">
        <Icon
          className={`w-5 h-5 mr-3 ${highlight ? 'text-yellow-600' : 'text-gray-600'}`}
        />
        <span className={highlight ? 'font-medium' : ''}>{label}</span>
      </div>
      <span className={`font-semibold ${highlight ? 'text-yellow-600' : ''}`}>
        {value}
      </span>
    </div>
  )
}
