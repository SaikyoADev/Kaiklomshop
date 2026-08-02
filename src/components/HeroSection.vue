<template>
  <section class="hero" :style="heroStyle">
    <div class="hero-copy">
      <p class="eyebrow">ระบบซื้อขายไอดีเกมออนไลน์</p>
      <h1>Kaiklomshop</h1>
      <p>
        ร้านขายรหัสเกมและไอดีพร้อมเล่นแบบเติมพอยต์ก่อนซื้อ มีสต็อกแยกชิ้น
        ซื้อสำเร็จแล้วเปิดดู username และ password ได้ทันทีในประวัติสมาชิก
      </p>
      <div class="hero-actions">
        <button class="solid" @click="shop.setView('home')">ดูสินค้าทั้งหมด</button>
        <button class="outline light" @click="shop.setView('topup')">เติมพอยต์</button>
      </div>
    </div>

    <div class="hero-art" aria-hidden="true">
      <div class="game-card big" :class="{ 'has-image': shop.state.heroCardImage }">
        <img v-if="shop.state.heroCardImage" :src="shop.state.heroCardImage" alt="" class="game-card-image" />
        <div class="game-card-content">
          <span>GAME ID</span>
          <strong>ไอดีพร้อมเล่น</strong>
          <small>สต็อกอัปเดตสด รับประกันทุกออเดอร์</small>
        </div>
      </div>
      <div class="floating-card one">Stock Live</div>
      <div class="floating-card two">Point Wallet</div>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { useShop } from "../composables/useShop";
const shop = useShop();

const heroStyle = computed(() => {
  if (!shop.state.heroImage) return {};
  return { "--hero-bg-image": `url("${shop.state.heroImage}")` };
});
</script>
