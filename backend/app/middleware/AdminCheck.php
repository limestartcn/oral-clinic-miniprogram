<?php
namespace app\middleware;

class AdminCheck
{
    
    public function handle($request, \Closure $next)
    {
        if ($request->user->role_id != 3) { // 3为管理员角色ID
            return json(['code' => 403, 'msg' => '需要管理员权限']);
        }
        return $next($request);
    }
}