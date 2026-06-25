<script setup lang="ts">
import { ref, computed } from "vue";

/** 搜索关键词 */
const keyword = ref("");

/** 垃圾分类数据 */
const garbageData: Record<string, string> = {
  纸巾: "干垃圾（其他垃圾）",
  塑料袋: "干垃圾（其他垃圾）",
  骨头: "湿垃圾（厨余垃圾）",
  菜叶: "湿垃圾（厨余垃圾）",
  电池: "有害垃圾",
  灯泡: "有害垃圾",
  纸箱: "可回收物",
  玻璃瓶: "可回收物",
  易拉罐: "可回收物",
  旧衣服: "可回收物",
  剩饭: "湿垃圾（厨余垃圾）",
  果皮: "湿垃圾（厨余垃圾）",
  过期药品: "有害垃圾",
  油漆桶: "有害垃圾",
  烟蒂: "干垃圾（其他垃圾）",
  陶瓷碎片: "干垃圾（其他垃圾）",
  金属餐具: "可回收物",
  茶叶渣: "湿垃圾（厨余垃圾）",
};

/** 分类颜色映射 */
const categoryColor: Record<string, string> = {
  可回收物: "#2196F3",
  有害垃圾: "#f44336",
  "湿垃圾（厨余垃圾）": "#4CAF50",
  "干垃圾（其他垃圾）": "#9E9E9E",
};

/** 过滤结果 */
const results = computed(() => {
  const key = keyword.value.trim();
  if (!key)
    return Object.entries(garbageData).map(([name, type]) => ({ name, type }));
  return Object.entries(garbageData)
    .filter(([name]) => name.includes(key))
    .map(([name, type]) => ({ name, type }));
});

/** 获取分类颜色 */
function getColor(type: string): string {
  return categoryColor[type] ?? "#999";
}
</script>

<template>
  <div class="tool-page">
    <div class="search-bar">
      <input
        v-model="keyword"
        class="input"
        placeholder="输入垃圾名称，如：电池、纸箱..."
      />
    </div>

    <div class="garbage-grid">
      <div v-for="item in results" :key="item.name" class="garbage-card">
        <span class="garbage-name">{{ item.name }}</span>
        <span
          class="garbage-type"
          :style="{
            background: getColor(item.type) + '20',
            color: getColor(item.type),
          }"
        >
          {{ item.type }}
        </span>
      </div>
    </div>

    <div v-if="!results.length" class="empty-tip">
      未找到该垃圾，请尝试其他关键词
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
.garbage-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}
.garbage-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.garbage-name {
  font-size: 15px;
  font-weight: 500;
}
.garbage-type {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  width: fit-content;
}
.empty-tip {
  text-align: center;
  color: var(--color-text-light);
  font-size: 14px;
  padding: 40px 0;
}
</style>
