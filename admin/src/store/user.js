// store/modules/user.js
export default {
  state: () => ({
    token: localStorage.getItem('admin-token') || '',
    roleId: null,
    nickname: '',
    avatar: ''
  }),
  mutations: {
    SET_TOKEN(state, token) {
      state.token = token
      localStorage.setItem('admin-token', token)
    },
    SET_USER_INFO(state, payload) {
      // 修正数据结构
      state.roleId = payload.userInfo.roleId
      state.token = payload.token
      state.nickname = payload.userInfo.nickname
      state.avatar = payload.userInfo.avatar
    },
    CLEAR_USER(state) {
      state.token = ''
      state.roleId = null
      state.nickname = ''
      state.avatar = ''
      localStorage.removeItem('admin-token')
    }
  },
  actions: {
    // 新增：初始化时根据token获取用户信息
    async initUser({ commit }) {
      const token = localStorage.getItem('admin-token')
      if (token) {
        try {
          const res = await this.$axios.get('/user/info')
          commit('SET_USER_INFO', {
            roleId: res.data.roleId,
            nickname: res.data.nickname,
            avatar: res.data.avatar
          })
        } catch (error) {
          commit('CLEAR_USER')
        }
      }
    },
    async fetchUserInfo({ commit }) {
      try {
        const res = await getUserInfo()
        console.log('[用户信息] 原始响应:', res) // 调试日志
        commit('SET_USER_INFO', {
          token: res.token,
          userInfo: res.userInfo // 确保数据结构一致
        })
      } catch (error) {
        console.error('获取用户信息失败:', error)
      }
    }
  }
}