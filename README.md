口腔诊所运营小程序
项目简介
本项目是为中小型口腔诊所量身打造的数字化运营平台，由患者微信小程序端与诊所后台管理系统组成。系统旨在通过移动互联网技术优化诊所业务流程，解决传统诊所信息分散、服务效率低、医患互动不足等痛点，实现预约挂号、电子病历管理、医生排班、数据统计等核心功能的线上化与智能化。

项目基于前后端分离架构设计，前端采用微信小程序（UniApp）与 Vue3 + Element Plus 后台管理界面，后端使用 ThinkPHP 8 框架，数据库采用 MySQL，并通过 RBAC 权限模型与 JWT 技术保障数据安全。系统已通过完整功能测试与性能验证，为口腔诊所的轻量化数字化转型提供了可行方案。

功能特点
患者微信小程序端
在线预约：选择科室、医生及可预约时段，支持在线支付定金或到院支付，预约状态实时更新。

医生信息展示：查看医生资质、擅长领域、患者评分及排班信息。

电子病历查询：历史就诊记录、检查影像、医嘱等结构化存储，方便患者随时查阅。

医患沟通：通过内置即时通讯模块与医生进行图文咨询，支持消息推送。

个人中心：管理个人信息、查看预约记录、取消/改签预约、提交评价等。

诊所后台管理系统
仪表盘：实时展示今日预约量、待确认订单、总收入等核心指标，提供预约趋势图表。

预约管理：处理患者预约请求，支持确认、改期、取消操作，并可查看预约详情。

排班管理：基于可视化日历配置医生排班，支持按周循环生成、临时调班、预约上限设置。

医生管理：维护医生档案（职称、擅长领域、头像等），关联系统账号。

科室管理：配置科室名称、描述、图标等。

用户管理：管理患者与员工账号，支持角色分配（患者、医生、管理员）。

数据统计：多维度分析就诊量、收入、医生接诊效率，支持报表导出。

权限控制：基于 RBAC 模型实现角色与权限的精细化管理，操作日志可追溯。

技术栈
层次	技术选型
前端（患者端）	微信小程序 + UniApp
前端（管理后台）	Vue 3 + Element Plus + Pinia + Axios
后端	ThinkPHP 8 + JWT + RBAC
数据库	MySQL 8.0 + Redis（缓存可选）
开发工具	Visual Studio Code、微信开发者工具、PHPStorm
服务器	Nginx / Apache（推荐 Nginx）
系统架构
系统采用前后端分离的微服务架构：

患者端小程序通过 HTTPS 调用后端 RESTful API。

后台管理界面通过 Vue 路由与后端接口交互。

后端基于 ThinkPHP 8 的 MVC 模式，通过模型层操作 MySQL 数据库，并利用中间件实现 JWT 鉴权与 RBAC 权限控制。

数据可视化使用 ECharts 在前端渲染，后端提供聚合数据接口。

安装与部署
环境要求
服务器：Linux / Windows，建议使用 Linux（CentOS 7+ 或 Ubuntu 20+）

Web 服务器：Nginx（推荐）或 Apache

PHP：7.4 ～ 8.1（需安装 PDO、OpenSSL、Curl 等扩展）

MySQL：5.7 或 8.0

Node.js：14+（仅用于前端构建）

微信开发者工具：用于预览和调试小程序

部署步骤
1. 后端部署
克隆项目代码到服务器：

bash
git clone https://github.com/your-repo/dental-clinic-miniprogram.git
cd dental-clinic-miniprogram/backend
安装 PHP 依赖：

bash
composer install
复制环境配置并修改：

bash
cp .env.example .env
在 .env 中配置数据库连接、JWT 密钥、微信小程序 AppID 和 AppSecret 等。

导入数据库：

使用 MySQL 创建数据库（例如 dental_clinic）。

导入项目根目录下的 database.sql 文件。

设置运行目录为 public，并配置 Nginx 指向 public 文件夹：

nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/backend/public;
    index index.php;
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
测试接口是否正常（例如访问 http://your-domain.com/api/user 应返回 JSON 数据）。

2. 微信小程序端部署
使用微信开发者工具打开项目目录下的 miniprogram 文件夹。

修改 config.js 或相关配置文件，将 baseUrl 指向后端服务器地址。

在微信公众平台注册小程序，获取 AppID，填入项目。

在开发者工具中预览或上传体验版。

3. 后台管理系统部署
进入 admin 目录：

bash
cd ../admin
安装依赖：

bash
npm install
修改 .env 或 .env.production 中的 VUE_APP_BASE_API 为后端 API 地址。

构建生产环境代码：

bash
npm run build
将 dist 目录下的文件部署至 Web 服务器（可与后端共用同一域或跨域配置）。

使用说明
患者端：通过微信搜索小程序名称或扫描二维码进入，授权登录后即可使用预约、查询等功能。

后台管理：访问管理后台网址，使用管理员账号（初始账号：admin，密码请查看安装说明）登录，即可进行排班、预约处理等操作。

项目结构简要
text
dental-clinic-miniprogram/
├── backend/                # ThinkPHP 后端代码
│   ├── app/                # 应用目录（控制器、模型、中间件等）
│   ├── config/             # 配置文件
│   ├── route/              # 路由定义
│   ├── database/           # 数据迁移/种子
│   └── public/             # 入口文件
├── miniprogram/            # 微信小程序前端代码（UniApp）
│   ├── pages/              # 页面文件
│   ├── components/         # 公共组件
│   ├── utils/              # 工具函数
│   └── App.vue / main.js   # 入口文件
├── admin/                  # 后台管理系统前端（Vue3）
│   ├── src/
│   ├── public/
│   └── package.json
└── docs/                   # 文档（含论文、设计图等）
