<?php
namespace app\model;

use think\Model;

class ScheduleTemplate extends Model
{
    // 定义时间戳字段
    protected $createTime = 'create_time';
    protected $updateTime = 'update_time';

    // 关联医生模型
    public function doctor()
    {
        return $this->belongsTo(Doctor::class, 'doctor_id');
    }
}