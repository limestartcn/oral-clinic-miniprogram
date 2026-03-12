<?php
namespace app\controller;

use app\BaseController;
use app\model\Appointment;
use app\model\Doctor;
use app\model\Schedule;
use app\model\ScheduleTemplate;
use think\facade\Db;
// 添加DateTime类引入
use \DateTime;
use \DateTimeZone;

class ScheduleController extends BaseController
{
    // 生成下周排班（管理员权限）
    public function generateNextWeek()
    {

        date_default_timezone_set('Asia/Shanghai');
        set_time_limit(0);
        try {
            // 记录开始时间
            trace('开始生成下周排班', 'info');
            
            // 获取有排班模板的医生
            $doctors = Doctor::has('scheduleTemplate')->with('scheduleTemplate')->select();
            trace('找到 '.count($doctors).' 位有排班模板的医生', 'info');
    
            // 计算起始日期
            $now = new DateTime('now', new DateTimeZone('Asia/Shanghai'));
            $startDate = clone $now;
            if ($startDate->format('N') != 1) {
                $startDate->modify('next monday');
            }
            $startDate = $startDate->format('Y-m-d');
            trace('排班起始日期：'.$startDate, 'info');
    
            Db::startTrans();
            
            $generatedCount = 0;
            foreach ($doctors as $doctor) {
                $template = $doctor->scheduleTemplate;
                trace("处理医生 {$doctor->id} 的排班模板", 'debug');
    
                $workDays = explode(',', $template->work_days);
                for ($i = 0; $i < 7; $i++) {
                    $currentDate = date('Y-m-d', strtotime($startDate." +{$i} days"));
                    $weekday = date('N', strtotime($currentDate));
                    
                    // 跳过非工作日
                    if (!in_array($weekday, $workDays)) {
                        trace("{$currentDate} 是医生 {$doctor->id} 的休息日", 'debug');
                        continue;
                    }
                    // 生成上午排班
                    if (!$this->existsSchedule($doctor->id, $currentDate, 1)) {
                        Schedule::create([
                            'doctor_id'     => $doctor->id,
                            'date'          => $currentDate,
                            'time_slot' => $this->formatTimeToMinutes($template->morning_start ?? '08:00:00') . '-' .$this->formatTimeToMinutes($template->morning_end ?? '12:00:00'),
                            'time_type'     => 1,
                            'max_patients'  => $template->default_max_patients ?? 5,
                            'available'     => 1,
                            'booked_patients' => 0
                        ]);
                        $generatedCount++;
                    }

                    // 生成下午排班
                    if (!$this->existsSchedule($doctor->id, $currentDate, 2)) {
                        Schedule::create([
                            'doctor_id'     => $doctor->id,
                            'date'          => $currentDate,
                            'time_slot' => $this->formatTimeToMinutes($template->afternoon_start ?? '14:30') . '-' .$this->formatTimeToMinutes($template->afternoon_end ?? '17:30'),
                            'time_type'     => 2,
                            'max_patients'  => $template->default_max_patients ?? 5,
                            'available'     => 1,
                            'booked_patients' => 0
                        ]);
                        $generatedCount++;
                    }
                }
            }
            
            Db::commit();
            trace("成功生成 {$generatedCount} 个排班", 'info');
            return json([
                'code' => 200,
                'msg' => '排班生成成功',
                'data' => ['count' => $generatedCount]
            ]);
        } catch (\Exception $e) {
            Db::rollback();
            trace("排班生成失败：".$e->getMessage(), 'error');
            trace("堆栈跟踪：\n".$e->getTraceAsString(), 'error');
            return json([
                'code' => 500,
                'msg' => '排班生成失败：'.$e->getMessage(),
                'detail' => $e->getTraceAsString()
            ]);
        }
    }
    
    // 检查排班是否已存在
    private function existsSchedule($doctorId, $date, $timeType)
    {
        return Schedule::where([
            'doctor_id' => $doctorId,
            'date' => $date,
            'time_type' => $timeType
        ])->find() !== null; // ✅ 直接判断结果是否存在
    }

    // 更新最大预约数（带自动状态管理）
    public function updateMaxPatients($id)
    {
        try {
            $max = $this->request->put('max_patients/d'); // 使用PUT方法获取参数
            
            $schedule = Schedule::withCount(['appointments' => function($query) {
                $query->where('status', 2);
            }])->findOrFail($id);
    
            // 验证逻辑
            if ($max < $schedule->appointments_count) {
                return json(['code' => 400, 'msg' => '不能小于当前预约数']);
            }
    
            // 更新数据库字段
            $schedule->max_patients = $max;
            $schedule->available = ($schedule->appointments_count < $max) ? 1 : 0;
            $schedule->save();
    
            return json(['code' => 200, 'msg' => '更新成功']);
        } catch (\Exception $e) {
            return json(['code' => 500, 'msg' => $e->getMessage()]);
        }
    }
    // 在 ScheduleController 类中添加以下方法
    private function formatTimeToMinutes($timeString)
    {
        try {
            // 尝试解析时间字符串（支持 "H:i:s" 或 "H:i" 格式）
            $dateTime = \DateTime::createFromFormat('H:i:s', $timeString);
            if (!$dateTime) {
                $dateTime = \DateTime::createFromFormat('H:i', $timeString);
            }
            // 返回格式化后的时间（H:i）
            return $dateTime ? $dateTime->format('H:i') : substr($timeString, 0, 5);
        } catch (\Exception $e) {
            // 容错处理：直接截取前5位字符（如 "08:00"）
            return substr($timeString, 0, 5);
        }
    }
    // 获取排班列表（支持日期范围）
    public function getList()
    {
        try {
            $params = $this->request->only([
                'page' => 1,
                'pageSize' => 10,
                'doctor_id' => null,
                'start_date' => null,
                'end_date' => null
            ]);
    
            $query = Schedule::with(['doctor' => function($query) {
                    $query->field('id,name');
                }])
                ->withCount(['bookedPatients' => 'booked_patients']) // 使用新关联
                ->when($params['doctor_id'], function($q) use ($params) {
                    // 新增医生筛选条件
                    return $q->where('doctor_id', $params['doctor_id']);
                })
                ->when($params['start_date'] && $params['end_date'], function($q) use ($params) {
                    return $q->whereBetween('date', [
                        $params['start_date'], 
                        $params['end_date']
                    ]);
                })
                ->field([
                    'id', 'doctor_id', 'date', 'time_slot', 'time_type',
                    'max_patients', 'available', 'create_time'
                ])
                ->fieldRaw('
                    IF(
                        (SELECT COUNT(*) FROM appointment 
                         WHERE schedule_id = schedule.id AND status = 2)
                        >= max_patients, 
                        0, 
                        available
                    ) as available_calculated
                ')
                ->order('date', 'asc')
                ->order('time_type', 'asc');
            // 打印完整SQL到日志
            trace('Generated SQL: ' . $query->buildSql(), 'debug');
            $paginator = $query->paginate([
                'page' => $params['page'],
                'list_rows' => $params['pageSize']
            ]);
    
            return json([
                'code' => 200,
                'data' => [
                    'list' => $paginator->items(),
                    'total' => $paginator->total()
                ]
            ]);
        } catch (\Exception $e) {
            // 记录完整错误信息
            trace([
                'Error Message' => $e->getMessage(),
                'SQL' => Db::getLastSql(), // 获取最后执行的SQL
                'Trace' => $e->getTraceAsString()
            ], 'error');
            return json([
                'code' => 500,
                'msg' => '服务器错误: '.$e->getMessage()
            ]);
        }
    }

    // 切换排班状态（管理员权限）
    public function toggleStatus($id)
    {
        try {
            // 获取请求参数
            $status = $this->request->post('status/d', 1); // 默认开启
            
            $schedule = Schedule::withCount(['appointments' => function($query) {
                $query->where('status', 2);
            }])->findOrFail($id);
    
            // 校验预约数
            if ($status == 1 && $schedule->appointments_count >= $schedule->max_patients) {
                return json(['code' => 400, 'msg' => '当前预约已满，不可开启']);
            }
    
            // 更新状态
            $schedule->available = $status;
            $schedule->save();
    
            return json(['code' => 200, 'msg' => '状态更新成功']);
        } catch (\Exception $e) {
            return json([
                'code' => 500,
                'msg' => '操作失败: '.$e->getMessage()
            ]);
        }
    }
}