<?php
namespace app\command;

use think\console\Command;
use think\console\Input;
use think\console\Output;
use app\controller\ScheduleController;

class AutoSchedule extends Command
{
    protected function configure()
    {
        $this->setName('autoschedule')->setDescription('自动生成下周排班');
    }

    protected function execute(Input $input, Output $output)
    {
        $controller = new ScheduleController();
        $result = $controller->generateNextWeek();
        
        $output->writeln($result->getData()['msg']);
    }
}