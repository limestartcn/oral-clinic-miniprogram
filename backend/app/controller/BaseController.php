<?php
namespace app\controller;

use think\Controller;
use think\Request;

class BaseController extends Controller
{
    protected $middleware = [
        'AuthCheck' => [
            'except' => ['login', 'wechatLogin'] // 排除登录接口
        ]
    ];
    
    // 获取当前用户
    protected function getUser()
    {
        return $this->request->user;
    }
}