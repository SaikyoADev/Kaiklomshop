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
        <img src="/promptpay-qr.jpg" alt="PromptPay QR สำหรับโอนเงิน" class="qr-image" />
        <h2>สแกนเพื่อโอนเงิน</h2>
        <div class="bank-card" v-if="shop.state.bank">
          <strong>{{ shop.state.bank.name }}</strong>
          <span>ชื่อบัญชี: {{ shop.state.bank.accountName }}</span>
          <span>เลขบัญชี: {{ shop.state.bank.accountNo }}</span>
          <small>{{ shop.state.bank.lineNote }}</small>
        </div>
        <p class="muted" style="font-size: 13px; margin: 0">
          หลังโอนเงิน ให้กรอกยอดและเลขอ้างอิงสลิป ระบบจะสร้างรายการรอตรวจในหลังบ้าน
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
