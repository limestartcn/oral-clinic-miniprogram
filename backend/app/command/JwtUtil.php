<?php
namespace app\common;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use think\facade\Config;

class JwtUtil
{
    // 生成Token
    public static function encode($data)
    {
        $key = Config::get('jwt.key');
        return JWT::encode($data, $key, 'HS256');
    }

    // 解析Token
    public static function decode($token)
    {
        $key = Config::get('jwt.key');
        return JWT::decode($token, new Key($key, 'HS256'));
    }
}