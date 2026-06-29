<script setup>
const formInputAndLabelDatas=[
    {
        "id":1,
        "name":"Username",
        "nameType":"text",
        "placeholder":"Your Username",
        "errorMsg":"Your Username is empty"
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
    <form action="" class="auth-login">


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