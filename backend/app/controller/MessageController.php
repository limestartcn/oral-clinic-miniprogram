<?php
namespace app\controller;

use think\Request;
use think\facade\Db;    // 新增：引入数据库门面类
use think\facade\Log;   // 新增：引入日志门面类
use app\model\Message;

class MessageController
{
    // 获取历史消息
    public function history(Request $request)
    {
        try {
            $conversationId = $request->param('conversation_id');
            $messages = Db::name('message')
                ->where('conversation_id', $conversationId)
                ->order('create_time', 'asc')
                ->select();
            
            return json(['code' => 200, 'data' => $messages]);
        } catch (\Exception $e) {
            // 记录错误日志（使用正确命名空间）
            Log::error('消息查询失败: ' . $e->getMessage());
            return json(['code' => 500, 'msg' => '服务器内部错误']);
        }
    }

    // 发送消息（保持不变）
    public function send(Request $request)
    {
        try {
            // 1. 获取参数
            $data = $request->post();
            $userId = $request->user->id;
            $doctorId = $data['doctor_id']; // 前端必须传递医生ID

            // 2. 自动创建或获取会话
            $conversation = Db::name('conversation')
                ->where('user_id', $userId)
                ->where('doctor_id', $doctorId)
                ->find();

            if (!$conversation) {
                $conversationId = Db::name('conversation')->insertGetId([
                    'user_id' => $userId,
                    'doctor_id' => $doctorId
                ]);
            } else {
                $conversationId = $conversation['id'];
            }

            // 3. 保存消息（关联会话ID）
            $message = Message::create([
                'conversation_id' => $conversationId,
                'sender_id' => $userId,
                'receiver_id' => $doctorId,
                'content' => $data['content'],
                'type' => $data['type']
            ]);

            return json(['code' => 200, 'data' => $message]);
    
        } catch (\Exception $e) {
            // 记录详细错误日志
            Log::error('消息发送失败', [
                'error' => $e->getMessage(),
                'data' => $data ?? [],
                'trace' => $e->getTraceAsString()
            ]);
            return json(['code' => 500, 'msg' => '服务器内部错误']);
        }
    }
    // 获取用户会话列表
    public function sessions(Request $request) {
        $userId = $request->user->id;

        try {
            $sessions = Db::name('conversation')
                ->alias('c')
                ->join('doctor d', 'c.doctor_id = d.id')
                ->field([
                    'c.id as conversation_id',
                    'd.id as doctor_id',
                    'd.name as doctor_name',
                    'd.avatar as doctor_avatar',
                    'c.last_message_time',
                    '(SELECT content FROM message WHERE conversation_id = c.id ORDER BY create_time DESC LIMIT 1) as last_msg_content'
                ])
                ->where('c.user_id', $userId)
                ->select();
        
            return json(['code' => 200, 'data' => $sessions]);
        } catch (\Exception $e) {
            Log::error('会话列表查询失败: ' . $e->getMessage());
            return json(['code' => 500, 'msg' => '服务器内部错误']);
        }
    }
    // 获取会话ID（不存在则创建）
    public function getConversationId(Request $request) {
        $userId = $request->user->id;
        $doctorId = $request->post('doctor_id');

        $conversation = Db::name('conversation')
            ->where('user_id', $userId)
            ->where('doctor_id', $doctorId)
            ->find();

        if (!$conversation) {
            $conversationId = Db::name('conversation')->insertGetId([
                'user_id' => $userId,
                'doctor_id' => $doctorId
            ]);
        } else {
            $conversationId = $conversation['id'];
        }

        return json(['code' => 200, 'data' => ['conversation_id' => $conversationId]]);
    }
}