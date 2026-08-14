<script setup lang="ts">
import { ref } from "vue";

/** 域名输入 */
const domain = ref("");
/** 查询结果 */
const info = ref<Record<string, string> | null>(null);

/** 模拟域名信息 */
const mockData: Record<string, Record<string, string>> = {
  "baidu.com": {
    注册商: "MarkMonitor Inc.",
    注册时间: "1999-10-11",
    过期时间: "2026-10-11",
    DNS: "dns.baidu.com",
    状态: "正常（活跃）",
  },
  "google.com": {
    注册商: "MarkMonitor Inc.",
    注册时间: "1997-09-15",
    过期时间: "2028-09-14",
    DNS: "ns1.google.com",
    状态: "正常（活跃）",
  },
  "github.com": {
    注册商: "MarkMonitor Inc.",
    注册时间: "2007-10-09",
    过期时间: "2026-10-09",
    DNS: "dns1.p08.nsone.net",
    状态: "正常（活跃）",
  },
};

/** 执行查询 */
function lookup() {
  const key = domain.value.trim().toLowerCase();
  info.value = mockData[key] ?? null;
}
</script>

<template>
  <div class="tool-page">
    <div class="search-bar">
      <input
        v-model="domain"
        class="input"
        placeholder="输入域名，如 baidu.com"
        @keyup.enter="lookup"
      />
      <button class="btn btn-primary" @click="lookup">查询</button>
    </div>

    <div v-if="info" class="info-card">
      <div v-for="(val, key) in info" :key="key" class="info-row">
        <span class="info-label">{{ key }}</span>
        <span class="info-value">{{ val }}</span>
      </div>
    </div>
    <div v-else-if="domain && !info" class="empty-tip">
      未找到该域名信息，请检查输入是否正确
    </div>
  </div>
</template>

<style scoped>
.tool-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.search-bar {
  display: flex;
  gap: 10px;
}
.input {
  flex: 1;
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
.info-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  overflow: hidden;
}
.info-row {
  display: flex;
  padding: 14px 18px;
  border-top: 1px solid var(--color-border);
  gap: 20px;
  align-items: center;
}
.info-row:first-child {
  border-top: none;
}
.info-label {
  width: 80px;
  font-size: 13px;
  color: var(--color-text-light);
  flex-shrink: 0;
}
.info-value {
  font-size: 14px;
  font-weight: 500;
}
.empty-tip {
  text-align: center;
  color: var(--color-text-light);
  font-size: 14px;
  padding: 40px 0;
}
</style>
