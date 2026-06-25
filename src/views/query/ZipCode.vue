<script setup lang="ts">
import { ref } from "vue";

/** 搜索关键词 */
const keyword = ref("");
/** 查询结果 */
const results = ref<{ code: string; address: string }[]>([]);

/** 模拟邮编数据 */
const zipData: Record<string, { code: string; address: string }[]> = {
  北京: [
    { code: "100000", address: "北京市东城区" },
    { code: "100020", address: "北京市朝阳区" },
  ],
  上海: [
    { code: "200000", address: "上海市黄浦区" },
    { code: "200120", address: "上海市浦东新区" },
  ],
  广州: [
    { code: "510000", address: "广州市越秀区" },
    { code: "510620", address: "广州市天河区" },
  ],
  深圳: [
    { code: "518000", address: "深圳市罗湖区" },
    { code: "518040", address: "深圳市福田区" },
  ],
};

/** 执行查询 */
function search() {
  const key = keyword.value.trim();
  results.value = zipData[key] ?? (key ? [] : []);
}
</script>

<template>
  <div class="tool-page">
    <div class="search-bar">
      <input
        v-model="keyword"
        class="input"
        placeholder="输入城市/地区名称..."
        @keyup.enter="search"
      />
      <button class="btn btn-primary" @click="search">查询</button>
    </div>

    <div v-if="results.length" class="result-table">
      <div class="table-header"><span>邮编</span><span>地址</span></div>
      <div v-for="item in results" :key="item.code" class="table-row">
        <span class="code-tag">{{ item.code }}</span>
        <span>{{ item.address }}</span>
      </div>
    </div>
    <div v-else-if="keyword && !results.length" class="empty-tip">
      未找到相关邮编，请尝试其他关键词
    </div>
  </div>
</template>

<style scoped>
.tool-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
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
.result-table {
  background: var(--color-card);
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
  overflow: hidden;
}
.table-header {
  display: grid;
  grid-template-columns: 120px 1fr;
  padding: 12px 16px;
  background: var(--color-table-header);
  font-weight: 600;
  font-size: 13px;
}
.table-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  padding: 12px 16px;
  border-top: 1px solid var(--color-border);
  font-size: 14px;
  align-items: center;
}
.code-tag {
  background: var(--color-tag-bg);
  color: var(--color-primary);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}
.empty-tip {
  text-align: center;
  color: var(--color-text-light);
  font-size: 14px;
  padding: 40px 0;
}
</style>
