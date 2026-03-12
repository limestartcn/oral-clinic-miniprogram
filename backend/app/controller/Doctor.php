<?php
namespace app\controller;

use think\facade\Db; // 新增此行
use app\BaseController;
use app\model\User; // 新增此行
use app\model\Doctor as DoctorModel;
use app\model\Department; // 用于科室存在性验证

class Doctor extends BaseController
{
    public function index()
    {
        try {
            $params = $this->request->get();
            $query = DoctorModel::with(['department', 'user']);
            if (isset($params['department_id']) && $params['department_id']) {
                $query->where('department_id', $params['department_id']);
            }
            // 添加分页参数
            $page = $params['page'] ?? 1;
            $pageSize = $params['pageSize'] ?? 100;
    
            // 执行分页查询
            $list = $query->paginate([
                'page' => $page,
                'list_rows' => $pageSize
            ]);
    
            return json([
                'code' => 200,
                'data' => [
                    'list' => $list->items(),
                    'total' => $list->total()
                ]
            ]);
        } catch (\Exception $e) {
            return json(['code' => 500, 'msg' => '获取数据失败']);
        }
    }

    // 获取医生待处理的预约列表
    public function getAppointments() {
        try {
            // 从JWT获取当前登录用户ID
            $userId = $this->request->userId; 
    
            // 通过用户ID查询医生信息
            $doctor = Db::name('doctor')
                ->where('user_id', $userId)
                ->find();
    
            if (!$doctor) {
                return json(['code' => 403, 'msg' => '医生身份验证失败']);
            }
    
            // ✅ 获取正确的医生ID
            $doctorId = $doctor['id'];
            $status = $this->request->param('status/d');
    
            $query = Db::name('appointment')
                ->alias('a')
                ->join('user u', 'a.user_id = u.id')
                ->join('departments d', 'a.department_id = d.id')
                ->field('a.*, u.nickname as patient_name, u.mobile, d.name as department_name')
                ->where('a.doctor_id', $doctorId); // ✅ 关键修正：使用 doctor_id
    
            if (is_numeric($status)) {
                $query->where('a.status', $status);
            }
    
            $list = $query->order('a.appointment_time', 'desc')
                ->select();
    
            return json(['code' => 200, 'data' => $list]);
    
        } catch (\Exception $e) {
            trace('获取医生预约失败：'.$e->getMessage(), 'error');
            return json(['code' => 500, 'msg' => '服务器错误']);
        }
    }
    // 新增创建医生方法
    public function create()
    {
        Db::startTrans();
        try {
            // 参数校验
            $required = ['mobile', 'password', 'name', 'department_id'];
            foreach ($required as $field) {
                if (!$this->request->has($field)) {
                    return json(['code' => 400, 'msg' => "缺少必填参数: {$field}"]);
                }
            }
    
            // 验证科室存在性
            if (!Department::find($this->request->post('department_id'))) {
                return json(['code' => 404, 'msg' => '科室不存在']);
            }
    
            // 1. 创建用户
            $userData = $this->request->post([
                'mobile',
                'password',
                'nickname'
            ]);
            
            $user = User::create([
                'mobile' => $userData['mobile'],
                'password' => password_hash($userData['password'], PASSWORD_DEFAULT),
                'nickname' => $userData['nickname'] ?? '医生_' . substr($userData['mobile'], -4),
                'role_id' => 2, // 医生角色
                'is_doctor' => 1
            ]);
    
            // 2. 创建医生档案
            $doctor = DoctorModel::create([
                'user_id' => $user->id,
                'name' => $this->request->post('name'),
                'title' => $this->request->post('title', '医师'),
                'department_id' => $this->request->post('department_id'),
                'specialty' => $this->request->post('specialty', '')
            ]);
    
            Db::commit();
            return json([
                'code' => 200,
                'data' => [
                    'user_id' => $user->id,
                    'doctor_id' => $doctor->id
                ]
            ]);
        } catch (\Exception $e) {
            Db::rollback();
            trace('医生创建失败：'.$e->getMessage().PHP_EOL.$e->getTraceAsString(), 'error');
            return json([
                'code' => 500,
                'msg' => config('app_debug') ? $e->getMessage() : '系统繁忙，请稍后重试'
            ]);
        }
    }

    // 获取医生列表（带关联）
    public function list()
    {
        try {
            $page = $this->request->param('page/d', 1);
            $limit = $this->request->param('limit/d', 10);
            $search = $this->request->param('search/s', '');
    
            $query = DoctorModel::with(['user', 'department']);
    
            if (!empty($search)) {
                $query->where('name', 'like', "%{$search}%")
                      ->whereOr('user.mobile', 'like', "%{$search}%");
            }
    
            $list = $query->paginate([
                'page' => $page,
                'list_rows' => $limit
            ]);
    
            return json([
                'code' => 200,
                'data' => $list
            ]);
        } catch (\Exception $e) {
            trace('获取医生列表失败: ' . $e->getMessage(), 'error');
            return json([
                'code' => 500,
                'msg' => '服务器内部错误',
                'error' => config('app_debug') ? $e->getMessage() : null
            ]);
        }
    }
    public function detail($id) {
        try {
            // 正确使用with方法加载关联
            $doctor = DoctorModel::with(['department'])
                ->where('id', $id)
                ->find();

            if (!$doctor) {
                return json(['code' => 404, 'msg' => '医生不存在']);
            }

            return json([
                'code' => 200,
                'data' => [
                    'id' => $doctor->id,
                    'department_id' => $doctor->department_id,
                    'name' => $doctor->name,
                    'title' => $doctor->title,
                    'department_name' => $doctor->department->name, // 通过关联获取科室名称
                    'specialty' => $doctor->specialty,
                    'avatar' => $doctor->avatar,
                    'rating' => $doctor->rating,
                    'service_count' => $doctor->service_count,
                    'satisfaction' => $doctor->satisfaction
                ]
            ]);
        } catch (\Exception $e) {
            return json(['code' => 500, 'msg' => '服务器错误：'.$e->getMessage()]);
        }
    }
    // 更新医生信息
    public function update($id)
    {
        $doctor = Doctor::find($id);
        if (!$doctor) {
            return json(['code' => 404, 'msg' => '医生不存在']);
        }

        $data = $this->request->post([
            'name',
            'title', 
            'department_id',
            'specialty'
        ]);

        $doctor->save($data);
        return json(['code' => 200, 'msg' => '更新成功']);
    }

}