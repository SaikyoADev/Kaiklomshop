<template>
  <div class="panel">
    <div class="panel-heading">
      <h2>รายการเติมเงิน</h2>
      <button class="outline" @click="shop.hideReviewedTopups">ซ่อนรายการที่ตรวจแล้ว</button>
    </div>
    <div class="admin-list" style="margin-top: 16px">
      <div v-for="topup in shop.state.admin.topups" :key="topup.id" class="admin-item">
        <span class="status" :class="topup.status">{{ topup.status }}</span>
        <h3>{{ topup.user?.name || 'ไม่พบผู้ใช้' }} เติม {{ shop.baht(topup.amount) }}</h3>
        <span>Username: {{ topup.user?.username || '-' }}</span>
        <span>สลิป: {{ topup.slipRef }}</span>
        <small>{{ shop.dateText(topup.createdAt) }}</small>
        <template v-if="topup.status === 'pending'">
          <label>
            เลขอ้างอิงจาก LINE Krungthai
            <input v-model="topup.lineInput" placeholder="เช่น LINE-KTB-0001" />
          </label>
          <div class="nav-actions">
            <button class="solid" @click="shop.reviewTopup(topup, 'approved')">อนุมัติ</button>
            <button class="outline" @click="shop.reviewTopup(topup, 'rejected')">ปฏิเสธ</button>
          </div>
        </template>
        <span v-else>ตรวจแล้ว: {{ shop.dateText(topup.reviewedAt) }} {{ topup.lineRef ? `| LINE: ${topup.lineRef}` : '' }}</span>
        <div class="nav-actions">
          <button class="outline" @click="shop.hideTopup(topup.id)">ซ่อนรายการนี้</button>
        </div>
      </div>
      <div v-if="shop.state.admin.topups.length === 0" class="admin-item">ยังไม่มีรายการเติมเงิน</div>
    </div>
  </div>
</template>

<script setup>
import { useShop } from "../../composables/useShop";
const shop = useShop();
</script>
