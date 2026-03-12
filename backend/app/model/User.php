<?php
namespace app\model;

use think\Model;
use think\model\concern\SoftDelete;
class User extends Model
{
    protected $autoWriteTimestamp = true;
    // 开启自动时间戳
    protected $createTime = 'create_time';
    protected $updateTime = 'update_time';

    // ✅ 指定日期格式（不带微秒）
    protected $dateFormat = 'Y-m-d H:i:s';
    // 明确字段架构
    protected $schema = [
        'id'            => 'int',
        'mobile'        => 'string',
        'password'      => 'string',
        'role_id'       => 'int',
        'doctor_id'     => 'int',
        'nickname'      => 'string',
        'avatar'        => 'string',
        'create_time'   => 'datetime',
        'update_time'   => 'datetime',
        'delete_time'   => 'int',
        'status'        => 'int'
    ];
    // ✅ 禁用字段缓存
    protected $fieldCache = false;

    // 在create前自动验证
    protected static function boot()
    {
        parent::boot();
        static::beforeInsert(function ($user) {
            if (empty($user->mobile)) { // ✅ 修正此处
                throw new \Exception("手机号不能为空");
            }
        });
    }

    //use SoftDelete;
    
    protected $deleteTime = 'delete_time'; 
    // // 新增字段映射
    // protected $schema = [
    //     'create_time' => 'datetime',
    //     'update_time' => 'datetime'
    // ];
    // 密码加密
    public function setPasswordAttr($value)
    {
        return password_hash($value, PASSWORD_DEFAULT);
    }
    
    public function checkPassword($inputPassword) {
        return password_verify($inputPassword, $this->password);
    }
    // 添加关联关系
    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'user_id', 'id'); // 使用完整命名空间引用
    }
    // 添加角色关联
    public function role()
    {
        return $this->belongsTo(\app\model\Role::class);
    }
    // 添加字段修改器
    public function setAvatarAttr($value)
    {
        return $value ?: '/default-avatar.png';
    }

    // 定义直接权限关联（如果有多对多）
    public function permissions()
    {
        return $this->belongsToMany(
            \app\model\Permission::class,
            \app\model\RolePermission::class,
            'role_id',
            'permission_id'
        );
    }
    // 修改状态检查逻辑
    public function isDisabled()
    {
        return $this->status == 0; // 使用现有status字段
    }

}