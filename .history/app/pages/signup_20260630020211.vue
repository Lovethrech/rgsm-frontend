<template>
    <div class="auth display-flex-center-center">
        <Auth/>
    </div>
</template>

<script setup>
useHead({
    title: "Auth | RGSM Dashboard"
})
</script>
<style scoped>
.auth{
    width: 100%;
    min-height: 100vh;
    padding: 5vh 0;
    line-height: 2;
    background: url("../assets/LandingPagePattern.svg") center/auto no-repeat;
    background-size: cover;
}
</style>