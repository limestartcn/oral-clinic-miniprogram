export default {
    namespaced: true, 
    state: () => ({
      token: localStorage.getItem('admin-token') || null, // 初始化时读取
      roleId: null,
      nickname: '',
      avatar: ''
    }),
    mutations: {
      SET_USER_INFO(state, payload) {
        state.token = payload.token; // 新增token字段
        state.roleId = payload.roleId;
        state.nickname = payload.nickname;
        state.avatar = payload.avatar;
        // 同步到localStorage
        if (payload.token) {
          localStorage.setItem('admin-token', payload.token);
        }
      },
      CLEAR_USER(state) {
        state.token = null;
        state.token = ''
        state.nickname = ''
        state.roleId = null
        localStorage.removeItem('admin-token')
      }
    },
    actions: {
      logout({ commit }) {
        return new Promise(resolve => {
          commit('CLEAR_USER')
          resolve()
        })
      }
    }
  }