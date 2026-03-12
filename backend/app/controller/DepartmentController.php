<?php
namespace app\controller;

use app\model\Department;
use think\facade\Db;

class DepartmentController
{
    public function index()
    {
        try {
            $departments = Db::name('departments')
                ->field('id,name,icon,description')
                ->select();
            
            return json([
                'code' => 200,
                'data' => $departments
            ]);
        } catch (\Exception $e) {
            return json([
                'code' => 500,
                'msg' => '获取科室列表失败'
            ]);
        }
    }
}