<?php
namespace app\model;
use think\Model;
use think\model\Pivot; // 关键修改点
class RolePermission extends Pivot
{
    protected $table = 'role_permission';
    
    public function role()
    {
        return $this->belongsTo(Role::class);
    }
    
    public function permission()
    {
        return $this->belongsTo(Permission::class);
    }
    // 自定义中间表逻辑（可选）
    protected $autoWriteTimestamp = true;
    
    public function getPermissionAttr()
    {
        return $this->belongsTo(Permission::class);
    }
    
    public function getRoleAttr()
    {
        return $this->belongsTo(Role::class);
    }

}