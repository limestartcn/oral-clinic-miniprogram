<?php
namespace app\middleware;

class JsonMiddleware
{
    public function handle($request, \Closure $next)
    {
        // 只处理JSON请求
        if ($request->isJson()) {
            // 解析JSON数据
            $data = json_decode($request->getContent(), true);
            
            // 合并到请求参数
            $request->withPost($data);
        }

        return $next($request);
    }
}