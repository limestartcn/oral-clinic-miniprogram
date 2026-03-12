<?php
namespace app\controller;

use think\facade\Cache;

class Test
{
    public function cache()
    {
        try {
            Cache::set('test_key', 'test_value', 60);
            return json([
                'code' => 200,
                'data' => Cache::get('test_key')
            ]);
        } catch (\Throwable $e) {
            return json([
                'code' => 500,
                'msg' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
}