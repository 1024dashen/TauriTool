<script setup lang="ts">
import { ref } from "vue";
import { isTauri } from "@tauri-apps/api/core";

/** 图标文字 */
const iconText = ref("AB");
/** 背景颜色 */
const bgColor = ref("#6c5ce7");
/** 文字颜色 */
const textColor = ref("#ffffff");
/** 圆角大小 */
const borderRadius = ref(16);
/** 图标尺寸选项 */
const sizes = [16, 32, 48, 64, 128, 256];
/** 下载状态提示 */
const statusMsg = ref("");
/** 是否正在下载 */
const downloading = ref(false);

/** 预览样式 */
function previewStyle(size: number): Record<string, string> {
  return {
    width: `${size}px`,
    height: `${size}px`,
    background: bgColor.value,
    color: textColor.value,
    borderRadius: `${borderRadius.value}px`,
    fontSize: `${Math.max(size * 0.35, 10)}px`,
  };
}

/** 在 Canvas 上绘制指定尺寸的图标并返回 PNG Blob */
function renderIcon(size: number): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // 绘制圆角矩形背景
  const r = Math.min(borderRadius.value, size / 2);
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fillStyle = bgColor.value;
  ctx.fill();

  // 绘制居中文字
  const fontSize = Math.max(size * 0.35, 10);
  ctx.fillStyle = textColor.value;
  ctx.font = `bold ${fontSize}px "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(iconText.value || "?", size / 2, size / 2);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/png");
  });
}

/** Blob 转 Uint8Array */
async function blobToUint8(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

/** 下载所有尺寸的图标 */
async function downloadAll() {
  downloading.value = true;
  statusMsg.value = "";
  console.log("Downloading all icons...", isTauri());
  try {
    if (isTauri()) {
      await downloadTauri();
    } else {
      await downloadWeb();
    }
  } catch (e) {
    statusMsg.value = `下载失败: ${e instanceof Error ? e.message : String(e)}`;
  } finally {
    downloading.value = false;
  }
}

/** Tauri 桌面端：选择文件夹后批量保存 PNG */
async function downloadTauri() {
  const { open } = await import("@tauri-apps/plugin-dialog");
  const { writeFile } = await import("@tauri-apps/plugin-fs");

  const dir = await open({ directory: true, title: "选择保存图标的文件夹" });
  if (!dir) {
    statusMsg.value = "已取消";
    return;
  }

  for (const size of sizes) {
    const blob = await renderIcon(size);
    const data = await blobToUint8(blob);
    const separator = dir.endsWith("/") || dir.endsWith("\\") ? "" : "/";
    await writeFile(`${dir}${separator}icon_${size}x${size}.png`, data);
  }
  statusMsg.value = `已保存 ${sizes.length} 个图标到: ${dir}`;
}

/** 网页端：逐个触发浏览器下载 */
async function downloadWeb() {
  for (const size of sizes) {
    const blob = await renderIcon(size);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `icon_${size}x${size}.png`;
    a.click();
    URL.revokeObjectURL(url);
    // 间隔避免浏览器拦截
    await new Promise((r) => setTimeout(r, 200));
  }
  statusMsg.value = `已下载 ${sizes.length} 个图标`;
}
</script>

<template>
  <div class="tool-page">
    <!-- 控制面板 -->
    <div class="control-panel">
      <div class="control-row">
        <label>图标文字</label>
        <input v-model="iconText" class="input input-sm" maxlength="4" />
      </div>
      <div class="control-row">
        <label>背景颜色</label>
        <input type="color" v-model="bgColor" class="color-picker" />
      </div>
      <div class="control-row">
        <label>文字颜色</label>
        <input type="color" v-model="textColor" class="color-picker" />
      </div>
      <div class="control-row">
        <label>圆角 (px)</label>
        <input
          type="range"
          v-model.number="borderRadius"
          min="0"
          max="64"
          class="range"
        />
        <span class="range-val">{{ borderRadius }}</span>
      </div>
      <div class="control-row">
        <button
          class="btn btn-primary"
          :disabled="downloading"
          @click="downloadAll"
        >
          {{ downloading ? "下载中..." : "下载全部图标" }}
        </button>
      </div>
    </div>

    <!-- 状态提示 -->
    <div v-if="statusMsg" class="status-msg">{{ statusMsg }}</div>

    <!-- 多尺寸预览 -->
    <h3 class="section-title">多尺寸预览</h3>
    <div class="preview-grid">
      <div v-for="size in sizes" :key="size" class="preview-item">
        <div class="icon-box" :style="previewStyle(size)">
          {{ iconText || "?" }}
        </div>
        <span class="size-label">{{ size }}×{{ size }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
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
.input-sm {
  width: 80px;
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-size: 14px;
  outline: none;
  background: var(--color-card);
  color: var(--color-text);
}
.color-picker {
  width: 36px;
  height: 32px;
  border: none;
  cursor: pointer;
  border-radius: 4px;
}
.range {
  width: 120px;
  accent-color: var(--color-primary);
}
.range-val {
  font-size: 13px;
  color: var(--color-text-light);
  min-width: 24px;
}
.btn {
  padding: 8px 20px;
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
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.status-msg {
  padding: 10px 14px;
  background: var(--color-highlight-blue);
  color: var(--color-primary);
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 500;
}
.section-title {
  font-size: 15px;
  font-weight: 600;
}
.preview-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: flex-end;
}
.preview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}
.size-label {
  font-size: 12px;
  color: var(--color-text-light);
}
</style>
