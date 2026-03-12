const app = getApp();
const BASE_URL = 'http://localhost:8000';

// 基础请求方法
const request = (url, method, data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + url,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': wx.getStorageSync('token')
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(res.data);
        }
      },
      fail: (err) => {
        reject({ code: 500, msg: '网络请求失败' });
      }
    });
  });
};

// 文件上传方法
const uploadImage = (filePath) => {
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: BASE_URL + '/upload/image',
      filePath,
      name: 'file',
      header: {
        'Authorization': wx.getStorageSync('token')
      },
      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          resolve(data);
        } catch (error) {
          reject({ code: 500, msg: '响应解析失败' });
        }
      },
      fail: (err) => {
        reject({ code: 500, msg: '上传失败' });
      }
    });
  });
};

// 导出所有接口
module.exports = {
  // 认证相关
  login: (data) => request('/auth/login', 'POST', data),
  wechatLogin: (data) => request('/auth/wechatLogin', 'POST', data),
  getCode: (data) => request('/auth/code', 'POST', data),
  logout: () => request('/auth/logout', 'POST'),

  // 用户相关
  getUserInfo: () => request('/user/info', 'GET'),
  updateUserInfo: (data) => request('/user/update', 'POST', data),
  getAppointmentCount: () => request('/user/appointment/count', 'GET'),
  getUserPermissions: () => request('/user/permissions', 'GET'),

  // 预约相关
  getAppointments: (params) => request('/appointments', 'GET', params),
  getAppointmentDetail: (id) => request(`/appointments/${id}`, 'GET'),
  cancelAppointment: (id) => request(`/appointments/${id}/cancel`, 'POST'),
  createAppointment: (data) => request('/appointments', 'POST', data),
  confirmPayment: (id) => request(`/appointments/${id}/pay`, 'POST'),

  // 提交评价
  submitReview: (data) => request('/reviews/create', 'POST', data),
  // 获取医生评价
  getDoctorReviews: (doctorId) => request(`/reviews/doctor/${doctorId}`, 'GET'),

  // 科室医生相关
  getDepartments: () => request('/departments', 'GET'),
  getDoctorsByDepartment: (departmentId) => 
    request(`/doctors?department_id=${departmentId}`, 'GET'), 

  // 时间槽接口
  getTimeSlots: (params) => request('/timeslots', 'GET', params),

  // 排班相关
  getSchedule: (params) => request('/doctor/schedule', 'GET', params),
  updateSchedule: (data) => request('/doctor/schedule', 'POST', data),

  // 医生相关接口
  completeAppointment: (id) => request(`/doctor/appointments/${id}/complete`, 'POST'),
  getDoctorAppointments: (params) => request('/doctor/appointments', 'GET', params),
  confirmAppointment: (id) => request(`/doctor/appointments/${id}/confirm`, 'POST'),
  getDoctorDetail: (id) => request(`/doctors/${id}`, 'GET'),
  // 消息相关
  getConversationId: (data) => request('/messages/getConversationId', 'POST', data),
  getMessages: (params) => request('/messages/history', 'GET', params),
  sendMessage: (data) => request('/messages/send', 'POST', data),
  getChatSessions: () => request('/messages/sessions', 'GET'),

  getMedicalRecords: (params) => request('/medical/records', 'GET',params),
  // 新增图片上传接口
  uploadImage
};