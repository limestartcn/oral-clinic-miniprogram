<?php
namespace app\controller;

use think\facade\Request;
use think\facade\Filesystem;
use think\facade\Validate;

class Upload 
{
    public function upload()
    {
        $file = Request::file('file');
        if (!$file) {
            return json(['code' => 400, 'msg' => '请选择文件'], 400);
        }
    
        // 验证条件配置
        $maxSize = 2 * 1024 * 1024; // 2MB
        $allowedExt = ['jpg', 'png', 'jpeg'];
        
        // 验证文件类型
        if (!in_array(strtolower($file->extension()), $allowedExt)) {
            return json([
                'code' => 400,
                'msg' => '仅支持 JPG/PNG/JPEG 格式'
            ], 400);
        }
    
        // 验证文件大小
        if ($file->getSize() > $maxSize) {
            return json([
                'code' => 400,
                'msg' => sprintf('文件大小不能超过 %.2fMB', $maxSize/1024/1024)
            ], 400);
        }
    
        try {
            $saveName = Filesystem::disk('public')
                ->putFileAs('avatars', $file, uniqid().'.'.$file->extension());
                
            $url = Request::domain().'/uploads/'.str_replace('\\', '/', $saveName);
            
            return json([
                'code' => 200,
                'data' => ['url' => $url]
            ]);
        } catch (\Exception $e) {
            return json([
                'code' => 500,
                'msg' => '上传失败',
                'error' => config('app_debug') ? $e->getMessage() : null
            ], 500);
        }
    }
    public function uploadImage()
    {
        $file = request()->file('file');
        if (!$file) {
            return json(['code' => 400, 'msg' => '未选择文件']);
        }
    
        // 新增：验证文件类型和大小
        $validate = Validate::rule([
            'file' => 'file|fileExt:jpg,png,jpeg|fileSize:2048000' // 2MB
        ]);
        if (!$validate->check(['file' => $file])) {
            return json(['code' => 400, 'msg' => $validate->getError()]);
        }
    
        $savePath = 'uploads/chat_images/';
        
        try {
            // 修正：直接使用 move 方法并指定文件名规则
            $info = $file->move($savePath, md5(uniqid()));
            if (!$info) {
                return json(['code' => 500, 'msg' => $file->getError()]);
            }
            // 修正：使用 DIRECTORY_SEPARATOR 处理路径兼容性
            $relativePath = str_replace('\\', '/', $info->getPathname());
            return json([
                'code' => 200,
                'data' => [
                    // 修正路径拼接方式
                    'url' => Request::domain() . '/' . str_replace('\\', '/', $info->getPathname())
                ]
            ]);
        } catch (\Exception $e) {
            return json([
                'code' => 500,
                'msg' => '上传失败：' . $e->getMessage()
            ]);
        }
    }
}