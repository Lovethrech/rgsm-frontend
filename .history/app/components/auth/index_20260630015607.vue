<script setup>
const showSignUp = ref(false)

const authMainTitle = computed(() =>
    showSignUp.value ? 'Welcome, New User' : 'Welcome, Admin'
)

const authMainDesc = computed(() =>
    showSignUp.value
        ? 'To access the realtime system dashboard for monitoring and moderation, please sign up.'
        : 'To access the realtime system dashboard for monitoring and moderation.'
)

const toggleSignUp = () => {
    showSignUp.value = !showSignUp.value
}
</script>

<template>
    <section class="auth-main glass">
        <ChelLogo />

        <h1 class="auth-main-title">
            {{ authMainTitle }}
        </h1>

        <p class="auth-main-desc">  
            {{ authMainDesc }}
        </p>

        <br />

        <div class="auth-main-form-ct">
            <AuthSignup v-if="showSignUp" />
            <AuthLogin v-else />
        </div>

        <div class="auth-question-ctn">
        <span class="auth-question">
            {{ showSignUp ? 'Already have an account?' : "Don't have an account yet?" }}
        </span>

        <button type="button" @click="toggleSignUp" class="auth-question-link-ctn">
            <span class="auth-question-link">
            {{ showSignUp ? 'Login' : 'Sign up' }}
            </span>
        </button>
        </div>

        <div class="fine-print">
            By continuing, you agree to the Terms<br />
            and Privacy Policy.
        </div>
    </section>
</template>

<style scoped>
.auth-main {
    padding: 3vh;
    margin: 0 3vh;
    width: 40vw;
}

.auth-main-title,
.auth-main-desc {
    text-align: center;
}

.auth-main-title {
    font-family: var(--display-font);
    margin-top: -3vh;
    color: #93c5fd;
    font-weight: 900;
    font-size: 4vh;
}

.auth-main-desc {
    color: #9ca3af;
    font-family: var(--mono-font);
    font-size: 1.8vh;
}

.auth-question-ctn {
    text-align: center;
    font-size: 1em;
    color: var(--slate-400);
    margin-top: auto;
}

.auth-question-link-ctn {
    background: transparent;
    border: 0;
    cursor: pointer;
}

.auth-question-link {
    color: var(--blue-300);
    font-weight: 600;
}

.fine-print {
    text-align: center;
    font-size: 1.8vh;
    color: var(--slate-600);
    line-height: 1.5;
}

@media screen and (max-width: 990px) and (min-width: 651px) {
    .auth-main {
        width: 60vw;
    }
    .auth-main-title {
        font-size: 3.5vh;
    }
    .auth-main-desc {
        font-size: 1.6vh;
    }
}

@media screen and (max-width: 650px) {
    .auth-main {
        width: 90vw;
    }
    .auth-main-title {
        font-size: 3vh;
    }
    .auth-main-desc {
        font-size: 1.4vh;
    }
}
</style>