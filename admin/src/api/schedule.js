import request from '@/utils/request'

// 获取排班列表（带分页）
export const getScheduleList = (params) => {
  return request({
    url: '/schedule/list',
    method: 'get',
    params: {
      page: params.page,
      pageSize: params.size,
      doctor_id: params.doctorId, // ✅ 保持与请求示例一致
      start_date: params.startDate, // ✅ 统一蛇形命名
      end_date: params.endDate
    }
  })
}

// 新增获取医生列表
export const getDoctors = (params) => {
  return request({
    url: '/doctor/list', 
    method: 'get',
    params: {
      page: params.page,
      limit: params.pageSize // 后端接收的是limit参数
    }
  })
}

// 新增状态切换接口
export const toggleScheduleStatus = (id, status) => {
  return request({
    url: `/schedule/${id}/status`,
    method: 'patch', // 保持与路由一致
    data: { status } // 使用data传递参数
  })
}

// 修改最大预约数
export const updateMaxPatients = (id, data) => {
  return request({
    url: `/schedule/${id}/max`,
    method: 'put', // 必须使用PUT方法
    data: { max_patients: data.max_patients } // 参数名对齐后端
  })
}

// 生成下周排班（管理员）
export const generateNextWeekSchedule = () => {
  return request.post('/schedule/generate')
}

// 获取单个排班详情
export const getScheduleDetail = (id) => {
  return request({
    url: `/schedule/${id}`,
    method: 'get'
  })
}

// 快捷方法示例
export const disableTimeSlot = id => request.patch(`/schedule/${id}/disable`)
export const enableTimeSlot = id => request.patch(`/schedule/${id}/enable`)