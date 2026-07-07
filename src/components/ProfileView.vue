<template>
  <section class="view" :class="{ active: shop.state.view === 'profile' }">
    <div class="section-title">
      <div>
        <p>บัญชีของฉัน</p>
        <h2>โปรไฟล์</h2>
      </div>
    </div>

    <div v-if="shop.state.me" class="split-layout">
      <div class="panel">
        <h2>ข้อมูลบัญชี</h2>
        <div class="profile-info">
          <div class="profile-row"><span>ชื่อที่แสดง</span><strong>{{ shop.state.me.name }}</strong></div>
          <div class="profile-row"><span>ชื่อผู้ใช้</span><strong>{{ shop.state.me.username }}</strong></div>
          <div class="profile-row"><span>สิทธิ์การใช้งาน</span><strong>{{ shop.state.me.role === 'admin' ? 'ผู้ดูแลระบบ' : 'สมาชิกทั่วไป' }}</strong></div>
          <div class="profile-row"><span>พอยต์คงเหลือ</span><strong class="price">{{ shop.baht(shop.state.me.points) }}</strong></div>
          <div class="profile-row"><span>สมัครสมาชิกเมื่อ</span><strong>{{ shop.dateText(shop.state.me.createdAt) }}</strong></div>
        </div>
      </div>

      <form class="panel form-card" @submit.prevent="shop.redeemCode" novalidate>
        <h2>กรอกโค้ดรับพอยต์</h2>
        <label>
          โค้ดรับพอยต์
          <input v-model="shop.state.redeemForm.code" type="text" placeholder="เช่น KAIKLOM-XXXX-XXXX" style="text-transform: uppercase" />
        </label>
        <button class="solid" type="submit">ใช้โค้ด</button>
        <p class="muted" style="font-size: 13px; margin: 0">
          รับโค้ดได้จากแอดมินหรือกิจกรรมของร้าน โค้ดแต่ละอันใช้ได้ 1 ครั้งต่อบัญชี
        </p>
      </form>
    </div>

    <div v-else class="panel">เข้าสู่ระบบเพื่อดูข้อมูลโปรไฟล์</div>
  </section>
</template>

<script setup>
import { useShop } from "../composables/useShop";
const shop = useShop();
</script>
