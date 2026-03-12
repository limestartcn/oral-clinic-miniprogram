<?php
namespace app\controller;

use app\BaseController;
use app\model\Role as RoleModel;

class RoleController extends BaseController
{
    public function permissions($id)
    {
        $role = RoleModel::with('permissions')->find($id);
        if (!$role) {
            return json(['code' => 404, 'msg' => '角色不存在']);
        }
        return json([
            'code' => 200,
            'data' => $role->permissions
        ]);
    }

    public function list()
    {
        try {
            $roles = RoleModel::field('id,name')->select();
            if ($roles->isEmpty()) {
                return json(['code' => 404, 'msg' => '无角色数据']);
            }
            return json([
                'code' => 200,
                'data' => $roles->toArray()
            ]);
        } catch (\Exception $e) {
            return json(['code' => 500, 'msg' => $e->getMessage()]);
        }
    }
}