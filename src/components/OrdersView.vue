<template>
  <section class="view" :class="{ active: shop.state.view === 'orders' }">
    <div class="section-title">
      <div>
        <p>ประวัติการซื้อ</p>
        <h2>รายการที่ซื้อแล้ว</h2>
      </div>
    </div>
    <div class="history-list">
      <article v-for="order in shop.state.orders" :key="order.id" class="history-item">
        <div>
          <h3>{{ order.productTitle }}</h3>
          <span>{{ shop.baht(order.price) }} | {{ shop.dateText(order.createdAt) }}</span>
          <div class="secret" :class="{ visible: shop.state.visibleSecrets[order.id] }">
            <div>Username: <strong>{{ order.credential.username }}</strong></div>
            <div>Password: <strong>{{ order.credential.password }}</strong></div>
            <div>หมายเหตุ: {{ order.credential.note || '-' }}</div>
          </div>
        </div>
        <button class="outline" @click="shop.toggleSecret(order.id)">
          {{ shop.state.visibleSecrets[order.id] ? 'ซ่อนรหัส' : 'ดูรหัส' }}
        </button>
      </article>
      <div v-if="!shop.state.me" class="panel">เข้าสู่ระบบเพื่อดูประวัติการซื้อ</div>
      <div v-else-if="shop.state.orders.length === 0" class="panel">ยังไม่มีประวัติการซื้อ</div>
    </div>
  </section>
</template>

<script setup>
import { useShop } from "../composables/useShop";
const shop = useShop();
</script>
