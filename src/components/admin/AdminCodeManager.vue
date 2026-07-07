<template>
  <div class="panel form-card">
    <h2>สร้างโค้ดรับพอยต์</h2>
    <form @submit.prevent="shop.createAdminCode" novalidate>
      <label>
        โค้ด (เว้นว่างให้ระบบสุ่มให้)
        <input v-model="shop.state.adminCodeForm.code" placeholder="เว้นว่าง = สุ่มอัตโนมัติ" style="text-transform: uppercase" />
      </label>
      <div class="two-col">
        <label>พอยต์ที่จะได้รับ <input v-model="shop.state.adminCodeForm.points" type="number" min="1" placeholder="100" required /></label>
        <label>ใช้ได้กี่ครั้ง <input v-model="shop.state.adminCodeForm.maxUses" type="number" min="1" placeholder="1" /></label>
      </div>
      <label>วันหมดอายุ (ไม่บังคับ) <input v-model="shop.state.adminCodeForm.expiresAt" type="datetime-local" /></label>
      <button class="solid" type="submit">สร้างโค้ด</button>
    </form>
  </div>

  <div class="panel">
    <h2>โค้ดทั้งหมด</h2>
    <div class="admin-list" style="margin-top: 16px">
      <div v-for="code in shop.state.adminCodes" :key="code.id" class="admin-item">
        <span class="status" :class="code.active ? 'approved' : 'rejected'">{{ code.active ? 'ใช้งานอยู่' : 'ปิดใช้งาน' }}</span>
        <h3 style="font-family: monospace">{{ code.code }}</h3>
        <span>{{ shop.baht(code.points) }} ต่อครั้ง | ใช้ไปแล้ว {{ code.usedCount }}/{{ code.maxUses }} ครั้ง</span>
        <small v-if="code.expiresAt">หมดอายุ: {{ shop.dateText(code.expiresAt) }}</small>
        <small>สร้างเมื่อ {{ shop.dateText(code.createdAt) }}</small>
        <div class="nav-actions">
          <button class="outline" @click="shop.toggleAdminCode(code)">{{ code.active ? 'ปิดใช้งาน' : 'เปิดใช้งาน' }}</button>
          <button class="outline danger" @click="shop.deleteAdminCode(code)">ลบ</button>
        </div>
      </div>
      <div v-if="shop.state.adminCodes.length === 0" class="admin-item">ยังไม่มีโค้ด</div>
    </div>
  </div>
</template>

<script setup>
import { useShop } from "../../composables/useShop";
const shop = useShop();
</script>
