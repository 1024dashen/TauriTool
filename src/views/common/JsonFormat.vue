<script setup lang="ts">
import { ref } from "vue";

/** JSON 输入内容 */
const inputJson = ref("");
/** 格式化后的输出 */
const outputJson = ref("");
/** 错误信息 */
const errorMsg = ref("");

/** 格式化 JSON */
function format() {
  errorMsg.value = "";
  try {
    const parsed = JSON.parse(inputJson.value);
    outputJson.value = JSON.stringify(parsed, null, 2);
  } catch (e) {
    errorMsg.value = `JSON 解析错误: ${(e as Error).message}`;
    outputJson.value = "";
  }
}

/** 压缩 JSON */
function compress() {
  errorMsg.value = "";
  try {
    const parsed = JSON.parse(inputJson.value);
    outputJson.value = JSON.stringify(parsed);
  } catch (e) {
    errorMsg.value = `JSON 解析错误: ${(e as Error).message}`;
    outputJson.value = "";
  }
}

/** 复制到剪贴板 */
async function copyOutput() {
  if (outputJson.value) {
    await navigator.clipboard.writeText(outputJson.value);
  }
}

/** 清空输入输出 */
function clear() {
  inputJson.value = "";
  outputJson.value = "";
  errorMsg.value = "";
}
</script>

<template>
  <div class="json-format">
    <!-- 操作栏 -->
    <div class="toolbar">
      <button class="btn btn-primary" @click="format">格式化</button>
      <button class="btn btn-secondary" @click="compress">压缩</button>
      <button class="btn btn-secondary" @click="copyOutput">复制结果</button>
      <button class="btn btn-outline" @click="clear">清空</button>
    </div>

    <!-- 错误提示 -->
    <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

    <!-- 输入输出区域 -->
    <div class="editor-grid">
      <div class="editor-panel">
        <label class="panel-label">输入</label>
        <textarea
          v-model="inputJson"
          class="editor-textarea"
          placeholder="请输入 JSON 字符串..."
          spellcheck="false"
        />
      </div>
      <div class="editor-panel">
        <label class="panel-label">输出</label>
        <textarea
          v-model="outputJson"
          class="editor-textarea output"
          readonly
          placeholder="格式化结果..."
          spellcheck="false"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.json-format {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.toolbar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  padding: 8px 20px;
  border: none;
  border-radius: var(--radius);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
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
.btn-outline {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-light);
}
.btn-outline:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.error-msg {
  padding: 10px 14px;
  background: var(--color-error-bg);
  color: var(--color-error-text);
  border-radius: var(--radius);
  font-size: 13px;
}

.editor-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

.editor-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.panel-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-light);
}

.editor-textarea {
  flex: 1;
  resize: none;
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-family: "Cascadia Code", "Fira Code", "Consolas", monospace;
  font-size: 13px;
  line-height: 1.6;
  background: var(--color-card);
  color: var(--color-text);
  outline: none;
  transition: border-color 0.2s;
}

.editor-textarea:focus {
  border-color: var(--color-primary);
}
.editor-textarea.output {
  background: var(--color-highlight);
}
</style>
