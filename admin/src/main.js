import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import store from './store' // 新增
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { getToken } from '@/utils/auth' // 添加这行

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

app.use(ElementPlus)
app.use(router)
app.use(store) // 新增
app.mount('#app')
app.config.globalProperties.$axios = axios

router.beforeEach((to, from, next) => {
    const token = getToken();
    
    // 不需要登录的页面白名单
    const allowList = ['/login'];
    
    if (token) {
      // 已登录时访问登录页自动跳转首页
      if (to.path === '/login') {
        next('/');
      } else {
        next();
      }
    } else {
      // 未登录时访问需授权页面跳转登录页
      if (allowList.includes(to.path)) {
        next();
      } else {
        next('/login');
      }
    }
  });