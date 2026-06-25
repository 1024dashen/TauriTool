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
  --color-primary: #6c5ce7;
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
  --color-sidebar-active: #e4e2f0;
  --color-sidebar-text: #2d3436;
  --color-sidebar-text-secondary: #636e72;
  --color-sidebar-border: #e0e0e0;
  --color-sidebar-toggle: #eef0f5;
  --color-sidebar-toggle-hover: #e0e2ea;
  /* 按钮 */
  --color-btn-secondary: #e8e8f0;
  --color-btn-secondary-hover: #d8d8e8;
  /* 表格 */
  --color-table-header: #f0f2f5;
  /* 标签 */
  --color-tag-bg: #e8e0ff;
  /* 提示 */
  --color-error-bg: #ffe8e8;
  --color-error-text: #c0392b;
  /* 高亮背景 */
  --color-highlight: #fafbff;
  --color-highlight-blue: #f0f2ff;
  /* 警告框 */
  --color-warn-bg: #fff9e6;
  --color-warn-border: #f0e0a0;
  --color-warn-text: #7a6a00;
}

/* 深色主题 */
[data-theme="dark"] {
  --color-primary: #7c6cf0;
  --color-bg: #121220;
  --color-card: #1e1e32;
  --color-text: #e0e0e8;
  --color-text-light: #8888a0;
  --color-border: #2e2e48;
  --color-sidebar: #0e0e1a;
  --color-sidebar-hover: #1a1a30;
  --color-sidebar-active: #2a2a48;
  --color-sidebar-text: #ffffff;
  --color-sidebar-text-secondary: rgba(255, 255, 255, 0.5);
  --color-sidebar-border: rgba(255, 255, 255, 0.1);
  --color-sidebar-toggle: rgba(255, 255, 255, 0.1);
  --color-sidebar-toggle-hover: rgba(255, 255, 255, 0.2);
  --color-btn-secondary: #2a2a44;
  --color-btn-secondary-hover: #3a3a58;
  --color-table-header: #1a1a2e;
  --color-tag-bg: #2e2a50;
  --color-error-bg: #3a1a1a;
  --color-error-text: #ff6b6b;
  --color-highlight: #1a1a30;
  --color-highlight-blue: #1a1a38;
  --color-warn-bg: #2a2610;
  --color-warn-border: #4a4220;
  --color-warn-text: #d4c470;
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
