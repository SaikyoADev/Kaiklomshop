<template>
  <section class="view" :class="{ active: shop.state.view === 'topup' }">
    <div class="section-title">
      <div>
        <p>เติมเงิน</p>
        <h2>เติมพอยต์เข้าบัญชี</h2>
      </div>
    </div>
    <div class="split-layout">
      <div class="panel qr-panel">
        <div class="topup-safe-card">
          <span class="topup-safe-icon">!</span>
          <h2>ปิดการแสดง QR เติมเงิน</h2>
          <p>
            เพื่อความปลอดภัย ระบบไม่แสดง QR Code ชื่อบัญชี หรือเลขบัญชีบนหน้าเว็บแล้ว
          </p>
        </div>
        <div class="bank-card">
          <strong>ติดต่อแอดมินก่อนเติมพอยต์</strong>
          <span>กรุณาติดต่อผู้ดูแลระบบเพื่อรับช่องทางเติมพอยต์ที่ปลอดภัย</span>
          <small>ข้อมูลบัญชีรับเงินถูกซ่อนจากหน้าลูกค้าแล้ว</small>
        </div>
        <p class="muted" style="font-size: 13px; margin: 0">
          หากได้รับช่องทางเติมพอยต์จากแอดมินแล้ว ให้กรอกยอดและเลขอ้างอิงสลิป ระบบจะสร้างรายการรอตรวจในหลังบ้าน
        </p>
      </div>

      <form class="panel form-card" @submit.prevent="$emit('submit-topup')" novalidate>
        <h2>แจ้งเติมเงิน</h2>
        <label>
          ยอดโอน (บาท)
          <input v-model="shop.state.topupForm.amount" type="number" min="1" placeholder="เช่น 100" required />
        </label>
        <label>
          เลขอ้างอิง / รายละเอียดสลิป
          <input v-model="shop.state.topupForm.slipRef" type="text" placeholder="เช่น KTB202605200001" required />
        </label>
        <label>
          วันและเวลาที่โอน
          <input v-model="shop.state.topupForm.transferAt" type="datetime-local" />
        </label>
        <button class="solid" type="submit">ส่งรายการให้แอดมินตรวจ</button>
        <div class="mini-list">
          <div v-for="topup in shop.state.topups" :key="topup.id" class="mini-item">
            <span class="status" :class="topup.status">{{ topup.status }}</span>
            <strong>{{ shop.baht(topup.amount) }}</strong>
            <span>สลิป: {{ topup.slipRef }}</span>
            <small>{{ shop.dateText(topup.createdAt) }}</small>
          </div>
          <div v-if="!shop.state.me" class="mini-item">เข้าสู่ระบบเพื่อดูประวัติเติมเงิน</div>
          <div v-else-if="shop.state.topups.length === 0" class="mini-item">ยังไม่มีรายการเติมเงิน</div>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup>
import { useShop } from "../composables/useShop";

defineEmits(["submit-topup"]);
const shop = useShop();
</script>
