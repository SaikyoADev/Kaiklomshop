<template>
  <section class="view" :class="{ active: shop.state.view === 'admin' }">
    <div class="section-title">
      <div>
        <p>หลังบ้าน</p>
        <h2>จัดการร้านค้า</h2>
      </div>
    </div>

    <AdminStats />

    <div class="admin-grid">
      <AdminProductForm />
      <AdminStockForm />
    </div>

    <div class="admin-grid lower">
      <AdminTopupList />
      <AdminProductList />
    </div>

    <AdminUserList />
  </section>
</template>

<script setup>
import { useShop } from "../composables/useShop";
import AdminStats from "./admin/AdminStats.vue";
import AdminProductForm from "./admin/AdminProductForm.vue";
import AdminStockForm from "./admin/AdminStockForm.vue";
import AdminTopupList from "./admin/AdminTopupList.vue";
import AdminProductList from "./admin/AdminProductList.vue";
import AdminUserList from "./admin/AdminUserList.vue";

const shop = useShop();
</script>
