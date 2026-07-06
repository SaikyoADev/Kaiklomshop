<template>
  <div class="panel">
    <h2>สินค้าในระบบ</h2>
    <div class="admin-list" style="margin-top: 16px">
      <div v-for="product in shop.state.admin.products" :key="product.id" class="admin-item product-admin-item">
        <div class="product-admin-head">
          <div>
            <h3>{{ product.title }}</h3>
            <span>{{ product.category }} | {{ shop.baht(product.price) }} | สต็อก {{ product.stock }}</span>
          </div>
          <span class="status" :class="product.status === 'active' ? 'approved' : 'rejected'">{{ product.status }}</span>
        </div>
        <div class="product-edit-grid">
          <label>ชื่อสินค้า <input v-model="product.title" /></label>
          <label>เกม <input v-model="product.game" /></label>
          <label>หมวดหมู่ <input v-model="product.category" /></label>
          <label>ราคา <input v-model="product.price" type="number" min="1" /></label>
          <label class="wide">URL รูปสินค้า <input v-model="product.image" /></label>
          <label>
            สถานะ
            <select v-model="product.status">
              <option value="active">แสดงสินค้า</option>
              <option value="hidden">ซ่อนสินค้า</option>
            </select>
          </label>
          <label class="wide">รายละเอียด <textarea v-model="product.description" rows="3"></textarea></label>
        </div>
        <div class="nav-actions">
          <button class="solid" @click="shop.updateProduct(product)">บันทึกการแก้ไข</button>
          <button class="outline danger" @click="shop.deleteProduct(product)">ลบสินค้า</button>
        </div>
      </div>
      <div v-if="shop.state.admin.products.length === 0" class="admin-item">ยังไม่มีสินค้า</div>
    </div>
  </div>
</template>

<script setup>
import { useShop } from "../../composables/useShop";
const shop = useShop();
</script>
