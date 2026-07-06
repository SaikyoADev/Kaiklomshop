<template>
  <section class="view" :class="{ active: shop.state.view === 'home' }">
    <div class="section-title">
      <div>
        <p>สินค้าทั้งหมด</p>
        <h2>เลือกไอดีเกมที่ต้องการ</h2>
      </div>
      <div class="filters">
        <button
          v-for="category in shop.categoryFilters.value"
          :key="category"
          :class="{ active: shop.state.activeCategory === category }"
          @click="shop.state.activeCategory = category"
        >
          {{ category }}
        </button>
      </div>
    </div>

    <div class="product-grid">
      <ProductCard
        v-for="product in shop.filteredProducts.value"
        :key="product.id"
        :product="product"
        @buy="(p) => $emit('buy', p)"
      />
      <div v-if="shop.filteredProducts.value.length === 0" class="panel">ยังไม่มีสินค้าในหมวดนี้</div>
    </div>
  </section>
</template>

<script setup>
import { useShop } from "../composables/useShop";
import ProductCard from "./ProductCard.vue";

defineEmits(["buy"]);
const shop = useShop();
</script>
