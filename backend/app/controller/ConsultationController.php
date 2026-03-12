<?php
// backend/app/controller/Consultation.php
namespace app\controller;

use app\model\Consultation;
use app\model\Message;
use think\facade\Request;

class ConsultationController extends BaseController
{
    // 创建咨询会话
    public function create()
    {
        $user = $this->getUser();
        $data = Request::post();
        
        // 验证医生有效性
        $doctor = Doctor::find($data['doctor_id']);
        if (!$doctor || $doctor->status != 1) {
            return json(['code' => 400, 'msg' => '医生不可用']);
        }
    
        // 创建咨询记录
        $consultation = Consultation::create([
            'patient_id' => $user->id,
            'doctor_id' => $data['doctor_id'],
            'initial_question' => $data['question'],
            'status' => 1
        ]);
    
        // 创建第一条消息
        Message::create([
            'consultation_id' => $consultation->id,
            'sender_id' => $user->id,
            'content' => $data['question'],
            'type' => 1
        ]);
    
        return json([
            'code' => 200,
            'data' => ['id' => $consultation->id]
        ]);
    }

    // 获取会话列表
    public function list()
    {
        $user = $this->getUser();
        $query = Consultation::with(['doctor.user', 'patient'])
            ->where(function($query) use ($user) {
                $query->where('patient_id', $user->id)
                      ->orWhere('doctor_id', $user->doctor->id);
            })
            ->order('created_at', 'desc');
        
        return json(['code' => 200, 'data' => $query->select()]);
    }

    // 发送消息
    public function sendMessage($id)
    {
        $content = Request::post('content');
        $user = $this->getUser();
        
        $message = Message::create([
            'consultation_id' => $id,
            'sender_id' => $user->id,
            'content' => $content
        ]);
        
        // 更新会话最后消息
        Consultation::update([
            'last_message' => $content,
            'unread_count' => \think\facade\Db::raw('unread_count+1')
        ], ['id' => $id]);
        
        // 触发WebSocket推送
        event('SendMessage', $message);
        
        return json(['code' => 200]);
    }
}