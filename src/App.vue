<script setup lang="ts">
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();

/** 侧边栏菜单数据 */
const menuGroups = ref([
  {
    label: "常用工具",
    icon: "⭐",
    children: [{ label: "JSON 格式化", path: "/common/json-format" }],
  },
  {
    label: "查询工具",
    icon: "🔍",
    children: [
      { label: "邮编查询", path: "/query/zip-code" },
      { label: "垃圾分类", path: "/query/garbage-classify" },
      { label: "域名信息", path: "/query/domain-info" },
    ],
  },
  {
    label: "图片工具",
    icon: "🖼️",
    children: [
      { label: "图标生成", path: "/image/icon-gen" },
      { label: "Logo 美化", path: "/image/logo-beautify" },
    ],
  },
  {
    label: "设备工具",
    icon: "🖥️",
    children: [{ label: "设备信息", path: "/device/device-info" }],
  },
  {
    label: "其他工具",
    icon: "🔧",
    children: [{ label: "短链接生成", path: "/other/short-link" }],
  },
]);

/** 当前激活的菜单项 */
const activePath = ref(route.path);

/** 导航到指定路径 */
function navigate(path: string) {
  activePath.value = path;
  router.push(path);
}
</script>

<template>
  <div class="app-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <span class="logo-icon">🧰</span>
        <span class="logo-text">工具箱</span>
      </div>

      <nav class="sidebar-nav">
        <div v-for="group in menuGroups" :key="group.label" class="menu-group">
          <div class="menu-group-title">
            <span class="menu-icon">{{ group.icon }}</span>
            <span>{{ group.label }}</span>
          </div>
          <ul class="menu-list">
            <li
              v-for="item in group.children"
              :key="item.path"
              :class="['menu-item', { active: activePath === item.path }]"
              @click="navigate(item.path)"
            >
              {{ item.label }}
            </li>
          </ul>
        </div>
      </nav>
    </aside>

    <!-- 主内容区域 -->
    <main class="main-content">
      <header class="content-header">
        <h1>{{ route.meta.title ?? "工具箱" }}</h1>
        <span class="breadcrumb">{{ route.meta.category }}</span>
      </header>
      <div class="content-body">
        <router-view />
      </div>
    </main>
  </div>
</template>

<style>
/* 全局重置 */
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --sidebar-width: 220px;
  --color-bg: #f5f7fa;
  --color-sidebar: #1e1e2e;
  --color-sidebar-hover: #2a2a3e;
  --color-sidebar-active: #3a3a5e;
  --color-primary: #6c5ce7;
  --color-text: #2d3436;
  --color-text-light: #636e72;
  --color-border: #e0e0e0;
  --color-card: #ffffff;
  --radius: 8px;
}

html,
body,
#app {
  height: 100%;
  font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  color: var(--color-text);
  background: var(--color-bg);
}
</style>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* 侧边栏样式 */
.sidebar {
  width: var(--sidebar-width);
  background: var(--color-sidebar);
  color: #fff;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow-y: auto;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-icon {
  font-size: 24px;
}
.logo-text {
  font-size: 18px;
  font-weight: 600;
}

.sidebar-nav {
  padding: 12px 0;
}

.menu-group {
  margin-bottom: 8px;
}

.menu-group-title {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.menu-icon {
  font-size: 14px;
}

.menu-list {
  list-style: none;
}

.menu-item {
  padding: 10px 16px 10px 40px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: rgba(255, 255, 255, 0.75);
  border-left: 3px solid transparent;
}

.menu-item:hover {
  background: var(--color-sidebar-hover);
  color: #fff;
}

.menu-item.active {
  background: var(--color-sidebar-active);
  color: #fff;
  border-left-color: var(--color-primary);
}

/* 主内容区 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: var(--color-card);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.content-header h1 {
  font-size: 20px;
  font-weight: 600;
}

.breadcrumb {
  font-size: 13px;
  color: var(--color-text-light);
  background: var(--color-bg);
  padding: 4px 12px;
  border-radius: 20px;
}

.content-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}
</style>
