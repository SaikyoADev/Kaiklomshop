<template>
  <div class="admin-stats">
    <div class="stat-card">
      <span>สมาชิกทั้งหมด</span>
      <strong>{{ shop.state.admin.stats?.userCount || 0 }}</strong>
    </div>
    <div class="stat-card">
      <span>ผู้ใช้ทั่วไป</span>
      <strong>{{ shop.state.admin.stats?.memberCount || 0 }}</strong>
    </div>
    <div class="stat-card">
      <span>เติมเงินรอตรวจ</span>
      <strong>{{ shop.state.admin.stats?.pendingTopups || 0 }}</strong>
    </div>
    <div class="stat-card">
      <span>ออเดอร์ทั้งหมด</span>
      <strong>{{ shop.state.admin.stats?.orderCount || 0 }}</strong>
    </div>
  </div>
</template>

<script setup>
import { useShop } from "../../composables/useShop";
const shop = useShop();
</script>
