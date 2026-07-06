<template>
  <form class="panel form-card" @submit.prevent="shop.createProduct" novalidate>
    <h2>เพิ่มสินค้า</h2>
    <label>ชื่อสินค้า <input v-model="shop.state.productForm.title" placeholder="Roblox Blox Fruits Lv.2450" required /></label>
    <div class="two-col">
      <label>เกม <input v-model="shop.state.productForm.game" required /></label>
      <label>ราคา (พอยต์) <input v-model="shop.state.productForm.price" type="number" min="1" placeholder="199" required /></label>
    </div>
    <label>หมวดหมู่ <input v-model="shop.state.productForm.category" /></label>
    <label>URL รูปสินค้า <input v-model="shop.state.productForm.image" type="url" placeholder="https://..." /></label>
    <label>รายละเอียด <textarea v-model="shop.state.productForm.description" rows="3" placeholder="รายละเอียดสินค้า"></textarea></label>
    <button class="solid" type="submit">เพิ่มสินค้า</button>
  </form>
</template>

<script setup>
import { useShop } from "../../composables/useShop";
const shop = useShop();
</script>
