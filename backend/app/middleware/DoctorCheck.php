<?php
namespace app\middleware;

use think\facade\Request; // [!code ++]
use think\Response;

class DoctorCheck
{
    public function handle($request, \Closure $next)
    {
        // 正确获取用户信息
        $isDoctor = $request->user->role_id === 2; // [!code ++]
        
        if (!$isDoctor) {
            return json([
                'code' => 403, 
                'msg' => '仅限医生访问',
                'debug' => [
                    'role_id' => $request->user->role_id,
                    'route' => $request->pathinfo()
                ]
            ]);
        }

        return $next($request);
    }
}