import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";

/** 创建 Vue 应用实例并挂载插件 */
const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount("#app");
