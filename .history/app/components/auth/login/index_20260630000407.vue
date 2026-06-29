<script setup>
const formInputAndLabelDatas=[
    {
        "id":1,
        "name":"Email",
        "nameType":"email",
        "placeholder":"Your Email",
        "errorMsg":"Your Email is empty"
    },
    {
        "id":2,
        "name":"Password",
        "nameType":"Password",
        "placeholder":"***************",
        "errorMsg":"Passord cannot be empty"
    }
]
const nameValue=ref("");
const passwordValue=ref("");
const botCheckBoxValue=ref("");
const displayError=ref("none");

const submitLoginDetails=()=>{
    if (((nameValue.value==="") ||(passwordValue.value==="")) || ((nameValue.value==="") && (passwordValue.value===""))){
        displayError.value="flex";
    }
}
</script>

<template>
    <form class="auth-login">
        <div class="form-input-and-label-ctn" v-for="formInputAndLabelData in formInputAndLabelDatas" :key="formInputAndLabelData.id">
            <label :for="formInputAndLabelData.name">
                {{formInputAndLabelData.name}}:*
            </label>
            <input :value="formInputAndLabelData.value" :name="formInputAndLabelData.name" :type="formInputAndLabelData.nameType" :placeholder="formInputAndLabelData.namePlaceholder" required/>
            <p class="form-input-and-label-error" :style="{display: displayError}">
                {{formInputAndLabelData.errorMsg}}
            </p>
        </div>
        <div class="auth-bot-question">
            <input :value="botCheckBoxValue" type="checkbox" name="auth-bot" id="auth-bot" required>
            <label for="auth-bot">
                I am not a robot
            </label>
        </div>
        <br/>
        <div class="auth-btn-ctn">
            <button class="auth-btn" type="submit">
                Login
            </button>
        </div>
        <!-- 
        <br/>
        <AuthBotQ :botCheckBoxValue="botCheckBoxValue"/>
        <AuthLoginButton @click="submitLoginDetails"/> -->
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