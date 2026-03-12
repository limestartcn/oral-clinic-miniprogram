<?php
namespace app\controller;

use think\Request;
use think\facade\Db;
use app\model\Review;
use app\model\Doctor;
use app\model\Appointment;

class ReviewController
{
    // 获取当前用户（替代BaseController的getUser方法）
    protected function getUser()
    {
        try {
            $token = request()->header('Authorization');
            if (!$token) return null;
    
            // ✅ 直接使用env配置，移除长度校验
            $secret = env('JWT_SECRET'); 
            if (!$secret) {
                throw new \Exception('JWT_SECRET未配置');
            }
    
            // ✅ 统一使用与BaseController相同的解析方式
            $payload = \Firebase\JWT\JWT::decode(
                str_replace('Bearer ', '', $token),
                new \Firebase\JWT\Key($secret, 'HS256')
            );
            
            return Db::name('user')->find($payload->uid);
        } catch (\Exception $e) {
            \think\facade\Log::error('JWT解析失败：'.$e->getMessage());
            return null;
        }
    }
    public function __construct()
    {
        // ✅ 启动时验证密钥配置
        if (empty(env('JWT_SECRET'))) {
            throw new \Exception('JWT_SECRET 未配置');
        }
    }
    
    // 提交评价
    public function create()
    {
        $user = $this->getUser();
        if (!$user) {
            return json(['code' => 401, 'msg' => '未登录']);
        }

        $data = input('post.');
        $validator = new \think\Validate([
            'appointment_id' => 'require|number',
            'rating' => 'require|float|between:1,5',
            'comment' => 'max:100'
        ]);
        
        if (!$validator->check($data)) {
            return json(['code' => 400, 'msg' => $validator->getError()]);
        }

        try {
            // 使用事务保证数据一致性
            Db::startTrans();

            // 验证预约有效性
            $appointment = Appointment::with(['doctor'])
                ->where('id', $data['appointment_id'])
                ->where('user_id', $user['id'])
                ->find();

            if (!$appointment) {
                throw new \Exception('预约不存在或权限不足');
            }

            if ($appointment->status != 3) {
                throw new \Exception('未完成的预约不能评价');
            }

            // 检查是否已评价
            if (Review::where('appointment_id', $data['appointment_id'])->count()) {
                throw new \Exception('已评价过该预约');
            }

            // 创建评价
            $review = Review::create([
                'appointment_id' => $data['appointment_id'],
                'doctor_id'     => $appointment->doctor_id,
                'user_id'       => $user['id'],
                'rating'        => $data['rating'],
                'comment'       => $data['comment'] ?? ''
            ]);

            // 更新医生评分（使用更精确的算法）
            $doctor = Doctor::find($appointment->doctor_id);
            $newCount = $doctor->service_count + 1;
            $newRating = round(
                ($doctor->rating * $doctor->service_count + $data['rating']) / $newCount,
                1
            );

            $doctor->save([
                'service_count' => $newCount,
                'rating'        => $newRating
            ]);

            Db::commit();
            return json(['code' => 200, 'msg' => '评价成功', 'data' => $review]);

        } catch (\Exception $e) {
            Db::rollback();
            return json(['code' => 500, 'msg' => $e->getMessage()]);
        }
    }

    // 获取医生评价列表（带分页）
    public function getByDoctor($id)
    {
        $page = input('page/d', 1);
        $pageSize = input('pageSize/d', 10);

        $query = Review::with(['user' => function($query) {
                $query->field('id,nickname,avatar');
            }])
            ->where('doctor_id', $id)
            ->order('create_time', 'desc');

        $total = $query->count();
        $reviews = $query->page($page, $pageSize)->select();

        return json([
            'code' => 200,
            'data' => [
                'list' => $reviews,
                'total' => $total,
                'page' => $page,
                'pageSize' => $pageSize
            ]
        ]);
    }
}