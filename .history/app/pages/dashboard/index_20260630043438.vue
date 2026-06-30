<script setup>
const supabase = useSupabaseClient()
const router = useRouter()

const user = useSupabaseUser()
const profile = ref(null)
const loading = ref(true)

onMounted(async () => {
  if (!user.value) {
    router.push('/')
    return
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, account_status')
    .eq('id', user.value.id)
    .single()

  if (error || !data) {
    router.push('/')
    return
  }

  if (data.account_status !== 'approved') {
    router.push('/pending-approval')
    return
  }

  profile.value = data
  loading.value = false
})
</script>

<template>
  <section class="dashboard-page">
    <div v-if="loading">
      Loading dashboard...
    </div>

    <div v-else>
      <h1>RGSM Security Dashboard</h1>

      <p>
        Welcome, {{ profile.full_name || profile.email }}
      </p>

      <p>
        Role: {{ profile.role }}
      </p>

      <div class="dashboard-grid">
        <div class="dashboard-card">
          <h2>Active Alerts</h2>
          <p>Monitor unauthorized RFID/geofence access events.</p>
        </div>

        <div class="dashboard-card">
          <h2>Geofence Zones</h2>
          <p>Manage campus, hostel, lab, and admin block geofences.</p>
        </div>

        <div class="dashboard-card">
          <h2>RFID Logs</h2>
          <p>View real-time RFID scan and access logs.</p>
        </div>

        <div class="dashboard-card">
          <h2>Emergency Lockdown</h2>
          <p>Trigger or monitor restricted movement during emergencies.</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  padding: 5vh;
  color: #ffffff;
}

.dashboard-page h1 {
  color: #93c5fd;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 3vh;
  margin-top: 4vh;
}

.dashboard-card {
  padding: 3vh;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 2vh;
  background: rgba(255, 255, 255, 0.06);
}

.dashboard-card h2 {
  color: #bfdbfe;
}

.dashboard-card p {
    color: #d1d5db;
}

@media screen and (max-width: 700px) {
    .dashboard-grid {
        grid-template-columns: 1fr;
    }
}
</style>