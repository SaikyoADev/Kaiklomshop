<template>
  <footer class="site-footer">
    <span>© {{ year }} Kaiklomshop</span>
    <button class="footer-link" @click="shop.setView('privacy')">นโยบายความเป็นส่วนตัว</button>
  </footer>
</template>

<script setup>
import { computed } from "vue";
import { useShop } from "../composables/useShop";
const shop = useShop();
const year = computed(() => new Date().getFullYear() + 543); // Buddhist calendar year, matches Thai site convention
</script>
