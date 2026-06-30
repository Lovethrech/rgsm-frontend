<script setup>
const supabase = useSupabaseClient()
const router = useRouter()

const email = ref('')
const password = ref('')
const botChecked = ref(false)

const loading = ref(false)
const errorMsg = ref('')

const submitLoginDetails = async () => {
    errorMsg.value = ''

    if (!email.value || !password.value || !botChecked.value) {
        errorMsg.value = 'Please enter email, password and confirm you are not a robot.'
        return
    }

    loading.value = true

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value
    })

    loading.value = false

    if (error) {
        errorMsg.value = error.message
        return
    }

    const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('id, role, requested_role, account_status, organization_id, hostel_id')
  .eq('id', data.user.id)
  .single()

if (profileError) {
  errorMsg.value = profileError.message
  return
}

if (profile.account_status !== 'approved') {
  errorMsg.value = 'Your account is pending approval. Please contact the system administrator.'
  return
}

router.push('/dashboard')
}
</script>

<template>
    <form class="auth-login" @submit.prevent="submitLoginDetails">
        <div class="form-input-and-label-ctn">
            <label for="loginEmail">Email:*</label>
            <input
                id="loginEmail"
                v-model="email"
                name="email"
                type="email"
                placeholder="Your Email"
                required
            />
        </div>

        <div class="form-input-and-label-ctn">
            <label for="loginPassword">Password:*</label>
            <input
                id="loginPassword"
                v-model="password"
                name="password"
                type="password"
                placeholder="***************"
                required
            />
        </div>

        <div class="auth-bot-question">
            <input
                v-model="botChecked"
                type="checkbox"
                name="auth-bot"
                id="auth-bot-login"
                required
            />
            <label for="auth-bot-login">
                I am not a robot
            </label>
        </div>

        <p v-if="errorMsg" class="form-input-and-label-error">
        {{ errorMsg }}
        </p>

        <br />

        <div class="auth-btn-ctn">
        <button class="auth-btn" type="submit" :disabled="loading">
            {{ loading ? 'Logging in...' : 'Login' }}
        </button>
        </div>
    </form>
</template>

