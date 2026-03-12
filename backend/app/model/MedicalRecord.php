<?php
namespace app\model;

use think\Model;

class MedicalRecord extends Model
{
    protected $table = 'medical_record';

    // 自动类型转换
    protected $type = [
        'prescription' => 'json',
        'attachments' => 'json'
    ];

    // 关联预约
    public function appointment()
    {
        return $this->belongsTo(Appointment::class, 'appointment_id');
    }
}