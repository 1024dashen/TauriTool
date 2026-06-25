<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import { isTauri } from "@tauri-apps/api/core";

/* ==================== 图片上传 ==================== */
const imgSrc = ref("");
const naturalW = ref(0);
const naturalH = ref(0);

/* ==================== 裁剪参数（百分比 0-100） ==================== */
const cropX = ref(0);
const cropY = ref(0);
const cropW = ref(100);
const cropH = ref(100);

/* ==================== 圆角参数 ==================== */
/** 0–50 表示圆角占边长的百分比 */
const radiusPercent = ref(0);
/** 是否启用苹果 squircle 连续曲线 */
const useAppleSquircle = ref(false);

/* ==================== UI 状态 ==================== */
const statusMsg = ref("");
const fileInput = ref<HTMLInputElement | null>(null);
/** 导出尺寸列表 */
const exportSizes = ref([64, 128, 256, 512, 1024]);
const downloading = ref(false);

/* ==================== 交互拖拽状态 ==================== */
const imgWrapRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const dragType = ref<"move" | "nw" | "ne" | "sw" | "se" | "new" | "">("");
const dragStart = ref({ mx: 0, my: 0, x: 0, y: 0, w: 0, h: 0 });

/* ==================== 显示尺寸（保持图片适应容器） ==================== */
const displayW = computed(() => {
  if (!naturalW.value || !naturalH.value) return 320;
  const maxW = 480,
    maxH = 400;
  const ratio = Math.min(maxW / naturalW.value, maxH / naturalH.value, 1);
  return Math.round(naturalW.value * ratio);
});
const displayH = computed(() => {
  if (!naturalW.value || !naturalH.value) return 320;
  const maxW = 480,
    maxH = 400;
  const ratio = Math.min(maxW / naturalW.value, maxH / naturalH.value, 1);
  return Math.round(naturalH.value * ratio);
});

/* 裁剪框 CSS 定位样式 */
const cropBoxStyle = computed(() => ({
  left: `${cropX.value}%`,
  top: `${cropY.value}%`,
  width: `${cropW.value}%`,
  height: `${cropH.value}%`,
}));

/* ==================== 圆角预设 ==================== */
const presets = [
  { label: "无圆角", val: 0 },
  { label: "小圆角 10%", val: 10 },
  { label: "中圆角 25%", val: 25 },
  { label: "大圆角 50%", val: 50 },
];

/* ==================== 上传处理 ==================== */
function triggerUpload() {
  fileInput.value?.click();
}

function handleFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  loadFile(file);
}

function handleDrop(e: DragEvent) {
  e.preventDefault();
  const file = e.dataTransfer?.files?.[0];
  if (file) loadFile(file);
}

function loadFile(file: File) {
  if (!file.type.startsWith("image/")) {
    statusMsg.value = "请选择图片文件";
    return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    imgSrc.value = ev.target?.result as string;
    nextTick(() => {
      const img = new Image();
      img.onload = () => {
        naturalW.value = img.width;
        naturalH.value = img.height;
        resetCrop();
        statusMsg.value = "";
        updatePreview();
      };
      img.src = imgSrc.value;
    });
  };
  reader.readAsDataURL(file);
}

/** 重置裁剪为最大居中正方形 */
function resetCrop() {
  const aspect = naturalW.value / naturalH.value;
  if (aspect >= 1) {
    // 图片更宽：正方形以高度为基准
    cropH.value = 100;
    cropW.value = (1 / aspect) * 100;
    cropX.value = (100 - cropW.value) / 2;
    cropY.value = 0;
  } else {
    // 图片更高：正方形以宽度为基准
    cropW.value = 100;
    cropH.value = aspect * 100;
    cropX.value = 0;
    cropY.value = (100 - cropH.value) / 2;
  }
}

/* ==================== 鼠标交互：裁剪框拖拽/缩放 ==================== */
function onOverlayMouseDown(e: MouseEvent) {
  const wrap = imgWrapRef.value;
  if (!wrap) return;
  const rect = wrap.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  const bx = (cropX.value / 100) * rect.width;
  const by = (cropY.value / 100) * rect.height;
  const bw = (cropW.value / 100) * rect.width;
  const bh = (cropH.value / 100) * rect.height;

  const corner = detectCorner(mx, my, bx, by, bw, bh);
  if (corner) {
    isDragging.value = true;
    dragType.value = corner;
  } else if (isInsideBox(mx, my, bx, by, bw, bh)) {
    isDragging.value = true;
    dragType.value = "move";
  } else {
    // 点击外部：从点击处新建正方形选区
    isDragging.value = true;
    dragType.value = "new";
    const pctX = (mx / rect.width) * 100;
    const pctY = (my / rect.height) * 100;
    cropX.value = pctX;
    cropY.value = pctY;
    cropW.value = 1;
    cropH.value = (naturalW.value / naturalH.value) * 1; // 保持正方形像素比
  }
  dragStart.value = {
    mx,
    my,
    x: cropX.value,
    y: cropY.value,
    w: cropW.value,
    h: cropH.value,
  };
  window.addEventListener("mousemove", onOverlayMouseMove);
  window.addEventListener("mouseup", onOverlayMouseUp);
}

function onOverlayMouseMove(e: MouseEvent) {
  const wrap = imgWrapRef.value;
  if (!wrap || !isDragging.value) return;
  const rect = wrap.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const dxPx = mx - dragStart.value.mx;
  const dyPx = my - dragStart.value.my;
  const s = dragStart.value;
  const MIN_SQ = 20; // 最小正方形边长（原始像素）
  /** 显示像素 → 百分比 转换系数 */
  const pw = 100 / rect.width;
  const ph = 100 / rect.height;
  /** 1 显示像素对应的原始像素数 */
  const origPerDispW = naturalW.value / rect.width;
  const origPerDispH = naturalH.value / rect.height;

  if (dragType.value === "move") {
    const dxPct = dxPx * pw;
    const dyPct = dyPx * ph;
    cropX.value = clamp(s.x + dxPct, 0, 100 - s.w);
    cropY.value = clamp(s.y + dyPct, 0, 100 - s.h);
  } else if (dragType.value === "new") {
    // 取较大轴偏移，转换为原始像素正方形
    const sqDispPx = Math.max(Math.abs(dxPx), Math.abs(dyPx));
    let sqOrigPx = Math.round(sqDispPx * origPerDispW); // 用宽轴换算
    sqOrigPx = clamp(
      sqOrigPx,
      MIN_SQ,
      Math.min(naturalW.value, naturalH.value),
    );
    const newWPct = (sqOrigPx / naturalW.value) * 100;
    const newHPct = (sqOrigPx / naturalH.value) * 100;
    cropX.value = clamp(dxPx >= 0 ? s.x : s.x - newWPct, 0, 100 - newWPct);
    cropY.value = clamp(dyPx >= 0 ? s.y : s.y - newHPct, 0, 100 - newHPct);
    cropW.value = newWPct;
    cropH.value = newHPct;
  } else {
    // 角落缩放：在原始像素空间维持正方形
    const sWOrig = (s.w / 100) * naturalW.value;
    const sHOrig = (s.h / 100) * naturalH.value;
    const dwOrig = dxPx * origPerDispW;
    const dhOrig = dyPx * origPerDispH;
    let sqOrigPx: number;
    let newOrigX = (s.x / 100) * naturalW.value;
    let newOrigY = (s.y / 100) * naturalH.value;

    if (dragType.value === "se") {
      sqOrigPx = clamp(
        Math.max(dwOrig, dhOrig),
        MIN_SQ,
        Math.min(naturalW.value - newOrigX, naturalH.value - newOrigY),
      );
    } else if (dragType.value === "sw") {
      sqOrigPx = clamp(
        Math.max(-dwOrig, dhOrig),
        MIN_SQ,
        Math.min(newOrigX + sWOrig, naturalH.value - newOrigY),
      );
      newOrigX = newOrigX + sWOrig - sqOrigPx;
    } else if (dragType.value === "ne") {
      sqOrigPx = clamp(
        Math.max(dwOrig, -dhOrig),
        MIN_SQ,
        Math.min(naturalW.value - newOrigX, newOrigY + sHOrig),
      );
      newOrigY = newOrigY + sHOrig - sqOrigPx;
    } else {
      // nw
      sqOrigPx = clamp(
        Math.max(-dwOrig, -dhOrig),
        MIN_SQ,
        Math.min(newOrigX + sWOrig, newOrigY + sHOrig),
      );
      newOrigX = newOrigX + sWOrig - sqOrigPx;
      newOrigY = newOrigY + sHOrig - sqOrigPx;
    }
    cropW.value = (sqOrigPx / naturalW.value) * 100;
    cropH.value = (sqOrigPx / naturalH.value) * 100;
    cropX.value = (newOrigX / naturalW.value) * 100;
    cropY.value = (newOrigY / naturalH.value) * 100;
  }
}

function onOverlayMouseUp() {
  isDragging.value = false;
  window.removeEventListener("mousemove", onOverlayMouseMove);
  window.removeEventListener("mouseup", onOverlayMouseUp);
  updatePreview();
}

const TH = 10;
function detectCorner(
  mx: number,
  my: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
) {
  if (Math.abs(mx - bx) < TH && Math.abs(my - by) < TH) return "nw";
  if (Math.abs(mx - (bx + bw)) < TH && Math.abs(my - by) < TH) return "ne";
  if (Math.abs(mx - bx) < TH && Math.abs(my - (by + bh)) < TH) return "sw";
  if (Math.abs(mx - (bx + bw)) < TH && Math.abs(my - (by + bh)) < TH)
    return "se";
  return null;
}
function isInsideBox(
  mx: number,
  my: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
) {
  return mx >= bx && mx <= bx + bw && my >= by && my <= by + bh;
}
function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

/* ==================== Canvas 渲染核心 ==================== */

/** 裁剪区域像素坐标（始终正方形，w === h） */
function getCropPixels() {
  const x = Math.round((cropX.value / 100) * naturalW.value);
  const y = Math.round((cropY.value / 100) * naturalH.value);
  // 宽度与高度取较小值确保不超出图像边界
  const side = Math.max(
    Math.min(
      Math.round((cropW.value / 100) * naturalW.value),
      Math.round((cropH.value / 100) * naturalH.value),
    ),
    1,
  );
  return { x, y, w: side, h: side };
}

/**
 * 绘制苹果 squircle（连续曲率圆角）路径
 * Apple 图标使用 superellipse，此处用三阶贝塞尔近似
 * controlOffset 使曲线在角部更"饱满"，模拟 iOS 图标外观
 */
function drawSquirclePath(
  ctx: CanvasRenderingContext2D,
  size: number,
  cornerR: number,
) {
  const s = size;
  const r = Math.min(cornerR, s / 2);
  // 苹果风格控制点偏移量（越大曲线越方）
  const c = r * 0.92;

  ctx.beginPath();
  ctx.moveTo(r, 0);
  // 上边 → 右上圆角
  ctx.lineTo(s - r, 0);
  ctx.bezierCurveTo(s - r + c, 0, s, r - c, s, r);
  // 右边 → 右下圆角
  ctx.lineTo(s, s - r);
  ctx.bezierCurveTo(s, s - r + c, s - r + c, s, s - r, s);
  // 下边 → 左下圆角
  ctx.lineTo(r, s);
  ctx.bezierCurveTo(r - c, s, 0, s - r + c, 0, s - r);
  // 左边 → 左上圆角
  ctx.lineTo(0, r);
  ctx.bezierCurveTo(0, r - c, r - c, 0, r, 0);
  ctx.closePath();
}

/** 绘制标准圆角矩形路径 */
function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  size: number,
  r: number,
) {
  const s = size;
  r = Math.min(r, s / 2);
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(s - r, 0);
  ctx.quadraticCurveTo(s, 0, s, r);
  ctx.lineTo(s, s - r);
  ctx.quadraticCurveTo(s, s, s - r, s);
  ctx.lineTo(r, s);
  ctx.quadraticCurveTo(0, s, 0, s - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
}

/**
 * 在指定 Canvas 上渲染最终效果图
 * @param canvas 目标 Canvas（尺寸需预先设置）
 * @param size   输出像素边长（正方形）
 */
async function renderToCanvas(canvas: HTMLCanvasElement, size: number) {
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);

  const crop = getCropPixels();
  const img = await loadImage(imgSrc.value);

  // 计算圆角像素值
  const rPx = (radiusPercent.value / 100) * (size / 2);

  ctx.save();
  // 应用形状裁剪
  if (useAppleSquircle.value) {
    const squircleR = Math.max(rPx, size * 0.18);
    drawSquirclePath(ctx, size, squircleR);
  } else if (radiusPercent.value > 0) {
    drawRoundedRectPath(ctx, size, rPx);
  } else {
    ctx.rect(0, 0, size, size);
  }
  ctx.clip();
  // 绘制图片（裁剪区域映射到整个 Canvas）
  ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, size, size);
  ctx.restore();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/* ==================== 实时预览更新 ==================== */
const previewCanvas = ref<HTMLCanvasElement | null>(null);
const PREVIEW_SIZE = 256;

async function updatePreview() {
  if (!previewCanvas.value || !imgSrc.value || !naturalW.value) return;
  previewCanvas.value.width = PREVIEW_SIZE;
  previewCanvas.value.height = PREVIEW_SIZE;
  await renderToCanvas(previewCanvas.value, PREVIEW_SIZE);
}

/* ==================== 导出下载 ==================== */
async function downloadAll() {
  if (!imgSrc.value || !naturalW.value) {
    statusMsg.value = "请先上传图片";
    return;
  }
  downloading.value = true;
  statusMsg.value = "";
  try {
    const blobs: { size: number; blob: Blob }[] = [];
    for (const size of exportSizes.value) {
      const c = document.createElement("canvas");
      c.width = size;
      c.height = size;
      await renderToCanvas(c, size);
      const blob = await new Promise<Blob>((r) =>
        c.toBlob((b) => r(b!), "image/png"),
      );
      blobs.push({ size, blob });
    }
    isTauri() ? await saveTauri(blobs) : await saveWeb(blobs);
  } catch (e) {
    statusMsg.value = `导出失败: ${e instanceof Error ? e.message : String(e)}`;
  } finally {
    downloading.value = false;
  }
}

async function saveTauri(blobs: { size: number; blob: Blob }[]) {
  const { open } = await import("@tauri-apps/plugin-dialog");
  const { writeFile } = await import("@tauri-apps/plugin-fs");
  const dir = await open({ directory: true, title: "选择保存文件夹" });
  if (!dir) {
    statusMsg.value = "已取消";
    return;
  }
  const sep = dir.endsWith("/") || dir.endsWith("\\") ? "" : "/";
  for (const { size, blob } of blobs) {
    const data = new Uint8Array(await blob.arrayBuffer());
    await writeFile(`${dir}${sep}logo_${size}x${size}.png`, data);
  }
  statusMsg.value = `已保存 ${blobs.length} 个文件到: ${dir}`;
}

async function saveWeb(blobs: { size: number; blob: Blob }[]) {
  for (const { size, blob } of blobs) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logo_${size}x${size}.png`;
    a.click();
    URL.revokeObjectURL(url);
    await new Promise((r) => setTimeout(r, 200));
  }
  statusMsg.value = `已下载 ${blobs.length} 个文件`;
}

/* ==================== 尺寸增减 ==================== */
const customSize = ref(1024);
function addSize() {
  if (customSize.value > 0 && !exportSizes.value.includes(customSize.value)) {
    exportSizes.value = [...exportSizes.value, customSize.value].sort(
      (a, b) => a - b,
    );
  }
}
function removeSize(s: number) {
  exportSizes.value = exportSizes.value.filter((x) => x !== s);
}
</script>

<template>
  <div class="tool-page">
    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleFile"
    />

    <!-- ====== 上传区域 ====== -->
    <div
      v-if="!imgSrc"
      class="upload-area"
      @click="triggerUpload"
      @drop="handleDrop"
      @dragover.prevent
    >
      <div class="upload-icon">🖼️</div>
      <div class="upload-text">点击上传或拖拽图片到这里</div>
      <div class="upload-hint">支持 JPG / PNG / WebP / SVG 等格式</div>
    </div>

    <template v-else>
      <!-- ====== 主内容：裁剪 + 预览 ====== -->
      <div class="main-row">
        <!-- 图片裁剪区 -->
        <div class="section">
          <div class="section-header">
            <h3 class="section-title">图片裁剪</h3>
            <div class="section-actions">
              <button class="btn btn-ghost btn-sm" @click="resetCrop">
                重置裁剪
              </button>
              <button class="btn btn-ghost btn-sm" @click="triggerUpload">
                更换图片
              </button>
            </div>
          </div>
          <div
            ref="imgWrapRef"
            class="img-wrap"
            :style="{ width: displayW + 'px', height: displayH + 'px' }"
            @mousedown="onOverlayMouseDown"
          >
            <img :src="imgSrc" class="crop-img" draggable="false" />
            <!-- SVG 半透明遮罩 -->
            <svg
              class="crop-svg"
              :viewBox="`0 0 ${displayW} ${displayH}`"
              preserveAspectRatio="none"
            >
              <path
                :d="`M0 0 H${displayW} V${displayH} H0 Z M${(cropX / 100) * displayW} ${(cropY / 100) * displayH} H${((cropX + cropW) / 100) * displayW} V${((cropY + cropH) / 100) * displayH} H${(cropX / 100) * displayW} Z`"
                fill="rgba(0,0,0,0.55)"
                fill-rule="evenodd"
                pointer-events="none"
              />
            </svg>
            <!-- 裁剪框 -->
            <div class="crop-box" :style="cropBoxStyle">
              <div class="corner corner-nw" />
              <div class="corner corner-ne" />
              <div class="corner corner-sw" />
              <div class="corner corner-se" />
            </div>
          </div>
          <div class="crop-info">
            原图 {{ naturalW }}×{{ naturalH }} &nbsp;·&nbsp; 裁剪
            {{
              Math.round(
                Math.min((cropW / 100) * naturalW, (cropH / 100) * naturalH),
              )
            }}×{{
              Math.round(
                Math.min((cropW / 100) * naturalW, (cropH / 100) * naturalH),
              )
            }}
          </div>
        </div>

        <!-- 预览区 -->
        <div class="section">
          <h3 class="section-title">效果预览</h3>
          <div class="preview-area">
            <canvas ref="previewCanvas" class="preview-canvas" />
          </div>
          <div class="preview-meta">
            <span>{{
              useAppleSquircle ? "苹果图标形状" : `圆角 ${radiusPercent}%`
            }}</span>
            <span
              >{{
                Math.round(
                  Math.min((cropW / 100) * naturalW, (cropH / 100) * naturalH),
                )
              }}×{{
                Math.round(
                  Math.min((cropW / 100) * naturalW, (cropH / 100) * naturalH),
                )
              }}</span
            >
          </div>
        </div>
      </div>

      <!-- ====== 控制面板 ====== -->
      <div class="control-panel">
        <!-- 圆角滑块 -->
        <div class="control-row full">
          <label>圆角大小</label>
          <input
            type="range"
            v-model.number="radiusPercent"
            min="0"
            max="50"
            step="1"
            class="range"
            @input="updatePreview"
          />
          <span class="range-val">{{ radiusPercent }}%</span>
        </div>

        <!-- 预设按钮 -->
        <div class="control-row">
          <label>圆角预设</label>
          <div class="preset-group">
            <button
              v-for="p in presets"
              :key="p.val"
              :class="[
                'btn btn-chip',
                { active: radiusPercent === p.val && !useAppleSquircle },
              ]"
              @click="
                radiusPercent = p.val;
                useAppleSquircle = false;
                updatePreview();
              "
            >
              {{ p.label }}
            </button>
            <button
              :class="['btn btn-chip btn-apple', { active: useAppleSquircle }]"
              @click="
                useAppleSquircle = !useAppleSquircle;
                updatePreview();
              "
            >
              🍎 Apple 图标
            </button>
          </div>
        </div>

        <!-- 导出尺寸 -->
        <div class="control-row">
          <label>导出尺寸</label>
          <div class="size-tags">
            <span v-for="s in exportSizes" :key="s" class="size-tag">
              {{ s }}px
              <button class="size-remove" @click="removeSize(s)">×</button>
            </span>
            <input
              v-model.number="customSize"
              type="number"
              min="16"
              max="4096"
              class="input-xs"
              placeholder="自定义"
              @keydown.enter="addSize"
            />
            <button class="btn btn-chip btn-sm" @click="addSize">+</button>
          </div>
        </div>

        <!-- 下载按钮 -->
        <div class="control-row">
          <button
            class="btn btn-primary"
            :disabled="downloading"
            @click="downloadAll"
          >
            {{ downloading ? "导出中..." : "下载所有尺寸" }}
          </button>
        </div>
      </div>

      <!-- 状态消息 -->
      <div v-if="statusMsg" class="status-msg">{{ statusMsg }}</div>
    </template>
  </div>
</template>

<style scoped>
.tool-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ===== 上传区 ===== */
.upload-area {
  background: var(--color-card);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius);
  padding: 80px 40px;
  text-align: center;
  cursor: pointer;
  transition:
    border-color 0.2s,
    background 0.2s;
}
.upload-area:hover {
  border-color: var(--color-primary);
  background: var(--color-hover);
}
.upload-icon {
  font-size: 48px;
  margin-bottom: 12px;
}
.upload-text {
  font-size: 15px;
  color: var(--color-text);
  margin-bottom: 6px;
}
.upload-hint {
  font-size: 12px;
  color: var(--color-text-light);
}

/* ===== 主布局 ===== */
.main-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}
.section {
  flex: 1;
  min-width: 300px;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}
.section-actions {
  display: flex;
  gap: 6px;
}
.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

/* ===== 裁剪区 ===== */
.img-wrap {
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  cursor: crosshair;
  user-select: none;
  flex-shrink: 0;
  margin: 0 auto;
  touch-action: none;
}
.crop-img {
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.crop-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.crop-box {
  position: absolute;
  border: 2px solid #fff;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.5),
    inset 0 0 0 1px rgba(0, 0, 0, 0.2);
  cursor: move;
  box-sizing: border-box;
}
.corner {
  position: absolute;
  width: 10px;
  height: 10px;
  background: #fff;
  border: 1px solid var(--color-primary);
  border-radius: 2px;
}
.corner-nw {
  top: -5px;
  left: -5px;
  cursor: nwse-resize;
}
.corner-ne {
  top: -5px;
  right: -5px;
  cursor: nesw-resize;
}
.corner-sw {
  bottom: -5px;
  left: -5px;
  cursor: nesw-resize;
}
.corner-se {
  bottom: -5px;
  right: -5px;
  cursor: nwse-resize;
}
.crop-info {
  font-size: 12px;
  color: var(--color-text-light);
  text-align: center;
}

/* ===== 预览 ===== */
.preview-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: repeating-conic-gradient(#e0e0e0 0% 25%, transparent 0% 50%) 50% /
    16px 16px;
  border-radius: 4px;
  min-height: 200px;
  padding: 16px;
}
.preview-canvas {
  max-width: 256px;
  max-height: 256px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}
.preview-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--color-text-light);
}

/* ===== 控制面板 ===== */
.control-panel {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.control-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.control-row.full {
  width: 100%;
}
.control-row label {
  font-size: 13px;
  color: var(--color-text-light);
  min-width: 64px;
  flex-shrink: 0;
}
.range {
  flex: 1;
  min-width: 120px;
  accent-color: var(--color-primary);
}
.range-val {
  font-size: 13px;
  color: var(--color-text-light);
  min-width: 32px;
  text-align: right;
}

.preset-group {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

/* ===== 按钮 ===== */
.btn {
  padding: 7px 16px;
  border: none;
  border-radius: var(--radius);
  font-size: 13px;
  cursor: pointer;
  font-weight: 500;
  transition:
    opacity 0.2s,
    background 0.2s,
    color 0.2s;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-primary {
  background: var(--color-primary);
  color: #fff;
}
.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}
.btn-ghost {
  background: transparent;
  color: var(--color-text-light);
  border: 1px solid var(--color-border);
}
.btn-ghost:hover {
  background: var(--color-hover);
}
.btn-sm {
  padding: 4px 10px;
  font-size: 12px;
}
.btn-chip {
  padding: 5px 12px;
  background: var(--color-hover);
  color: var(--color-text-light);
  border: 1px solid transparent;
}
.btn-chip:hover {
  background: var(--color-border);
}
.btn-chip.active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}
.btn-apple {
  white-space: nowrap;
}

/* ===== 尺寸标签 ===== */
.size-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.size-tag {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 3px 8px;
  background: var(--color-hover);
  border-radius: 4px;
  font-size: 12px;
  color: var(--color-text-light);
}
.size-remove {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-light);
  font-size: 14px;
  padding: 0 2px;
  line-height: 1;
}
.size-remove:hover {
  color: var(--color-danger, #e74c3c);
}
.input-xs {
  width: 64px;
  padding: 3px 6px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 12px;
  outline: none;
  background: var(--color-card);
  color: var(--color-text);
}

/* ===== 状态消息 ===== */
.status-msg {
  padding: 10px 14px;
  background: var(--color-highlight-blue, rgba(59, 130, 246, 0.1));
  color: var(--color-primary);
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 500;
}
</style>
