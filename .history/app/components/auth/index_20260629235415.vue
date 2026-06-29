<template>
    <section class="auth-main glass">
        <ChelLogo/>
        <h1 class="auth-main-title">
            Welcome, 
            
            Admin
        </h1>
        <p class="auth-main-desc">
            To access the realtime system dashboard for monitoring and moderation.
        </p>
        <br/>
        <div class="auth-main-form-ct">
            <AuthLogin/>
        </div>
    </section>
</template>

<style scoped>
.auth-main{
    padding: 3vh;
    margin: 0 3vh;
}
.auth-main-title, .auth-main-desc{
    text-align: center;
}
.auth-main-title{
    color: #93C5FD; 
    font-weight:900;
}
.auth-main-desc{
    color: #9ca3af;
}
</style>