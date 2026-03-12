<?php
namespace app\controller;

use app\BaseController;
use app\model\Role;

class Admin extends BaseController
{
    public function getroles()
    {
        $roles = Role::with(['permissions'])
            ->select();
        
        return json([
            'code' => 200,
            'data' => $roles
        ]);
    }

    public function updateRolePermissions()
    {
        $data = input('post.');
        // 实现权限更新逻辑
        return json(['code' => 200]);
    }
}