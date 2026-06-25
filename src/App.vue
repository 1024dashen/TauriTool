<script setup lang="ts">
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useTheme } from "./composables/useTheme";

const router = useRouter();
const route = useRoute();
const { isDark, toggleTheme } = useTheme();

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
      { label: "Logo美化", path: "/image/logo-beautify" },
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
        <div class="header-left">
          <span class="logo-icon">🧰</span>
          <span class="logo-text">工具箱</span>
        </div>
        <!-- 主题切换按钮 -->
        <button
          class="theme-toggle"
          :title="isDark ? '切换浅色模式' : '切换深色模式'"
          @click="toggleTheme"
        >
          {{ isDark ? "☀️" : "🌙" }}
        </button>
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

/* 浅色主题（默认） */
:root {
  --sidebar-width: 220px;
  --radius: 8px;
  /* 主色调 */
  --color-primary: #0ea5e9;
  /* 背景与表面 */
  --color-bg: #f5f7fa;
  --color-card: #ffffff;
  /* 文字 */
  --color-text: #2d3436;
  --color-text-light: #636e72;
  /* 边框 */
  --color-border: #e0e0e0;
  /* 侧边栏 */
  --color-sidebar: #ffffff;
  --color-sidebar-hover: #eef0f5;
  --color-sidebar-active: #e0f2fe;
  --color-sidebar-text: #2d3436;
  --color-sidebar-text-secondary: #636e72;
  --color-sidebar-border: #e0e0e0;
  --color-sidebar-toggle: #eef0f5;
  --color-sidebar-toggle-hover: #e0e2ea;
  /* 按钮 */
  --color-btn-secondary: #e8edf0;
  --color-btn-secondary-hover: #d8e2ea;
  /* 表格 */
  --color-table-header: #f0f2f5;
  /* 标签 */
  --color-tag-bg: #e0f2fe;
  /* 提示 */
  --color-error-bg: #ffe8e8;
  --color-error-text: #c0392b;
  /* 高亮背景 */
  --color-highlight: #fafbff;
  --color-highlight-blue: #f0f9ff;
  /* 警告框 */
  --color-warn-bg: #fff9e6;
  --color-warn-border: #f0e0a0;
  --color-warn-text: #7a6a00;
  /* 滚动条 */
  --scrollbar-track: transparent;
  --scrollbar-thumb: #c0c0c0;
  --scrollbar-thumb-hover: #a0a0a0;
}

/* 深色主题 - One Dark Pro */
[data-theme="dark"] {
  --color-primary: #38bdf8;
  --color-bg: #282c34;
  --color-card: #2c313a;
  --color-text: #abb2bf;
  --color-text-light: #5c6370;
  --color-border: #3e4451;
  --color-sidebar: #21252b;
  --color-sidebar-hover: #2c313a;
  --color-sidebar-active: #323842;
  --color-sidebar-text: #abb2bf;
  --color-sidebar-text-secondary: #5c6370;
  --color-sidebar-border: #181a1f;
  --color-sidebar-toggle: #323842;
  --color-sidebar-toggle-hover: #3e4451;
  --color-btn-secondary: #323842;
  --color-btn-secondary-hover: #3e4451;
  --color-table-header: #21252b;
  --color-tag-bg: #1e3a5f;
  --color-error-bg: #3a2020;
  --color-error-text: #e06c75;
  --color-highlight: #2c313a;
  --color-highlight-blue: #252b35;
  --color-warn-bg: #332d1a;
  --color-warn-border: #4a4220;
  --color-warn-text: #e5c07b;
  /* 滚动条 */
  --scrollbar-track: transparent;
  --scrollbar-thumb: #4b5263;
  --scrollbar-thumb-hover: #5c6370;
}

html,
body,
#app {
  /* height: 100%; */
  font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  color: var(--color-text);
  background: var(--color-bg);
}

::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 100px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}
</style>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* 侧边栏 */
.sidebar {
  width: var(--sidebar-width);
  background: var(--color-sidebar);
  color: var(--color-sidebar-text);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow-y: auto;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 16px;
  border-bottom: 1px solid var(--color-sidebar-border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 24px;
}
.logo-text {
  font-size: 18px;
  font-weight: 600;
}

/* 主题切换按钮 */
.theme-toggle {
  background: var(--color-sidebar-toggle);
  border: none;
  border-radius: 8px;
  width: 34px;
  height: 34px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.theme-toggle:hover {
  background: var(--color-sidebar-toggle-hover);
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
  color: var(--color-sidebar-text-secondary);
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
  color: var(--color-sidebar-text-secondary);
  border-left: 3px solid transparent;
}
.menu-item:hover {
  background: var(--color-sidebar-hover);
  color: var(--color-sidebar-text);
}
.menu-item.active {
  background: var(--color-sidebar-active);
  color: var(--color-sidebar-text);
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
