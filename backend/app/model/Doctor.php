<?php
namespace app\model;

use think\Model;

class Doctor extends Model
{
    // ✅ 指定实际表名
    protected $table = 'doctor';
    
    // 关联用户
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
    
    // ✅ 完整字段定义
    protected $schema = [
        'id'             => 'int',
        'user_id'        => 'int', // ✅ 新增关联字段
        'name'           => 'string',
        'title'          => 'string',
        'avatar'         => 'string',
        'rating'         => 'float',
        'specialty'      => 'string',
        'department_id'  => 'int',  // ✅ 必须存在的关联字段
        'service_count'  => 'int',
        'satisfaction'   => 'float',
        'create_time'    => 'datetime',
        'update_time'    => 'datetime'
    ];
    
    // ✅ 定义科室关联
    public function department()
    {
        return $this->belongsTo(\app\model\Department::class, 'department_id');
    }
    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }
    // 添加排班模板关联
    public function scheduleTemplate()
    {
        return $this->hasOne(ScheduleTemplate::class, 'doctor_id');
    }
}