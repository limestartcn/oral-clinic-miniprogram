<?php
// 应用公共文件
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
// JWT编码
function jwt_encode($payload) {
    return JWT::encode(
        $payload, 
        config('jwt.secret'), // 使用正确的配置项
        config('jwt.algo')
    );
}
// JWT解码（关键修复）
function jwt_decode($token) {
    $headers = new \stdClass(); 
    return JWT::decode(
        $token, 
        new Key(
            config('jwt.secret'), // 使用正确的配置项
            config('jwt.algo')
        )
    );
}