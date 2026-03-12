// src/api/user.js → 完整接口定义
import service from '@/utils/request'

export const getUserList = (params) => {
  return service({
    url: '/user/list',
    method: 'get',
    params
  })
}

export const createUser = (data) => {
  return service({
    url: '/user/create',
    method: 'post',
    data
  })
}

export const deleteUser = (id) => {
  return service({
    url: `/user/delete/${id}`,
    method: 'delete'
  })
}

export const getUserInfo = () => {
  return service({
    url: '/user/info',
    method: 'get'
  })
}

// 更新用户
export const updateUser = (id, data) => {
  return service({
    url: `/user/update/${id}`,
    method: 'post',
    data
  })
}

// 切换用户状态
export const toggleUserStatus = (id, data) => {
  return service({
    url: `/user/toggle-status/${id}`,
    method: 'post',
    data
  })
}