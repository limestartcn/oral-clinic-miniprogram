<?php
namespace app\middleware;

use think\facade\Cache;
use app\model\User;
use app\model\RolePermission;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use app\model\Doctor as DoctorModel;
class AuthCheck
{
    // 集中管理JWT配置
    private $jwtKey;
    private $jwtAlgo;

    public function __construct()
    {
        // 在构造函数中初始化
        $this->jwtKey = env('JWT_SECRET');
        $this->jwtAlgo = env('JWT_ALGO', 'HS256');
    }

    private function checkPermission($roleId, $permissionCode)
    {
        // 使用 join 替代 hasWhere 确保关联正确性
        $count = RolePermission::alias('rp')
            ->join('permission p', 'p.id = rp.permission_id')
            ->where('rp.role_id', $roleId)
            ->where('p.code', $permissionCode)
            ->count();

        // 添加调试日志
        \think\facade\Log::info("权限验证: 角色ID={$roleId}, 权限码={$permissionCode}, 结果={$count}");
        return $count > 0;
    }
    public function handle($request, \Closure $next)
    {
        // 新增调试日志
        \think\facade\Log::info("原始Authorization头: " . $request->header('Authorization'));
        \think\facade\Log::info("当前使用的JWT密钥: " . env('JWT_SECRET'));
        \think\facade\Log::info("当前使用的JWT算法: " . env('JWT_ALGO'));
        $key = $this->jwtKey;
        $algo = $this->jwtAlgo;    
        $authorizationHeader = $request->header('Authorization', '');
        $token = str_replace('Bearer ', '', $authorizationHeader);
        \think\facade\Log::info("AuthCheck Token: " . $token); // 记录原始Token
        if (empty($token)) {
            \think\facade\Log::error("未提供令牌");
            return json(['code' => 401, 'msg' => '未提供令牌']);
        }
    
        try {
            \think\facade\Log::info("尝试解析Token: " . $token);
            $payload = JWT::decode($token, new Key($key, $algo));
            \think\facade\Log::info("解析后的Payload: " . json_encode($payload));
            // 3. 验证用户有效性 ---------------------------------------------
            $user = User::with(['role'])
                ->find($payload->uid);
            if (!$user || !$user->role) {
                \think\facade\Log::error("[中间件] 用户不存在或角色异常 UID: ".$payload->uid);
                return json(['code' => 403, 'msg' => '用户状态异常']);
            }
            if (!isset($payload->uid)) {
                throw new \Exception("无效 Token 格式");
            }
            // 兼容管理端声明
            if ($request->pathinfo() === '/admin' && (!isset($payload->type) || $payload->type !== 'admin')) {
                throw new \Exception("非管理端 Token");
            }
            // 绑定医生ID（如果是医生角色）
            if ($user->role_id == 2) {
                // 优先使用已关联的 doctor_id
                if (!$user->doctor_id) {
                    $doctor = DoctorModel::where('user_id', $user->id)->find();
                    if (!$doctor) {
                        \think\facade\Log::error("医生档案不存在 UID: {$user->id}");
                        return json(['code' => 403, 'msg' => '医生信息未配置']);
                    }
                    $user->doctor_id = $doctor->id; // 更新用户记录
                    $user->save();
                }
                $request->doctorId = $user->doctor_id;
            }
            // 4. 绑定关键数据到请求对象 -------------------------------------
            $request->userId = $user->id;
            $request->roleId = $user->role_id; // 新增角色ID绑定
            //$request->doctorId = $user->role_id === 2 ? $user->id : null; // 医生角色绑定
            $request->user = $user;

            // 6. 权限验证 -------------------------------------------------
            $permissionCode = $this->getRequiredPermission($request);
            if ($permissionCode && !$this->checkPermission($user->role_id, $permissionCode)) {
                \think\facade\Log::error("权限验证失败 角色ID:{$user->role_id} 权限码:{$permissionCode}");
                return json(['code' => 403, 'msg' => '权限不足']);
            }

            return $next($request);
        } catch (\Exception $e) {
            // 记录完整错误堆栈
            \think\facade\Log::error("中间件异常: " . $e->getMessage() . 
                "\nTrace:\n" . $e->getTraceAsString());
            return json([
                'code' => 500, 
                'msg' => '服务器内部错误',
                'debug' => config('app_debug') ? $e->getMessage() : null
            ]);
        }

    }    
    private function getRequiredPermission($request)
    {
        $routePermissions = [
            'RoleController/list' => 'admin:roles:view', // 新增权限码
            'doctor/create' => 'doctor:manage',
            'doctor/appointments' => 'doctor:appointments:view',
            'doctor/appointments/:id/complete' => 'doctor:appointments:manage',
            'admin/roles' => 'admin:roles:view',
            'admin/roles/update' => 'admin:roles:edit',
            'User/list' => 'user:manage',
            'User/create' => 'user:manage',
            'User/delete' => 'user:manage',
            'RoleController/list' => 'admin:roles:view',
        ];

        return $routePermissions[$request->controller().'/'.$request->action()] ?? null;
    }
}