<?php
// +----------------------------------------------------------------------
// | ThinkPHP [ WE CAN DO IT JUST THINK ]
// +----------------------------------------------------------------------
// | 基础路由和公开接口
// +----------------------------------------------------------------------
use think\facade\Route;

// 基础测试路由
Route::get('think', function () {
    return 'hello,ThinkPHP8!';
});
Route::get('test/hello', function () {
    return json(['code' => 200, 'data' => 'Hello World']);
});

// 认证相关接口（无需权限）
Route::post('auth/login', 'Auth/login');
Route::post('auth/wechatLogin', 'Auth/wechatLogin');
Route::get('auth/check', 'Auth/check');
Route::post('admin/login', 'Auth/adminLogin'); // 管理端登录

// +----------------------------------------------------------------------
// | 需要权限验证的接口组
// +----------------------------------------------------------------------
Route::group(function () {
    //-----------------------------
    // 用户相关接口
    //-----------------------------
    Route::group('user', function () {
        Route::get('info', 'User/info');
        Route::post('update', 'User/update');
        Route::get('permissions', 'User/permissions');
        Route::get('appointment/count', 'User/getAppointmentCount');
        
        // 用户管理（假设为管理员操作）
        Route::get('list', 'User/list');
        Route::post('create', 'User/create');
        Route::post('update/:id', 'User/update');
        Route::delete('delete/:id', 'User/delete');
        Route::post('toggle-status/:id', 'User/toggleStatus'); // 新增状态切换接口
    })->middleware([\app\middleware\AuthCheck::class]); // 确保中间件存在

    //-----------------------------
    // 预约相关接口
    //-----------------------------
    Route::group('appointments', function () {
        Route::get('', 'AppointmentController/index');
        Route::post('', 'AppointmentController/store');
        Route::get('timeslots', 'AppointmentController/getTimeSlots');
        Route::get(':id', 'AppointmentController/read');
        Route::post(':id/cancel', 'AppointmentController/cancel');
        Route::post(':id/pay', 'AppointmentController/pay');

    });
    Route::get('timeslots', 'AppointmentController/getTimeSlots');
    //-----------------------------
    // 科室相关接口
    //-----------------------------
    Route::group('departments', function () {
        Route::get('/', 'DepartmentController/index');
    });

    //-----------------------------
    // 医生相关接口
    //-----------------------------
    Route::group('doctors', function () {
        Route::get('', 'Doctor/index');
        Route::post('', 'Doctor/create');    // 创建医生
        Route::get('list', 'Doctor/list');         // 医生列表
        Route::post(':id', 'Doctor/update');// 更新信息
        Route::get(':id', 'Doctor/detail');
        Route::get('appointments', 'Doctor/getAppointments');
        Route::post('appointments/:id/complete', 'AppointmentController/complete');
        Route::post('appointments/:id/confirm', 'AppointmentController/confirm');
    })->middleware([\app\middleware\AuthCheck::class]);

    //-----------------------------
    // 管理端专用接口
    //-----------------------------
    Route::group('admin', function () {
        Route::get('roles', 'Admin/getRoles');
        Route::post('roles/update', 'Admin/updateRolePermissions');
    });

    //-----------------------------
    // 角色管理接口
    //-----------------------------
    Route::get('role/list', 'RoleController/list');

})->middleware([\app\middleware\AuthCheck::class]);

// +----------------------------------------------------------------------
// | 测试接口
// +----------------------------------------------------------------------
Route::get('test/cache', 'Test/cache');

// +----------------------------------------------------------------------
// | 跨域设置（可根据需要调整位置）
// +----------------------------------------------------------------------
Route::group('admin', function () {
    // 可添加需要特殊跨域设置的管理端路由
})->allowCrossDomain();

Route::post('api/upload', 'Upload/upload');

Route::group('schedule', function () {
    Route::post('generate', 'ScheduleController/generateNextWeek'); // 生成排班
    Route::get('list', 'ScheduleController/getList'); // 获取排班列表
    Route::put(':id/max', 'ScheduleController/updateMaxPatients'); // 修改最大预约数
    Route::patch(':id/status', 'ScheduleController/toggleStatus');
})->middleware([\app\middleware\AuthCheck::class]);

// 添加消息相关路由
Route::group('messages', function () {
    Route::post('getConversationId', 'MessageController/getConversationId');   
    Route::get('sessions', 'MessageController/sessions');      // 获取消息记录
    Route::get('history', 'MessageController/history'); // 获取历史消息
    Route::post('send', 'MessageController/send');      // 发送消息
})->middleware([\app\middleware\AuthCheck::class]);

Route::group('reviews', function () {
    Route::post('create', 'ReviewController/create'); // 提交评价
    Route::get('doctor/:id', 'ReviewController/getByDoctor'); // 获取医生评价
})->middleware([\app\middleware\AuthCheck::class]);

Route::post('upload/image', 'Upload/uploadImage');

// 医生专属接口组
Route::group('doctor', function () {
    // 预约管理
    Route::get('appointments', 'AppointmentController/doctorAppointments');
    Route::post('appointments/:id/complete', 'AppointmentController/complete');
    
    // 病例管理接口组
    Route::group('medical', function () { 
        Route::get('list', 'MedicalRecordController/list');
        Route::get(':appointmentId', 'MedicalRecordController/detail'); 
        Route::post('save', 'MedicalRecordController/save'); 
    });
})->middleware([\app\middleware\AuthCheck::class, \app\middleware\DoctorCheck::class]);

Route::group('medical', function () {
    Route::get('records', 'MedicalRecordController/userRecords');
})->middleware([\app\middleware\AuthCheck::class]);
