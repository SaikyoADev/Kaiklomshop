<template>
  <dialog class="auth-dialog" ref="dialogRef">
    <form method="dialog" class="dialog-card">
      <button class="icon-close" value="cancel" aria-label="ปิด">x</button>
      <h2>เข้าร่วม Kaiklomshop</h2>
      <div class="tabs">
        <button type="button" :class="{ active: shop.state.authTab === 'login' }" @click="shop.state.authTab = 'login'">เข้าสู่ระบบ</button>
        <button type="button" :class="{ active: shop.state.authTab === 'register' }" @click="shop.state.authTab = 'register'">สมัครสมาชิก</button>
      </div>

      <div class="auth-pane" :class="{ active: shop.state.authTab === 'login' }">
        <label>ชื่อผู้ใช้ <input v-model="shop.state.loginForm.username" autocomplete="username" placeholder="demo หรือ admin" /></label>
        <label>รหัสผ่าน <input v-model="shop.state.loginForm.password" type="password" autocomplete="current-password" placeholder="••••••••" /></label>
        <button class="solid" type="button" @click="doLogin">เข้าสู่ระบบ</button>
      </div>

      <div class="auth-pane" :class="{ active: shop.state.authTab === 'register' }">
        <label>ชื่อที่แสดง <input v-model="shop.state.registerForm.name" autocomplete="name" placeholder="ชื่อของคุณ" /></label>
        <label>ชื่อผู้ใช้ <input v-model="shop.state.registerForm.username" autocomplete="username" placeholder="username" /></label>
        <label>รหัสผ่าน <input v-model="shop.state.registerForm.password" type="password" autocomplete="new-password" placeholder="••••••••" /></label>
        <button class="solid" type="button" @click="doRegister">สมัครสมาชิก</button>
      </div>
    </form>
  </dialog>
</template>

<script setup>
import { ref } from "vue";
import { useShop } from "../composables/useShop";

const shop = useShop();
const dialogRef = ref(null);

function open(tab) {
  shop.state.authTab = tab;
  dialogRef.value.showModal();
}

async function doLogin() {
  if (await shop.login()) dialogRef.value.close();
}

async function doRegister() {
  if (await shop.register()) dialogRef.value.close();
}

defineExpose({ open });
</script>
