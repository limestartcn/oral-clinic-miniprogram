<?php
namespace app\controller;

use think\Request;
use app\model\MedicalRecord;
use app\BaseController;
use think\exception\ModelNotFoundException;
use think\facade\Db;

class MedicalRecordController extends BaseController
{
    // 保存病例（创建/更新）
    public function save(Request $request)
    {
        try {
            $data = $request->post();
            $doctorId = $request->doctorId;
    
            // 验证预约有效性
            $appointment = Db::name('appointment')
                ->where('id', $data['appointment_id'])
                ->where('doctor_id', $doctorId)
                ->where('status', 3)
                ->find();
    
            if (!$appointment) {
                return json(['code' => 403, 'msg' => '非法操作']);
            }
    
            // ✅ 使用 ThinkPHP 方式实现更新或创建
            $record = MedicalRecord::where('appointment_id', $data['appointment_id'])
                ->find();
    
            if ($record) {
                $record->save(array_merge($data, ['doctor_id' => $doctorId]));
            } else {
                $record = MedicalRecord::create(array_merge($data, [
                    'doctor_id' => $doctorId,
                    'appointment_id' => $data['appointment_id']
                ]));
            }
    
            return json([
                'code' => 200,
                'data' => $record,
                'msg' => '保存成功'
            ]);
    
        } catch (\Exception $e) {
            trace('病例保存失败:'.$e->getMessage(), 'error');
            return json(['code' => 500, 'msg' => '系统错误']);
        }
    }

    // 获取病例详情
    public function detail($appointmentId)
    {
        try {
            $record = MedicalRecord::with(['appointment.user'])
                ->where('appointment_id', $appointmentId)
                ->findOrFail(); // ✅ 使用 findOrFail()
    
            // 结构化返回数据（三重保障）
            return json([
                'code' => 200,
                'data' => [
                    'diagnosis'       => $record->diagnosis ?? '',
                    'treatment'       => $record->treatment ?? '',
                    'prescription'    => $record->prescription ?: [],
                    'attachments'     => $record->attachments ?: [],
                    'appointment_time'=> $record->appointment->appointment_time ?? '',
                    'patient_info'    => [
                        'nickname' => $record->appointment->user->nickname ?? '未知患者',
                        'mobile'   => $record->appointment->user->mobile ?? '--'
                    ]
                ]
            ]);
    
        } catch (ModelNotFoundException $e) {
            return json([ // ✅ 直接使用json方法
                'code' => 404,
                'msg' => '病例不存在',
                'data' => [
                    'patient_info' => ['nickname' => '未知患者', 'mobile' => '--']
                ]
            ]);
        } catch (\Exception $e) {
            return json([ // ✅ 直接使用json方法
                'code' => 500,
                'msg' => '系统错误'
            ]);
        }
    }
    public function list(Request $request)
    {
        try {
            $doctorId = $request->doctorId;
            $keyword = $request->param('keyword', '');
            $page = $request->param('page/d', 1); // 严格类型转换 [!code ++]
            $size = $request->param('size/d', 15);
    
            // 关联查询优化 [!code ++]
            $query = MedicalRecord::with([
                'appointment' => function($query) {
                    $query->with(['user' => function($query) {
                        $query->field('id,nickname,mobile');
                    }]);
                }
            ])->where('doctor_id', $doctorId);
    
            if ($keyword) {
                // 使用更安全的查询方式 [!code ++]
                $query->whereHas('appointment.user', function($q) use ($keyword) {
                    $q->where('nickname|mobile', 'like', "%{$keyword}%");
                });
            }
    
            // 分页参数验证 [!code ++]
            $page = max(1, $page);
            $size = min(50, $size);
    
            $list = $query->order('id', 'desc')
                ->paginate([
                    'page' => $page,
                    'list_rows' => $size
                ]);
            $records = $list->items();
            // 空数据保护
            if (empty($records)) {
                return json([
                    'code' => 200,
                    'data' => [
                        'records' => [],
                        'total' => $list->total()
                    ]
                ]);
            }
            // 数据结构转换 [!code ++]
            $formatted = array_map(function($item) {
                return [
                    'appointment_id' => $item->appointment_id,
                    'diagnosis' => $item->diagnosis,
                    'appointment_time' => $item->appointment->appointment_time,
                    'patient_info' => $item->appointment->user
                ];
            }, $records);
    
            return json([
                'code' => 200,
                'data' => [
                    'records' => $formatted,
                    'total' => $list->total()
                ]
            ]);
    
        } catch (\Exception $e) {
            // 记录完整错误 [!code ++]
            trace('[病例列表错误] '.$e->getMessage()."\n".$e->getTraceAsString(), 'error');
            return json([
                'code' => 500,
                'msg' => '服务暂不可用',
                'debug' => env('app_debug') ? $e->getMessage() : null
            ]);
        }
    }
    public function userRecords(Request $request)
    {
        try {
            $userId = $request->userId;
            
            $records = Db::name('medical_record')
                ->alias('mr')
                ->join('appointment a', 'mr.appointment_id = a.id')
                ->join('doctor d', 'mr.doctor_id = d.id')
                ->join('departments dp', 'a.department_id = dp.id')
                ->where('a.user_id', $userId)
                ->field([
                    'mr.id',
                    'mr.diagnosis',
                    'mr.treatment',
                    'mr.prescription',
                    'mr.attachments',
                    'mr.create_time',
                    'd.name as doctor_name',
                    'dp.name as department_name'
                ])
                ->order('mr.create_time', 'desc')
                ->select()
                ->toArray();
                
            // 处理数据格式
            $records = array_map(function($record) {
                $record['prescription'] = json_encode($record['prescription'], JSON_UNESCAPED_UNICODE);
                $record['attachments'] = json_encode($record['attachments'], JSON_UNESCAPED_SLASHES);
                return $record;
            }, $records);
    
            return json([
                'code' => 200,
                'data' => $records
            ]);
    
        } catch (\Exception $e) {
            trace('健康档案查询失败:'.$e->getMessage(), 'error');
            return json(['code' => 500, 'msg' => '系统繁忙']);
        }
    }
}