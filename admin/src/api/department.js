// src/api/department.js
import request from '@/utils/request' // 假设您使用了axios封装

// 获取科室列表
export function getDepartmentList(params) {
  return request({
    url: '/departments',
    method: 'get',
    params
  })
}