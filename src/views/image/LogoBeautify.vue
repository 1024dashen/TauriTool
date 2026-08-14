<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { isTauri } from '@tauri-apps/api/core'

/* ==================== 图片上传 ==================== */
const imgSrc = ref('')
const naturalW = ref(0)
const naturalH = ref(0)
const imgEl = ref<HTMLImageElement | null>(null)

/* ==================== 变换参数 ==================== */
const imgScale = ref(1) // 缩放倍率（相对适配尺寸）
const imgRotation = ref(0) // 旋转角度（0-360）
const imgOffsetX = ref(0) // 平移 X（编辑器像素）
const imgOffsetY = ref(0) // 平移 Y（编辑器像素）

/* ==================== 裁剪参数（百分比 0-100，相对于旋转后显示尺寸） ==================== */
const cropX = ref(0)
const cropY = ref(0)
const cropW = ref(100)
const cropH = ref(100)

/* ==================== 圆角参数 ==================== */
const radiusPercent = ref(0)
const useAppleSquircle = ref(false)

/* ==================== 内边距（透明边距百分比 0-40） ==================== */
const paddingPercent = ref(0)

/* ==================== UI 状态 ==================== */
const statusMsg = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const exportSizes = ref([64, 128, 256, 512, 1024])
const downloading = ref(false)

/* ==================== 编辑器 ==================== */
const editorCanvas = ref<HTMLCanvasElement | null>(null)
const editorSize = 420
const previewCanvas = ref<HTMLCanvasElement | null>(null)
const PREVIEW_SIZE = 256

/** 旋转后的原始尺寸（宽/高可能互换） */
const rotatedW = computed(() => {
    const rad = (imgRotation.value * Math.PI) / 180
    return Math.round(
        Math.abs(naturalW.value * Math.cos(rad)) +
            Math.abs(naturalH.value * Math.sin(rad))
    )
})
const rotatedH = computed(() => {
    const rad = (imgRotation.value * Math.PI) / 180
    return Math.round(
        Math.abs(naturalW.value * Math.sin(rad)) +
            Math.abs(naturalH.value * Math.cos(rad))
    )
})

/** 适配编辑器的缩放倍率（zoom=1 时图片刚好填满编辑器） */
const fitScale = computed(() => {
    const maxDim = Math.max(rotatedW.value, rotatedH.value)
    return maxDim > 0 ? editorSize / maxDim : 1
})

/* 裁剪框 CSS 定位 */

/* ==================== 圆角预设 ==================== */
const presets = [
    { label: '无圆角', val: 0 },
    { label: '小圆角 10%', val: 10 },
    { label: '中圆角 25%', val: 25 },
    { label: '大圆角 50%', val: 50 },
]

/* ==================== 风格预设（圆角 + 内边距 + squircle 组合） ==================== */
interface StylePreset {
    label: string
    icon: string
    radius: number
    padding: number
    squircle: boolean
}
const stylePresets: StylePreset[] = [
    { label: '原始', icon: '◻️', radius: 0, padding: 0, squircle: false },
    { label: 'Apple 图标', icon: '🍎', radius: 22, padding: 0, squircle: true },
    {
        label: 'iOS 小图标',
        icon: '🍏',
        radius: 22,
        padding: 10,
        squircle: true,
    },
    {
        label: 'macOS 通知',
        icon: '🔔',
        radius: 22,
        padding: 15,
        squircle: true,
    },
]
function applyStylePreset(p: StylePreset) {
    radiusPercent.value = p.radius
    paddingPercent.value = p.padding
    useAppleSquircle.value = p.squircle
    updatePreview()
}
function isActivePreset(p: StylePreset) {
    return (
        radiusPercent.value === p.radius &&
        paddingPercent.value === p.padding &&
        useAppleSquircle.value === p.squircle
    )
}

/* ==================== 上传处理 ==================== */
function triggerUpload() {
    fileInput.value?.click()
}

function handleFile(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    loadFile(file)
}

function handleDrop(e: DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer?.files?.[0]
    if (file) loadFile(file)
}

function loadFile(file: File) {
    if (!file.type.startsWith('image/')) {
        statusMsg.value = '请选择图片文件'
        return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
        imgSrc.value = ev.target?.result as string
        const img = new Image()
        img.onload = () => {
            naturalW.value = img.width
            naturalH.value = img.height
            imgEl.value = img
            fitView()
            resetCrop()
            statusMsg.value = ''
            attachWheelListener()
            drawEditor()
            updatePreview()
        }
        img.src = imgSrc.value
    }
    reader.readAsDataURL(file)
}

/* ==================== 视图控制 ==================== */
function fitView() {
    imgScale.value = 1
    imgOffsetX.value = 0
    imgOffsetY.value = 0
}

function resetCrop() {
    cropX.value = 0
    cropY.value = 0
    cropW.value = 100
    cropH.value = 100
}

function rotateLeft() {
    imgRotation.value = (imgRotation.value + 270) % 360
    fitView()
    drawEditor()
    updatePreview()
}
function rotateRight() {
    imgRotation.value = (imgRotation.value + 90) % 360
    fitView()
    drawEditor()
    updatePreview()
}
function onRotationInput() {
    drawEditor()
    updatePreview()
}

function applyPreset(val: number) {
    radiusPercent.value = val
    useAppleSquircle.value = false
    updatePreview()
}
function onFitClick() {
    fitView()
    drawEditor()
    updatePreview()
}

/** 滚轮缩放 */
function onWheel(e: WheelEvent) {
    e.preventDefault()
    const factor = e.deltaY > 0 ? 0.92 : 1.08
    imgScale.value = clamp(imgScale.value * factor, 0.1, 10)
    drawEditor()
    updatePreview()
}

/* ==================== 编辑器 Canvas 绘制 ==================== */
function drawEditor() {
    const canvas = editorCanvas.value
    if (!canvas || !imgEl.value) return
    const ctx = canvas.getContext('2d')!
    const S = editorSize
    ctx.clearRect(0, 0, S, S)

    // 棋盘格背景
    const ts = 10
    for (let y = 0; y < S; y += ts) {
        for (let x = 0; x < S; x += ts) {
            ctx.fillStyle =
                (Math.floor(x / ts) + Math.floor(y / ts)) % 2 === 0
                    ? '#e8e8e8'
                    : '#fff'
            ctx.fillRect(x, y, ts, ts)
        }
    }

    // 绘制带变换的图片
    ctx.save()
    ctx.translate(S / 2 + imgOffsetX.value, S / 2 + imgOffsetY.value)
    ctx.rotate((imgRotation.value * Math.PI) / 180)
    const sc = fitScale.value * imgScale.value
    ctx.scale(sc, sc)
    ctx.drawImage(imgEl.value, -naturalW.value / 2, -naturalH.value / 2)
    ctx.restore()

    // 裁剪遮罩（半透明黑色）
    const cx = (cropX.value / 100) * S
    const cy = (cropY.value / 100) * S
    const cw = (cropW.value / 100) * S
    const ch = (cropH.value / 100) * S
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    // 上方
    ctx.fillRect(0, 0, S, cy)
    // 下方
    ctx.fillRect(0, cy + ch, S, S - cy - ch)
    // 左方
    ctx.fillRect(0, cy, cx, ch)
    // 右方
    ctx.fillRect(cx + cw, cy, S - cx - cw, ch)

    // 裁剪框边框
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.strokeRect(cx, cy, cw, ch)

    // 裁剪框内参考线（三分线）
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 1
    for (let i = 1; i <= 2; i++) {
        ctx.beginPath()
        ctx.moveTo(cx + (cw / 3) * i, cy)
        ctx.lineTo(cx + (cw / 3) * i, cy + ch)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(cx, cy + (ch / 3) * i)
        ctx.lineTo(cx + cw, cy + (ch / 3) * i)
        ctx.stroke()
    }

    // 四角手柄
    const hs = 8
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = 'var(--color-primary, #2563eb)'
    ctx.lineWidth = 1.5
    for (const [hx, hy] of [
        [cx, cy],
        [cx + cw, cy],
        [cx, cy + ch],
        [cx + cw, cy + ch],
    ]) {
        ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs)
        ctx.strokeRect(hx - hs / 2, hy - hs / 2, hs, hs)
    }
}

/* ==================== 鼠标交互：角柄=裁剪缩放，其余=平移图片 ==================== */
const isDragging = ref(false)
const dragType = ref<'pan' | 'nw' | 'ne' | 'sw' | 'se' | ''>('')
const dragStart = ref({ mx: 0, my: 0, w: 0, h: 0, ox: 0, oy: 0 })

function editorMouseDown(e: MouseEvent) {
    const S = editorSize
    const mx = e.offsetX,
        my = e.offsetY
    const bx = (cropX.value / 100) * S,
        by = (cropY.value / 100) * S
    const bw = (cropW.value / 100) * S,
        bh = (cropH.value / 100) * S

    // 仅角柄触发裁剪缩放，其余全部平移图片
    const corner = detectCorner(mx, my, bx, by, bw, bh)
    dragType.value = corner || 'pan'
    isDragging.value = true
    dragStart.value = {
        mx,
        my,
        w: cropW.value,
        h: cropH.value,
        ox: imgOffsetX.value,
        oy: imgOffsetY.value,
    }
    window.addEventListener('mousemove', editorMouseMove)
    window.addEventListener('mouseup', editorMouseUp)
}

function editorMouseMove(e: MouseEvent) {
    if (!isDragging.value) return
    const canvas = editorCanvas.value
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left,
        my = e.clientY - rect.top
    const dxPx = mx - dragStart.value.mx,
        dyPx = my - dragStart.value.my
    const s = dragStart.value
    const S = editorSize

    if (dragType.value === 'pan') {
        // 平移图片（任意位置拖拽均可）
        imgOffsetX.value = s.ox + dxPx
        imgOffsetY.value = s.oy + dyPx
    } else {
        // 角柄缩放裁剪（始终居中，等比缩放）
        const distFromCenter = Math.max(
            Math.abs(mx - S / 2),
            Math.abs(my - S / 2)
        )
        const newPct = clamp(((distFromCenter * 2) / S) * 100, 10, 100)
        cropW.value = newPct
        cropH.value = newPct
        cropX.value = (100 - newPct) / 2
        cropY.value = (100 - newPct) / 2
    }
    drawEditor()
}

function editorMouseUp() {
    isDragging.value = false
    window.removeEventListener('mousemove', editorMouseMove)
    window.removeEventListener('mouseup', editorMouseUp)
    updatePreview()
}

const TH = 14
function detectCorner(
    mx: number,
    my: number,
    bx: number,
    by: number,
    bw: number,
    bh: number
) {
    if (Math.abs(mx - bx) < TH && Math.abs(my - by) < TH) return 'nw'
    if (Math.abs(mx - (bx + bw)) < TH && Math.abs(my - by) < TH) return 'ne'
    if (Math.abs(mx - bx) < TH && Math.abs(my - (by + bh)) < TH) return 'sw'
    if (Math.abs(mx - (bx + bw)) < TH && Math.abs(my - (by + bh)) < TH)
        return 'se'
    return null
}
function clamp(v: number, min: number, max: number) {
    return Math.min(max, Math.max(min, v))
}

/** 计算滑块填充百分比 CSS 变量 */
function rangeStyle(val: number, min: number, max: number) {
    const pct = ((val - min) / (max - min)) * 100
    return { '--range-pct': `${pct}%` } as Record<string, string>
}

/* ==================== 滚轮事件监听（支持 preventDefault） ==================== */
function attachWheelListener() {
    nextTick(() => {
        editorCanvas.value?.addEventListener('wheel', onWheel, {
            passive: false,
        })
    })
}
watch(imgSrc, (newVal, _oldVal) => {
    if (!newVal && editorCanvas.value) {
        editorCanvas.value.removeEventListener('wheel', onWheel)
    }
})

/* ==================== Canvas 渲染核心 ==================== */

/** 裁剪区域像素坐标（旋转后坐标系，始终正方形） */
function getCropPixels() {
    const side = Math.max(
        Math.min(
            Math.round((cropW.value / 100) * editorSize),
            Math.round((cropH.value / 100) * editorSize)
        ),
        1
    )
    const x = Math.round((cropX.value / 100) * editorSize)
    const y = Math.round((cropY.value / 100) * editorSize)
    return { x, y, side }
}

/** 绘制苹果 squircle（连续曲率圆角）路径 */
function drawSquirclePath(
    ctx: CanvasRenderingContext2D,
    size: number,
    cornerR: number
) {
    const s = size,
        r = Math.min(cornerR, s / 2),
        c = r * 0.92
    ctx.beginPath()
    ctx.moveTo(r, 0)
    ctx.lineTo(s - r, 0)
    ctx.bezierCurveTo(s - r + c, 0, s, r - c, s, r)
    ctx.lineTo(s, s - r)
    ctx.bezierCurveTo(s, s - r + c, s - r + c, s, s - r, s)
    ctx.lineTo(r, s)
    ctx.bezierCurveTo(r - c, s, 0, s - r + c, 0, s - r)
    ctx.lineTo(0, r)
    ctx.bezierCurveTo(0, r - c, r - c, 0, r, 0)
    ctx.closePath()
}

/** 绘制标准圆角矩形路径 */
function drawRoundedRectPath(
    ctx: CanvasRenderingContext2D,
    size: number,
    r: number
) {
    const s = size
    r = Math.min(r, s / 2)
    ctx.beginPath()
    ctx.moveTo(r, 0)
    ctx.lineTo(s - r, 0)
    ctx.quadraticCurveTo(s, 0, s, r)
    ctx.lineTo(s, s - r)
    ctx.quadraticCurveTo(s, s, s - r, s)
    ctx.lineTo(r, s)
    ctx.quadraticCurveTo(0, s, 0, s - r)
    ctx.lineTo(0, r)
    ctx.quadraticCurveTo(0, 0, r, 0)
    ctx.closePath()
}

/** 渲染最终效果图（裁剪 + 变换 + 圆角/squircle + 透明内边距） */
async function renderToCanvas(canvas: HTMLCanvasElement, size: number) {
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, size, size)
    if (!imgEl.value) return

    const crop = getCropPixels()
    // 内边距：每边留出的透明空间占输出尺寸的百分比
    const pad = (paddingPercent.value / 100) * size
    const innerSize = size - pad * 2 // 去除内边距后的实际绘制区域尺寸
    if (innerSize <= 0) return

    const rPx = (radiusPercent.value / 100) * (innerSize / 2)

    ctx.save()
    // 平移到内边距区域起点
    ctx.translate(pad, pad)

    // 形状裁剪（应用在内边距内的区域上）
    if (useAppleSquircle.value) {
        drawSquirclePath(ctx, innerSize, rPx)
    } else if (radiusPercent.value > 0) {
        drawRoundedRectPath(ctx, innerSize, rPx)
    } else {
        ctx.rect(0, 0, innerSize, innerSize)
    }
    ctx.clip()

    // 计算编辑器坐标 → 输出 Canvas 的映射（基于 innerSize）
    const S = editorSize
    const sc = fitScale.value * imgScale.value
    const cx = S / 2 + imgOffsetX.value - crop.x
    const cy = S / 2 + imgOffsetY.value - crop.y
    const k = innerSize / crop.side

    ctx.translate(cx * k, cy * k)
    ctx.rotate((imgRotation.value * Math.PI) / 180)
    ctx.scale(sc * k, sc * k)
    ctx.drawImage(imgEl.value, -naturalW.value / 2, -naturalH.value / 2)
    ctx.restore()
}

/* ==================== 实时预览 ==================== */
async function updatePreview() {
    if (!previewCanvas.value || !imgEl.value) return
    previewCanvas.value.width = PREVIEW_SIZE
    previewCanvas.value.height = PREVIEW_SIZE
    await renderToCanvas(previewCanvas.value, PREVIEW_SIZE)
}

/* ==================== 导出下载 ==================== */
async function downloadAll() {
    if (!imgEl.value) {
        statusMsg.value = '请先上传图片'
        return
    }
    downloading.value = true
    statusMsg.value = ''
    try {
        const blobs: { size: number; blob: Blob }[] = []
        for (const size of exportSizes.value) {
            const c = document.createElement('canvas')
            c.width = size
            c.height = size
            await renderToCanvas(c, size)
            const blob = await new Promise<Blob>((r) =>
                c.toBlob((b) => r(b!), 'image/png')
            )
            blobs.push({ size, blob })
        }
        isTauri() ? await saveTauri(blobs) : await saveWeb(blobs)
    } catch (e) {
        statusMsg.value = `导出失败: ${
            e instanceof Error ? e.message : String(e)
        }`
    } finally {
        downloading.value = false
    }
}

async function saveTauri(blobs: { size: number; blob: Blob }[]) {
    const { open } = await import('@tauri-apps/plugin-dialog')
    const { writeFile } = await import('@tauri-apps/plugin-fs')
    const dir = await open({ directory: true, title: '选择保存文件夹' })
    if (!dir) {
        statusMsg.value = '已取消'
        return
    }
    const sep = dir.endsWith('/') || dir.endsWith('\\') ? '' : '/'
    for (const { size, blob } of blobs) {
        const data = new Uint8Array(await blob.arrayBuffer())
        await writeFile(`${dir}${sep}logo_${size}x${size}.png`, data)
    }
    statusMsg.value = `已保存 ${blobs.length} 个文件到: ${dir}`
}

async function saveWeb(blobs: { size: number; blob: Blob }[]) {
    for (const { size, blob } of blobs) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `logo_${size}x${size}.png`
        a.click()
        URL.revokeObjectURL(url)
        await new Promise((r) => setTimeout(r, 200))
    }
    statusMsg.value = `已下载 ${blobs.length} 个文件`
}

/* ==================== 尺寸增减 ==================== */
const customSize = ref(1024)
function addSize() {
    if (customSize.value > 0 && !exportSizes.value.includes(customSize.value)) {
        exportSizes.value = [...exportSizes.value, customSize.value].sort(
            (a, b) => a - b
        )
    }
}
function removeSize(s: number) {
    exportSizes.value = exportSizes.value.filter((x) => x !== s)
}

/* ==================== ICNS 导出 ==================== */

/** 尺寸对应的 ICNS OSType（macOS 标准） */
const ICNS_TYPES: Record<number, string> = {
    16: 'icp4',
    32: 'icp5',
    64: 'icp6',
    128: 'ic07',
    256: 'ic08',
    512: 'ic09',
    1024: 'ic10',
}

/** 将字符串编码为 4 字节 ASCII */
function encodeOSType(s: string): Uint8Array {
    return new Uint8Array([
        s.charCodeAt(0),
        s.charCodeAt(1),
        s.charCodeAt(2),
        s.charCodeAt(3),
    ])
}

/** 将 uint32 编码为大端序 4 字节 */
function encodeUint32BE(n: number): Uint8Array {
    return new Uint8Array([
        (n >> 24) & 0xff,
        (n >> 16) & 0xff,
        (n >> 8) & 0xff,
        n & 0xff,
    ])
}

/** 拼接多个 Uint8Array */
function concatBytes(...arrays: Uint8Array[]): Uint8Array {
    const total = arrays.reduce((sum, a) => sum + a.length, 0)
    const result = new Uint8Array(total)
    let offset = 0
    for (const a of arrays) {
        result.set(a, offset)
        offset += a.length
    }
    return result
}

/**
 * 构建 ICNS 二进制文件
 * 格式：magic(4) + filesize(4) + [type(4) + entrysize(4) + pngdata(n)]...
 */
function buildICNS(icons: { size: number; png: Uint8Array }[]): Uint8Array {
    const entries: Uint8Array[] = []
    for (const { size, png } of icons) {
        const ostype = ICNS_TYPES[size]
        if (!ostype) continue
        const entryLen = 8 + png.length
        entries.push(
            concatBytes(encodeOSType(ostype), encodeUint32BE(entryLen), png)
        )
    }
    const body = concatBytes(...entries)
    const fileLen = 8 + body.length
    return concatBytes(encodeOSType('icns'), encodeUint32BE(fileLen), body)
}

/** 生成 ICNS 并下载 */
async function downloadICNS() {
    if (!imgEl.value) {
        statusMsg.value = '请先上传图片'
        return
    }
    downloading.value = true
    statusMsg.value = ''
    try {
        // 使用所有标准 ICNS 尺寸（与导出尺寸取交集）
        const icnsSizes = [16, 32, 64, 128, 256, 512, 1024]
        const icons: { size: number; png: Uint8Array }[] = []
        for (const size of icnsSizes) {
            const c = document.createElement('canvas')
            c.width = size
            c.height = size
            await renderToCanvas(c, size)
            const blob = await new Promise<Blob>((r) =>
                c.toBlob((b) => r(b!), 'image/png')
            )
            icons.push({ size, png: new Uint8Array(await blob.arrayBuffer()) })
        }
        const icnsData = buildICNS(icons)
        if (isTauri()) {
            const { open } = await import('@tauri-apps/plugin-dialog')
            const { writeFile } = await import('@tauri-apps/plugin-fs')
            const dir = await open({ directory: true, title: '选择保存位置' })
            if (!dir) {
                statusMsg.value = '已取消'
                return
            }
            const sep = dir.endsWith('/') || dir.endsWith('\\') ? '' : '/'
            await writeFile(`${dir}${sep}logo.icns`, icnsData)
            statusMsg.value = `已保存 ICNS 到: ${dir}`
        } else {
            const blob = new Blob([icnsData.buffer.slice(0) as ArrayBuffer], {
                type: 'image/x-icns',
            })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'logo.icns'
            a.click()
            URL.revokeObjectURL(url)
            statusMsg.value = '已下载 logo.icns'
        }
    } catch (e) {
        statusMsg.value = `ICNS 导出失败: ${
            e instanceof Error ? e.message : String(e)
        }`
    } finally {
        downloading.value = false
    }
}
</script>

<template>
    <div class="tool-page">
        <input
            ref="fileInput"
            type="file"
            accept="image/*"
            style="display: none"
            @change="handleFile"
        />

        <!-- 上传区域 -->
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
            <!-- 主内容：编辑器 + 预览 -->
            <div class="main-row">
                <!-- 图片编辑器 -->
                <div class="section">
                    <div class="section-header">
                        <h3 class="section-title">图片编辑</h3>
                        <div class="section-actions">
                            <button
                                class="btn btn-ghost btn-sm"
                                @click="onFitClick"
                            >
                                适配
                            </button>
                            <button
                                class="btn btn-ghost btn-sm"
                                @click="resetCrop"
                            >
                                重置裁剪
                            </button>
                            <button
                                class="btn btn-ghost btn-sm"
                                @click="triggerUpload"
                            >
                                更换图片
                            </button>
                        </div>
                    </div>

                    <div class="editor-container">
                        <canvas
                            ref="editorCanvas"
                            :width="editorSize"
                            :height="editorSize"
                            class="editor-canvas"
                            @mousedown="editorMouseDown"
                        />
                    </div>

                    <div class="editor-info">
                        原图 {{ naturalW }}×{{ naturalH }} &nbsp;·&nbsp; 缩放
                        {{ (imgScale * 100).toFixed(0) }}% &nbsp;·&nbsp; 旋转
                        {{ imgRotation }}°
                    </div>
                </div>

                <!-- 预览区 -->
                <div class="section">
                    <h3 class="section-title">效果预览</h3>
                    <div class="preview-area">
                        <canvas ref="previewCanvas" class="preview-canvas" />
                    </div>
                    <div class="preview-meta">
                        <span
                            >{{
                                useAppleSquircle
                                    ? `Apple 圆角 ${radiusPercent}%`
                                    : `圆角 ${radiusPercent}%`
                            }}
                            · 内边距 {{ paddingPercent }}%</span
                        >
                    </div>
                </div>
            </div>

            <!-- 控制面板 -->
            <div class="control-panel">
                <!-- 缩放 -->
                <!-- <div class="control-row full">
                    <label>缩放</label>
                    <button class="btn btn-ghost btn-xs" @click="scaleDown">
                        −
                    </button>
                    <input
                        type="range"
                        v-model.number="imgScale"
                        min="0.1"
                        max="5"
                        step="0.01"
                        class="range"
                        :style="rangeStyle(imgScale, 0.1, 5)"
                        @input="onScaleInput"
                    />
                    <button class="btn btn-ghost btn-xs" @click="scaleUp">
                        +
                    </button>
                    <span class="range-val"
                        >{{ (imgScale * 100).toFixed(0) }}%</span
                    >
                </div> -->

                <!-- 旋转 -->
                <div class="control-row full">
                    <label>旋转</label>
                    <button class="btn btn-ghost btn-xs" @click="rotateLeft">
                        ↺ 90°
                    </button>
                    <input
                        type="range"
                        v-model.number="imgRotation"
                        min="0"
                        max="359"
                        step="1"
                        class="range"
                        :style="rangeStyle(imgRotation, 0, 359)"
                        @input="onRotationInput"
                    />
                    <button class="btn btn-ghost btn-xs" @click="rotateRight">
                        ↻ 90°
                    </button>
                    <span class="range-val">{{ imgRotation }}°</span>
                </div>

                <!-- 裁剪尺寸 -->
                <!-- <div class="control-row full">
          <label>裁剪</label>
          <input
            type="range"
            v-model.number="cropW"
            min="10"
            max="100"
            step="1"
            class="range"
            :style="rangeStyle(cropW, 10, 100)"
            @input="onCropSizeInput"
          />
          <span class="range-val">{{ cropW.toFixed(0) }}%</span>
        </div> -->

                <!-- 圆角 -->
                <div class="control-row full">
                    <label>圆角</label>
                    <input
                        type="range"
                        v-model.number="radiusPercent"
                        min="0"
                        max="100"
                        step="1"
                        class="range"
                        :style="rangeStyle(radiusPercent, 0, 100)"
                        @input="updatePreview"
                    />
                    <span class="range-val">{{ radiusPercent }}%</span>
                </div>

                <!-- 内边距 -->
                <div class="control-row full">
                    <label>内边距</label>
                    <input
                        type="range"
                        v-model.number="paddingPercent"
                        min="0"
                        max="40"
                        step="1"
                        class="range"
                        :style="rangeStyle(paddingPercent, 0, 40)"
                        @input="updatePreview"
                    />
                    <span class="range-val">{{ paddingPercent }}%</span>
                </div>

                <!-- 风格预设 -->
                <div class="control-row">
                    <label>图标风格</label>
                    <div class="preset-group">
                        <button
                            v-for="p in stylePresets"
                            :key="p.label"
                            :class="[
                                'btn btn-chip',
                                { active: isActivePreset(p) },
                            ]"
                            @click="applyStylePreset(p)"
                        >
                            {{ p.icon }} {{ p.label }}
                        </button>
                    </div>
                </div>

                <!-- 圆角预设 -->
                <div class="control-row">
                    <label>圆角预设</label>
                    <div class="preset-group">
                        <button
                            v-for="p in presets"
                            :key="p.val"
                            :class="[
                                'btn btn-chip',
                                {
                                    active:
                                        radiusPercent === p.val &&
                                        !useAppleSquircle,
                                },
                            ]"
                            @click="applyPreset(p.val)"
                        >
                            {{ p.label }}
                        </button>
                    </div>
                </div>

                <!-- 导出尺寸 -->
                <div class="control-row">
                    <label>导出尺寸</label>
                    <div class="size-tags">
                        <span
                            v-for="s in exportSizes"
                            :key="s"
                            class="size-tag"
                        >
                            {{ s }}px
                            <button class="size-remove" @click="removeSize(s)">
                                ×
                            </button>
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
                        <button class="btn btn-chip btn-sm" @click="addSize">
                            +
                        </button>
                    </div>
                </div>

                <!-- 下载 -->
                <div class="control-row">
                    <button
                        class="btn btn-primary"
                        :disabled="downloading"
                        @click="downloadAll"
                    >
                        {{ downloading ? '导出中...' : '下载 PNG' }}
                    </button>
                    <button
                        class="btn btn-primary"
                        :disabled="downloading"
                        @click="downloadICNS"
                    >
                        {{ downloading ? '导出中...' : '下载 ICNS' }}
                    </button>
                </div>
            </div>

            <div v-if="statusMsg" class="status-msg">{{ statusMsg }}</div>
        </template>
    </div>
</template>

<style scoped>
.tool-page {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

/* ===== 上传区 ===== */
.upload-area {
    background: var(--color-card);
    border: 2px dashed var(--color-border);
    border-radius: var(--radius);
    padding: 80px 40px;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
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
    gap: 12px;
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

/* ===== 编辑器 ===== */
.editor-container {
    display: flex;
    justify-content: center;
}
.editor-canvas {
    border-radius: 4px;
    cursor: crosshair;
    user-select: none;
    touch-action: none;
    max-width: 100%;
    height: auto;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}
.editor-info {
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
    min-width: 56px;
    flex-shrink: 0;
}
/* ===== 滑块 ===== */
.range {
    -webkit-appearance: none;
    appearance: none;
    flex: 1;
    min-width: 100px;
    height: 6px;
    border-radius: 3px;
    background: var(--color-border);
    outline: none;
    cursor: pointer;
    transition: background 0.2s;
}
/* Webkit 轨道 */
.range::-webkit-slider-runnable-track {
    height: 6px;
    border-radius: 3px;
    background: linear-gradient(
        to right,
        var(--color-primary) 0%,
        var(--color-primary) var(--range-pct, 50%),
        var(--color-border) var(--range-pct, 50%),
        var(--color-border) 100%
    );
}
/* Webkit 拇指 */
.range::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--color-primary);
    border: 2px solid #fff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    margin-top: -5px;
    transition: transform 0.15s, box-shadow 0.15s;
}
.range::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 2px 8px rgba(14, 165, 233, 0.4);
}
.range::-webkit-slider-thumb:active {
    transform: scale(1.1);
}
/* Firefox 轨道 */
.range::-moz-range-track {
    height: 6px;
    border-radius: 3px;
    background: var(--color-border);
    border: none;
}
/* Firefox 填充 */
.range::-moz-range-progress {
    height: 6px;
    border-radius: 3px;
    background: var(--color-primary);
}
/* Firefox 拇指 */
.range::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--color-primary);
    border: 2px solid #fff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
    cursor: pointer;
}
.range-val {
    font-size: 13px;
    color: var(--color-text-light);
    min-width: 40px;
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
    transition: opacity 0.2s, background 0.2s;
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
.btn-xs {
    padding: 2px 8px;
    font-size: 14px;
    font-weight: 700;
    min-width: 28px;
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
