<script setup>
const supabase = useSupabaseClient()
const router = useRouter()

const email = ref('')
const password = ref('')
const fullName = ref('')
const requestedRole = ref('')
const botChecked = ref(false)

const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const roles = [
  {
    label: 'Global Admin',
    value: 'global_admin',
    description: 'Full access across all organizations. Requires approval.'
  },
  {
    label: 'University Admin',
    value: 'university_admin',
    description: 'Manages one university or organization.'
  },
  {
    label: 'Bilateral Admin',
    value: 'bilateral_admin',
    description: 'Higher hostel-level access, including appointed hostel logs.'
  },
  {
    label: 'Unilateral Admin',
    value: 'unilateral_admin',
    description: 'Hostel representative / limited assigned-hostel access.'
  }
]

const submitSignUpDetails = async () => {
  errorMsg.value = ''
  successMsg.value = ''

  if (!email.value || !password.value || !requestedRole.value || !botChecked.value) {
    errorMsg.value = 'Please fill all required fields and confirm you are not a robot.'
    return
  }

  if (password.value.length < 6) {
    errorMsg.value = 'Password must be at least 6 characters.'
    return
  }

  loading.value = true

  const { data, error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
    options: {
      data: {
        full_name: fullName.value,
        requested_role: requestedRole.value
      }
    }
  })

  loading.value = false

  if (error) {
    errorMsg.value = error.message
    return
  }

  successMsg.value =
    'Account created. Please check your email for confirmation. Your role will remain pending until approved.'

  console.log('Signup data:', data)
}
</script>

<template>
    <form class="auth-login" @submit.prevent="submitSignUpDetails">
        <div class="form-input-and-label-ctn">
            <label for="fullName">Full Name</label>
            <input
                id="fullName"
                v-model="fullName"
                name="fullName"
                type="text"
                placeholder="Your full name"
            />
        </div>

        <div class="form-input-and-label-ctn">
            <label for="signupEmail">Email:*</label>
            <input
                id="signupEmail"
                v-model="email"
                name="email"
                type="email"
                placeholder="Your Email"
                required
            />
        </div>

        <div class="form-input-and-label-ctn">
            <label for="signupPassword">Password:*</label>
            <input
                id="signupPassword"
                v-model="password"
                name="password"
                type="password"
                placeholder="***************"
                required
            />
        </div>

        <div class="form-input-and-label-ctn">
            <label for="role">Role:*</label>
            <select id="role" v-model="requestedRole" required>
                <option disabled value="">Select your role</option>
                <option
                v-for="role in roles"
                :key="role.value"
                :value="role.value"
                >
                {{ role.label }}
                </option>
            </select>

            <p v-if="requestedRole" class="role-help">
                {{ roles.find((role) => role.value === requestedRole)?.description }}
            </p>
        </div>

        <div class="auth-bot-question">
            <input
                v-model="botChecked"
                type="checkbox"
                name="auth-bot"
                id="auth-bot-signup"
                required
            />
            <label for="auth-bot-signup">
                I am not a robot
            </label>
        </div>

        <p v-if="errorMsg" class="form-input-and-label-error">
        {{ errorMsg }}
        </p>

        <p v-if="successMsg" class="form-success">
        {{ successMsg }}
        </p>

        <br />

        <div class="auth-btn-ctn">
            <button class="auth-btn" type="submit" :disabled="loading">
                {{ loading ? 'Creating Account...' : 'Create Account' }}
            </button>
        </div>
    </form>
</template>

<style scoped>
.form-input-and-label-ctn {
    width: 100%;
    display: flex;
    flex-direction: column;
}

.form-input-and-label-ctn label {
    font-size: 1.4vh;
    color: #d1d5db;
    font-weight: 700;
}

.form-input-and-label-ctn input,
.form-input-and-label-ctn select {
    font-size: 2vh;
    padding: 1vh;
    margin-bottom: 2vh;
    background: transparent;
    color: #ffffff;
    border: 0;
    border-bottom: 0.1vh solid #d1d5db;
}

.form-input-and-label-ctn select option {
    color: #000000;
}

.role-help {
    margin-top: -1vh;
    margin-bottom: 2vh;
    color: #93c5fd;
    font-size: 1.4vh;
}

.form-input-and-label-error {
    font-size: 1.4vh;
    color: #f87171;
}

.form-success {
    font-size: 1.4vh;
    color: #86efac;
}

.auth-bot-question label {
    font-size: 1.4vh;
}

.auth-btn-ctn {
    width: 100%;
    display: flex;
    justify-content: center;
}

.auth-btn {
    background-color: var(--slate-200);
    color: var(--dark);
    font-size: 2vh;
    width: 100%;
    padding: 1vh;
    border: 0;
    transition: all 0.3s ease-in-out;
}

.auth-btn:hover {
    cursor: pointer;
    background-color: #000000;
    color: #ffffff;
}

.auth-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>