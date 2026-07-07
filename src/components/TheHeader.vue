<template>
  <header class="topbar">
    <div class="brand" @click="shop.setView('home')">
      <div class="brand-mark">
        <img src="/kaiklom-logo.png" alt="Kaiklomshop" />
      </div>
      <div class="brand-text">
        <strong>Kaiklomshop</strong>
        <span>Game ID Marketplace</span>
      </div>
    </div>

    <nav class="nav-actions">
      <button class="ghost" :class="{ active: shop.state.view === 'home' }" @click="shop.setView('home')">หน้าร้าน</button>
      <button class="ghost" :class="{ active: shop.state.view === 'topup' }" @click="shop.setView('topup')">เติมพอยต์</button>
      <button class="ghost" :class="{ active: shop.state.view === 'orders' }" @click="shop.setView('orders')">ประวัติการซื้อ</button>
      <button class="ghost" :class="{ active: shop.state.view === 'spin' }" @click="shop.setView('spin')">กงล้อ</button>
      <button v-if="shop.state.me" class="ghost" :class="{ active: shop.state.view === 'profile' }" @click="shop.setView('profile')">โปรไฟล์</button>
      <button v-if="shop.isAdmin.value" class="ghost" :class="{ active: shop.state.view === 'admin' }" @click="shop.setView('admin')">หลังบ้าน</button>
    </nav>

    <div class="account-actions">
      <div v-if="shop.state.me" class="wallet">{{ shop.baht(shop.state.me.points) }} | {{ shop.state.me.name }}</div>
      <button v-if="!shop.state.me" class="outline" @click="$emit('open-auth', 'login')">เข้าสู่ระบบ</button>
      <button v-if="!shop.state.me" class="solid" @click="$emit('open-auth', 'register')">สมัครสมาชิก</button>
      <button v-if="shop.state.me" class="outline" @click="shop.logout">ออกจากระบบ</button>
    </div>
  </header>
</template>

<script setup>
import { useShop } from "../composables/useShop";

defineEmits(["open-auth"]);
const shop = useShop();
</script>
