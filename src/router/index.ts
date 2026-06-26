import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";

/** 工具路由配置 */
const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/common/json-format",
  },
  // 常用工具
  {
    path: "/common/json-format",
    name: "JsonFormat",
    component: () => import("../views/common/JsonFormat.vue"),
    meta: { title: "JSON格式化", category: "常用工具" },
  },
  // 查询工具
  {
    path: "/query/zip-code",
    name: "ZipCode",
    component: () => import("../views/query/ZipCode.vue"),
    meta: { title: "邮编查询", category: "查询工具" },
  },
  {
    path: "/query/garbage-classify",
    name: "GarbageClassify",
    component: () => import("../views/query/GarbageClassify.vue"),
    meta: { title: "垃圾分类", category: "查询工具" },
  },
  {
    path: "/query/domain-info",
    name: "DomainInfo",
    component: () => import("../views/query/DomainInfo.vue"),
    meta: { title: "域名信息", category: "查询工具" },
  },
  // 图片工具
  {
    path: "/image/icon-gen",
    name: "IconGen",
    component: () => import("../views/image/IconGen.vue"),
    meta: { title: "图标生成", category: "图片工具" },
  },
  {
    path: "/image/logo-beautify",
    name: "LogoBeautify",
    component: () => import("../views/image/LogoBeautify.vue"),
    meta: { title: "Logo美化", category: "图片工具" },
  },
  // 设备工具
  {
    path: "/device/device-info",
    name: "DeviceInfo",
    component: () => import("../views/device/DeviceInfo.vue"),
    meta: { title: "设备信息", category: "设备工具" },
  },
  // 其他工具
  {
    path: "/other/short-link",
    name: "ShortLink",
    component: () => import("../views/other/ShortLink.vue"),
    meta: { title: "短链接生成", category: "其他工具" },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
