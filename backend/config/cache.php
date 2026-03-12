<?php

// +----------------------------------------------------------------------
// | 缓存设置
// +----------------------------------------------------------------------

/*return [
    'default' => 'redis',
    'stores'  => [
        'redis' => [
            'type'     => 'redis',
            'host'     => '127.0.0.1',
            'port'     => 6379,
            'password' => '',
            'select'   => 0,
            'timeout'  => 0,
            'persistent' => false
        ]
    ]
];*/
return [
    'default' => 'file', // 临时改为文件缓存
    'stores'  => [
        'file' => [
            'type'       => 'File',
            'path'       => app()->getRuntimePath() . 'cache/',
            'expire'     => 86400,
            'prefix'     => 'cache_',
            'serialize'  => true,
            'data_compress' => false,
        ],
        'redis' => [
            'type'       => 'redis',
            'host'       => env('REDIS_HOST', '127.0.0.1'),
            'port'       => env('REDIS_PORT', 6379),
            'password'   => env('REDIS_PASSWORD', ''),
            'select'     => env('REDIS_SELECT', 0),
            'timeout'    => env('REDIS_TIMEOUT', 0),
            'persistent' => false,
        ]
    ]
];