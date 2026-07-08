<template>
  <div class="panel admin-users-panel">
    <div class="panel-heading">
      <h2>สมาชิกในระบบ</h2>
      <span>{{ shop.state.adminUsers.total }} บัญชี</span>
    </div>

    <div class="user-search-row">
      <input
        v-model="shop.state.adminUsers.search"
        type="search"
        placeholder="ค้นหาชื่อผู้ใช้หรือชื่อสมาชิก..."
        @keyup.enter="shop.searchAdminUsers"
      />
      <button class="outline" @click="shop.searchAdminUsers">ค้นหา</button>
    </div>

    <div class="admin-list" style="margin-top: 16px">
      <div v-for="user in shop.state.adminUsers.list" :key="user.id" class="admin-item user-admin-item">
        <div>
          <h3>
            {{ user.name }}
            <span v-if="user.banned" class="status rejected" style="margin-left: 6px">ถูกแบน</span>
          </h3>
          <span>Username: {{ user.username }} | {{ user.role === 'admin' ? 'แอดมิน' : 'สมาชิก' }} | {{ shop.baht(user.points) }}</span>
          <small>สมัครเมื่อ {{ shop.dateText(user.createdAt) }}</small>
          <small v-if="user.banned && user.banReason">เหตุผลที่แบน: {{ user.banReason }}</small>
        </div>

        <div class="user-admin-actions">
          <input v-model="user.pointInput" type="number" min="1" placeholder="จำนวนพอยต์" :disabled="user.role === 'admin'" />
          <button class="solid" :disabled="user.role === 'admin'" @click="shop.adjustUserPoints(user, 1)">+ เพิ่ม</button>
          <button class="outline" :disabled="user.role === 'admin'" @click="shop.adjustUserPoints(user, -1)">- ลด</button>
        </div>

        <div class="user-admin-actions">
          <button
            v-if="user.role !== 'admin'"
            class="outline"
            @click="shop.setUserRole(user, 'admin')"
          >
            ตั้งเป็นแอดมิน
          </button>
          <button v-else class="outline" @click="shop.setUserRole(user, 'user')">ถอดสิทธิ์แอดมิน</button>

          <button class="outline" :disabled="user.role === 'admin'" @click="shop.toggleBanUser(user)">
            {{ user.banned ? 'ปลดแบน' : 'แบน' }}
          </button>
          <button class="outline danger" :disabled="user.role === 'admin'" @click="shop.deleteUser(user)">ลบ</button>
        </div>
      </div>
      <div v-if="shop.state.adminUsers.list.length === 0" class="admin-item">ไม่พบสมาชิก</div>
    </div>

    <div class="user-pagination" v-if="totalPages > 1">
      <button class="outline" :disabled="shop.state.adminUsers.page <= 1" @click="shop.goToUsersPage(shop.state.adminUsers.page - 1)">‹ ก่อนหน้า</button>
      <span>หน้า {{ shop.state.adminUsers.page }} / {{ totalPages }}</span>
      <button class="outline" :disabled="shop.state.adminUsers.page >= totalPages" @click="shop.goToUsersPage(shop.state.adminUsers.page + 1)">ถัดไป ›</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useShop } from "../../composables/useShop";
const shop = useShop();
const totalPages = computed(() => Math.max(1, Math.ceil(shop.state.adminUsers.total / shop.state.adminUsers.pageSize)));
</script>
