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

    <h2 style="margin-top: 20px">โหมดปิดใช้งานเว็บไซต์</h2>
    <label class="toggle-row">
      <input
        v-model="shop.state.adminSiteSettings.site_maintenance_enabled"
        type="checkbox"
        true-value="1"
        false-value="0"
      />
      <span>เปิดโหมดปิดใช้งานเว็บสำหรับผู้ใช้ทั่วไป</span>
    </label>
    <label>
      เหตุผลที่แสดงให้ผู้ใช้เห็น
      <textarea
        v-model="shop.state.adminSiteSettings.site_maintenance_reason"
        rows="3"
        placeholder="เช่น เว็บไซต์ปิดปรับปรุงชั่วคราว กรุณากลับมาใหม่ภายหลัง"
      ></textarea>
    </label>
    <p class="muted" style="font-size: 13px; margin: 0">
      เมื่อเปิดใช้งาน แอดมินยังเข้าสู่ระบบและใช้หลังบ้านได้ แต่ผู้ใช้ทั่วไปจะเห็น popup แจ้งปิดใช้งาน
    </p>

    <h2 style="margin-top: 20px">ข้อมูลบัญชีรับเงิน (เก็บไว้เฉพาะหลังบ้าน)</h2>
    <label>ชื่อธนาคาร <input v-model="shop.state.adminSiteSettings.bank_name" placeholder="เช่น ธนาคารกรุงไทย" /></label>
    <label>ชื่อบัญชี <input v-model="shop.state.adminSiteSettings.bank_account_name" /></label>
    <label>เลขบัญชี <input v-model="shop.state.adminSiteSettings.bank_account_no" placeholder="เช่น 660-x-xxxxx-x" /></label>
    <label>ข้อความอธิบายระบบเติมเงิน <textarea v-model="shop.state.adminSiteSettings.bank_line_note" rows="3"></textarea></label>

    <button class="solid" @click="shop.saveSiteSettings">บันทึกการตั้งค่า</button>
  </div>
</template>

<script setup>
import { useShop } from "../../composables/useShop";
const shop = useShop();
</script>
