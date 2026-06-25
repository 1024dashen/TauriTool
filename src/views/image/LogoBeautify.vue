<script setup lang="ts">
import { ref } from "vue";

/** Logo 文字 */
const logoText = ref("MyLogo");
/** 字体样式 */
const fontFamily = ref("'Segoe UI', sans-serif");
/** 主色 */
const primaryColor = ref("#6c5ce7");
/** 字号 */
const fontSize = ref(48);
/** 字重 */
const fontWeight = ref(700);
/** 字间距 */
const letterSpacing = ref(2);
/** 预设渐变 */
const gradients = [
  "linear-gradient(135deg, #6c5ce7, #a29bfe)",
  "linear-gradient(135deg, #0984e3, #74b9ff)",
  "linear-gradient(135deg, #e17055, #fab1a0)",
  "linear-gradient(135deg, #00b894, #55efc4)",
  "linear-gradient(135deg, #fd79a8, #e84393)",
  "linear-gradient(135deg, #2d3436, #636e72)",
];
/** 当前选中渐变 */
const activeGradient = ref(gradients[0]);
/** 是否使用渐变 */
const useGradient = ref(true);

/** 预览文字样式 */
function logoStyle(): Record<string, string> {
  return {
    fontFamily: fontFamily.value,
    fontSize: `${fontSize.value}px`,
    fontWeight: String(fontWeight.value),
    letterSpacing: `${letterSpacing.value}px`,
    background: useGradient.value ? activeGradient.value : "none",
    color: useGradient.value ? "transparent" : primaryColor.value,
    WebkitBackgroundClip: useGradient.value ? "text" : "unset",
    WebkitTextFillColor: useGradient.value ? "transparent" : primaryColor.value,
  };
}
</script>

<template>
  <div class="tool-page">
    <!-- 预览区域 -->
    <div class="preview-area">
      <div class="logo-preview" :style="logoStyle()">
        {{ logoText || "Logo" }}
      </div>
    </div>

    <!-- 控制面板 -->
    <div class="control-panel">
      <div class="control-row">
        <label>Logo 文字</label>
        <input v-model="logoText" class="input" />
      </div>
      <div class="control-row">
        <label>字号</label>
        <input
          type="range"
          v-model.number="fontSize"
          min="20"
          max="120"
          class="range"
        />
        <span class="range-val">{{ fontSize }}px</span>
      </div>
      <div class="control-row">
        <label>字重</label>
        <input
          type="range"
          v-model.number="fontWeight"
          min="100"
          max="900"
          step="100"
          class="range"
        />
        <span class="range-val">{{ fontWeight }}</span>
      </div>
      <div class="control-row">
        <label>字间距</label>
        <input
          type="range"
          v-model.number="letterSpacing"
          min="-5"
          max="20"
          class="range"
        />
        <span class="range-val">{{ letterSpacing }}px</span>
      </div>
      <div class="control-row">
        <label>纯色</label>
        <input type="color" v-model="primaryColor" class="color-picker" />
        <label class="checkbox-label">
          <input type="checkbox" v-model="useGradient" /> 使用渐变
        </label>
      </div>
      <div v-if="useGradient" class="control-row gradient-row">
        <label>渐变预设</label>
        <div class="gradient-list">
          <div
            v-for="(g, i) in gradients"
            :key="i"
            :class="['gradient-chip', { active: activeGradient === g }]"
            :style="{ background: g }"
            @click="activeGradient = g"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.preview-area {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 60px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}
.logo-preview {
  line-height: 1.2;
  text-align: center;
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
.input {
  flex: 1;
  min-width: 120px;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-size: 14px;
  outline: none;
  background: var(--color-card);
}
.range {
  width: 120px;
  accent-color: var(--color-primary);
}
.range-val {
  font-size: 13px;
  color: var(--color-text-light);
  min-width: 40px;
}
.color-picker {
  width: 36px;
  height: 32px;
  border: none;
  cursor: pointer;
  border-radius: 4px;
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  cursor: pointer;
}
.gradient-row {
  width: 100%;
}
.gradient-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.gradient-chip {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}
.gradient-chip:hover {
  transform: scale(1.1);
}
.gradient-chip.active {
  border-color: var(--color-text);
  box-shadow: 0 0 0 2px var(--color-primary);
}
</style>
