<?php
namespace app\middleware;

class Cors
{
    public function handle($request, \Closure $next)
    {
        // 预检请求直接响应
        if ($request->method() == 'OPTIONS') {
            return $this->buildOptionsResponse($request);
        }

        $response = $next($request);

        // 设置CORS头
        $allowOrigin = [
            'http://localhost:5173',
            'https://your-domain.com'
        ];
        $origin = $request->header('origin');
        $finalOrigin = in_array($origin, $allowOrigin) ? $origin : '';

        // 调试日志
        \think\facade\Log::info("CORS处理: 来源[$origin] 允许域名[$finalOrigin]");

        // 设置响应头
        $response->header([
            'Access-Control-Allow-Origin' => $finalOrigin,
            'Access-Control-Allow-Credentials' => 'true',
            'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
            'Access-Control-Allow-Headers' => 'Authorization, Content-Type, X-Requested-With, X-Token, Accept, Origin',
            'Access-Control-Expose-Headers' => 'Authorization, Content-Length'
        ]);

        return $response;
    }

    private function buildOptionsResponse($request)
    {
        $allowOrigin = [
            'http://localhost:5173',
            'https://your-domain.com'
        ];
        $origin = $request->header('origin');
        $finalOrigin = in_array($origin, $allowOrigin) ? $origin : '';

        return response()
            ->code(204)
            ->header([
                'Access-Control-Allow-Origin' => $finalOrigin,
                'Access-Control-Allow-Credentials' => 'true',
                'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
                'Access-Control-Allow-Headers' => 'Authorization, Content-Type, X-Requested-With, X-Token, Accept, Origin',
                'Access-Control-Max-Age' => 86400 // 预检请求缓存时间（秒）
            ]);
    }
}