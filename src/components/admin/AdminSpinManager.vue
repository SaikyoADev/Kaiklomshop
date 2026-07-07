<template>
  <div class="panel form-card">
    <h2>ตั้งราคาต่อการหมุน</h2>
    <div class="two-col">
      <label>ราคาต่อการหมุน (พอยต์) <input v-model="shop.state.adminSpin.costPerSpin" type="number" min="1" /></label>
      <button class="solid" style="align-self: flex-end" @click="shop.updateSpinCost">บันทึกราคา</button>
    </div>
  </div>

  <div class="panel form-card">
    <h2>เพิ่มของรางวัล</h2>
    <form @submit.prevent="shop.createSpinPrize" novalidate>
      <label>ชื่อรางวัล <input v-model="shop.state.adminSpin.prizeForm.label" placeholder="เช่น 100 พอยต์" required /></label>
      <label>
        ประเภทรางวัล
        <select v-model="shop.state.adminSpin.prizeForm.type">
          <option value="points">พอยต์ทันที</option>
          <option value="code">โค้ดรับพอยต์</option>
          <option value="product">สินค้าฟรี</option>
        </select>
      </label>

      <label v-if="shop.state.adminSpin.prizeForm.type !== 'product'">
        พอยต์ที่จะได้รับ
        <input v-model="shop.state.adminSpin.prizeForm.pointsValue" type="number" min="0" placeholder="100" />
      </label>

      <label v-if="shop.state.adminSpin.prizeForm.type === 'product'">
        เลือกสินค้า
        <select v-model="shop.state.adminSpin.prizeForm.productId">
          <option value="">-- เลือกสินค้า --</option>
          <option v-for="product in shop.state.admin.products" :key="product.id" :value="product.id">
            {{ product.title }} (สต็อก {{ product.stock }})
          </option>
        </select>
      </label>

      <div class="two-col">
        <label>น้ำหนัก/สัดส่วนโอกาสออก <input v-model="shop.state.adminSpin.prizeForm.weight" type="number" min="1" placeholder="10" /></label>
        <label>สี <input v-model="shop.state.adminSpin.prizeForm.color" type="color" /></label>
      </div>
      <p class="muted" style="font-size: 13px; margin: 0">
        % โอกาสออกจริงคำนวณอัตโนมัติจากน้ำหนักเทียบกับรางวัลอื่นที่เปิดใช้งานอยู่ (ไม่ต้องรวมให้ครบ 100 เอง)
      </p>
      <button class="solid" type="submit">เพิ่มรางวัล</button>
    </form>
  </div>

  <div class="panel">
    <h2>ของรางวัลทั้งหมด</h2>
    <div class="admin-list" style="margin-top: 16px">
      <div v-for="prize in shop.state.adminSpin.prizes" :key="prize.id" class="admin-item">
        <span class="status" :class="prize.active ? 'approved' : 'rejected'">{{ prize.active ? 'เปิดใช้งาน' : 'ปิดใช้งาน' }}</span>
        <h3>
          <span class="spin-swatch" :style="{ background: prize.color }" style="display:inline-block;width:12px;height:12px;border-radius:50%;margin-right:6px"></span>
          {{ prize.label }} — {{ prize.percent }}%
        </h3>
        <span>ประเภท: {{ prize.type === 'points' ? 'พอยต์ทันที' : prize.type === 'code' ? 'โค้ดรับพอยต์' : 'สินค้าฟรี' }}</span>
        <span v-if="prize.type !== 'product'">มูลค่า {{ shop.baht(prize.pointsValue) }}</span>
        <span v-else>สต็อกคงเหลือ {{ prize.stock ?? 0 }} ชิ้น</span>
        <div class="two-col">
          <label>ชื่อรางวัล <input v-model="prize.label" /></label>
          <label>น้ำหนัก <input v-model="prize.weight" type="number" min="1" /></label>
        </div>
        <div class="two-col">
          <label v-if="prize.type !== 'product'">พอยต์ <input v-model="prize.pointsValue" type="number" min="0" /></label>
          <label>สี <input v-model="prize.color" type="color" /></label>
        </div>
        <div class="nav-actions">
          <button class="solid" @click="shop.updateSpinPrize(prize)">บันทึก</button>
          <button class="outline" @click="shop.updateSpinPrize({ ...prize, active: prize.active ? 0 : 1 })">
            {{ prize.active ? 'ปิดใช้งาน' : 'เปิดใช้งาน' }}
          </button>
          <button class="outline danger" @click="shop.deleteSpinPrize(prize)">ลบ</button>
        </div>
      </div>
      <div v-if="shop.state.adminSpin.prizes.length === 0" class="admin-item">ยังไม่มีของรางวัล</div>
    </div>
  </div>
</template>

<script setup>
import { useShop } from "../../composables/useShop";
const shop = useShop();
</script>
