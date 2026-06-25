<script setup lang="ts">
import { ref } from "vue";

/** 图标文字 */
const iconText = ref("AB");
/** 背景颜色 */
const bgColor = ref("#6c5ce7");
/** 文字颜色 */
const textColor = ref("#ffffff");
/** 圆角大小 */
const borderRadius = ref(16);
/** 图标尺寸选项 */
const sizes = [16, 32, 48, 64, 128, 256];

/** 预览样式 */
function previewStyle(size: number): Record<string, string> {
  return {
    width: `${size}px`,
    height: `${size}px`,
    background: bgColor.value,
    color: textColor.value,
    borderRadius: `${borderRadius.value}px`,
    fontSize: `${Math.max(size * 0.35, 10)}px`,
  };
}
</script>

<template>
  <div class="tool-page">
    <!-- 控制面板 -->
    <div class="control-panel">
      <div class="control-row">
        <label>图标文字</label>
        <input v-model="iconText" class="input input-sm" maxlength="4" />
      </div>
      <div class="control-row">
        <label>背景颜色</label>
        <input type="color" v-model="bgColor" class="color-picker" />
      </div>
      <div class="control-row">
        <label>文字颜色</label>
        <input type="color" v-model="textColor" class="color-picker" />
      </div>
      <div class="control-row">
        <label>圆角 (px)</label>
        <input
          type="range"
          v-model.number="borderRadius"
          min="0"
          max="64"
          class="range"
        />
        <span class="range-val">{{ borderRadius }}</span>
      </div>
    </div>

    <!-- 多尺寸预览 -->
    <h3 class="section-title">多尺寸预览</h3>
    <div class="preview-grid">
      <div v-for="size in sizes" :key="size" class="preview-item">
        <div class="icon-box" :style="previewStyle(size)">
          {{ iconText || "?" }}
        </div>
        <span class="size-label">{{ size }}×{{ size }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.control-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  background: var(--color-card);
  padding: 20px;
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
}
.control-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.control-row label {
  font-size: 13px;
  color: var(--color-text-light);
  min-width: 64px;
}
.input-sm {
  width: 80px;
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-size: 14px;
  outline: none;
  background: var(--color-card);
  color: var(--color-text);
}
.color-picker {
  width: 36px;
  height: 32px;
  border: none;
  cursor: pointer;
  border-radius: 4px;
}
.range {
  width: 120px;
  accent-color: var(--color-primary);
}
.range-val {
  font-size: 13px;
  color: var(--color-text-light);
  min-width: 24px;
}
.section-title {
  font-size: 15px;
  font-weight: 600;
}
.preview-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: flex-end;
}
.preview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}
.size-label {
  font-size: 12px;
  color: var(--color-text-light);
}
</style>
