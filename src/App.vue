<template>
  <Transition name="loader">
    <div v-if="!appReady" class="app-loader" role="status" aria-live="polite">
      <div class="loader-card">
        <div class="loader-logo">
          <img src="/kaiklom-logo.png" alt="Kaiklomshop" />
        </div>
        <strong>Kaiklomshop</strong>
        <span>กำลังโหลดร้านค้า...</span>
        <div class="loader-bar" aria-hidden="true"></div>
      </div>
    </div>
  </Transition>

  <TheHeader @open-auth="openAuth" />

  <main :class="{ 'page-ready': appReady }">
    <HeroSection />
    <NoticeBanner />
    <HomeView @buy="(product) => shop.requestPurchase(product, openAuth)" />
    <TopupView @submit-topup="shop.createTopup(openAuth)" />
    <OrdersView />
    <SpinView :open-auth="openAuth" />
    <ProfileView />
    <AdminView />
    <PrivacyPolicyView />
  </main>

  <SiteFooter />

  <AuthDialog ref="authDialogRef" />
  <PurchaseConfirmDialog />
  <ToastMessage />
  <MobileTabBar />
  <ChatFab />
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useShop } from "./composables/useShop";

import TheHeader from "./components/TheHeader.vue";
import HeroSection from "./components/HeroSection.vue";
import NoticeBanner from "./components/NoticeBanner.vue";
import HomeView from "./components/HomeView.vue";
import TopupView from "./components/TopupView.vue";
import OrdersView from "./components/OrdersView.vue";
import SpinView from "./components/SpinView.vue";
import ProfileView from "./components/ProfileView.vue";
import AdminView from "./components/AdminView.vue";
import PrivacyPolicyView from "./components/PrivacyPolicyView.vue";
import SiteFooter from "./components/SiteFooter.vue";
import AuthDialog from "./components/AuthDialog.vue";
import PurchaseConfirmDialog from "./components/PurchaseConfirmDialog.vue";
import MobileTabBar from "./components/MobileTabBar.vue";
import ToastMessage from "./components/ToastMessage.vue";
import ChatFab from "./components/ChatFab.vue";

const shop = useShop();
const authDialogRef = ref(null);
const appReady = ref(false);

function openAuth(tab) {
  authDialogRef.value?.open(tab);
}

onMounted(async () => {
  await Promise.all([
    shop.loadBootstrap(),
    new Promise((resolve) => setTimeout(resolve, 850)),
  ]);
  appReady.value = true;
});
</script>
