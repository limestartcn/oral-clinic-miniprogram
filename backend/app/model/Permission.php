<?php
namespace app\model;
use think\Model;

class Permission extends Model
{
    protected $table = 'permission';
    
    public function roles()
    {
        return $this->belongsToMany(
            Role::class,
            RolePermission::class,
            'role_id',
            'permission_id'
        );
    }
}