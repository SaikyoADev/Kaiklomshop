<template>
  <div class="collapsible" :class="{ open }">
    <button type="button" class="collapsible-toggle" @click="$emit('toggle')">
      <span>{{ title }}</span>
      <span class="collapsible-chevron">{{ open ? '▲' : '▼' }}</span>
    </button>
    <div v-if="open" class="collapsible-body">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  open: { type: Boolean, default: false },
});
defineEmits(["toggle"]);
</script>
