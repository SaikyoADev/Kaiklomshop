<template>
  <div v-if="shop.state.purchase.pendingProduct" class="spin-result-overlay" @click.self="shop.cancelPurchase">
    <div class="panel purchase-confirm-card">
      <h2>ยืนยันการซื้อ</h2>
      <p class="purchase-confirm-product">{{ shop.state.purchase.pendingProduct.title }}</p>
      <p class="purchase-confirm-price">{{ shop.baht(shop.state.purchase.pendingProduct.price) }}</p>

      <div class="purchase-record-notice">
        <strong>⚠️ กรุณาอัดคลิปหน้าจอไว้เป็นหลักฐาน</strong>
        <p>
          แนะนำให้เริ่มอัดคลิปตั้งแต่ก่อนกดยืนยันซื้อ ต่อเนื่องไปจนถึงหน้าเข้าสู่ระบบและเห็นรหัสสินค้า
          เพื่อใช้เป็นหลักฐานหากมีปัญหาเกี่ยวกับออเดอร์นี้ในภายหลัง
        </p>
      </div>

      <div class="nav-actions" style="justify-content: center">
        <button class="solid" :disabled="shop.state.purchase.confirming" @click="shop.confirmPurchase">
          {{ shop.state.purchase.confirming ? 'กำลังดำเนินการ...' : 'ยืนยันซื้อ' }}
        </button>
        <button class="outline" :disabled="shop.state.purchase.confirming" @click="shop.cancelPurchase">ยกเลิก</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useShop } from "../composables/useShop";
const shop = useShop();
</script>
