<template>
  <nav class="mobile-tabbar" aria-label="เมนูหลัก">
    <button
      v-for="tab in tabs"
      :key="tab.view"
      :class="{ active: shop.state.view === tab.view }"
      @click="shop.setView(tab.view)"
    >
      <span class="tab-icon">{{ tab.icon }}</span>
      <span>{{ tab.label }}</span>
    </button>
  </nav>
</template>

<script setup>
import { computed } from "vue";
import { useShop } from "../composables/useShop";

const shop = useShop();

const tabs = computed(() => {
  const base = [
    { view: "home", icon: "🏠", label: "หน้าร้าน" },
    { view: "topup", icon: "💰", label: "เติมเงิน" },
    { view: "spin", icon: "🎡", label: "กงล้อ" },
    { view: "orders", icon: "🧾", label: "ประวัติ" },
    { view: "profile", icon: "👤", label: "โปรไฟล์" },
  ];
  if (shop.isAdmin.value) {
    base.push({ view: "admin", icon: "🛠️", label: "หลังบ้าน" });
  }
  return base;
});
</script>
