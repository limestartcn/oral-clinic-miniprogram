// src/api/role.js → 角色相关接口
import service from '@/utils/request'

export const getRoleList = () => {
  return service({
    url: '/role/list',
    method: 'get'
  })
}