<?php
namespace app\service;

use think\facade\Db;

class ScheduleOptimizer {
    // 遗传算法参数
    private $populationSize = 50;
    private $mutationRate = 0.1;
    private $maxGenerations = 100;

    public function generateSchedule($departmentId, $startDate, $endDate) {
        // 1. 获取必要数据
        $doctors = Db::name('doctor')
            ->where('department_id', $departmentId)
            ->field('id, service_count, satisfaction')
            ->select();
            
        $appointments = Db::name('appointment')
            ->where('department_id', $departmentId)
            ->whereBetweenTime('appointment_time', $startDate, $endDate)
            ->field('appointment_time, status')
            ->select();

        // 2. 初始化种群
        $population = $this->initializePopulation($doctors, $startDate, $endDate);
        
        // 3. 进化循环
        for ($i = 0; $i < $this->maxGenerations; $i++) {
            $population = $this->evolvePopulation($population, $appointments);
        }

        // 4. 选择最优解
        $bestSchedule = $this->selectBestSchedule($population);
        
        return $this->formatSchedule($bestSchedule);
    }

    private function initializePopulation($doctors, $startDate, $endDate) {
        // 实现初始化逻辑（示例）
        $population = [];
        $dateRange = $this->generateDateRange($startDate, $endDate);
        
        for ($i = 0; $i < $this->populationSize; $i++) {
            $schedule = [];
            foreach ($dateRange as $date) {
                $schedule[$date] = $this->randomAssignDoctors($doctors);
            }
            $population[] = $schedule;
        }
        return $population;
    }

    private function evolvePopulation($population, $appointments) {
        // 实现进化逻辑（示例）
        $newPopulation = [];
        
        foreach ($population as $schedule) {
            // 选择
            if (mt_rand(0, 100) < 50) continue;
            
            // 交叉
            $child = $this->crossover($schedule, $population[array_rand($population)]);
            
            // 变异
            $newPopulation[] = $this->mutate($child);
        }
        
        return $newPopulation;
    }

    private function calculateFitness($schedule, $appointments) {
        // 实现适应度计算（核心逻辑）
        $score = 0;
        
        // 1. 医生工作均衡度
        $workload = [];
        foreach ($schedule as $dailySchedule) {
            foreach ($dailySchedule as $doctorId => $slots) {
                $workload[$doctorId] = ($workload[$doctorId] ?? 0) + count($slots);
            }
        }
        $score += 1 / (max($workload) - min($workload) + 1);

        // 2. 预约需求匹配度
        foreach ($appointments as $appt) {
            if ($appt['status'] == 4) continue; // 跳过取消的预约
            $date = date('Y-m-d', strtotime($appt['appointment_time']));
            $time = date('H:i', strtotime($appt['appointment_time']));
            
            if (isset($schedule[$date])) {
                foreach ($schedule[$date] as $doctorSchedule) {
                    if (in_array($time, $doctorSchedule)) {
                        $score += 1;
                        break;
                    }
                }
            }
        }

        return $score;
    }

    // 其他辅助方法...
}