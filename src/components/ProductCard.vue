<template>
  <article class="product-card">
    <div class="product-image">
      <img v-if="product.image" :src="product.image" :alt="product.title" loading="lazy" />
      <span class="stock-badge">คงเหลือ {{ product.stock }} ชิ้น</span>
    </div>
    <div class="product-body">
      <div class="product-meta">
        <span>{{ product.game }}</span>
        <span>{{ product.category }}</span>
      </div>
      <h3>{{ product.title }}</h3>
      <p>{{ product.description || 'สินค้าพร้อมส่งอัตโนมัติหลังซื้อสำเร็จ' }}</p>
      <div class="buy-row">
        <span class="price">{{ shop.baht(product.price) }}</span>
        <button class="solid" :disabled="product.stock < 1" @click="$emit('buy', product)">
          {{ product.stock < 1 ? 'หมดสต็อก' : 'ซื้อเลย' }}
        </button>
      </div>
    </div>
  </article>
</template>

<script setup>
import { useShop } from "../composables/useShop";

defineProps({ product: { type: Object, required: true } });
defineEmits(["buy"]);
const shop = useShop();
</script>
