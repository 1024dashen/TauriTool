<script setup lang="ts">
import { ref } from "vue";

/** 长链接输入 */
const longUrl = ref("");
/** 生成的短链接 */
const shortUrl = ref("");

/** 模拟生成短链接 */
function generate() {
  if (!longUrl.value.trim()) return;
  const hash = Math.random().toString(36).substring(2, 8);
  shortUrl.value = `https://s.link/${hash}`;
}

/** 复制短链接 */
async function copyShort() {
  if (shortUrl.value) {
    await navigator.clipboard.writeText(shortUrl.value);
  }
}
</script>

<template>
  <div class="tool-page">
    <div class="gen-card">
      <label class="card-label">输入长链接</label>
      <input
        v-model="longUrl"
        class="input"
        placeholder="https://example.com/very-long-url..."
        @keyup.enter="generate"
      />

      <button class="btn btn-primary" @click="generate">生成短链接</button>

      <div v-if="shortUrl" class="result-area">
        <label class="card-label">短链接</label>
        <div class="short-row">
          <span class="short-url">{{ shortUrl }}</span>
          <button class="btn btn-secondary" @click="copyShort">复制</button>
        </div>
      </div>
    </div>

    <!-- 历史记录（仅展示提示） -->
    <div class="hint-box">
      <p>
        💡 提示：此工具生成模拟短链接用于演示，实际使用需接入短链接服务 API。
      </p>
    </div>
  </div>
</template>

<style scoped>
.tool-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.gen-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.card-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-light);
}
.input {
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-size: 14px;
  outline: none;
  background: var(--color-card);
  color: var(--color-text);
  transition: border-color 0.2s;
}
.input:focus {
  border-color: var(--color-primary);
}
.btn {
  padding: 10px 22px;
  border: none;
  border-radius: var(--radius);
  font-size: 14px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}
.btn-primary {
  background: var(--color-primary);
  color: #fff;
}
.btn-primary:hover {
  opacity: 0.9;
}
.btn-secondary {
  background: var(--color-btn-secondary);
  color: var(--color-text);
}
.btn-secondary:hover {
  background: var(--color-btn-secondary-hover);
}
.result-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}
.short-row {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--color-highlight-blue);
  padding: 12px 16px;
  border-radius: var(--radius);
}
.short-url {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-primary);
}
.hint-box {
  background: var(--color-warn-bg);
  border: 1px solid var(--color-warn-border);
  border-radius: var(--radius);
  padding: 14px 18px;
  font-size: 13px;
  color: var(--color-warn-text);
}
</style>
