<?php
namespace app\model;

use think\Model;
use think\model\relation\BelongsToMany;

class Role extends Model
{
    public function permissions()
    {
        return $this->belongsToMany(
            Permission::class, 
            RolePermission::class,
            'role_id', 
            'permission_id'
        );
    }
}