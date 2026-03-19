'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { supabase } from '@/lib/supabase';
import { Users, MessageSquare, DollarSign, AlertCircle, RefreshCw, BarChart3, AlertTriangle, TrendingUp, Calendar, CheckCircle, Clock } from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuthStore();
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) router.push('/login');
  }, [user, authLoading, router]);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await fetch('/api/admin/dashboard');
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setStats(data);
      setLastUpdated(new Date());
      if (data.recentBookings) setRecentBookings(data.recentBookings);
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const ur = await fetch('/api/admin/users', { headers: { Authorization: 'Bearer ' + session.access_token } });
          if (ur.ok) { const u = await ur.json(); setRecentUsers(u.slice(0, 6)); }
        }
      }
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (authLoading || !user || user.role !== 'admin') return;
    fetchStats();
    const t = setInterval(fetchStats, 60000);
    return () => clearInterval(t);
  }, [user, authLoading, fetchStats]);

  if (authLoading || (!user && !authLoading)) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"/></div>;
  }
  if (!user || user.role !== 'admin') return null;

  const navItems = [
    { label: 'Conversations', icon: MessageSquare, path: '/admin/conversations', color: 'from-purple-600 to-purple-700' },
    { label: 'Payments', icon: DollarSign, path: '/admin/payments', color: 'from-green-600 to-green-700' },
    { label: 'Users', icon: Users, path: '/admin/users', color: 'from-blue-600 to-blue-700' },
    { label: 'Disputes', icon: AlertTriangle, path: '/admin/disputes', color: 'from-red-600 to-red-700' },
    { label: 'Verification', icon: CheckCircle, path: '/admin/verification', color: 'from-teal-600 to-teal-700' },
    { label: 'Financials', icon: TrendingUp, path: '/admin/financials', color: 'from-orange-600 to-orange-700' },
  ];

  const statusColor = (s) => s==='completed'?'bg-green-100 text-green-700':s==='accepted'?'bg-blue-100 text-blue-700':s==='pending'?'bg-yellow-100 text-yellow-700':'bg-gray-100 text-gray-600';
  const roleCls = (r) => r==='braider'?'bg-blue-100 text-blue-700':r==='admin'?'bg-purple-100 text-purple-700':'bg-green-100 text-green-700';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {lastUpdated ? 'Updated ' + lastUpdated.toLocaleTimeString() : 'Loading...'}
            </p>
          </div>
          <button onClick={fetchStats} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            <RefreshCw className="w-5 h-5 text-gray-600"/>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0"/>
            <p className="text-red-700 text-sm">{error}</p>
            <button onClick={fetchStats} className="ml-auto text-red-600 text-sm font-semibold hover:underline">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"/>
          </div>
        ) : stats ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Users</p>
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600"/>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.totalBraiders} braiders · {stats.totalCustomers} customers</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bookings</p>
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-purple-600"/>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Revenue</p>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-green-600"/>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">${stats.totalRevenue?.toFixed(0) ?? 0}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.pendingPayments} pending</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Conversations</p>
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-orange-600"/>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.totalConversations}</p>
                <p className="text-xs text-green-600 mt-1">{stats.activeConversations} active</p>
              </div>
            </div>

            {/* Quick Nav */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {navItems.map(item => (
                <button key={item.path} onClick={() => router.push(item.path)}
                  className={`bg-gradient-to-br ${item.color} rounded-xl p-4 text-white hover:opacity-90 hover:scale-105 transition-all shadow-sm flex flex-col items-center gap-2`}>
                  <item.icon className="w-5 h-5"/>
                  <span className="text-xs font-semibold">{item.label}</span>
                </button>
              ))}
            </div>

            {/* User distribution bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">User Distribution</h3>
              <div className="space-y-3">
                {[
                  { label: 'Braiders', count: stats.totalBraiders, color: 'bg-blue-500' },
                  { label: 'Customers', count: stats.totalCustomers, color: 'bg-green-500' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-20">{item.label}</span>
                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full transition-all`}
                        style={{ width: stats.totalUsers > 0 ? (item.count / stats.totalUsers * 100) + '%' : '0%' }}/>
                    </div>
                    <span className="text-xs font-bold text-gray-900 w-8 text-right">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent data grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Bookings */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-600"/> Recent Bookings
                  </h3>
                  <button onClick={() => router.push('/admin/conversations')} className="text-xs text-primary-600 hover:underline">View all</button>
                </div>
                {recentBookings.length === 0
                  ? <p className="text-xs text-gray-400 text-center py-6">No bookings yet</p>
                  : <div className="space-y-2">
                      {recentBookings.map(b => (
                        <div key={b.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{b.customer_name || 'Customer'}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3"/>
                              {b.appointment_date ? new Date(b.appointment_date).toLocaleDateString() : '—'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(b.status)}`}>{b.status}</span>
                            <span className="text-xs font-bold text-gray-900">${b.total_amount?.toFixed(0) ?? '—'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                }
              </div>

              {/* Recent Users */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600"/> Recent Sign-ups
                  </h3>
                  <button onClick={() => router.push('/admin/users')} className="text-xs text-primary-600 hover:underline">View all</button>
                </div>
                {recentUsers.length === 0
                  ? <p className="text-xs text-gray-400 text-center py-6">No users yet</p>
                  : <div className="space-y-2">
                      {recentUsers.map(u => (
                        <div key={u.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{u.full_name || 'Unknown'}</p>
                            <p className="text-xs text-gray-400 truncate">{u.email}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleCls(u.role)}`}>{u.role}</span>
                        </div>
                      ))}
                    </div>
                }
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
