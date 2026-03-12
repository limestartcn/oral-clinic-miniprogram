// store/index.js
import { createStore } from 'vuex'
import user from './modules/user'
import createPersistedState from 'vuex-persistedstate'

export default createStore({
  modules: { user },
  plugins: [
    createPersistedState({
      paths: ['user'], // 指定需要持久化的模块
      storage: window.localStorage // 使用localStorage
    })
  ]
})