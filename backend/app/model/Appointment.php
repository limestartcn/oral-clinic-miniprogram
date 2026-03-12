<?php
namespace app\model;

use think\Model;

class Appointment extends Model
{
    protected $table = 'appointment';
    
    // 状态映射
    const STATUS_PENDING = 1; // 待确认
    const STATUS_CONFIRMED = 2; // 已预约
    const STATUS_COMPLETED = 3; // 已完成
    const STATUS_CANCELED = 4; // 已取消

    // // 时间字段自动转换
    // protected $type = [
    //     'appointment_time' => 'timestamp'
    // ];
    // 定义与排班的关联
    public function schedule()
    {
        return $this->belongsTo(Schedule::class, 'schedule_id');
    }
    // 定义与科室的关联
    public function department()
    {
        return $this->belongsTo(\app\model\Department::class, 'department_id');
    }

    // 定义与医生的关联
    public function doctor()
    {
        return $this->belongsTo(\app\model\Doctor::class, 'doctor_id');
    }
    // 定义与User模型的关联
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
}