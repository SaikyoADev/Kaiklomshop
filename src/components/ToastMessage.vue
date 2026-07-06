<template>
  <div class="toast" :class="{ show: shop.state.toastMessage }" role="alert" aria-live="polite">
    {{ shop.state.toastMessage }}
  </div>
</template>

<script setup>
import { useShop } from "../composables/useShop";
const shop = useShop();
</script>
