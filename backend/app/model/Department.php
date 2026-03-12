<?php
namespace app\model;

use think\Model;

class Department extends Model
{
    protected $name = 'departments'; // 表名需与数据库一致
    
    protected $schema = [
        'id' => 'int',
        'name' => 'string',
        'description' => 'text',
        'icon' => 'string',
        'create_time' => 'datetime'
    ];
}