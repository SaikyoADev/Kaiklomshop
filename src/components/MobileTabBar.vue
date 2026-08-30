<template>
  <nav class="mobile-tabbar" aria-label="เมนูหลัก">
    <button
      v-for="tab in tabs"
      :key="tab.view"
      :class="{ active: shop.state.view === tab.view }"
      @click="shop.setView(tab.view)"
    >
      <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <template v-if="tab.icon === 'home'">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </template>
        <template v-else-if="tab.icon === 'wallet'">
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
          <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
        </template>
        <template v-else-if="tab.icon === 'spin'">
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="12" x2="12" y2="3" />
          <line x1="12" y1="12" x2="19.5" y2="16.5" />
          <line x1="12" y1="12" x2="4.5" y2="16.5" />
        </template>
        <template v-else-if="tab.icon === 'receipt'">
          <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
          <path d="M8 7h8" />
          <path d="M8 11h8" />
          <path d="M8 15h5" />
        </template>
        <template v-else-if="tab.icon === 'user'">
          <path d="M20 21a8 8 0 0 0-16 0" />
          <circle cx="12" cy="7" r="4" />
        </template>
        <template v-else-if="tab.icon === 'settings'">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
        </template>
      </svg>
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
    { view: "home", icon: "home", label: "หน้าร้าน" },
    { view: "topup", icon: "wallet", label: "เติมเงิน" },
    { view: "spin", icon: "spin", label: "กงล้อ" },
    { view: "orders", icon: "receipt", label: "ประวัติ" },
    { view: "profile", icon: "user", label: "โปรไฟล์" },
  ];
  if (shop.isAdmin.value) {
    base.push({ view: "admin", icon: "settings", label: "หลังบ้าน" });
  }
  return base;
});
</script>
