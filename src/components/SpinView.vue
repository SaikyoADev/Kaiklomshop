<template>
  <section class="view" :class="{ active: shop.state.view === 'spin' }">
    <div class="section-title">
      <div>
        <p>เสี่ยงดวง</p>
        <h2>กงล้อรับรางวัล</h2>
      </div>
    </div>

    <div class="spin-layout">
      <div class="spin-wheel-wrap">
        <div class="spin-pointer" aria-hidden="true">▼</div>
        <div class="spin-wheel" :style="wheelStyle" ref="wheelRef">
          <div
            v-for="(prize, index) in shop.state.spin.prizes"
            :key="prize.id"
            class="spin-label"
            :style="labelStyle(index)"
          >
            {{ prize.label }}
          </div>
        </div>
      </div>

      <div class="panel spin-panel">
        <h2>หมุนกงล้อ</h2>
        <p class="muted" style="margin: 0">
          ราคาต่อการหมุน: <strong>{{ shop.baht(shop.state.spin.costPerSpin) }}</strong>
        </p>
        <button
          class="solid"
          :disabled="shop.state.spin.spinning || !shop.state.me"
          @click="doSpin"
        >
          {{ shop.state.spin.spinning ? 'กำลังหมุน...' : (shop.state.me ? 'หมุนเลย!' : 'เข้าสู่ระบบเพื่อหมุน') }}
        </button>

        <div class="spin-legend">
          <div v-for="prize in shop.state.spin.prizes" :key="prize.id" class="spin-legend-row">
            <span class="spin-swatch" :style="{ background: prize.color }"></span>
            <span>{{ prize.label }}</span>
            <span class="muted">{{ prize.percent }}%</span>
          </div>
          <div v-if="shop.state.spin.prizes.length === 0" class="muted">ยังไม่มีของรางวัลตอนนี้</div>
        </div>
      </div>
    </div>

    <div v-if="resultVisible && shop.state.spin.lastResult" class="spin-result-overlay" @click.self="closeResult">
      <div class="panel spin-result-card">
        <h2>🎉 ยินดีด้วย!</h2>
        <p class="spin-result-label">{{ shop.state.spin.lastResult.prizeLabel }}</p>
        <p v-if="shop.state.spin.lastResult.pointsWon > 0 && shop.state.spin.lastResult.prizeType === 'points'">
          ได้รับ {{ shop.baht(shop.state.spin.lastResult.pointsWon) }}
        </p>
        <p v-if="shop.state.spin.lastResult.codeWon">
          ได้รับโค้ด: <strong style="font-family: monospace">{{ shop.state.spin.lastResult.codeWon }}</strong>
          <br /><small class="muted">มูลค่า {{ shop.baht(shop.state.spin.lastResult.pointsWon) }} — ไปกรอกที่หน้าโปรไฟล์ได้เลย</small>
        </p>
        <p v-if="shop.state.spin.lastResult.prizeType === 'product'">
          ได้รับสินค้าฟรี! ดูรายละเอียดได้ที่ประวัติการซื้อ
        </p>
        <button class="solid" @click="closeResult">ปิด</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from "vue";
import { useShop } from "../composables/useShop";

const props = defineProps({ openAuth: { type: Function, required: true } });

const shop = useShop();
const wheelRef = ref(null);
const rotation = ref(0);
const resultVisible = ref(false);

const wheelStyle = computed(() => {
  const prizes = shop.state.spin.prizes;
  if (!prizes.length) {
    return { background: "#2a2118", transform: `rotate(${rotation.value}deg)` };
  }
  let cumulative = 0;
  const stops = prizes.map((p) => {
    const start = cumulative;
    cumulative += p.percent;
    return `${p.color} ${start}% ${cumulative}%`;
  });
  return {
    background: `conic-gradient(${stops.join(", ")})`,
    transform: `rotate(${rotation.value}deg)`,
  };
});

function labelStyle(index) {
  const prizes = shop.state.spin.prizes;
  let cumulative = 0;
  for (let i = 0; i < index; i++) cumulative += prizes[i].percent;
  const mid = cumulative + prizes[index].percent / 2;
  const angle = (mid / 100) * 360;
  return { transform: `rotate(${angle}deg) translateY(-38%)` };
}

async function doSpin() {
  const prizesBefore = shop.state.spin.prizes;
  const data = await shop.spinWheel(props.openAuth);
  if (!data) return;

  const index = prizesBefore.findIndex((p) => p.id === data.prizeId);
  let targetMidAngle = 180;
  if (index !== -1) {
    let cumulative = 0;
    for (let i = 0; i < index; i++) cumulative += prizesBefore[i].percent;
    targetMidAngle = cumulative + prizesBefore[index].percent / 2;
  }
  // Spin several full turns, then land so the pointer (fixed at top) points at the winning segment.
  const extraSpins = 5 * 360;
  const finalAngle = extraSpins + (360 - (targetMidAngle / 100) * 360);
  rotation.value = rotation.value - (rotation.value % 360) + finalAngle;

  setTimeout(() => {
    shop.finishSpinAnimation();
    resultVisible.value = true;
  }, 4200);
}

function closeResult() {
  resultVisible.value = false;
}
</script>
