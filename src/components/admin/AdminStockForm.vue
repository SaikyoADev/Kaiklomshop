<template>
  <form class="panel form-card" @submit.prevent="shop.addStock" novalidate>
    <h2>เพิ่มสต็อก</h2>
    <label>
      เลือกสินค้า
      <select v-model="shop.state.stockForm.productId">
        <option v-for="product in shop.state.admin.products" :key="product.id" :value="product.id">
          {{ product.title }} ({{ product.stock }} ชิ้น)
        </option>
      </select>
    </label>
    <label>
      รายการรหัส (บรรทัดละ 1 ชุด)
      <textarea v-model="shop.state.stockForm.rows" rows="9" placeholder="username|password|หมายเหตุ&#10;user2|pass2|หมายเหตุ"></textarea>
    </label>
    <button class="solid" type="submit">บันทึกสต็อก</button>
  </form>
</template>

<script setup>
import { useShop } from "../../composables/useShop";
const shop = useShop();
</script>
