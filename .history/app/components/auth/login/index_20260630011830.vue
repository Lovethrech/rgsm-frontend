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
    .select('role, account_status, organization_id, hostel_id')
    .eq('id', data.user.id)
    .single()

  if (profileError) {
    errorMsg.value = profileError.message
    return
  }

  if (profile.account_status !== 'approved') {
    await supabase.auth.signOut()
    errorMsg.value = 'Your account is pending approval. Contact the system administrator.'
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

<style scoped>
.form-input-and-label-ctn{
    width:100%;
    display: flex;
    flex-direction: column;
}
.form-input-and-label-ctn label{
    width: 22%;
    font-size: 1.4vh;
    color: #d1d5db;
    font-weight: 700;
    border-top-right-radius: 2vh;
    border-bottom-right-radius: 2vh;
}
.form-input-and-label-ctn input{
    font-size: 2vh;
    padding: 1vh;
    margin-bottom: 2vh;
    background: transparent;
    color: #ffffff;
    border: 0;
    border-bottom: 0.1vh solid #d1d5db;
}
.form-input-and-label-error{
    position: absolute;
    right: 3vh;
    text-align: right;
    font-size: 1.3vh;
    color: red;
    border-top-left-radius: 2vh;
    border-bottom-left-radius: 2vh;
}
.auth-bot-question label{
    font-size: 1.4vh;
}
.auth-btn-ctn{
    width: 100%;
    display: flex;
    justify-content: center;
}
.auth-btn{
    background-color: var(--slate-200);
    color: var(--dark);
    font-size: 2vh;
    width: 100%;
    padding: 1vh;
    border:0;
    transition: all 0.3s ease-in-out;
}
.auth-btn:hover{
    cursor: pointer;
    background-color: #000000;
    color: #ffffff;
}
</style>