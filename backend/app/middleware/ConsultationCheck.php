<?php
// backend/app/middleware/ConsultationCheck.php
namespace app\middleware;

use app\model\Consultation;
use think\Request;

class ConsultationCheck
{
    public function handle(Request $request, \Closure $next)
    {
        $user = $request->user;
        $consultationId = $request->param('id');
        
        $consultation = Consultation::where('id', $consultationId)
            ->where(function($query) use ($user) {
                $query->where('patient_id', $user->id)
                      ->orWhere('doctor_id', $user->doctor->id);
            })->find();
            
        if (!$consultation) {
            return json(['code' => 403, 'msg' => '无权限访问该会话']);
        }
        
        return $next($request);
    }
}