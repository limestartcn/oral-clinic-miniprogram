<?php
namespace app\model;

use think\Model;

class Message extends Model
{
    // 表名（如果表名不是message需指定）
    protected $name = 'message';
    
    // 自动写入时间戳
    protected $autoWriteTimestamp = 'datetime';
    
    // 定义字段类型（可选）
    protected $type = [
        'id'          => 'int',
        'sender_id'   => 'int',
        'receiver_id' => 'int',
        'is_read'     => 'bool'
    ];
}