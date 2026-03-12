<?php
namespace app\controller;

use app\BaseController;
use app\model\User as UserModel; // 使用别名避免冲突
use think\facade\Cache;
use think\facade\Validate;
use think\facade\Db;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class User extends BaseController
{
    // 获取用户信息
    public function info()
    {
        try {
            $userId = $this->request->userId;
            \think\facade\Log::info("正确获取的用户ID：" . $userId);
            // 添加调试：直接查询数据库
            $userExists = UserModel::where('id', $userId)->find();
            \think\facade\Log::info("数据库查询结果：" . ($userExists ? '存在' : '不存在'));
            $user = UserModel::with(['role'])
                ->field('id,nickname,mobile,role_id')
                ->find($userId);
        
            if (!$user) {
                \think\facade\Log::error("用户不存在，ID：" . $userId);
                return json(['code' => 404, 'msg' => '用户不存在']);
            }
    
            return json([
                'code' => 200,
                'data' => [
                    'nickname' => $user->nickname,
                    'mobile'   => $user->mobile,
                    'roleId'   => $user->role_id,
                    'roleName' => $user->role->name, // 从关联模型获取角色名称
                    'id' => $user->id, // ✅ 必须返回用户ID
                ]
            ]);
    
        } catch (\Exception $e) {
            if (!$user->role) {
                return json(['code' => 500, 'msg' => '角色数据异常']);
            }
            // 返回详细错误信息（调试模式）
            return json([
                'code' => 500,
                'msg'  => '服务器错误',
                'error' => $e->getMessage() // 生产环境应移除此行
            ]);
        }
    }

    public function permissions()
    {
        try {
            $user = $this->request->user;
            
            // 验证关联数据
            if (!$user->role) {
                return json(['code' => 404, 'msg' => '角色不存在']);
            }
            
            return json([
                'code' => 200,
                'data' => [
                    'roleId' => $user->role_id,
                    'roleName' => $user->role->name,
                    'permissions' => $user->role->permissions->column('code')
                ]
            ]);
        } catch (\Exception $e) {
            \think\facade\Log::error('权限接口异常：'.$e->getMessage());
            return json(['code' => 500, 'msg' => '服务器错误']);
        }
    }

    public function getAppointmentCount()
    {
        try {
            // 从JWT获取用户ID
            $token = str_replace('Bearer ', '', $this->request->header('Authorization'));
            $key = 'your_strong_secret_key_here'; // 与登录接口一致
            $decoded = JWT::decode($token, new Key($key, 'HS256'));
            $userId = $decoded->uid;

            // 使用Db门面查询
            $count = Db::name('appointment')
                ->where('user_id', $userId)
                ->where('status', 1)
                ->count();

            return json([
                'code' => 200,
                'count' => $count
            ]);
        } catch (\Exception $e) {
            return json([
                'code' => 500,
                'msg' => '服务器错误：' . $e->getMessage()
            ]);
        }
    }

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    // 用户列表（分页+搜索）
    public function list()
    {
        try {
            // 权限校验（仅管理员）
            if ($this->request->user->role_id != 3) {
                return json(['code' => 403, 'msg' => '无权操作']);
            }

            // 获取请求参数
            $params = $this->request->get([
                'page' => 1,
                'pageSize' => 10,
                'search' => '',
                'roleId' => null
            ]);

            // 构建查询
            $query = UserModel::with(['role'])
            ->field('id, nickname, mobile, role_id, create_time, status'); // ✅ 添加status字段

            // 搜索逻辑
            if (!empty($params['search'])) {
                $query->where('nickname|mobile', 'like', "%{$params['search']}%");
            }

            if (!empty($params['roleId'])) {
                $query->where('role_id', $params['roleId']);
            }

            // 分页查询
            $list = $query->paginate([
                'page' => $params['page'],
                'list_rows' => $params['pageSize'],
                'query' => $this->request->get()
            ]);

            return json([
                'code' => 200,
                'data' => [
                    'list' => $list->items(),
                    'total' => $list->total()
                ]
            ]);

        } catch (\Exception $e) {
            return json(['code' => 500, 'msg' => $e->getMessage()]);
        }
    }

    // 新增用户
    public function create()
    {
        try {
            // 权限校验
            if ($this->request->user->role_id != 3) {
                return json(['code' => 403, 'msg' => '无权操作']);
            }

            $data = $this->request->post([
                'nickname',
                'mobile',
                'password',
                'role_id'
            ]);

            // 数据验证
            $validate = Validate::rule([
                'nickname' => 'require|max:20',
                'mobile' => 'require|mobile|unique:user',
                'password' => 'require|min:6',
                'role_id' => 'require|in:1,2,3'
            ]);

            if (!$validate->check($data)) {
                return json(['code' => 400, 'msg' => $validate->getError()]);
            }

            // 密码加密
            $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);

            // 创建用户
            $user = UserModel::create($data);

            return json([
                'code' => 200,
                'msg' => '用户创建成功',
                'data' => $user->id
            ]);

        } catch (\Exception $e) {
            return json(['code' => 500, 'msg' => $e->getMessage()]);
        }
    }

    // 更新用户信息
    public function update()
    {
        \think\facade\Log::info("请求参数: " . json_encode($this->request->param()));
        \think\facade\Log::info("路由参数: " . json_encode($this->request->route()));
        try {
            // 权限校验
            if ($this->request->user->role_id != 3) {
                return json(['code' => 403, 'msg' => '无权操作']);
            }
    
            // 手动获取路由参数中的id
            $id = $this->request->param('id');
            \think\facade\Log::info("正在更新用户ID: {$id}"); // 添加日志
    
            $data = $this->request->post([
                'nickname',
                'mobile',
                'role_id'
            ]);
    
            // 数据验证
            $validate = Validate::rule([
                'nickname' => 'require|max:20',
                'mobile' => 'require|mobile|unique:user,mobile,'.$id,
                'role_id' => 'require|in:1,2,3'
            ]);
    
            if (!$validate->check($data)) {
                return json(['code' => 400, 'msg' => $validate->getError()]);
            }
    
            // 更新用户
            UserModel::update($data, ['id' => $id]);
    
            return json([
                'code' => 200,
                'msg' => '用户信息更新成功'
            ]);
    
        } catch (\Exception $e) {
            \think\facade\Log::error("用户更新失败: " . $e->getMessage()); // 错误日志
            return json(['code' => 500, 'msg' => $e->getMessage()]);
        }
    }

    // 删除用户
    public function delete($id)
    {
        try {
            // 权限校验
            if ($this->request->user->role_id != 3) {
                return json(['code' => 403, 'msg' => '无权操作']);
            }

            // 禁止删除自己
            if ($id == $this->request->userId) {
                return json(['code' => 400, 'msg' => '不能删除自己']);
            }

            // 删除用户
            UserModel::destroy($id);

            return json([
                'code' => 200,
                'msg' => '用户删除成功'
            ]);

        } catch (\Exception $e) {
            return json(['code' => 500, 'msg' => $e->getMessage()]);
        }
    }
    public function toggleStatus($id)
    {
        try {
            // 权限校验
            if ($this->request->user->role_id != 3) {
                return json(['code' => 403, 'msg' => '无权操作']);
            }

            $data = $this->request->post(['status']);
            $user = UserModel::find($id);

            if (!$user) {
                return json(['code' => 404, 'msg' => '用户不存在']);
            }

            $user->status = $data['status'];
            $user->save();

            return json([
                'code' => 200,
                'msg' => '状态更新成功'
            ]);

        } catch (\Exception $e) {
            return json(['code' => 500, 'msg' => $e->getMessage()]);
        }
    }

}