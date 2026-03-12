<template>
<div class="login-container">
    <div class="login-box">
      <h1 class="title">口腔诊所管理后台</h1>
      <el-form
        ref="loginForm"
        :model="loginForm"
        :rules="loginRules"
        @keyup.enter="handleLogin" 
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            @keyup.enter="handleLogin" 
          ></el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin" 
          ></el-input>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="footer">
        <span>©2025 爱牙口腔诊所管理系统</span>
      </div>
    </div>
  </div>
</template>

<script>
import { adminLogin } from "@/api/auth"; // 引入管理端登录接口
import { User, Lock } from '@element-plus/icons-vue'

export default {
  name: 'Login',
  components: {
    User,
    Lock
  },
  data() { // ✅ 添加data初始化
    return {
      loginForm: {
        username: '',
        password: ''
      },
      loginRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
        ]
      },
      loading: false
    };
  },
  methods: {
    async handleLogin() {
      this.$refs.loginForm.validate(async (valid) => {
        if (!valid) return;

        this.loading = true;
        try {
          const res = await adminLogin({
            username: this.loginForm.username,
            password: this.loginForm.password
          });

          if (res.code === 200) {
            // ✅ 仅保留一次存储和提交
            console.log('存储Token:', res.data.token);
            //setToken(res.data.token); // 使用统一方法存储
            localStorage.setItem('admin-token', res.data.token);
            localStorage._synced = '1'; // 添加同步标记
            console.log('当前存储的Token:', localStorage.getItem('admin-token'));
            await new Promise(resolve => setTimeout(resolve, 0));
            if (localStorage.getItem('admin-token') !== res.data.token) {
              throw new Error('Token存储异常，请检查浏览器设置');
            }
            this.$store.commit('user/SET_USER_INFO', {
              token: res.data.token, 
              roleId: res.data.userInfo.roleId,
              nickname: res.data.userInfo.nickname,
              avatar: res.data.userInfo.avatar || '',
              id: res.data.userInfo.id
            });
            const storedToken = localStorage.getItem('admin-token');
            if (!storedToken) {
              throw new Error('Token存储失败');
            }
            // ✅ 直接跳转（无需 await）
            const roleId = res.data.userInfo.roleId;
            if (roleId === 3) {
              console.log('跳转前Token状态:', localStorage.getItem('admin-token'));
              this.$router.push('/admin/dashboard');
            } else if (roleId === 2) {
              this.$router.push('/doctor/appointments');
            }
          }
        } catch (error) {
          this.$message.error(error.message || '登录失败');
        } finally {
          this.loading = false;
        }
      });
    }
  }
};
</script>

<style scoped>
.login-container {
  height: 100vh;
  background: url("~@/assets/login-bg.jpg") no-repeat center/cover;
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-box {
  width: 400px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.title {
  text-align: center;
  color: #303133;
  margin-bottom: 30px;
  font-size: 24px;
}

.login-btn {
  width: 100%;
  margin-top: 10px;
}

.footer {
  margin-top: 30px;
  text-align: center;
  color: #909399;
  font-size: 12px;
}
</style>