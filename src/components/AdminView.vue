<template>
  <section class="view" :class="{ active: shop.state.view === 'admin' }">
    <div class="section-title">
      <div>
        <p>หลังบ้าน</p>
        <h2>จัดการร้านค้า</h2>
      </div>
    </div>

    <CollapsibleSection title="ภาพรวม" :open="shop.state.adminPanelOpen.stats" @toggle="shop.togglePanel('stats')">
      <AdminStats />
    </CollapsibleSection>

    <CollapsibleSection title="เพิ่มสินค้าใหม่" :open="shop.state.adminPanelOpen.addProduct" @toggle="shop.togglePanel('addProduct')">
      <AdminProductForm />
    </CollapsibleSection>

    <CollapsibleSection title="เพิ่มสต็อกสินค้า" :open="shop.state.adminPanelOpen.addStock" @toggle="shop.togglePanel('addStock')">
      <AdminStockForm />
    </CollapsibleSection>

    <CollapsibleSection title="โค้ดรับพอยต์" :open="shop.state.adminPanelOpen.codes" @toggle="shop.togglePanel('codes')">
      <AdminCodeManager />
    </CollapsibleSection>

    <CollapsibleSection title="กงล้อรับรางวัล" :open="shop.state.adminPanelOpen.spin" @toggle="shop.togglePanel('spin')">
      <AdminSpinManager />
    </CollapsibleSection>

    <CollapsibleSection title="รายการเติมเงิน" :open="shop.state.adminPanelOpen.topups" @toggle="shop.togglePanel('topups')">
      <AdminTopupList />
    </CollapsibleSection>

    <CollapsibleSection title="สินค้าในระบบ" :open="shop.state.adminPanelOpen.products" @toggle="shop.togglePanel('products')">
      <AdminProductList />
    </CollapsibleSection>

    <CollapsibleSection title="สมาชิกในระบบ" :open="shop.state.adminPanelOpen.users" @toggle="shop.togglePanel('users')">
      <AdminUserList />
    </CollapsibleSection>
  </section>
</template>

<script setup>
import { useShop } from "../composables/useShop";
import CollapsibleSection from "./CollapsibleSection.vue";
import AdminStats from "./admin/AdminStats.vue";
import AdminProductForm from "./admin/AdminProductForm.vue";
import AdminStockForm from "./admin/AdminStockForm.vue";
import AdminCodeManager from "./admin/AdminCodeManager.vue";
import AdminSpinManager from "./admin/AdminSpinManager.vue";
import AdminTopupList from "./admin/AdminTopupList.vue";
import AdminProductList from "./admin/AdminProductList.vue";
import AdminUserList from "./admin/AdminUserList.vue";

const shop = useShop();
</script>
