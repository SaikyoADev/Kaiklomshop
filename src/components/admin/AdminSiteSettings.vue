<template>
  <div class="panel form-card">
    <h2>รูปภาพหน้าแรก</h2>
    <label>
      URL รูปพื้นหลัง Hero (รูปด้านหลังตัวหนังสือ Kaiklomshop)
      <input v-model="shop.state.adminSiteSettings.hero_image" type="url" placeholder="https://..." />
    </label>
    <label>
      URL รูปในกล่อง "ไอดีพร้อมเล่น"
      <input v-model="shop.state.adminSiteSettings.hero_card_image" type="url" placeholder="https://... (เว้นว่างได้ถ้าไม่ต้องการรูป)" />
    </label>
    <p class="muted" style="font-size: 13px; margin: 0">
      ใส่ลิงก์รูปภาพที่โฮสต์ไว้ที่อื่น (เช่น imgur, ลิงก์รูปสินค้า) แล้วบันทึก ระบบจะเปลี่ยนให้ทันทีโดยไม่ต้องแก้โค้ด
    </p>

    <h2 style="margin-top: 20px">ข้อมูลบัญชีรับเงิน (แสดงคู่กับ QR)</h2>
    <label>ชื่อธนาคาร <input v-model="shop.state.adminSiteSettings.bank_name" placeholder="เช่น ธนาคารกรุงไทย" /></label>
    <label>ชื่อบัญชี <input v-model="shop.state.adminSiteSettings.bank_account_name" /></label>
    <label>เลขบัญชี (จะแสดงให้ลูกค้าเห็น) <input v-model="shop.state.adminSiteSettings.bank_account_no" placeholder="เช่น 660-x-xxxxx-x" /></label>
    <label>ข้อความอธิบายระบบเติมเงิน <textarea v-model="shop.state.adminSiteSettings.bank_line_note" rows="3"></textarea></label>

    <button class="solid" @click="shop.saveSiteSettings">บันทึกการตั้งค่า</button>
  </div>
</template>

<script setup>
import { useShop } from "../../composables/useShop";
const shop = useShop();
</script>
