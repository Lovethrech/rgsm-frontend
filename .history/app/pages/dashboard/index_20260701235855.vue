<script setup>
useHead({
    title: "Dashboard | RGSM"
})
const supabase = useSupabaseClient()
const router = useRouter()
const user = useSupabaseUser()

const sidebarOpen = ref(false)
const sidebarCollapsed = ref(false)
const activeSection = ref('dashboard')
const loading = ref(true)
const profile = ref(null)
const authError = ref('')

const detectionEvents = ref([])
const accessLogs = ref([])
const alerts = ref([])
const geofences = ref([])
const readers = ref([])
const students = ref([])
const hostels = ref([])

const systemSettings = ref([])
const lockdownLoading = ref(false)
const lockdownReason = ref('Campus-wide emergency lockdown activated by security administrator.')

const settingsLoading = ref(false)
const systemConfigForm = ref({
  system_name: 'RGSM Campus Security',
  security_contact: 'security@demo-university.edu',
  alert_retention_days: 30,
  default_simulation_students: 20,
  default_simulation_duration: 60,
  auto_generate_alerts: true
})

const systemConfiguration = computed(() => {
  const setting = systemSettings.value.find(
    (item) => item.setting_key === 'system_configuration'
  )

  return setting?.setting_value || systemConfigForm.value
})

const emergencyLockdown = computed(() => {
  const setting = systemSettings.value.find(
    (item) => item.setting_key === 'emergency_lockdown'
  )

  return setting?.setting_value || {
    enabled: false,
    reason: '',
    activated_by: '',
    activated_at: null
  }
})

const profiles = ref([])
const usersLoading = ref(false)
const userActionLoading = ref(false)

const pendingUsers = computed(() =>
  profiles.value.filter((user) => user.account_status === 'pending')
)

const approvedUsers = computed(() =>
  profiles.value.filter((user) => user.account_status === 'approved')
)

const suspendedUsers = computed(() =>
  profiles.value.filter((user) => user.account_status === 'suspended')
)

const adminRoles = [
  {
    label: 'Global Admin',
    value: 'global_admin'
  },
  {
    label: 'University Admin',
    value: 'university_admin'
  },
  {
    label: 'Bilateral Admin',
    value: 'bilateral_admin'
  },
  {
    label: 'Unilateral Admin',
    value: 'unilateral_admin'
  }
]


const simulationStudents = ref(20)
const simulationDuration = ref(60)
const simulationScenario = ref('mixed')
const simulationLoading = ref(false)
const simulationStatus = ref(null)
const simulationMessage = ref('')

const simulationScenarios = [
  {
    label: 'Mixed Scenario',
    value: 'mixed',
    description: 'Normal movement, hostel activity, restricted zones, and unknown tags.'
  },
  {
    label: 'Normal Movement',
    value: 'normal',
    description: 'Mostly valid RFID scans across campus and hostel zones.'
  },
  {
    label: 'Violations',
    value: 'violations',
    description: 'Higher rate of denied access and alert-triggering events.'
  },
  {
    label: 'Hostel Movement',
    value: 'hostel',
    description: 'Hostel-based scans for gender and assigned-hostel checks.'
  },
  {
    label: 'Restricted Zones',
    value: 'restricted',
    description: 'Attempts around labs, admin block, and server room.'
  },
  {
    label: 'Unknown Tags',
    value: 'unknown',
    description: 'Unknown or suspicious RFID tags scanned by valid readers.'
  }
]

// API FUNCTIONS
const config = useRuntimeConfig()
const backendBaseUrl = config.public.backendUrl

const getSimulationStatus = async () => {
  try {
    const response = await $fetch(`${backendBaseUrl}/api/simulation/status`)
    simulationStatus.value = response
  } catch (error) {
    simulationMessage.value = 'Could not fetch simulation status. Make sure the backend is running.'
  }
}

const startSimulation = async () => {
  simulationLoading.value = true
  simulationMessage.value = ''

  try {
    const response = await $fetch(`${backendBaseUrl}/api/simulation/start`, {
      method: 'POST',
      query: {
        num_students: simulationStudents.value,
        duration: simulationDuration.value,
        scenario: simulationScenario.value
      }
    })

    simulationStatus.value = {
      is_running: true
    }

    simulationMessage.value =
      response.message ||
      `Simulation started: ${simulationScenario.value}, ${simulationStudents.value} students, ${simulationDuration.value}s.`
  } catch (error) {
    simulationMessage.value = 'Failed to start simulation. Confirm FastAPI is running on port 8000.'
  } finally {
    simulationLoading.value = false
  }
}

const stopSimulation = async () => {
  simulationLoading.value = true
  simulationMessage.value = ''

  try {
    const response = await $fetch(`${backendBaseUrl}/api/simulation/stop`, {
      method: 'POST'
    })

    simulationStatus.value = {
      is_running: false
    }

    simulationMessage.value = response.message || 'Simulation stopped.'
  } catch (error) {
    simulationMessage.value = 'Failed to stop simulation.'
  } finally {
    simulationLoading.value = false
  }
}


const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '▦' },
    { id: 'live-geofence', label: 'Live Geofence', icon: '◎' },
    { id: 'events', label: 'RFID Events', icon: '≋' },
    { id: 'alerts', label: 'Alerts', icon: '!' },
    { id: 'students', label: 'Students', icon: '♙' },
    { id: 'readers', label: 'RFID Readers', icon: '▣' },
    { id: 'geofences', label: 'Geofence Zones', icon: '⬡' },
    { id: 'hostels', label: 'Hostels', icon: '⌂' },
    { id: 'simulation', label: 'Simulation', icon: '⚙' },
    { id: 'reports', label: 'Reports', icon: '▤' },
    { id: 'emergency', label: 'Emergency', key: 'emergency', icon: '⌁' },
    { id: 'users', label: 'Users & Roles', key: 'users', icon: '◉' },
    { id: 'settings', label: 'Settings', icon: '☷' }
]

const sectionTitle = computed(() => {
  return navItems.find((item) => item.id === activeSection.value)?.label || 'Dashboard'
})

const activeAlerts = computed(() =>
  alerts.value.filter((alert) =>
    ['open', 'acknowledged'].includes(alert.status)
  )
)

const resolvedAlerts = computed(() =>
  alerts.value.filter((alert) => alert.status === 'resolved')
)

const criticalAlerts = computed(() => {
  return alerts.value.filter((alert) => alert.severity === 'critical' && alert.status !== 'resolved')
})

const deniedLogs = computed(() => {
  return accessLogs.value.filter((log) => log.decision === 'denied' || log.decision === 'alert')
})

const allowedLogs = computed(() => {
  return accessLogs.value.filter((log) => log.decision === 'allowed')
})

const recentEvents = computed(() => {
  return detectionEvents.value.slice(0, 8)
})

const geofenceOccupancy = computed(() => {
  const countMap = {}

  accessLogs.value.forEach((log) => {
    const zoneId = log.geofence_id || 'unknown'
    if (!countMap[zoneId]) {
      countMap[zoneId] = 0
    }

    if (log.decision === 'allowed') {
      countMap[zoneId] += 1
    }
  })

  return geofences.value.map((zone) => ({
    ...zone,
    occupancy: countMap[zone.id] || 0
  }))
})

const totalEvents = computed(() => detectionEvents.value.length)

const totalAccessLogs = computed(() => accessLogs.value.length)

const totalAlerts = computed(() => alerts.value.length)

const openAlerts = computed(() =>
  alerts.value.filter((alert) => alert.status === 'open')
)

const acknowledgedAlerts = computed(() =>
  alerts.value.filter((alert) => alert.status === 'acknowledged')
)

const resolvedAlertCount = computed(() =>
  alerts.value.filter((alert) => alert.status === 'resolved').length
)

const accessDecisionReport = computed(() => {
  const allowed = accessLogs.value.filter((log) => log.decision === 'allowed').length
  const denied = accessLogs.value.filter((log) => log.decision === 'denied').length
  const alert = accessLogs.value.filter((log) => log.decision === 'alert').length
  const total = accessLogs.value.length || 1

  return {
    allowed,
    denied,
    alert,
    allowedRate: Math.round((allowed / total) * 100),
    deniedRate: Math.round(((denied + alert) / total) * 100)
  }
})

const alertSeverityReport = computed(() => {
  return {
    critical: alerts.value.filter((alert) => alert.severity === 'critical').length,
    high: alerts.value.filter((alert) => alert.severity === 'high').length,
    medium: alerts.value.filter((alert) => alert.severity === 'medium').length,
    low: alerts.value.filter((alert) => alert.severity === 'low').length
  }
})

const formatTime = (dateValue) => {
  if (!dateValue) return 'N/A'

  return new Date(dateValue).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const formatDate = (dateValue) => {
  if (!dateValue) return 'N/A'

  return new Date(dateValue).toLocaleString()
}

const closeMobileSidebar = () => {
  sidebarOpen.value = false
}

const setSection = (section) => {
  activeSection.value = section
  closeMobileSidebar()
}

const logout = async () => {
  await supabase.auth.signOut()
  router.push('/')
}

const loadProfile = async () => {
  authError.value = ''

  const {
    data: { user: authUser },
    error: userError
  } = await supabase.auth.getUser()

  if (userError || !authUser) {
    authError.value = 'You are not logged in. Please login again.'
    loading.value = false
    return
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, account_status, organization_id, hostel_id')
    .eq('id', authUser.id)
    .single()

  if (error) {
    authError.value = error.message
    loading.value = false
    return
  }

  if (!data) {
    authError.value = 'Profile record was not found for this user.'
    loading.value = false
    return
  }

  if (data.account_status !== 'approved') {
    authError.value = 'Your account is not approved yet. Please contact the system administrator.'
    loading.value = false
    return
  }

  profile.value = data
}

const loadDashboardData = async () => {
  const [
    detectionEventsResponse,
    accessLogsResponse,
    alertsResponse,
    geofencesResponse,
    readersResponse,
    studentsResponse,
    hostelsResponse
  ] = await Promise.all([
    supabase
      .from('detection_events')
      .select('*')
      .order('occurred_at', { ascending: false })
      .limit(30),

    supabase
      .from('access_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30),

    supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30),

    supabase
      .from('geofence_zones')
      .select('*')
      .order('created_at', { ascending: false }),

    supabase
      .from('rfid_readers')
      .select('*')
      .order('created_at', { ascending: false }),

    supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('hostels')
      .select('*')
      .order('created_at', { ascending: false })
  ]
  
  if (!detectionEventsResponse.error) {
    detectionEvents.value = detectionEventsResponse.data || []
  }


  if (!accessLogsResponse.error) {
    accessLogs.value = accessLogsResponse.data || []
  }

  if (!alertsResponse.error) {
    alerts.value = alertsResponse.data || []
  }

  if (!geofencesResponse.error) {
    geofences.value = geofencesResponse.data || []
  }

  if (!readersResponse.error) {
    readers.value = readersResponse.data || []
  }

  if (!studentsResponse.error) {
    students.value = studentsResponse.data || []
  }
}

const downloadCsv = (filename, rows) => {
  if (!rows.length) {
    authError.value = 'No data available to export.'
    return
  }

  const headers = Object.keys(rows[0])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header] ?? ''
          return `"${String(value).replaceAll('"', '""')}"`
        })
        .join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], {
    type: 'text/csv;charset=utf-8;'
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

const exportAlertsReport = () => {
  const rows = alerts.value.map((alert) => ({
    id: alert.id,
    alert_type: alert.alert_type,
    severity: alert.severity,
    status: alert.status,
    message: alert.message,
    created_at: alert.created_at,
    updated_at: alert.updated_at
  }))

  downloadCsv('rgsm-alerts-report.csv', rows)
}

const exportAccessLogsReport = () => {
  const rows = accessLogs.value.map((log) => ({
    id: log.id,
    decision: log.decision,
    reason: log.reason,
    student_id: log.student_id,
    reader_id: log.reader_id,
    geofence_id: log.geofence_id,
    created_at: log.created_at
  }))

  downloadCsv('rgsm-access-logs-report.csv', rows)
}

const exportEventsReport = () => {
  const rows = detectionEvents.value.map((event) => ({
    id: event.id,
    tag_uid: event.tag_uid,
    reader_id: event.reader_id,
    event_type: event.event_type,
    occurred_at: event.occurred_at
  }))

  downloadCsv('rgsm-rfid-events-report.csv', rows)
}

const subscribeToRealtime = () => {
  console.log('Starting RGSM realtime subscription...')

  const channel = supabase
    .channel('rgsm-live-dashboard')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'detection_events'
      },
      (payload) => {
        console.log('Realtime detection event:', payload)

        if (payload.eventType === 'INSERT') {
          detectionEvents.value = [payload.new, ...detectionEvents.value].slice(0, 40)
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'access_logs'
      },
      (payload) => {
        console.log('Realtime access log:', payload)

        if (payload.eventType === 'INSERT') {
          accessLogs.value = [payload.new, ...accessLogs.value].slice(0, 40)
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'alerts'
      },
      (payload) => {
        console.log('Realtime alert:', payload)

        if (payload.eventType === 'INSERT') {
          alerts.value = [payload.new, ...alerts.value].slice(0, 40)
        }

        if (payload.eventType === 'UPDATE') {
          alerts.value = alerts.value.map((alert) =>
            alert.id === payload.new.id ? payload.new : alert
          )
        }
      }
    )
    .subscribe((status, err) => {
      console.log('Realtime subscription status:', status)

      if (err) {
        console.error('Realtime subscription error:', err)
      }
    })

  return channel
}

let realtimeChannel = null

const loadProfiles = async () => {
  usersLoading.value = true

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, requested_role, account_status, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    profiles.value = data || []
  } catch (error) {
    console.error('Failed to load profiles:', error)
    authError.value = error?.message || 'Failed to load users.'
  } finally {
    usersLoading.value = false
  }
}

const updateUserProfile = async (userId, updates) => {
  userActionLoading.value = true
  authError.value = ''

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw error
    }

    profiles.value = profiles.value.map((user) =>
      user.id === userId ? data : user
    )
  } catch (error) {
    console.error('Failed to update user:', error)
    authError.value = error?.message || 'Failed to update user.'
  } finally {
    userActionLoading.value = false
  }
}

const approveUser = async (user) => {
  await updateUserProfile(user.id, {
    account_status: 'approved',
    role: user.requested_role || 'university_admin'
  })
}

const suspendUser = async (user) => {
  await updateUserProfile(user.id, {
    account_status: 'suspended'
  })
}

const reactivateUser = async (user) => {
  await updateUserProfile(user.id, {
    account_status: 'approved'
  })
}

const changeUserRole = async (user, role) => {
  await updateUserProfile(user.id, {
    role
  })
}

const alertActionLoading = ref(false)

const updateAlertStatus = async (alertId, status) => {
  alertActionLoading.value = true

  try {
    const { error } = await supabase
      .from('alerts')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', alertId)

    if (error) {
      throw error
    }

    alerts.value = alerts.value.map((alert) =>
      alert.id === alertId
        ? {
            ...alert,
            status,
            updated_at: new Date().toISOString()
          }
        : alert
    )
  } catch (error) {
    console.error('Failed to update alert status:', error)
    authError.value = error.message || 'Failed to update alert status.'
  } finally {
    alertActionLoading.value = false
  }
}

const acknowledgeAlert = async (alertId) => {
  await updateAlertStatus(alertId, 'acknowledged')
}

const resolveAlert = async (alertId) => {
  await updateAlertStatus(alertId, 'resolved')
}

const loadSystemSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    systemSettings.value = data || []
  } catch (error) {
    console.error('Failed to load system settings:', error)
    authError.value = error?.message || 'Failed to load system settings.'
  }
}

const updateEmergencyLockdown = async (enabled) => {
  lockdownLoading.value = true
  authError.value = ''

  try {
    const existingSetting = systemSettings.value.find(
      (item) => item.setting_key === 'emergency_lockdown'
    )

    if (!existingSetting) {
      throw new Error('Emergency lockdown setting was not found.')
    }

    const newValue = {
      enabled,
      reason: enabled ? lockdownReason.value : '',
      activated_by: profile.value?.email || profile.value?.full_name || 'Global Admin',
      activated_at: enabled ? new Date().toISOString() : null
    }

    const { data, error } = await supabase
      .from('system_settings')
      .update({
        setting_value: newValue,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingSetting.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    systemSettings.value = systemSettings.value.map((item) =>
      item.id === data.id ? data : item
    )
  } catch (error) {
    console.error('Failed to update emergency lockdown:', error)
    authError.value = error?.message || 'Failed to update emergency lockdown.'
  } finally {
    lockdownLoading.value = false
  }
}

const activateLockdown = async () => {
  await updateEmergencyLockdown(true)
}

const deactivateLockdown = async () => {
  await updateEmergencyLockdown(false)
}

const syncSystemConfigForm = () => {
  const config = systemConfiguration.value

  systemConfigForm.value = {
    system_name: config.system_name || 'RGSM Campus Security',
    security_contact: config.security_contact || 'security@demo-university.edu',
    alert_retention_days: Number(config.alert_retention_days || 30),
    default_simulation_students: Number(config.default_simulation_students || 20),
    default_simulation_duration: Number(config.default_simulation_duration || 60),
    auto_generate_alerts: Boolean(config.auto_generate_alerts ?? true)
  }

  simulationStudents.value = systemConfigForm.value.default_simulation_students
  simulationDuration.value = systemConfigForm.value.default_simulation_duration
}

const saveSystemConfiguration = async () => {
  settingsLoading.value = true
  authError.value = ''

  try {
    const existingSetting = systemSettings.value.find(
      (item) => item.setting_key === 'system_configuration'
    )

    if (!existingSetting) {
      throw new Error('System configuration setting was not found.')
    }

    const { data, error } = await supabase
      .from('system_settings')
      .update({
        setting_value: systemConfigForm.value,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingSetting.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    systemSettings.value = systemSettings.value.map((item) =>
      item.id === data.id ? data : item
    )

    simulationStudents.value = systemConfigForm.value.default_simulation_students
    simulationDuration.value = systemConfigForm.value.default_simulation_duration
  } catch (error) {
    console.error('Failed to save settings:', error)
    authError.value = error?.message || 'Failed to save system settings.'
  } finally {
    settingsLoading.value = false
  }
}

onMounted(async () => {
  loading.value = true

  await loadProfile()

  if (!authError.value && profile.value) {
    await loadDashboardData()
    await loadProfiles()
    await loadSystemSettings()
    syncSystemConfigForm()
    realtimeChannel = subscribeToRealtime()
    await getSimulationStatus()
  }

  loading.value = false
})


onUnmounted(async () => {
  if (realtimeChannel) {
    await supabase.removeChannel(realtimeChannel)
  }
})
</script>

<template>
    <main class="dashboard-shell">
        <div
        class="mobile-overlay"
        :class="{ 'mobile-overlay-active': sidebarOpen }"
        @click="closeMobileSidebar"
        />

        <aside
        class="dashboard-sidebar"
        :class="{
            'sidebar-open': sidebarOpen,
            'sidebar-collapsed': sidebarCollapsed
        }"
        >
        <div class="sidebar-brand">
            <ChelLogo />
        </div>

        <nav class="sidebar-nav">
            <button
            v-for="item in navItems"
            :key="item.id"
            type="button"
            class="nav-item"
            :class="{ 'nav-item-active': activeSection === item.id }"
            @click="setSection(item.id)"
            >
            <span class="nav-icon">{{ item.icon }}</span>
            <span v-if="!sidebarCollapsed" class="nav-label">{{ item.label }}</span>
            </button>
        </nav>

        <div class="sidebar-footer">
            <button
            type="button"
            class="collapse-btn desktop-only"
            @click="sidebarCollapsed = !sidebarCollapsed"
            >
            {{ sidebarCollapsed ? '→' : '← Collapse' }}
            </button>

            <button type="button" class="logout-btn" @click="logout">
            <span>↪</span>
            <span v-if="!sidebarCollapsed">Logout</span>
            </button>
        </div>
        </aside>

        <section class="dashboard-main" :class="{ 'main-expanded': sidebarCollapsed }">
        <header class="dashboard-topbar">
            <button type="button" class="mobile-menu-btn" @click="sidebarOpen = true">
            ☰
            </button>

            <div>
            <p class="eyebrow">Realtime Campus Security</p>
            <h1>{{ sectionTitle }}</h1>
            </div>

            <div class="topbar-right">
            <div class="live-pill">
                <span class="pulse-dot"></span>
                Live
            </div>

            <div class="profile-chip">
                <span class="profile-avatar">
                {{ profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'A' }}
                </span>

                <div class="profile-meta">
                  <strong>{{ profile?.full_name || profile?.email || 'RGSM Admin' }}</strong>
                  <small>{{ profile?.role?.replace('_', ' ') || 'Authenticated User' }}</small>
                </div>
            </div>
            </div>
        </header>

        <section v-if="loading" class="state-card">
            <div class="loader"></div>
            <p>Loading RGSM dashboard...</p>
        </section>

        <section v-else-if="authError" class="state-card error-state">
            <h2>Access Restricted</h2>
            <p>{{ authError }}</p>
            <button type="button" @click="logout">Return to Login</button>
        </section>

        <section v-else class="dashboard-content">
            <template v-if="activeSection === 'dashboard'">
            <div class="stats-grid">
                <article class="stat-card">
                <span>Total RFID Events</span>
                <strong>{{ detectionEvents.length }}</strong>
                <small>Latest simulation reads</small>
                </article>

                <article class="stat-card">
                <span>Active Alerts</span>
                <strong>{{ activeAlerts.length }}</strong>
                <small>{{ criticalAlerts.length }} critical</small>
                </article>

                <article class="stat-card">
                <span>Geofence Zones</span>
                <strong>{{ geofences.length }}</strong>
                <small>Logical RFID zones</small>
                </article>

                <article class="stat-card">
                <span>RFID Readers</span>
                <strong>{{ readers.length }}</strong>
                <small>Active boundary triggers</small>
                </article>
            </div>

            <div class="dashboard-grid">
                <article class="panel panel-large">
                <div class="panel-header">
                    <div>
                    <h2>Live Geofence Activity</h2>
                    <p>Dynamic view of RFID-triggered geofence movement.</p>
                    </div>
                    <span class="panel-badge">Realtime</span>
                </div>

                <div class="geofence-map">
                    <div
                    v-for="(zone, index) in geofenceOccupancy"
                    :key="zone.id"
                    class="zone-node"
                    :class="`zone-node-${(index % 6) + 1}`"
                    >
                    <span class="zone-pulse"></span>
                    <strong>{{ zone.name }}</strong>
                    <small>{{ zone.occupancy }} occupants</small>
                    </div>

                    <div v-if="!geofenceOccupancy.length" class="empty-map">
                    No geofence zones found. Add geofence zones in Supabase.
                    </div>
                </div>
                </article>

                <article class="panel">
                <div class="panel-header">
                    <div>
                    <h2>Active Alerts</h2>
                    <p>Security exceptions and denied access logs.</p>
                    </div>
                </div>

                <div class="alert-list">
                    <div
                    v-for="alert in activeAlerts.slice(0, 6)"
                    :key="alert.id"
                    class="alert-item"
                    :class="`alert-${alert.severity}`"
                    >
                      <div class="alert-actions">
                        <button
                          v-if="alert.status === 'open'"
                          type="button"
                          class="ack-btn"
                          :disabled="alertActionLoading"
                          @click="acknowledgeAlert(alert.id)"
                        >
                          Acknowledge
                        </button>

                        <button
                          v-if="alert.status !== 'resolved'"
                          type="button"
                          class="resolve-btn"
                          :disabled="alertActionLoading"
                          @click="resolveAlert(alert.id)"
                        >
                          Resolve
                        </button>
                      </div>
                    <div>
                        <strong>{{ alert.alert_type || 'Security Alert' }}</strong>
                        <p>{{ alert.message }}</p>
                    </div>
                    <small>{{ formatTime(alert.created_at) }}</small>
                    </div>

                    <p v-if="!activeAlerts.length" class="empty-text">
                    No active alerts.
                    </p>
                </div>
                </article>
            </div>

            <div class="dashboard-grid lower-grid">
                <article class="panel">
                <div class="panel-header">
                    <div>
                    <h2>Recent RFID Reads</h2>
                    <p>Newest reads from Python/SimPy or RFID device layer.</p>
                    </div>
                </div>

                <div class="event-feed">
                    <div
                    v-for="event in recentEvents"
                    :key="event.id"
                    class="event-row"
                    >
                    <span class="event-dot"></span>
                    <div>
                        <strong>{{ event.tag_uid }}</strong>
                        <p>{{ event.event_type }} · Reader {{ event.reader_id || 'N/A' }}</p>
                    </div>
                    <small>{{ formatTime(event.occurred_at) }}</small>
                    </div>

                    <p v-if="!recentEvents.length" class="empty-text">
                    No RFID events yet. Start your simulation to populate this feed.
                    </p>
                </div>
                </article>

                <article class="panel">
                <div class="panel-header">
                    <div>
                    <h2>Access Decisions</h2>
                    <p>Allowed, denied, and alert-triggered decisions.</p>
                    </div>
                </div>

                <div class="decision-summary">
                    <div class="decision-box allowed">
                    <strong>{{ allowedLogs.length }}</strong>
                    <span>Allowed</span>
                    </div>

                    <div class="decision-box denied">
                    <strong>{{ deniedLogs.length }}</strong>
                    <span>Denied / Alert</span>
                    </div>
                </div>

                <div class="mini-table">
                    <div
                    v-for="log in accessLogs.slice(0, 5)"
                    :key="log.id"
                    class="mini-row"
                    >
                    <span :class="['status-dot', log.decision]"></span>
                    <p>{{ log.reason || 'Access decision processed' }}</p>
                    <small>{{ log.decision }}</small>
                    </div>
                </div>
                </article>
            </div>
            </template>

            <template v-else-if="activeSection === 'live-geofence'">
            <article class="panel full-panel">
                <div class="panel-header">
                <div>
                    <h2>Live Geofence Monitor</h2>
                    <p>Each zone below represents logical RFID reader grouping, not GPS-only boundaries.</p>
                </div>
                </div>

                <div class="zone-grid">
                <div
                    v-for="zone in geofenceOccupancy"
                    :key="zone.id"
                    class="zone-card"
                >
                    <div class="zone-card-top">
                    <h3>{{ zone.name }}</h3>
                    <span>{{ zone.zone_type || 'zone' }}</span>
                    </div>
                    <p>{{ zone.description || 'No description provided.' }}</p>
                    <div class="zone-meter">
                    <span :style="{ width: `${Math.min(zone.occupancy * 10, 100)}%` }"></span>
                    </div>
                    <strong>{{ zone.occupancy }} live occupants</strong>
                </div>

                <p v-if="!geofenceOccupancy.length" class="empty-text">
                    No geofence zones available.
                </p>
                </div>
            </article>
            </template>

            <template v-else-if="activeSection === 'events'">
            <article class="panel full-panel">
                <div class="panel-header">
                <div>
                    <h2>RFID Detection Events</h2>
                    <p>Raw detection events from the simulation or hardware reader layer.</p>
                </div>
                </div>

                <div class="data-table">
                <div class="table-head">
                    <span>Tag UID</span>
                    <span>Reader</span>
                    <span>Event Type</span>
                    <span>Time</span>
                </div>

                <div
                    v-for="event in detectionEvents"
                    :key="event.id"
                    class="table-row"
                >
                    <span>{{ event.tag_uid }}</span>
                    <span>{{ event.reader_id || 'N/A' }}</span>
                    <span>{{ event.event_type }}</span>
                    <span>{{ formatDate(event.occurred_at) }}</span>
                </div>
                </div>
            </article>
            </template>

            <template v-else-if="activeSection === 'alerts'">
            <article class="panel full-panel">
                <div class="panel-header">
                <div>
                    <h2>Alerts & Notifications</h2>
                    <p>Security alerts generated from rule-based geofence decisions.</p>
                </div>
                </div>

                <div class="alert-grid">
                <div
                    v-for="alert in alerts"
                    :key="alert.id"
                    class="alert-card"
                    :class="`alert-${alert.severity}`"
                >
                    <div>
                    <h3>{{ alert.alert_type }}</h3>
                    <p>{{ alert.message }}</p>
                    </div>

                    <div class="alert-card-footer">
                    <span>{{ alert.severity }}</span>
                    <small>{{ formatDate(alert.created_at) }}</small>
                    </div>
                </div>

                <p v-if="!alerts.length" class="empty-text">
                    No alerts have been generated yet.
                </p>
                </div>
            </article>
            </template>

            <template v-else-if="activeSection === 'students'">
            <article class="panel full-panel">
                <div class="panel-header">
                <div>
                    <h2>Student Tracking</h2>
                    <p>RFID-linked student identities and movement visibility.</p>
                </div>
                </div>

                <div class="data-table">
                <div class="table-head">
                    <span>Name</span>
                    <span>Matric Number</span>
                    <span>RFID UID</span>
                    <span>Department</span>
                </div>

                <div
                    v-for="student in students"
                    :key="student.id"
                    class="table-row"
                >
                    <span>{{ student.full_name }}</span>
                    <span>{{ student.matric_number }}</span>
                    <span>{{ student.rfid_uid }}</span>
                    <span>{{ student.department || 'N/A' }}</span>
                </div>
                </div>
            </article>
            </template>

            <template v-else-if="activeSection === 'readers'">
            <article class="panel full-panel">
                <div class="panel-header">
                <div>
                    <h2>RFID Readers</h2>
                    <p>Reader devices acting as geofence triggers.</p>
                </div>
                </div>

                <div class="zone-grid">
                <div
                    v-for="reader in readers"
                    :key="reader.id"
                    class="zone-card"
                >
                    <div class="zone-card-top">
                    <h3>{{ reader.name }}</h3>
                    <span>{{ reader.is_active ? 'Active' : 'Inactive' }}</span>
                    </div>
                    <p>{{ reader.location || 'No location provided.' }}</p>
                    <strong>{{ reader.reader_code }}</strong>
                </div>
                </div>
            </article>
            </template>


            <!-- SIMULATION -->
            <template v-else-if="activeSection === 'simulation'">
              <article class="panel full-panel">
                <div class="panel-header">
                  <div>
                    <h2>Simulation Control Center</h2>
                    <p>
                      Start scenario-based RFID movement simulations and watch Supabase update the dashboard in realtime.
                    </p>
                  </div>

                  <span
                    class="simulation-status-pill"
                    :class="{ 'simulation-running': simulationStatus?.is_running }"
                  >
                    {{ simulationStatus?.is_running ? 'Running' : 'Stopped' }}
                  </span>
                </div>

                <div class="simulation-layout">
                  <div class="simulation-control-card">
                    <h3>Run Simulation</h3>

                    <div class="simulation-form">
                      <label>
                        Scenario
                        <select v-model="simulationScenario">
                          <option
                            v-for="scenario in simulationScenarios"
                            :key="scenario.value"
                            :value="scenario.value"
                          >
                            {{ scenario.label }}
                          </option>
                        </select>
                      </label>

                      <p class="scenario-description">
                        {{
                          simulationScenarios.find((scenario) => scenario.value === simulationScenario)?.description
                        }}
                      </p>

                      <label>
                        Number of Students
                        <input
                          v-model.number="simulationStudents"
                          type="number"
                          min="1"
                          max="200"
                        />
                      </label>

                      <label>
                        Duration Seconds
                        <input
                          v-model.number="simulationDuration"
                          type="number"
                          min="10"
                          max="3600"
                        />
                      </label>

                      <div class="simulation-actions">
                        <button
                          type="button"
                          class="safe-btn"
                          :disabled="simulationLoading || simulationStatus?.is_running"
                          @click="startSimulation"
                        >
                          {{ simulationLoading ? 'Starting...' : 'Start Simulation' }}
                        </button>

                        <button
                          type="button"
                          class="danger-btn"
                          :disabled="simulationLoading || !simulationStatus?.is_running"
                          @click="stopSimulation"
                        >
                          Stop Simulation
                        </button>
                      </div>

                      <p v-if="simulationMessage" class="simulation-message">
                        {{ simulationMessage }}
                      </p>
                    </div>
                  </div>

                  <div class="simulation-control-card">
                    <h3>Live Simulation Output</h3>

                    <div class="simulation-metrics">
                      <div>
                        <span>RFID Events</span>
                        <strong>{{ detectionEvents.length }}</strong>
                      </div>

                      <div>
                        <span>Access Logs</span>
                        <strong>{{ accessLogs.length }}</strong>
                      </div>

                      <div>
                        <span>Active Alerts</span>
                        <strong>{{ activeAlerts.length }}</strong>
                      </div>

                      <div>
                        <span>Denied / Alert</span>
                        <strong>{{ deniedLogs.length }}</strong>
                      </div>
                    </div>

                    <div class="event-feed simulation-feed">
                      <div
                        v-for="event in recentEvents"
                        :key="event.id"
                        class="event-row"
                      >
                        <span class="event-dot"></span>

                        <div>
                          <strong>{{ event.tag_uid }}</strong>
                          <p>{{ event.event_type }} · {{ event.reader_id || 'Reader N/A' }}</p>
                        </div>

                        <small>{{ formatTime(event.occurred_at) }}</small>
                      </div>

                      <p v-if="!recentEvents.length" class="empty-text">
                        No simulation events yet. Start a simulation to populate this feed.
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            </template>

              <template v-else-if="activeSection === 'users'">
              <article class="panel full-panel">
                <div class="panel-header">
                  <div>
                    <h2>Users & Roles</h2>
                    <p>Approve administrators, manage account status, and assign access roles.</p>
                  </div>

                  <button type="button" class="safe-btn" @click="loadProfiles">
                    Refresh Users
                  </button>
                </div>

                <div class="user-summary-grid">
                  <div>
                    <span>Pending</span>
                    <strong>{{ pendingUsers.length }}</strong>
                  </div>

                  <div>
                    <span>Approved</span>
                    <strong>{{ approvedUsers.length }}</strong>
                  </div>

                  <div>
                    <span>Suspended</span>
                    <strong>{{ suspendedUsers.length }}</strong>
                  </div>

                  <div>
                    <span>Total Users</span>
                    <strong>{{ profiles.length }}</strong>
                  </div>
                </div>

                <div class="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Requested Role</th>
                        <th>Current Role</th>
                        <th>Status</th>
                        <th>Joined</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr v-for="user in profiles" :key="user.id">
                        <td>
                          <strong>{{ user.full_name || 'Unnamed User' }}</strong>
                          <p>{{ user.email }}</p>
                        </td>

                        <td>{{ user.requested_role || 'N/A' }}</td>

                        <td>
                          <select
                            :value="user.role"
                            :disabled="userActionLoading || profile?.role !== 'global_admin'"
                            @change="changeUserRole(user, $event.target.value)"
                          >
                            <option
                              v-for="role in adminRoles"
                              :key="role.value"
                              :value="role.value"
                            >
                              {{ role.label }}
                            </option>
                          </select>
                        </td>

                        <td>
                          <span class="status-pill" :class="`status-${user.account_status}`">
                            {{ user.account_status }}
                          </span>
                        </td>

                        <td>{{ formatDate(user.created_at) }}</td>

                        <td>
                          <div class="user-actions">
                            <button
                              v-if="user.account_status === 'pending'"
                              type="button"
                              class="ack-btn"
                              :disabled="userActionLoading || profile?.role !== 'global_admin'"
                              @click="approveUser(user)"
                            >
                              Approve
                            </button>

                            <button
                              v-if="user.account_status === 'approved'"
                              type="button"
                              class="danger-btn small-action"
                              :disabled="userActionLoading || profile?.role !== 'global_admin'"
                              @click="suspendUser(user)"
                            >
                              Suspend
                            </button>

                            <button
                              v-if="user.account_status === 'suspended'"
                              type="button"
                              class="safe-btn small-action"
                              :disabled="userActionLoading || profile?.role !== 'global_admin'"
                              @click="reactivateUser(user)"
                            >
                              Reactivate
                            </button>
                          </div>
                        </td>
                      </tr>

                      <tr v-if="!profiles.length">
                        <td colspan="6">No users found.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </article>
            </template>

            <template v-else-if="activeSection === 'emergency'">
              <article class="panel full-panel">
                <div class="panel-header">
                  <div>
                    <h2>Emergency Lockdown</h2>
                    <p>Activate or deactivate campus-wide emergency access restriction.</p>
                  </div>

                  <span
                    class="lockdown-pill"
                    :class="{ 'lockdown-active': emergencyLockdown.enabled }"
                  >
                    {{ emergencyLockdown.enabled ? 'Lockdown Active' : 'Normal Operation' }}
                  </span>
                </div>

                <div class="lockdown-grid">
                  <section class="lockdown-card">
                    <h3>Current Emergency Status</h3>

                    <p v-if="emergencyLockdown.enabled" class="lockdown-warning">
                      Emergency lockdown is currently active. Student RFID access attempts will be denied and logged as critical alerts.
                    </p>

                    <p v-else class="normal-message">
                      Campus access is operating under normal geofence rules.
                    </p>

                    <div class="lockdown-details">
                      <div>
                        <span>Reason</span>
                        <strong>{{ emergencyLockdown.reason || 'No active emergency' }}</strong>
                      </div>

                      <div>
                        <span>Activated By</span>
                        <strong>{{ emergencyLockdown.activated_by || 'N/A' }}</strong>
                      </div>

                      <div>
                        <span>Activated At</span>
                        <strong>
                          {{
                            emergencyLockdown.activated_at
                              ? formatDate(emergencyLockdown.activated_at)
                              : 'N/A'
                          }}
                        </strong>
                      </div>
                    </div>
                  </section>

                  <section class="lockdown-card">
                    <h3>Lockdown Control</h3>

                    <label class="lockdown-label">
                      Lockdown Reason
                      <textarea
                        v-model="lockdownReason"
                        rows="4"
                        placeholder="Enter reason for lockdown..."
                        :disabled="emergencyLockdown.enabled"
                      ></textarea>
                    </label>

                    <div class="lockdown-actions">
                      <button
                        type="button"
                        class="danger-btn"
                        :disabled="lockdownLoading || emergencyLockdown.enabled || profile?.role !== 'global_admin'"
                        @click="activateLockdown"
                      >
                        {{ lockdownLoading ? 'Activating...' : 'Activate Lockdown' }}
                      </button>

                      <button
                        type="button"
                        class="safe-btn"
                        :disabled="lockdownLoading || !emergencyLockdown.enabled || profile?.role !== 'global_admin'"
                        @click="deactivateLockdown"
                      >
                        {{ lockdownLoading ? 'Deactivating...' : 'Deactivate Lockdown' }}
                      </button>
                    </div>

                    <p v-if="profile?.role !== 'global_admin'" class="empty-text">
                      Only Global Admin users can change emergency lockdown status.
                    </p>
                  </section>
                </div>
              </article>
            </template>

            <template v-else-if="activeSection === 'reports'">
              <article class="panel full-panel">
                <div class="panel-header">
                  <div>
                    <h2>Reports & Analytics</h2>
                    <p>Security performance summary generated from RFID events, access logs, and alerts.</p>
                  </div>

                  <div class="report-actions">
                    <button type="button" class="safe-btn small-action" @click="exportEventsReport">
                      Export Events
                    </button>

                    <button type="button" class="safe-btn small-action" @click="exportAccessLogsReport">
                      Export Logs
                    </button>

                    <button type="button" class="safe-btn small-action" @click="exportAlertsReport">
                      Export Alerts
                    </button>
                  </div>
                </div>

                <div class="report-grid">
                  <section class="report-card">
                    <span>Total RFID Events</span>
                    <strong>{{ totalEvents }}</strong>
                    <p>Raw RFID scans received from campus readers.</p>
                  </section>

                  <section class="report-card">
                    <span>Total Access Decisions</span>
                    <strong>{{ totalAccessLogs }}</strong>
                    <p>Allowed, denied, and alert-triggered access decisions.</p>
                  </section>

                  <section class="report-card">
                    <span>Total Alerts</span>
                    <strong>{{ totalAlerts }}</strong>
                    <p>Security alerts generated by the rule engine.</p>
                  </section>

                  <section class="report-card">
                    <span>Resolved Alerts</span>
                    <strong>{{ resolvedAlertCount }}</strong>
                    <p>Alerts closed by administrators.</p>
                  </section>
                </div>

                <div class="report-layout">
                  <section class="report-panel">
                    <h3>Access Decision Summary</h3>

                    <div class="report-bars">
                      <div>
                        <div class="bar-label">
                          <span>Allowed</span>
                          <strong>{{ accessDecisionReport.allowed }} / {{ accessDecisionReport.allowedRate }}%</strong>
                        </div>
                        <div class="bar-track">
                          <span class="bar-fill allowed-bar" :style="{ width: `${accessDecisionReport.allowedRate}%` }"></span>
                        </div>
                      </div>

                      <div>
                        <div class="bar-label">
                          <span>Denied / Alert</span>
                          <strong>
                            {{ accessDecisionReport.denied + accessDecisionReport.alert }} /
                            {{ accessDecisionReport.deniedRate }}%
                          </strong>
                        </div>
                        <div class="bar-track">
                          <span class="bar-fill denied-bar" :style="{ width: `${accessDecisionReport.deniedRate}%` }"></span>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section class="report-panel">
                    <h3>Alert Severity Breakdown</h3>

                    <div class="severity-grid">
                      <div class="severity critical">
                        <span>Critical</span>
                        <strong>{{ alertSeverityReport.critical }}</strong>
                      </div>

                      <div class="severity high">
                        <span>High</span>
                        <strong>{{ alertSeverityReport.high }}</strong>
                      </div>

                      <div class="severity medium">
                        <span>Medium</span>
                        <strong>{{ alertSeverityReport.medium }}</strong>
                      </div>

                      <div class="severity low">
                        <span>Low</span>
                        <strong>{{ alertSeverityReport.low }}</strong>
                      </div>
                    </div>
                  </section>
                </div>

                <section class="report-panel">
                  <h3>Recent Incident Report</h3>

                  <div class="data-table">
                    <div class="table-head">
                      <span>Alert Type</span>
                      <span>Severity</span>
                      <span>Status</span>
                      <span>Time</span>
                    </div>

                    <div
                      v-for="alert in alerts.slice(0, 10)"
                      :key="alert.id"
                      class="table-row"
                    >
                      <span>{{ alert.alert_type }}</span>
                      <span>{{ alert.severity }}</span>
                      <span>{{ alert.status }}</span>
                      <span>{{ formatDate(alert.created_at) }}</span>
                    </div>
                  </div>

                  <p v-if="!alerts.length" class="empty-text">
                    No incident data available yet.
                  </p>
                </section>
              </article>
            </template>

            <template v-else-if="activeSection === 'settings'">
              <article class="panel full-panel">
                <div class="panel-header">
                  <div>
                    <h2>System Settings</h2>
                    <p>Configure RGSM dashboard preferences and operational defaults.</p>
                  </div>

                  <span class="status-pill status-approved">
                    {{ profile?.role === 'global_admin' ? 'Global Admin Access' : 'Read Only' }}
                  </span>
                </div>

                <div class="settings-grid">
                  <section class="settings-card">
                    <h3>General Configuration</h3>

                    <div class="settings-form">
                      <label>
                        System Name
                        <input
                          v-model="systemConfigForm.system_name"
                          type="text"
                          :disabled="profile?.role !== 'global_admin'"
                        />
                      </label>

                      <label>
                        Security Contact Email
                        <input
                          v-model="systemConfigForm.security_contact"
                          type="email"
                          :disabled="profile?.role !== 'global_admin'"
                        />
                      </label>

                      <label>
                        Alert Retention Days
                        <input
                          v-model.number="systemConfigForm.alert_retention_days"
                          type="number"
                          min="1"
                          max="365"
                          :disabled="profile?.role !== 'global_admin'"
                        />
                      </label>
                    </div>
                  </section>

                  <section class="settings-card">
                    <h3>Simulation Defaults</h3>

                    <div class="settings-form">
                      <label>
                        Default Students
                        <input
                          v-model.number="systemConfigForm.default_simulation_students"
                          type="number"
                          min="1"
                          max="200"
                          :disabled="profile?.role !== 'global_admin'"
                        />
                      </label>

                      <label>
                        Default Duration Seconds
                        <input
                          v-model.number="systemConfigForm.default_simulation_duration"
                          type="number"
                          min="10"
                          max="3600"
                          :disabled="profile?.role !== 'global_admin'"
                        />
                      </label>

                      <label class="toggle-setting">
                        <input
                          v-model="systemConfigForm.auto_generate_alerts"
                          type="checkbox"
                          :disabled="profile?.role !== 'global_admin'"
                        />
                        <span>Enable automatic alert generation</span>
                      </label>
                    </div>
                  </section>
                </div>

                <div class="settings-footer">
                  <button
                    type="button"
                    class="safe-btn"
                    :disabled="settingsLoading || profile?.role !== 'global_admin'"
                    @click="saveSystemConfiguration"
                  >
                    {{ settingsLoading ? 'Saving...' : 'Save Settings' }}
                  </button>

                  <p v-if="profile?.role !== 'global_admin'" class="empty-text">
                    Only Global Admin users can update system settings.
                  </p>
                </div>
              </article>
            </template>

            <template v-else>
            <article class="panel full-panel">
                <div class="panel-header">
                <div>
                    <h2>{{ sectionTitle }}</h2>
                    <p>This section is ready for the next implementation step.</p>
                </div>
                </div>

                <div class="placeholder-block">
                <h3>{{ sectionTitle }} module</h3>
                <p>
                    We will connect this module to Supabase tables and role-based permissions as the system grows.
                </p>
                </div>
            </article>
            </template>
        </section>
        </section>
    </main>
</template>

<style scoped>
.dashboard-shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.18), transparent 35%),
    radial-gradient(circle at bottom right, rgba(147, 51, 234, 0.15), transparent 35%),
    #07111f;
  color: #f8fafc;
}

.dashboard-sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  width: 285px;
  height: 100vh;
  background: rgba(5, 15, 30, 0.96);
  border-right: 1px solid rgba(148, 163, 184, 0.18);
  backdrop-filter: blur(18px);
  display: flex;
  flex-direction: column;
  z-index: 50;
  transition: width 0.25s ease, transform 0.25s ease;
}

.sidebar-collapsed {
  width: 92px;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.4rem;
  min-height: 92px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
}

.brand-mark {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: linear-gradient(135deg, #38bdf8, #6366f1);
  display: grid;
  place-items: center;
  font-weight: 900;
  font-size: 1.4rem;
  box-shadow: 0 0 28px rgba(56, 189, 248, 0.35);
}

.brand-text h2 {
  margin: 0;
  color: #dbeafe;
  line-height: 1;
}

.brand-text span {
  color: #94a3b8;
  font-size: 0.82rem;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.nav-item {
  width: 100%;
  border: 0;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.85rem 0.9rem;
  margin-bottom: 0.35rem;
  border-radius: 1rem;
  color: #cbd5e1;
  background: transparent;
  cursor: pointer;
  transition: 0.2s ease;
  text-align: left;
}

.nav-item:hover {
  background: rgba(148, 163, 184, 0.12);
  color: #ffffff;
}

.nav-item-active {
  color: #ffffff;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.32), rgba(147, 51, 234, 0.24));
  border: 1px solid rgba(147, 197, 253, 0.2);
}

.nav-icon {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 1.1rem;
}

.nav-label {
  font-size: 0.95rem;
  font-weight: 650;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid rgba(148, 163, 184, 0.14);
}

.collapse-btn,
.logout-btn {
  width: 100%;
  border: 0;
  border-radius: 0.9rem;
  padding: 0.8rem;
  margin-bottom: 0.55rem;
  color: #e2e8f0;
  background: rgba(148, 163, 184, 0.12);
  cursor: pointer;
}

.logout-btn {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  background: rgba(239, 68, 68, 0.15);
  color: #fecaca;
}

.dashboard-main {
  min-height: 100vh;
  margin-left: 285px;
  padding: 1.4rem;
  transition: margin-left 0.25s ease;
}

.main-expanded {
  margin-left: 92px;
}

.dashboard-topbar {
  min-height: 82px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.2rem;
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 1.4rem;
  backdrop-filter: blur(16px);
  margin-bottom: 1.4rem;
}

.eyebrow {
  margin: 0 0 0.25rem;
  color: #38bdf8;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.dashboard-topbar h1 {
  margin: 0;
  font-size: clamp(1.4rem, 3vw, 2.2rem);
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.live-pill {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  border: 1px solid rgba(34, 197, 94, 0.32);
  color: #bbf7d0;
  background: rgba(34, 197, 94, 0.1);
  padding: 0.55rem 0.75rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 800;
}

.pulse-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: #22c55e;
  box-shadow: 0 0 0 rgba(34, 197, 94, 0.7);
  animation: pulse 1.5s infinite;
}

.profile-chip {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.45rem 0.75rem;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.1);
}

.profile-avatar {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: #1d4ed8;
  font-weight: 900;
}

.profile-meta {
  display: flex;
  flex-direction: column;
}

.profile-meta strong {
  font-size: 0.85rem;
}

.profile-meta small {
  color: #94a3b8;
  font-size: 0.72rem;
  text-transform: capitalize;
}

.mobile-menu-btn {
  display: none;
  border: 0;
  color: #ffffff;
  background: rgba(148, 163, 184, 0.15);
  padding: 0.75rem 0.9rem;
  border-radius: 0.8rem;
  cursor: pointer;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat-card,
.panel {
  background: rgba(15, 23, 42, 0.76);
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 1.4rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
}

.stat-card {
  padding: 1.2rem;
}

.stat-card span {
  color: #94a3b8;
  font-size: 0.85rem;
}

.stat-card strong {
  display: block;
  font-size: 2.3rem;
  margin: 0.35rem 0;
  color: #ffffff;
}

.stat-card small {
  color: #60a5fa;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1.45fr 0.85fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.lower-grid {
  grid-template-columns: 1fr 1fr;
}

.panel {
  padding: 1.2rem;
}

.full-panel {
  min-height: 70vh;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.1rem;
}

.panel-header h2 {
  margin: 0;
  color: #dbeafe;
}

.panel-header p {
  margin: 0.3rem 0 0;
  color: #94a3b8;
}

.panel-badge {
  background: rgba(37, 99, 235, 0.2);
  color: #bfdbfe;
  border: 1px solid rgba(147, 197, 253, 0.2);
  padding: 0.4rem 0.65rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 800;
}

.geofence-map {
  position: relative;
  height: 440px;
  overflow: hidden;
  border-radius: 1.2rem;
  background:
    linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px),
    radial-gradient(circle at center, rgba(59, 130, 246, 0.16), transparent 55%);
  background-size: 38px 38px, 38px 38px, 100% 100%;
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.zone-node {
  position: absolute;
  min-width: 145px;
  padding: 0.9rem;
  border-radius: 1.1rem;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(96, 165, 250, 0.32);
  box-shadow: 0 0 28px rgba(59, 130, 246, 0.18);
}

.zone-node strong,
.zone-node small {
  display: block;
}

.zone-node small {
  color: #93c5fd;
  margin-top: 0.2rem;
}

.zone-node-1 { top: 11%; left: 9%; }
.zone-node-2 { top: 20%; right: 12%; }
.zone-node-3 { top: 48%; left: 34%; }
.zone-node-4 { bottom: 12%; left: 12%; }
.zone-node-5 { bottom: 17%; right: 14%; }
.zone-node-6 { top: 39%; right: 36%; }

.zone-pulse {
  position: absolute;
  right: 0.85rem;
  top: 0.85rem;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #38bdf8;
  animation: pulse 1.7s infinite;
}

.alert-list,
.event-feed,
.mini-table {
  display: grid;
  gap: 0.75rem;
}

.alert-item,
.event-row,
.mini-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 0.8rem;
  border-radius: 1rem;
  background: rgba(148, 163, 184, 0.08);
}

.alert-item p,
.event-row p,
.mini-row p {
  margin: 0.2rem 0 0;
  color: #94a3b8;
  font-size: 0.82rem;
}

.alert-item small,
.event-row small,
.mini-row small {
  color: #64748b;
  white-space: nowrap;
}

.alert-critical {
  border: 1px solid rgba(239, 68, 68, 0.38);
}

.alert-high {
  border: 1px solid rgba(249, 115, 22, 0.38);
}

.alert-medium {
  border: 1px solid rgba(234, 179, 8, 0.38);
}

.alert-low {
  border: 1px solid rgba(34, 197, 94, 0.32);
}

.event-dot,
.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #38bdf8;
}

.status-dot.allowed {
  background: #22c55e;
}

.status-dot.denied,
.status-dot.alert {
  background: #ef4444;
}

.decision-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.decision-box {
  padding: 1rem;
  border-radius: 1rem;
  background: rgba(148, 163, 184, 0.08);
}

.decision-box strong {
  display: block;
  font-size: 2rem;
}

.decision-box.allowed strong {
  color: #86efac;
}

.decision-box.denied strong {
  color: #fca5a5;
}

.zone-grid,
.alert-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.zone-card,
.alert-card {
  padding: 1rem;
  border-radius: 1.2rem;
  background: rgba(148, 163, 184, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.zone-card-top,
.alert-card-footer {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.zone-card h3,
.alert-card h3 {
  margin: 0;
}

.zone-card span,
.alert-card span {
  color: #93c5fd;
  font-size: 0.8rem;
  text-transform: capitalize;
}

.zone-card p,
.alert-card p,
.helper-note {
  color: #94a3b8;
}

.zone-meter {
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.16);
  overflow: hidden;
  margin: 1rem 0;
}

.zone-meter span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #38bdf8, #6366f1);
}

.data-table {
  width: 100%;
  overflow-x: auto;
}

.table-head,
.table-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  min-width: 800px;
  gap: 1rem;
  padding: 0.95rem;
}

.table-head {
  color: #93c5fd;
  font-weight: 900;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
}

.table-row {
  color: #e2e8f0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
}

.emergency-panel {
  border-color: rgba(239, 68, 68, 0.28);
}

.emergency-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.danger-btn,
.warning-btn,
.safe-btn,
.state-card button {
  border: 0;
  border-radius: 1rem;
  padding: 0.9rem 1.2rem;
  color: white;
  font-weight: 900;
  cursor: pointer;
}

.danger-btn {
  background: #dc2626;
}

.warning-btn {
  background: #d97706;
}

.safe-btn {
  background: #16a34a;
}

.placeholder-block,
.state-card {
  padding: 3rem;
  border-radius: 1.4rem;
  background: rgba(148, 163, 184, 0.08);
  text-align: center;
}

.state-card {
  min-height: 55vh;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 1rem;
}

.error-state {
  border: 1px solid rgba(239, 68, 68, 0.28);
}

.empty-text,
.empty-map {
  color: #94a3b8;
}

.empty-map {
  height: 100%;
  display: grid;
  place-items: center;
  text-align: center;
}

.loader {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: 4px solid rgba(148, 163, 184, 0.2);
  border-top-color: #38bdf8;
  animation: spin 0.8s linear infinite;
}

.mobile-overlay {
  display: none;
}

.desktop-only {
  display: block;
}

.simulation-status-pill {
  padding: 0.5rem 0.85rem;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.14);
  color: #cbd5e1;
  font-size: 0.8rem;
  font-weight: 900;
}

.simulation-running {
  background: rgba(34, 197, 94, 0.14);
  color: #bbf7d0;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.simulation-layout {
  display: grid;
  grid-template-columns: 0.85fr 1.15fr;
  gap: 1rem;
}

.simulation-control-card {
  padding: 1.2rem;
  border-radius: 1.2rem;
  background: rgba(148, 163, 184, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.simulation-control-card h3 {
  margin-top: 0;
  color: #dbeafe;
}

.simulation-form {
  display: grid;
  gap: 1rem;
}

.simulation-form label {
  display: grid;
  gap: 0.45rem;
  color: #cbd5e1;
  font-size: 0.9rem;
  font-weight: 800;
}

.simulation-form input,
.simulation-form select {
  width: 100%;
  padding: 0.85rem;
  border-radius: 0.85rem;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.9);
  color: #ffffff;
  outline: none;
}

.scenario-description {
  margin: -0.4rem 0 0;
  color: #93c5fd;
  font-size: 0.85rem;
}

.simulation-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
}

.simulation-actions button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.simulation-message {
  color: #bfdbfe;
  background: rgba(59, 130, 246, 0.12);
  padding: 0.8rem;
  border-radius: 0.85rem;
  border: 1px solid rgba(96, 165, 250, 0.18);
}

.simulation-metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.simulation-metrics div {
  padding: 1rem;
  border-radius: 1rem;
  background: rgba(15, 23, 42, 0.65);
}

.simulation-metrics span {
  display: block;
  color: #94a3b8;
  font-size: 0.8rem;
}

.simulation-metrics strong {
  display: block;
  margin-top: 0.35rem;
  color: #ffffff;
  font-size: 1.8rem;
}

.simulation-feed {
  max-height: 360px;
  overflow-y: auto;
}

.alert-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.ack-btn,
.resolve-btn {
  border: none;
  border-radius: 999px;
  padding: 0.55rem 0.85rem;
  font-size: 0.75rem;
  font-weight: 900;
  cursor: pointer;
}

.ack-btn {
  background: rgba(59, 130, 246, 0.15);
  color: #bfdbfe;
  border: 1px solid rgba(59, 130, 246, 0.35);
}

.resolve-btn {
  background: rgba(34, 197, 94, 0.15);
  color: #bbf7d0;
  border: 1px solid rgba(34, 197, 94, 0.35);
}

.ack-btn:disabled,
.resolve-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.alert-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.45rem;
}

.alert-meta span {
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.12);
  color: #cbd5e1;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: capitalize;
}
.user-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.9rem;
  margin-bottom: 1rem;
}

.user-summary-grid div {
  padding: 1rem;
  border-radius: 1rem;
  background: rgba(148, 163, 184, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.user-summary-grid span {
  display: block;
  color: #94a3b8;
  font-size: 0.8rem;
  font-weight: 800;
}

.user-summary-grid strong {
  display: block;
  color: #ffffff;
  font-size: 1.8rem;
  margin-top: 0.3rem;
}

.user-actions {
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.small-action {
  padding: 0.55rem 0.8rem;
  font-size: 0.75rem;
}

.status-pill {
  display: inline-flex;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: capitalize;
}

.status-pending {
  color: #fde68a;
  background: rgba(245, 158, 11, 0.14);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.status-approved {
  color: #bbf7d0;
  background: rgba(34, 197, 94, 0.14);
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.status-suspended {
  color: #fecaca;
  background: rgba(239, 68, 68, 0.14);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.table-wrapper select {
  padding: 0.55rem 0.7rem;
  border-radius: 0.7rem;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.95);
  color: #ffffff;
  outline: none;
}

.lockdown-pill {
  padding: 0.55rem 0.9rem;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.14);
  color: #bbf7d0;
  border: 1px solid rgba(34, 197, 94, 0.3);
  font-size: 0.8rem;
  font-weight: 900;
}

.lockdown-active {
  background: rgba(239, 68, 68, 0.16);
  color: #fecaca;
  border-color: rgba(239, 68, 68, 0.35);
}

.lockdown-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.1rem;
}

.lockdown-card {
  padding: 1.2rem;
  border-radius: 1.2rem;
  background: rgba(148, 163, 184, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.lockdown-card h3 {
  margin-top: 0;
  color: #dbeafe;
}

.lockdown-warning {
  color: #fecaca;
  background: rgba(239, 68, 68, 0.14);
  border: 1px solid rgba(239, 68, 68, 0.25);
  padding: 0.9rem;
  border-radius: 0.9rem;
}

.normal-message {
  color: #bbf7d0;
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.22);
  padding: 0.9rem;
  border-radius: 0.9rem;
}

.lockdown-details {
  display: grid;
  gap: 0.8rem;
  margin-top: 1rem;
}

.lockdown-details div {
  padding: 0.9rem;
  border-radius: 0.9rem;
  background: rgba(15, 23, 42, 0.65);
}

.lockdown-details span {
  display: block;
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 800;
}

.lockdown-details strong {
  display: block;
  margin-top: 0.35rem;
  color: #ffffff;
}

.lockdown-label {
  display: grid;
  gap: 0.5rem;
  color: #cbd5e1;
  font-weight: 800;
}

.lockdown-label textarea {
  width: 100%;
  border-radius: 0.9rem;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.9);
  color: #ffffff;
  padding: 0.85rem;
  resize: vertical;
  outline: none;
}

.lockdown-actions {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.report-actions {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.report-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.9rem;
  margin-bottom: 1rem;
}

.report-card,
.report-panel {
  padding: 1rem;
  border-radius: 1.1rem;
  background: rgba(148, 163, 184, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.report-card span {
  color: #94a3b8;
  font-size: 0.8rem;
  font-weight: 800;
}

.report-card strong {
  display: block;
  margin-top: 0.35rem;
  color: #ffffff;
  font-size: 2rem;
}

.report-card p {
  margin-bottom: 0;
  color: #93c5fd;
  font-size: 0.85rem;
}

.report-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.9rem;
  margin-bottom: 1rem;
}

.report-panel h3 {
  margin-top: 0;
  color: #dbeafe;
}

.report-bars {
  display: grid;
  gap: 1rem;
}

.bar-label {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  color: #cbd5e1;
  font-size: 0.85rem;
}

.bar-track {
  width: 100%;
  height: 10px;
  margin-top: 0.5rem;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.16);
  overflow: hidden;
}

.bar-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
}

.allowed-bar {
  background: #22c55e;
}

.denied-bar {
  background: #ef4444;
}

.severity-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.7rem;
}

.severity {
  padding: 0.9rem;
  border-radius: 0.95rem;
  background: rgba(15, 23, 42, 0.65);
}

.severity span {
  display: block;
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 800;
}

.severity strong {
  display: block;
  margin-top: 0.4rem;
  font-size: 1.6rem;
}

.severity.critical strong {
  color: #fca5a5;
}

.severity.high strong {
  color: #fdba74;
}

.severity.medium strong {
  color: #fde68a;
}

.severity.low strong {
  color: #86efac;
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.1rem;
}

.settings-card {
  padding: 1.2rem;
  border-radius: 1.2rem;
  background: rgba(148, 163, 184, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.settings-card h3 {
  margin-top: 0;
  color: #dbeafe;
}

.settings-form {
  display: grid;
  gap: 1rem;
}

.settings-form label {
  display: grid;
  gap: 0.45rem;
  color: #cbd5e1;
  font-size: 0.9rem;
  font-weight: 800;
}

.settings-form input[type='text'],
.settings-form input[type='email'],
.settings-form input[type='number'] {
  width: 100%;
  padding: 0.85rem;
  border-radius: 0.85rem;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.9);
  color: #ffffff;
  outline: none;
}

.settings-form input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.toggle-setting {
  display: flex !important;
  grid-template-columns: none !important;
  align-items: center;
  gap: 0.7rem !important;
  padding: 0.85rem;
  border-radius: 0.85rem;
  background: rgba(15, 23, 42, 0.65);
}

.toggle-setting input {
  width: 18px;
  height: 18px;
}

.settings-footer {
  margin-top: 1.2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

@media screen and (max-width: 900px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}

@media screen and (max-width: 900px) {
  .report-grid,
  .report-layout {
    grid-template-columns: 1fr;
  }

  .severity-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media screen and (max-width: 900px) {
  .lockdown-grid {
    grid-template-columns: 1fr;
  }
}

@media screen and (max-width: 900px) {
  .user-summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}



@media screen and (max-width: 900px) {
  .simulation-layout {
    grid-template-columns: 1fr;
  }

  .simulation-metrics {
    grid-template-columns: 1fr;
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.55);
  }

  70% {
    box-shadow: 0 0 0 12px rgba(56, 189, 248, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(56, 189, 248, 0);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media screen and (max-width: 1180px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .dashboard-grid,
  .lower-grid {
    grid-template-columns: 1fr;
  }

  .zone-grid,
  .alert-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media screen and (max-width: 760px) {
  .dashboard-sidebar {
    transform: translateX(-105%);
    width: 290px;
  }

  .dashboard-sidebar.sidebar-open {
    transform: translateX(0);
  }

  .sidebar-collapsed {
    width: 290px;
  }

  .dashboard-main,
  .main-expanded {
    margin-left: 0;
    padding: 0.85rem;
  }

  .mobile-menu-btn {
    display: block;
  }

  .mobile-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(2, 6, 23, 0.62);
    z-index: 40;
    opacity: 0;
    pointer-events: none;
    transition: 0.2s ease;
  }

  .mobile-overlay-active {
    opacity: 1;
    pointer-events: auto;
  }

  .desktop-only {
    display: none;
  }

  .dashboard-topbar {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .topbar-right {
    width: 100%;
    justify-content: space-between;
  }

  .profile-meta {
    display: none;
  }

  .stats-grid,
  .zone-grid,
  .alert-grid {
    grid-template-columns: 1fr;
  }

  .geofence-map {
    height: 520px;
  }

  .zone-node {
    position: relative;
    top: auto;
    left: auto;
    right: auto;
    bottom: auto;
    margin: 0.7rem;
  }

  .table-head,
  .table-row {
    min-width: 720px;
  }
}
</style>