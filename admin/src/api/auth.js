import request from "@/utils/request";
import service from '@/utils/request'; // ✅ 正确导入

export const adminLogin = (data) => {
  return request({
    url: '/admin/login', // 移除多余层级，保持与代理配置一致
    method: 'post',
    data
  });
};

export const getUserList = (params) => {
  return service({ // 使用service而非原生axios
    url: '/user/list',
    method: 'get',
    params
  });
};
