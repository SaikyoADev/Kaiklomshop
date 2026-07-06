<template>
  <div class="panel admin-users-panel">
    <div class="panel-heading">
      <h2>สมาชิกในระบบ</h2>
      <span>{{ shop.state.admin.users.length }} บัญชี</span>
    </div>
    <div class="admin-list" style="margin-top: 16px">
      <div v-for="user in shop.state.admin.users" :key="user.id" class="admin-item user-admin-item">
        <div>
          <h3>{{ user.name }}</h3>
          <span>Username: {{ user.username }} | {{ user.role }} | {{ shop.baht(user.points) }}</span>
          <small>สมัครเมื่อ {{ shop.dateText(user.createdAt) }}</small>
        </div>
        <div class="user-admin-actions">
          <input v-model="user.pointInput" type="number" min="1" placeholder="เพิ่มพอยต์" :disabled="user.role === 'admin'" />
          <button class="solid" :disabled="user.role === 'admin'" @click="shop.addPointsToUser(user)">เพิ่ม</button>
          <button class="outline danger" :disabled="user.role === 'admin'" @click="shop.deleteUser(user)">ลบ</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useShop } from "../../composables/useShop";
const shop = useShop();
</script>
