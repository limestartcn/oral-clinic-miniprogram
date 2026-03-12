<?php
namespace app\model;

use think\Model;

class Review extends Model
{
    // 定义时间戳字段
    protected $createTime = 'create_time';

    // 关联用户
    public function user()
    {
        return $this->belongsTo(\app\model\User::class, 'user_id');
    }
}