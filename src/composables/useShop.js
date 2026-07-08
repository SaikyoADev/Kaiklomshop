import { reactive, computed } from "vue";

// Singleton reactive state shared across every component (like a tiny store).
const state = reactive({
  token: localStorage.getItem("shopToken") || "",
  me: null,
  products: [],
  categories: [],
  activeCategory: "ทั้งหมด",
  bank: null,
  view: "home",
  authTab: "login",
  toastMessage: "",
  toastTimer: null,
  loginForm: { username: "", password: "" },
  registerForm: { name: "", username: "", password: "" },
  topupForm: { amount: "", slipRef: "", transferAt: "" },
  productForm: { title: "", game: "Roblox", category: "Roblox ID", price: "", image: "", description: "" },
  stockForm: { productId: "", rows: "" },
  topups: [],
  orders: [],
  visibleSecrets: {},
  admin: { products: [], topups: [], orders: [], stats: {} },
  adminUsers: { list: [], total: 0, page: 1, pageSize: 20, search: "" },
  redeemForm: { code: "" },
  adminCodeForm: { code: "", points: "", maxUses: 1, expiresAt: "" },
  adminCodes: [],
  spin: { costPerSpin: 0, prizes: [], spinning: false, lastResult: null },
  purchase: { pendingProduct: null, confirming: false },
  adminSpin: { prizes: [], costPerSpin: 0, prizeForm: { label: "", type: "points", pointsValue: "", productId: "", weight: 10, color: "#f59e0b" } },
  adminPanelOpen: {
    stats: true,
    addProduct: false,
    addStock: false,
    codes: false,
    spin: false,
    topups: false,
    products: false,
    users: false,
  },
});

const isAdmin = computed(() => state.me?.role === "admin");
const categoryFilters = computed(() => ["ทั้งหมด", ...state.categories]);
const filteredProducts = computed(() => {
  if (state.activeCategory === "ทั้งหมด") return state.products;
  return state.products.filter((product) => product.category === state.activeCategory);
});

function baht(amount) {
  return `${new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(Number(amount || 0))} พอยต์`;
}

function dateText(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function toast(message) {
  state.toastMessage = message;
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => {
    state.toastMessage = "";
  }, 3200);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.message || "เกิดข้อผิดพลาด");
  }
  return data;
}

async function loadBootstrap() {
  try {
    const data = await api("/api/bootstrap");
    state.me = data.me;
    state.products = data.products;
    state.categories = data.categories;
    state.bank = data.bank;
  } catch (error) {
    toast(error.message);
  }
}

async function loadTopups() {
  if (!state.me) {
    state.topups = [];
    return;
  }
  try {
    const data = await api("/api/topups");
    state.topups = data.topups;
  } catch (error) {
    toast(error.message);
  }
}

async function loadOrders() {
  if (!state.me) {
    state.orders = [];
    return;
  }
  try {
    const data = await api("/api/orders");
    state.orders = data.orders;
  } catch (error) {
    toast(error.message);
  }
}

async function loadAdmin() {
  if (!isAdmin.value) return;
  try {
    const data = await api("/api/admin");
    state.admin = {
      ...data,
      products: data.products.map((product) => ({ ...product })),
      topups: data.topups.map((topup) => ({ ...topup, lineInput: "" })),
    };
    if (!state.stockForm.productId && state.admin.products[0]) {
      state.stockForm.productId = state.admin.products[0].id;
    }
  } catch (error) {
    toast(error.message);
  }
}

async function setView(view) {
  state.view = view;
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (view === "topup") await loadTopups();
  if (view === "orders") await loadOrders();
  if (view === "spin") await loadSpin();
  if (view === "admin") {
    await loadAdmin();
    await loadAdminUsers();
    await loadAdminCodes();
    await loadAdminSpin();
  }
}

function requireLogin(openAuthFn) {
  if (state.me) return true;
  openAuthFn("login");
  toast("กรุณาเข้าสู่ระบบก่อนใช้งาน");
  return false;
}

async function login() {
  try {
    const data = await api("/api/login", { method: "POST", body: JSON.stringify(state.loginForm) });
    state.token = data.token;
    state.me = data.user;
    localStorage.setItem("shopToken", state.token);
    toast("เข้าสู่ระบบสำเร็จ");
    return true;
  } catch (error) {
    toast(error.message);
    return false;
  }
}

async function register() {
  try {
    const data = await api("/api/register", { method: "POST", body: JSON.stringify(state.registerForm) });
    state.token = data.token;
    state.me = data.user;
    localStorage.setItem("shopToken", state.token);
    toast("สมัครสมาชิกสำเร็จ");
    return true;
  } catch (error) {
    toast(error.message);
    return false;
  }
}

function logout() {
  state.token = "";
  state.me = null;
  state.admin = { users: [], products: [], topups: [], orders: [], stats: {} };
  localStorage.removeItem("shopToken");
  setView("home");
  toast("ออกจากระบบแล้ว");
}

function requestPurchase(product, openAuthFn) {
  if (!requireLogin(openAuthFn)) return;
  if (product.stock < 1) {
    toast("สินค้าหมดสต็อก");
    return;
  }
  state.purchase.pendingProduct = product;
}

function cancelPurchase() {
  state.purchase.pendingProduct = null;
}

async function confirmPurchase() {
  const product = state.purchase.pendingProduct;
  if (!product) return;
  state.purchase.confirming = true;
  try {
    const data = await api("/api/purchase", { method: "POST", body: JSON.stringify({ productId: product.id }) });
    state.me = data.user;
    await loadBootstrap();
    toast("ซื้อสำเร็จ ดูรหัสได้ในประวัติการซื้อ");
    state.purchase.pendingProduct = null;
    await setView("orders");
  } catch (error) {
    toast(error.message);
  } finally {
    state.purchase.confirming = false;
  }
}

async function createTopup(openAuthFn) {
  if (!requireLogin(openAuthFn)) return;
  try {
    await api("/api/topups", { method: "POST", body: JSON.stringify(state.topupForm) });
    state.topupForm = { amount: "", slipRef: "", transferAt: "" };
    toast("ส่งรายการเติมเงินแล้ว รอแอดมินตรวจสอบ");
    await loadTopups();
  } catch (error) {
    toast(error.message);
  }
}

function toggleSecret(orderId) {
  state.visibleSecrets[orderId] = !state.visibleSecrets[orderId];
}

async function createProduct() {
  try {
    await api("/api/admin/products", { method: "POST", body: JSON.stringify(state.productForm) });
    state.productForm = { title: "", game: "Roblox", category: "Roblox ID", price: "", image: "", description: "" };
    toast("เพิ่มสินค้าแล้ว");
    await loadBootstrap();
    await loadAdmin();
  } catch (error) {
    toast(error.message);
  }
}

async function updateProduct(product) {
  if (!product.title || Number(product.price) <= 0) {
    toast("กรุณากรอกชื่อสินค้าและราคามากกว่า 0");
    return;
  }
  try {
    await api(`/api/admin/products/${product.id}`, { method: "PATCH", body: JSON.stringify(product) });
    toast("บันทึกการแก้ไขสินค้าแล้ว");
    await loadBootstrap();
    await loadAdmin();
  } catch (error) {
    toast(error.message);
  }
}

async function deleteProduct(product) {
  const ok = confirm(`ต้องการลบสินค้า "${product.title}" ใช่หรือไม่`);
  if (!ok) return;
  try {
    await api(`/api/admin/products/${product.id}`, { method: "DELETE" });
    toast("ลบสินค้าแล้ว");
    await loadBootstrap();
    await loadAdmin();
  } catch (error) {
    toast(error.message);
  }
}

async function addStock() {
  if (!state.stockForm.productId) {
    toast("กรุณาเลือกสินค้า");
    return;
  }
  try {
    await api(`/api/admin/products/${state.stockForm.productId}/stock`, {
      method: "POST",
      body: JSON.stringify({ rows: state.stockForm.rows }),
    });
    state.stockForm.rows = "";
    toast("เพิ่มสต็อกสำเร็จ");
    await loadBootstrap();
    await loadAdmin();
  } catch (error) {
    toast(error.message);
  }
}

async function reviewTopup(topup, status) {
  try {
    await api(`/api/admin/topups/${topup.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        status,
        lineRef: topup.lineInput || "",
        note: status === "approved" ? "ยอดตรงกับ LINE Krungthai" : "ยอดไม่ตรงหรือไม่พบเงินเข้า",
      }),
    });
    toast(status === "approved" ? "อนุมัติและเพิ่มพอยต์แล้ว" : "ปฏิเสธรายการแล้ว");
    await loadBootstrap();
    await loadAdmin();
  } catch (error) {
    toast(error.message);
  }
}

async function hideTopup(topupId) {
  try {
    await api(`/api/admin/topups/${topupId}`, { method: "PATCH", body: JSON.stringify({ hidden: true }) });
    toast("ซ่อนรายการเติมเงินแล้ว");
    await loadAdmin();
  } catch (error) {
    toast(error.message);
  }
}

async function hideReviewedTopups() {
  try {
    const data = await api("/api/admin/topups/hide-reviewed", { method: "POST", body: JSON.stringify({}) });
    toast(`ซ่อนรายการที่ตรวจแล้ว ${data.hidden || 0} รายการ`);
    await loadAdmin();
  } catch (error) {
    toast(error.message);
  }
}

async function loadAdminUsers(page = state.adminUsers.page) {
  if (!isAdmin.value) return;
  try {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(state.adminUsers.pageSize),
      search: state.adminUsers.search || "",
    });
    const data = await api(`/api/admin/users?${params.toString()}`);
    state.adminUsers.list = data.users.map((user) => ({ ...user, pointInput: "" }));
    state.adminUsers.total = data.total;
    state.adminUsers.page = data.page;
  } catch (error) {
    toast(error.message);
  }
}

async function searchAdminUsers() {
  await loadAdminUsers(1);
}

async function goToUsersPage(page) {
  const maxPage = Math.max(1, Math.ceil(state.adminUsers.total / state.adminUsers.pageSize));
  const target = Math.min(Math.max(1, page), maxPage);
  await loadAdminUsers(target);
}

async function adjustUserPoints(user, sign) {
  const rawAmount = Number(user.pointInput || 0);
  if (!rawAmount || rawAmount <= 0) {
    toast("กรุณากรอกจำนวนพอยต์ที่ต้องการปรับ");
    return;
  }
  const amount = sign * rawAmount;
  try {
    await api(`/api/admin/users/${user.id}/points`, {
      method: "POST",
      body: JSON.stringify({ amount, note: sign > 0 ? "เพิ่มพอยต์โดยตรงจากหลังบ้าน" : "ลดพอยต์โดยตรงจากหลังบ้าน" }),
    });
    toast(sign > 0 ? "เพิ่มพอยต์ให้สมาชิกแล้ว" : "ลดพอยต์สมาชิกแล้ว");
    await loadBootstrap();
    await loadAdminUsers();
  } catch (error) {
    toast(error.message);
  }
}

async function setUserRole(user, role) {
  const ok = confirm(role === "admin" ? `ตั้งให้ "${user.username}" เป็นแอดมินใช่หรือไม่` : `ถอดสิทธิ์แอดมินของ "${user.username}" ใช่หรือไม่`);
  if (!ok) return;
  try {
    await api(`/api/admin/users/${user.id}/role`, { method: "PATCH", body: JSON.stringify({ role }) });
    toast("ปรับสิทธิ์สมาชิกแล้ว");
    await loadAdminUsers();
  } catch (error) {
    toast(error.message);
  }
}

async function toggleBanUser(user) {
  if (user.banned) {
    const ok = confirm(`ต้องการปลดแบน "${user.username}" ใช่หรือไม่`);
    if (!ok) return;
    try {
      await api(`/api/admin/users/${user.id}/ban`, { method: "PATCH", body: JSON.stringify({ banned: false }) });
      toast("ปลดแบนสมาชิกแล้ว");
      await loadAdminUsers();
    } catch (error) {
      toast(error.message);
    }
    return;
  }
  const reason = prompt(`เหตุผลที่แบน "${user.username}" (ไม่บังคับ)`) || "";
  try {
    await api(`/api/admin/users/${user.id}/ban`, { method: "PATCH", body: JSON.stringify({ banned: true, reason }) });
    toast("แบนสมาชิกแล้ว");
    await loadAdminUsers();
  } catch (error) {
    toast(error.message);
  }
}

async function deleteUser(user) {
  const ok = confirm(`ต้องการลบสมาชิก ${user.username} ใช่หรือไม่`);
  if (!ok) return;
  try {
    await api(`/api/admin/users/${user.id}`, { method: "DELETE" });
    toast("ลบสมาชิกแล้ว");
    await loadBootstrap();
    await loadAdminUsers();
  } catch (error) {
    toast(error.message);
  }
}

async function redeemCode() {
  if (!state.me) {
    toast("กรุณาเข้าสู่ระบบก่อนใช้งาน");
    return;
  }
  const code = state.redeemForm.code.trim();
  if (!code) {
    toast("กรุณากรอกโค้ด");
    return;
  }
  try {
    const data = await api("/api/redeem", { method: "POST", body: JSON.stringify({ code }) });
    state.me = data.user;
    state.redeemForm.code = "";
    toast(`รับ ${baht(data.pointsAdded)} สำเร็จ!`);
  } catch (error) {
    toast(error.message);
  }
}

async function loadAdminCodes() {
  if (!isAdmin.value) return;
  try {
    const data = await api("/api/admin/codes");
    state.adminCodes = data.codes;
  } catch (error) {
    toast(error.message);
  }
}

async function createAdminCode() {
  const points = Number(state.adminCodeForm.points || 0);
  if (!points || points <= 0) {
    toast("กรุณากรอกจำนวนพอยต์มากกว่า 0");
    return;
  }
  try {
    await api("/api/admin/codes", {
      method: "POST",
      body: JSON.stringify({
        code: state.adminCodeForm.code,
        points,
        maxUses: state.adminCodeForm.maxUses || 1,
        expiresAt: state.adminCodeForm.expiresAt || null,
      }),
    });
    state.adminCodeForm = { code: "", points: "", maxUses: 1, expiresAt: "" };
    toast("สร้างโค้ดสำเร็จ");
    await loadAdminCodes();
  } catch (error) {
    toast(error.message);
  }
}

async function toggleAdminCode(code) {
  try {
    await api(`/api/admin/codes/${code.id}`, { method: "PATCH", body: JSON.stringify({ active: !code.active }) });
    toast(code.active ? "ปิดใช้งานโค้ดแล้ว" : "เปิดใช้งานโค้ดแล้ว");
    await loadAdminCodes();
  } catch (error) {
    toast(error.message);
  }
}

async function deleteAdminCode(code) {
  const ok = confirm(`ต้องการลบโค้ด "${code.code}" ใช่หรือไม่`);
  if (!ok) return;
  try {
    await api(`/api/admin/codes/${code.id}`, { method: "DELETE" });
    toast("ลบโค้ดแล้ว");
    await loadAdminCodes();
  } catch (error) {
    toast(error.message);
  }
}

// ---- Spin wheel (user side) ----

async function loadSpin() {
  try {
    const data = await api("/api/spin");
    state.spin.costPerSpin = data.costPerSpin;
    state.spin.prizes = data.prizes;
  } catch (error) {
    toast(error.message);
  }
}

async function spinWheel(openAuthFn) {
  if (!requireLogin(openAuthFn)) return;
  if (state.spin.spinning) return;
  if (!state.me || state.me.points < state.spin.costPerSpin) {
    toast("พอยต์ไม่เพียงพอสำหรับหมุนกงล้อ");
    return;
  }
  state.spin.spinning = true;
  state.spin.lastResult = null;
  try {
    const data = await api("/api/spin", { method: "POST" });
    state.me = data.user;
    state.spin.lastResult = data;
    return data;
  } catch (error) {
    toast(error.message);
    state.spin.spinning = false;
    return null;
  }
}

function finishSpinAnimation() {
  state.spin.spinning = false;
}

// ---- Spin wheel (admin side) ----

async function loadAdminSpin() {
  if (!isAdmin.value) return;
  try {
    const data = await api("/api/admin/spin-prizes");
    state.adminSpin.prizes = data.prizes;
    state.adminSpin.costPerSpin = data.costPerSpin;
  } catch (error) {
    toast(error.message);
  }
}

async function createSpinPrize() {
  const form = state.adminSpin.prizeForm;
  if (!form.label.trim()) {
    toast("กรุณากรอกชื่อรางวัล");
    return;
  }
  if (form.type === "product" && !form.productId) {
    toast("กรุณาเลือกสินค้าสำหรับรางวัลนี้");
    return;
  }
  try {
    await api("/api/admin/spin-prizes", {
      method: "POST",
      body: JSON.stringify({
        label: form.label,
        type: form.type,
        pointsValue: form.pointsValue || 0,
        productId: form.productId || undefined,
        weight: form.weight || 10,
        color: form.color || "#f59e0b",
      }),
    });
    state.adminSpin.prizeForm = { label: "", type: "points", pointsValue: "", productId: "", weight: 10, color: "#f59e0b" };
    toast("เพิ่มรางวัลแล้ว");
    await loadAdminSpin();
  } catch (error) {
    toast(error.message);
  }
}

async function updateSpinPrize(prize) {
  try {
    await api(`/api/admin/spin-prizes/${prize.id}`, {
      method: "PATCH",
      body: JSON.stringify({ label: prize.label, weight: prize.weight, color: prize.color, pointsValue: prize.pointsValue, active: prize.active }),
    });
    toast("บันทึกรางวัลแล้ว");
    await loadAdminSpin();
  } catch (error) {
    toast(error.message);
  }
}

async function deleteSpinPrize(prize) {
  const ok = confirm(`ต้องการลบรางวัล "${prize.label}" ใช่หรือไม่`);
  if (!ok) return;
  try {
    await api(`/api/admin/spin-prizes/${prize.id}`, { method: "DELETE" });
    toast("ลบรางวัลแล้ว");
    await loadAdminSpin();
  } catch (error) {
    toast(error.message);
  }
}

async function updateSpinCost() {
  try {
    await api("/api/admin/spin-settings", { method: "PATCH", body: JSON.stringify({ costPerSpin: state.adminSpin.costPerSpin }) });
    toast("บันทึกราคาต่อการหมุนแล้ว");
  } catch (error) {
    toast(error.message);
  }
}

function togglePanel(key) {
  state.adminPanelOpen[key] = !state.adminPanelOpen[key];
}

// Single entry point every component imports.
export function useShop() {
  return {
    state,
    isAdmin,
    categoryFilters,
    filteredProducts,
    baht,
    dateText,
    toast,
    loadBootstrap,
    loadTopups,
    loadOrders,
    loadAdmin,
    loadAdminUsers,
    searchAdminUsers,
    goToUsersPage,
    setView,
    requireLogin,
    login,
    register,
    logout,
    requestPurchase,
    cancelPurchase,
    confirmPurchase,
    createTopup,
    toggleSecret,
    createProduct,
    updateProduct,
    deleteProduct,
    addStock,
    reviewTopup,
    hideTopup,
    hideReviewedTopups,
    adjustUserPoints,
    setUserRole,
    toggleBanUser,
    deleteUser,
    redeemCode,
    loadAdminCodes,
    createAdminCode,
    toggleAdminCode,
    deleteAdminCode,
    loadSpin,
    spinWheel,
    finishSpinAnimation,
    loadAdminSpin,
    createSpinPrize,
    updateSpinPrize,
    deleteSpinPrize,
    updateSpinCost,
    togglePanel,
  };
}
