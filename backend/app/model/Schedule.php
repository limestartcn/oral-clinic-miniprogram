<?php
namespace app\model;

use think\Model;

class Schedule extends Model
{
    // 定义时间戳字段
    protected $createTime = 'create_time';
    protected $updateTime = 'update_time';

    // 关联医生模型
    public function doctor()
    {
        return $this->belongsTo(Doctor::class, 'doctor_id');
    }
    // 定义与预约的关联
    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'schedule_id');
    }
    
    // 新增专门统计已确认预约的关联
    public function bookedPatients()
    {
        return $this->hasMany(Appointment::class, 'schedule_id')
            ->where('status', 2);
    }
}