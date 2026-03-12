<?php
// backend/app/model/Consultation.php
namespace app\model;

use think\Model;

class Consultation extends Model
{
    protected $table = 'consultation';
    
    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function doctor()
    {
        return $this->belongsTo(Doctor::class, 'doctor_id');
    }
}

// backend/app/model/Message.php
class Message extends Model
{
    protected $table = 'message';
    
    public function consultation()
    {
        return $this->belongsTo(Consultation::class);
    }
}