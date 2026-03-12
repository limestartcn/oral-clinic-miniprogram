// src/api/doctor.js
import request from '@/utils/request'

export const getDoctorList = (params) => {
  return request({
    url: '/doctor/list',
    method: 'get',
    params: {
      page: params.page,
      pageSize: params.pageSize // 保持与后端参数命名一致
    }
  })
}

export const deleteDoctor = (ids) => {
  return request({
    url: '/doctor/delete',
    method: 'post',
    data: { ids }
  })
}

export const createDoctor = data => request.post('/doctors', data)
export const updateDoctor = (id, data) => request.put(`/doctors/${id}`, data)
export const getDoctorDetail = id => request.get(`/doctors/${id}`)

export const getDoctors = (params) => {
  return request({
    url: '/doctors',
    method: 'get',
    params
  })
}

export const getSchedule = (params) => {
  return request({
    url: '/schedule',
    method: 'get',
    params
  })
}

export const createTimeSlot = (data) => {
  return request({
    url: '/schedule',
    method: 'post',
    data
  })
}

export const updateTimeSlot = (id, data) => {
  return request({
    url: `/schedule/${id}`,
    method: 'put',
    data
  })
}

export const deleteTimeSlot = (id) => {
  return request({
    url: `/schedule/${id}`,
    method: 'delete'
  })
}

// ✅ 正确导出方法
export const getDoctorAppointments = (params) => {
  return request({
    url: '/doctor/appointments',
    method: 'get',
    params
  })
}

// ✅ 确保导出名称与导入一致
export const completeAppointment = (id) => {
  return request({
    url: `/doctor/appointments/${id}/complete`,
    method: 'post'
  })
}

export const getMedicalList = (params) => request({
  url: '/doctor/medical/list',
  method: 'GET',
  params
})

export const getMedicalDetail = (appointmentId) => {
  return request({
    url: `/doctor/medical/${appointmentId}`,
    method: 'GET' // ✅ 确保为大写
  })
}
