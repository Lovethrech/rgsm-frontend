<template>
    <section class="auth-main glass">
        <ChelLogo/>
        <h1 class="auth-main-title">
            Welcome, Admin
        </h1>
        <p class="auth-main-desc">
            To access the realtime system dashboard <br/> for monitoring and moderation.
        </p>
        <br/>
        <div class="auth-main-form-ct">
            <AuthLogin/>
        </div>
        <div class="auth-question-ctn">
            <span class="auth-question">
                Don't have an account yet?
            </span>
            <NuxtLink to='/signup'> 
                <span class='auth-question-link'>
                    Sign up
                </span>
            </NuxtLink>
        </div>
        <div class="fine-print">
            By continuing, you agree to the Terms<br />
            and Privacy Policy.
        </div>
    </section>
</template>

<style scoped>
.auth-main{
    padding: 3vh;
    margin: 0 3vh;
    width:40vw;
}
.auth-main-title, .auth-main-desc{
    text-align: center;
}
.auth-main-title{
    color: #93C5FD; 
    font-weight:900;
    font-size: 4vh;
}
.auth-main-desc{
    color: #9ca3af;
}
.auth-question-ctn{
    text-align:center; 
    font-size:1em; 
    color:var(--slate-400); 
    margin-top:auto;
}
.auth-question-link{
    color:var(--blue-300); 
    font-weight:600;
}
.fine-print {
    text-align: center;
    font-size: 1.8vh;
    color: var(--slate-600);
    line-height: 1.5;
}

@media screen and (max-width: 990px) and  {
    .auth-main{
        width: 60vw;
    }
}
@media screen and (max-width: 650px) {
    .auth-main{
        width: 60vw;
    }
}
</style>