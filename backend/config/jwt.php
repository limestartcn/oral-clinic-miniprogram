<?php
return [
    'secret' => 'your_strong_secret_key_here', // 确保与生成Token时一致
    'algo'   => 'HS256', // 必须与生成Token的算法一致
    'expire'      => 7200
];