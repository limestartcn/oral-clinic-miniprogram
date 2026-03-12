<?php
namespace app\controller;

use think\Request;
use app\model\Appointment;
use app\BaseController;
use think\facade\Db; // 引入数据库操作门面类
use think\facade\Cache; 
class AppointmentController extends BaseController
{
    // 获取预约列表
    public function index(Request $request)
    {
        try {
            $userId = $request->userId;
            $status = $request->param('status');
    
            $query = Appointment::with([
                'department' => function ($query) {
                    $query->field('id,name');
                },
                'doctor' => function ($query) {
                    $query->with(['user' => function ($query) {
                        $query->field('id,nickname');
                    }]);
                }
            ])->where('user_id', $userId);
    
            // ✅ 修正筛选逻辑
            if ($status !== null && is_numeric($status)) {
                // 只有当 status > 0 时应用筛选
                if ($status > 0) {
                    $query->where('status', intval($status));
                }
                // status=0 时不做筛选（显示全部）
            }
    
            $list = $query->order('appointment_time', 'desc')
                ->select()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'appointment_time' => $item->appointment_time,
                        'status' => $item->status,
                        'department' => $item->department->name ?? '未知科室',
                        'doctor_name' => $item->doctor->user->nickname ?? '未知医生'
                    ];
                });
    
            return json([
                'code' => 200,
                'data' => $list->toArray()
            ]);
        } catch (\Exception $e) {
            trace('预约列表错误详情：'.$e->getMessage(), 'error');
            return json(['code' => 500, 'msg' => '服务器内部错误']);
        }
    }
    
    // 获取预约详情
    public function read($id)
    {
        $userId = $this->request->userId;
    
        $appointment = Appointment::with([
            'doctor' => function ($query) {
                $query->field('id,user_id,name,avatar,department_id')
                      ->with(['user' => function ($query) {
                          $query->field('id,nickname');
                      }]);
            },
            'department' => function ($query) {
                $query->field('id,name');
            }
        ])->where('id', $id)
          ->where('user_id', $userId)
          ->find();
    
        if (!$appointment) {
            return json(['code' => 404, 'msg' => '预约不存在或无权访问']);
        }
    
        return json([
            'code' => 200,
            'data' => [
                'id' => $appointment->id,
                'time' => $appointment->appointment_time,
                'status' => $appointment->status,
                'doctor' => [
                    'id' => $appointment->doctor->id,
                    'name' => $appointment->doctor->user->nickname ?? '未知医生', // ✅ 使用 nickname
                    'avatar' => $appointment->doctor->avatar ?? ''
                ],
                'department' => $appointment->department->name ?? '未知科室'
            ]
        ]);
    }

    // 取消预约
    public function cancel($id) {
        try {
            $appointment = Appointment::findOrFail($id);
            $appointment->status = Appointment::STATUS_CANCELED;
            $appointment->save();
            return json(['code' => 200, 'msg' => '取消成功']);
        } catch (\Exception $e) {
            return json(['code' => 500, 'msg' => '取消失败']);
        }
    }
    public function getTimeSlots(Request $request)
    {
        try {
            // 1. 接收参数
            $doctorId = $request->param('doctorId/d');
            $date = $request->param('date');
    
            // 2. 参数校验
            if (!$doctorId || !$date) {
                return json(['code' => 400, 'msg' => '缺少必要参数']);
            }
    
            // 3. 查询数据库（使用门面类 Db）
            $schedules = Db::name('schedule')
                ->where('doctor_id', $doctorId)
                ->where('date', $date)
                ->select();
    
            // 4. 返回数据
            return json([
                'code' => 200,
                'data' => $schedules
            ]);
    
        } catch (\Exception $e) {
            // 记录错误日志
            trace('获取时间段失败：' . $e->getMessage(), 'error');
            return json(['code' => 500, 'msg' => '服务器内部错误']);
        }
    }

    // AppointmentController.php
    public function store(Request $request) {
        try {
            // 从 JWT 获取用户 ID
            $userId = $request->userId;
            if (!$userId) {
                return json(['code' => 401, 'msg' => '未授权访问']);
            }
    
            // 接收参数（确保参数名与前端一致）
            $data = $request->post();
            if (empty($data['doctor_id']) || empty($data['department_id']) || empty($data['appointment_time'])) {
                return json(['code' => 400, 'msg' => '缺少必要参数']);
            }
    
            // 将时间字符串直接存入数据库
            $appointmentTime = $data['appointment_time'];
            
            // 验证时间格式
            if (!preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $appointmentTime)) {
                return json(['code' => 400, 'msg' => '时间格式错误']);
            }
    
            // 创建预约记录
            $appointment = Appointment::create([
                'schedule_id' => $data['schedule_id'], // 新增字段
                'user_id' => $userId,
                'doctor_id' => $data['doctor_id'],
                'department_id' => $data['department_id'],
                'appointment_time' => $appointmentTime, // 直接使用字符串
                'status' => Appointment::STATUS_PENDING,
                'patient_name' => $data['patient_name'] ?? '',
                'patient_mobile' => $data['patient_mobile'] ?? '',
                'remark' => $data['remark'] ?? '',
            ]);
    
            return json([
                'code' => 200,
                'data' => $appointment,
                'msg' => '预约成功'
            ]);
    
        } catch (\Exception $e) {
            trace('创建预约失败：' . $e->getMessage(), 'error');
            return json(['code' => 500, 'msg' => '服务器内部错误']);
        }
    }
    // // 新增完成预约方法
    // public function complete($id) {
    //     try {
    //         // 获取当前医生ID
    //         $doctorId = $this->request->doctorId;
            
    //         $appointment = Appointment::where('id', $id)
    //             ->where('doctor_id', $doctorId)
    //             ->find();

    //         if (!$appointment) {
    //             return json(['code' => 404, 'msg' => '预约不存在或无权操作']);
    //         }

    //         if ($appointment->status != 2) {
    //             return json(['code' => 400, 'msg' => '只有已预约状态可标记完成']);
    //         }

    //         $appointment->status = 3; // 3-已完成
    //         $appointment->save();

    //         // 记录操作日志
    //         Db::name('audit_log')->insert([
    //             'user_id' => $this->request->userId,
    //             'action' => 'appointment:complete',
    //             'target' => '预约ID: '.$id,
    //             'detail' => '医生完成预约',
    //             'ip' => $this->request->ip()
    //         ]);

    //         return json(['code' => 200, 'msg' => '操作成功']);

    //     } catch (\Exception $e) {
    //         trace('完成预约错误：'.$e->getMessage(), 'error');
    //         return json(['code' => 500, 'msg' => '服务器错误']);
    //     }
    // }
    // 新增确认预约方法
    public function confirm($id) {
        try {
            $doctorId = $this->request->doctorId;
            
            $appointment = Appointment::where('id', $id)
                ->where('doctor_id', $doctorId)
                ->find();

            if (!$appointment) {
                return json(['code' => 404, 'msg' => '预约不存在或无权操作']);
            }

            if ($appointment->status != 1) {
                return json(['code' => 400, 'msg' => '只有待确认状态可操作']);
            }

            $appointment->status = 2; // 更新为已预约
            $appointment->save();

            // 记录操作日志
            Db::name('audit_log')->insert([
                'user_id' => $this->request->userId,
                'action' => 'appointment:confirm',
                'target' => '预约ID: '.$id,
                'detail' => '医生确认预约',
                'ip' => $this->request->ip()
            ]);

            return json(['code' => 200, 'msg' => '确认成功']);

        } catch (\Exception $e) {
            trace('确认预约错误：'.$e->getMessage(), 'error');
            return json(['code' => 500, 'msg' => '服务器错误']);
        }
    }
    public function pay($id)
    {
        try {
            $appointment = Appointment::find($id);
            if (!$appointment) {
                return json(['code' => 404, 'msg' => '预约不存在']);
            }
            
            // 更新状态为已支付
            $appointment->status = 2;
            $appointment->save();
            
            return json(['code' => 200, 'msg' => '支付成功']);
        } catch (\Exception $e) {
            return json(['code' => 500, 'msg' => '服务器错误']);
        }
    }
    /**
     * 获取医生专属预约列表
     */
    public function doctorAppointments(Request $request)
    {
        try {
            $doctorId = $request->doctorId;
            $status = $request->param('status/d', 0);
            $keyword = $request->param('keyword/s', '');
            $page = $request->param('page/d', 1);
            $size = $request->param('size/d', 20);

            $query = Appointment::with([
                'user' => function($query) {
                    $query->field('id,nickname,mobile');
                },
                'department' => function($query) {
                    $query->field('id,name');
                }
            ])->where('doctor_id', $doctorId);

            // 状态筛选
            $statusMap = [
                1 => \app\model\Appointment::STATUS_PENDING,
                2 => \app\model\Appointment::STATUS_CONFIRMED,
                3 => \app\model\Appointment::STATUS_COMPLETED
            ];
            if ($status && isset($statusMap[$status])) {
                $query->where('status', $statusMap[$status]);
            }

            // 关键词搜索
            if ($keyword) {
                $query->hasWhere('user', function($q) use ($keyword) {
                    $q->where('nickname|mobile', 'like', "%{$keyword}%");
                });
            }

            // 分页处理
            $list = $query->order('appointment_time', 'desc')
                ->paginate([
                    'page' => $page,
                    'list_rows' => $size
                ])
                ->each(function($item) {
                    $item->patient_info = $item->user;
                    $item->department_name = $item->department->name;
                    unset($item->user, $item->department);
                    return $item;
                });

            return json([
                'code' => 200,
                'data' => [
                    'records' => $list->items(),
                    'total' => $list->total()
                ]
            ]);

        } catch (\Exception $e) {
            trace('医生预约列表错误:'.$e->getMessage(), 'error');
            return json(['code' => 500, 'msg' => '系统繁忙']);
        }
    }

    /**
     * 完成预约接口
     */
    public function complete($id)
    {
        try {
            // ✅ 新增操作频率校验
            $cacheKey = 'complete_lock:'.$id;
            if (Cache::has($cacheKey)) {
                return json(['code' => 429, 'msg' => '操作过于频繁']);
            }
            Cache::set($cacheKey, 1, 3); // 3秒内禁止重复操作

            $doctorId = $this->request->doctorId;
            
            $appointment = Appointment::where('id', $id)
                ->where('doctor_id', $doctorId)
                ->where('status', \app\model\Appointment::STATUS_CONFIRMED)
                ->find();

            if (!$appointment) {
                return json(['code' => 403, 'msg' => '非法操作']);
            }

            $appointment->status = \app\model\Appointment::STATUS_COMPLETED;
            $appointment->save();

            // 记录操作日志
            Db::name('audit_log')->insert([
                'user_id' => $this->request->userId,
                'action' => 'appointment:complete',
                'target' => "预约ID: {$id}",
                'detail' => '医生完成就诊',
                'ip' => $this->request->ip()
            ]);

            return json(['code' => 200, 'msg' => '操作成功']);

        } catch (\Exception $e) {
            trace('完成预约错误:'.$e->getMessage(), 'error');
            return json(['code' => 500, 'msg' => '系统错误']);
        }
    }
}