import { ref } from "vue";

/** 主题类型 */
type Theme = "light" | "dark";

const STORAGE_KEY = "app-theme";

/** 初始化：读取 localStorage 或跟随系统偏好 */
function getInitialTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** 应用主题到 DOM */
function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

/** 全局单例主题状态，所有组件共享 */
const isDark = ref(getInitialTheme() === "dark");

// 初始化 DOM 属性
applyTheme(getInitialTheme());

/** 主题管理组合式函数 */
export function useTheme() {
  /** 切换深色/浅色主题 */
  function toggleTheme() {
    isDark.value = !isDark.value;
    const theme: Theme = isDark.value ? "dark" : "light";
    localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
  }

  return { isDark, toggleTheme };
}
