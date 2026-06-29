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
        <div class="form-input-and-label-ctn" v-for="formInputAndLabelData in formInpoutAndLabelDatas" :key="formInputAndLabelData.id">
            <label :for="formInputNaname">
                {{name}}:*
            </label>
            <input :value="value" :name="name" :type="nameType" :placeholder="namePlaceholder" required/>
            <p class="form-input-and-label-error" :style="{display: displayError}">
                {{errorMsg}}
            </p>
        </div>

        <!-- <AuthInputAndLabel 
            :name="formInputAndLabelDatas[0].name"
            :nameType="formInputAndLabelDatas[0].nameType"
            :namePlaceholder="formInputAndLabelDatas[0].placeholder"
            :errorMsg="formInputAndLabelDatas[0].errorMsg"
            :value="nameValue"
            :displayError="displayError"
        />
        <AuthInputAndLabel 
            :name="formInputAndLabelDatas[1].name"
            :nameType="formInputAndLabelDatas[1].nameType"
            :namePlaceholder="formInputAndLabelDatas[1].placeholder"
            :errorMsg="formInputAndLabelDatas[1].errorMsg"
            :value="passwordValue"
            :displayError="displayError"
        />
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
.form-input-and-label-ctn label, .form-input-and-label-error{
    background-color: #000000;
    padding: 0.3vh 1vh;
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
</style>