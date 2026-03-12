<?php
return [
    'default' => 'public',
    'disks' => [
        'public' => [
            'type' => 'local',
            'root' => app()->getRootPath() . 'public/uploads',
            'url' => '/uploads',
            'visibility' => 'public',
        ]
    ]
];