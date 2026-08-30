<template>
  <section class="view" :class="{ active: shop.state.view === 'privacy' }">
    <div class="section-title">
      <div>
        <p>ความเป็นส่วนตัว</p>
        <h2>นโยบายความเป็นส่วนตัวและการใช้คุกกี้</h2>
      </div>
    </div>

    <div class="panel" style="display: flex; flex-direction: column; gap: 16px; max-width: 720px">
      <div>
        <h3 style="margin: 0 0 6px">ข้อมูลที่เราเก็บ</h3>
        <p class="muted" style="margin: 0">
          เราเก็บข้อมูลเท่าที่จำเป็นต่อการให้บริการเท่านั้น ได้แก่ ชื่อ ชื่อผู้ใช้ รหัสผ่าน (จัดเก็บแบบเข้ารหัส ไม่สามารถอ่านย้อนกลับได้)
          ยอดพอยต์ ประวัติการเติมเงินและการซื้อสินค้า เพื่อใช้ในการยืนยันตัวตนและให้บริการซื้อขายผ่านเว็บไซต์
        </p>
      </div>

      <div>
        <h3 style="margin: 0 0 6px">การใช้คุกกี้ (Cookies)</h3>
        <p class="muted" style="margin: 0">
          เว็บไซต์นี้ใช้คุกกี้ประเภท <strong>"จำเป็น" (Functional Cookie)</strong> เพียงอย่างเดียว
          เพื่อจดจำสถานะการเข้าสู่ระบบของคุณเท่านั้น คุกกี้นี้ไม่ได้ใช้เพื่อติดตามพฤติกรรม ไม่ได้ใช้เพื่อการโฆษณา
          และไม่ได้แชร์ข้อมูลให้บุคคลที่สาม
        </p>
      </div>

      <div>
        <h3 style="margin: 0 0 6px">การรักษาความปลอดภัยข้อมูล</h3>
        <p class="muted" style="margin: 0">
          รหัสผ่านของสมาชิกจัดเก็บด้วยการเข้ารหัสแบบทางเดียว (PBKDF2) และข้อมูลรหัสไอดีเกมที่ขายในระบบเข้ารหัสไว้ก่อนบันทึกลงฐานข้อมูล
          เพื่อป้องกันข้อมูลรั่วไหลแม้ในกรณีที่ฐานข้อมูลถูกเข้าถึงโดยไม่ได้รับอนุญาต
        </p>
      </div>

      <div>
        <h3 style="margin: 0 0 6px">สิทธิ์ของคุณ</h3>
        <p class="muted" style="margin: 0">
          คุณสามารถขอให้ลบบัญชีและข้อมูลของคุณออกจากระบบได้ โดยติดต่อผู้ดูแลร้านผ่านช่องทางแชทที่แสดงในหน้าเว็บไซต์
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useShop } from "../composables/useShop";
const shop = useShop();
</script>
