// src/api/medical.js
import request from '@/utils/request';

// 获取病例详情
export const getMedicalDetail = (appointmentId) => {
  return request({
    url: `/doctor/medical/${appointmentId}`,
    method: 'GET'
  });
};

// 提交病例
export const saveMedicalRecord = (data) => {
  return request({
    url: '/doctor/medical/save',
    method: 'POST',
    data
  });
};