<?php
namespace app\controller;

use app\BaseController;
use app\model\User;
use think\facade\Cache;
use Firebase\JWT\Key;
use Firebase\JWT\JWT; // 添加JWT类引用
use think\facade\Db; // 添加数据库门面引用

class Auth extends BaseController
{
    // 手机号登录
    public function login()
    {
        try {
            // 接收并验证JSON输入
            $input = json_decode(file_get_contents('php://input'), true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return json([
                    'code' => 400,
                    'msg' => '非法JSON格式'
                ]);
            }
    
            // 参数完整性校验
            $required = ['mobile', 'password', 'code'];
            foreach ($required as $field) {
                if (!isset($input[$field])){
                    return json([
                        'code' => 400,
                        'msg' => "缺少必要参数：{$field}"
                    ]);
                }
            }
    
            // 开发环境测试账号快捷登录
            $isTestAccount = config('app.debug') 
                && $input['mobile'] === '13800000000' 
                && $input['code'] === '123456';

            if (!$isTestAccount && config('app.debug') === false) { // 仅在非调试模式验证
                $cacheKey = 'sms_code_' . $input['mobile'];
                $cacheCode = Cache::get($cacheKey);
                
                if (!$cacheCode || $cacheCode !== $input['code']) {
                    return json([
                        'code' => 401,
                        'msg' => '验证码错误'
                    ]);
                }
            }
    
            // 用户查询
            $user = User::withTrashed()
                ->where('mobile', $input['mobile'])
                ->find();
    
            // 用户状态校验
            if (!$user) {
                return json([
                    'code' => 403,
                    'msg' => '账号不存在'
                ]);
            }
            
            if ($user->status == 0) {
                return json([
                    'code' => 404,
                    'msg' => '账号已被禁用'
                ]);
            }
    
            // 密码验证（带暴力破解防护）
            if ($user->login_attempts >= 5) {
                return json([
                    'code' => 405,
                    'msg' => '密码错误次数过多，请15分钟后再试'
                ]);
            }
    
            if (!$user->checkPassword($input['password'])) {
                $user->login_attempts += 1;
                $user->save();
                
                return json([
                    'code' => 406,
                    'msg' => '账号或密码错误'
                ]);
            }
    
            // 重置尝试次数
            $user->login_attempts = 0;
            $user->last_login = date('Y-m-d H:i:s');
            $user->save();
    
            // 生成访问令牌
            return $this->generateToken($user);
    
        } catch (\Exception $e) {
            // 异常日志记录
            trace('登录异常：' . $e->getMessage(), 'error');
            
            return json([
                'code' => 500,
                'msg' => '系统繁忙，请稍后再试'
            ]);
        }
    }

    public function mockCode()
    {
        $mobile = input('mobile');
        Cache::set('sms_code_'.$mobile, '123456', 300);
        return json(['code'=>200, 'msg'=>'验证码已发送']);
    }

    // 微信登录
    public function wechatLogin()
    {
        $code = $this->request->post('code');
        $appid = 'YOUR_APP_ID_PLACEHOLDER';
        $secret = '89027115700121f4604af44056892239';
        
        // 获取openid
        $url = "https://api.weixin.qq.com/sns/jscode2session?appid={$appid}&secret={$secret}&js_code={$code}&grant_type=authorization_code";
        $res = json_decode(file_get_contents($url), true);
        
        if (isset($res['errcode'])) {
            return json(['code' => 500, 'msg' => '微信登录失败']);
        }
        
        $user = User::where('openid', $res['openid'])->find();
        if (!$user) {
            // 新用户自动注册
            $user = User::create([
                'openid' => $res['openid'],
                'nickname' => '微信用户',
                'mobile' => ''
            ]);
        }
        
        return $this->generateToken($user);
    }

    // 生成Token
    private function generateToken($user)
    {
        trace('当前密钥内容：' . config('jwt.secret'), 'debug');
        trace('密钥长度：' . strlen(config('jwt.secret')), 'debug');
        try {
            $key = env('JWT_SECRET', 'default_secret_key');
            
            // 使用ThinkPHP的with预加载关联
            $user = User::with(['role.permissions'])
                ->find($user->id);
            
            // 验证角色数据存在
            if (!$user->role) {
                throw new \Exception('用户角色信息缺失');
            }
    
            // 检查权限数据
            if (!$user->role->permissions) {
                throw new \Exception('权限数据加载失败');
            }
    
            // 生成Token
            $token = JWT::encode([
                'uid' => $user->id,
                'role' => $user->role_id,
                'exp' => time() + 86400 * 7
            ], $key, 'HS256');
    
            return json([
                'code' => 200,
                'data' => [
                    'token' => $token,
                    'userInfo' => [
                        'roleId' => $user->role_id,
                        'permissions' => $user->role->permissions->column('code')
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            trace('Token生成失败详情：' . $e->getMessage(), 'error');
            trace('堆栈信息：' . $e->getTraceAsString(), 'error');
            return json(['code' => 500, 'msg' => '认证配置异常']);
        }
    }
    public function info()
    {
        try {
            // 获取并验证Token
            $token = $this->request->header('Authorization');
            if (!$token) {
                return json(['code' => 401, 'msg' => '未授权']);
            }
            
            $decoded = JWT::decode($token, new Key('your_strong_secret_key_here', 'HS256'));
            $userId = $decoded->uid;

            // 查询用户信息
            $user = UserModel::withCount(['appointment' => function($query) {
                $query->where('status', 1);
            }])->find($userId);

            if (!$user) {
                return json(['code' => 404, 'msg' => '用户不存在']);
            }

            return json([
                'code' => 200,
                'data' => $user->visible([
                    'id', 'nickname', 'mobile', 'avatar', 'appointments_count'
                ])
            ]);
            
        } catch (\Exception $e) {
            return json([
                'code' => 500,
                'msg' => '服务器错误: ' . $e->getMessage()
            ]);
        }
    }
    public function check()
    {
        try {
            $token = str_replace('Bearer ', '', $this->request->header('Authorization'));
            if (empty($token)) {
                return json(['code' => 401, 'msg' => 'Token缺失']);
            }
    
            // 验证签名
            $decoded = JWT::decode($token, new Key('your_strong_secret_key_here', 'HS256'));
    
            // 检查黑名单
            if (Cache::has('blacklist:'.$token)) {
                return json(['code' => 401, 'msg' => 'Token已失效']);
            }
    
            return json(['code' => 200, 'msg' => 'Token有效']);
        } catch (\Exception $e) {
            return json(['code' => 401, 'msg' => 'Token验证失败: '.$e->getMessage()]);
        }
    }
    // 退出登录
    public function logout()
    {
        try {
            $token = $this->request->header('Authorization');
            if ($token) {
                // 将token加入黑名单（需要redis支持）
                Cache::set('blacklist:'.$token, 1, 86400);
            }
            return json(['code' => 200, 'msg' => '退出成功']);
        } catch (\Exception $e) {
            return json(['code' => 500, 'msg' => '退出失败']);
        }
    }
    //
    public function cache()
    {
        try {
            $path = runtime_path('cache');
            $file = $path . 'test_file.txt';
            
            // 调试输出
            echo "当前工作目录: " . getcwd() . "\n";
            echo "缓存路径: " . $path . "\n";
            echo "文件路径: " . $file . "\n";
            echo "目录是否可写: " . (is_writable($path) ? '是' : '否') . "\n";

            file_put_contents($file, 'test_content');
            return json([
                'code' => 200,
                'data' => file_get_contents($file)
            ]);
        } catch (\Exception $e) {
            return json([
                'code' => 500,
                'msg' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }

    // 新增管理后台登录方法
    public function adminLogin()
    {
        try {
            // ✅ 1. 接收参数兼容两种方式
            $input = $this->request->post();
            $username = $input['username'] ?? '';
            $password = $input['password'] ?? '';

            // ✅ 2. 增强日志记录
            trace('管理登录请求参数：'.json_encode($input), 'debug');

            // ✅ 3. 参数验证增强
            if (empty($username)) {
                return json(['code' => 400, 'msg' => '用户名不能为空']);
            }

            // ✅ 4. 用户查询（仅限医生和管理员）
            $user = User::where('mobile', $username)
                ->where('role_id', 'IN', [2, 3])
                ->find();

            trace('查询到的用户：'.json_encode($user), 'debug');

            // ✅ 5. 用户验证增强
            if (!$user || !password_verify($password, $user->password)) {
                trace('登录失败：用户名或密码错误', 'warning');
                return json(['code' => 401, 'msg' => '用户名或密码错误']);
            }

            // ✅ 6. 生成管理端专属Token
            $token = $this->generateAdminToken($user);

            return json([
                'code' => 200,
                'data' => [
                    'token' => $token,
                    'userInfo' => [
                        'roleId' => $user->role_id,
                        'nickname' => $user->nickname,
                        'id' => $user->id // 必须返回用户ID
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            trace('管理登录异常：'.$e->getMessage()."\n".$e->getTraceAsString(), 'error');
            return json(['code' => 500, 'msg' => '系统繁忙，请稍后再试']);
        }
    }

    // 生成管理端Token（独立密钥）
    private function generateAdminToken($user)
    {
        // ✅ 从环境变量读取
        $key = env('JWT_SECRET'); 
        $algo = env('JWT_ALGO', 'HS256');
        
        return JWT::encode([
            'uid' => $user->id,
            'role' => $user->role_id,
            'type' => 'admin',
            'exp' => time() + 86400 * 7
        ], $key, $algo);
    }
}