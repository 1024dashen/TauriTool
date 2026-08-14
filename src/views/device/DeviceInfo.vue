<script setup lang="ts">
import { ref, onMounted } from "vue";

/** 设备信息数据 */
const deviceInfo = ref<{ label: string; value: string }[]>([]);

/** 获取设备信息 */
onMounted(() => {
  const nav = navigator;
  const screen = window.screen;
  deviceInfo.value = [
    { label: "操作系统", value: nav.platform },
    { label: "浏览器", value: nav.userAgent.split(" ").slice(-2).join(" ") },
    { label: "语言", value: nav.language },
    { label: "屏幕分辨率", value: `${screen.width} × ${screen.height}` },
    {
      label: "可用分辨率",
      value: `${screen.availWidth} × ${screen.availHeight}`,
    },
    { label: "色深", value: `${screen.colorDepth} 位` },
    { label: "像素比", value: `${window.devicePixelRatio}x` },
    {
      label: "视口大小",
      value: `${window.innerWidth} × ${window.innerHeight}`,
    },
    { label: "CPU 核心数", value: String(nav.hardwareConcurrency ?? "未知") },
    {
      label: "内存",
      value: (nav as Navigator & { deviceMemory?: number }).deviceMemory
        ? `${(nav as Navigator & { deviceMemory?: number }).deviceMemory} GB`
        : "未知",
    },
    {
      label: "网络类型",
      value:
        (nav as Navigator & { connection?: { effectiveType: string } })
          .connection?.effectiveType ?? "未知",
    },
    { label: "在线状态", value: nav.onLine ? "在线" : "离线" },
    { label: "Cookie 启用", value: nav.cookieEnabled ? "是" : "否" },
    {
      label: "触摸支持",
      value: nav.maxTouchPoints > 0 ? `是 (${nav.maxTouchPoints} 点)` : "否",
    },
  ];
});
</script>

<template>
  <div class="tool-page">
    <div class="info-grid">
      <div v-for="item in deviceInfo" :key="item.label" class="info-card">
        <div class="card-label">{{ item.label }}</div>
        <div class="card-value">{{ item.value }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}
.info-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.card-label {
  font-size: 12px;
  color: var(--color-text-light);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.card-value {
  font-size: 15px;
  font-weight: 600;
  word-break: break-all;
}
</style>
