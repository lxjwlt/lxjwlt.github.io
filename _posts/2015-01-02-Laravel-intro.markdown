---
layout: post
title: "Laravel简介"
category: back-end
excerpt: 'Laravel是一款基于MVC设计模式的PHP框架，提供了一系列便捷的API接口，包括数据库、路由、表单验证等等，使PHP开发更为快速和优雅'
---

[开启更好的阅读模式](https://www.zybuluo.com/lxjwlt/note/57678)

Laravel是一款基于MVC设计模式的PHP框架，提供了一系列便捷的API接口，包括数据库、路由、表单验证等等，使PHP开发更为快速和优雅，一言以蔽：

> Laravel为WEB艺术家而生！

##安装
先保证你已经安装好了PHP，接下来，你可以直接参考官网的[安装教程](http://v4.golaravel.com/docs/4.2/installation)进行安装。

如果遇到网络问题，上述安装教程无法成功安装，你也可以先下载PHP包管理工具[composer.phar](http://pan.baidu.com/s/1kTsXDo7)，用PHP命令行运行安装：

    php composer.phar
    
安装成功后，设置composer的环境变量，以便全局命令行调用，windows下的路径应该是：`~\AppData\Roaming\Composer\vendor\bin;`

最后通过composer下载Laravel所有依赖文件，运行：

    composer create-project laravel/your_project_name --prefer-dist

等待所有文件下载成功，我们能看到项目文件夹中已经有了app、public等等文件夹，主要文件都放置在`app/`文件夹下，下面会介绍到。

##路由
路由的设置都写在`app/routers.php`中，路由有两种，基于get请求和基于post请求的：

```php
Route::get('welcome', function() { return 'hello world by GET'; });
Route::post('welcome', function() { return 'hello world by POST'; });
```

当然，我们也能实现支持所有请求动作的路由，无论GET还是POST：

```php
Route::any('welcome', function() { return 'hello world'; });
```

现在，我们访问`/welcome`时，页面会显示"hello world"。

###路由命名
当路由名过长，而我们又需要频繁地获取它的路径时，我们可以为路由命名：

```php
Route::get('lxjwlt_home_page', array('as' => 'home', function() { 
    return 'welcome to my home';
}));
```

只有为路由命名后，我们**才能够**通过以下方式获取路由路径：

```php
Route::to('home');
```

##视图
视图(view)提供表现层，单纯地提供界面效果，以便使视图代码和逻辑代码分离。

视图文件均放置在`app/views`内，视图代码以HTML的形式呈现，但与HTML不同的是，我们可以通过`{{ }}`插入PHP语句：

```html
<!-- IN app/views/demo.blade.php -->
<html>
    <head></head>
    <body>
        <h1>{{'1+1='.(1 + 1)}}</h1>
        <b>{{$keyword or 'default value'}}</b>
    </body>
</html>
```

我们可以通过路由请求可以返回该视图：

```php
Route::get('/', function() {
    return View::make('demo');
});
```

###blade模板
为了页面重复代码，我们通常会提取出页面中公共的部分，比如`<header><footer>`以及一些外部资源的引用，再针对不同页面进行相应的组合。

Laravel提供Blade模块引擎，方便我们实现模板继承和模板片段，要注意的是，所有这些模板都**必须**以`.blade.php`结尾。

下面我们来实现一个页面layout模板，该模板会被应用到所有页面中：

```php
<!-- IN app/views/layout.blade.php -->
<html>
    <body>
        @yield('content', 'Default content!')
    </body>
</html>
```

上述代码中，`@yield`用于声明一个位置，用于插入内容。第一个参数是ID，第二个参数是默认内容，当该content位置为插入内容，则显示默认内容。

接下来我们要实现home页面，该页面继承layout模板：

```php
<!-- IN app/views/home.blade.php -->
@extends('layout')

@section('content')
<h1>welcome to lxjwlt's home</h1>
@stop
```

home页面继承layout模板，继承要用到关键字`@extends`。而`@section`则是用来定义`content`位置的内容。最终Blade引擎会将home页面渲染成：

```html
<html>
    <body>
        <h1>welcome to lxjwlt's home</h1>
    </body>
</html>
```

能插入内容还不够，我们还需要满足以下条件：

* 可引用公共资源，但可覆盖公共资源
* 可引用特有资源

下面我们就以*home页面引用样式文件*为例：

```php
<!-- IN app/views/layout.blade.php -->
<html>
    <head>
        @section('CSS')
        <link rel="stylesheet" href="common.css" />
        @show
    </head>
    <body>
        @yield('content', 'Default content!')
    </body>
</html>
```

我们在layout模板上引用了common.css，用`@section`和`@show`括起来。注意是`@show`而不是`@stop`。

现在，我们可以在home页面直接覆盖掉公共样式：

```html
@section('CSS')
<link rel="stylesheet" href="home.css" />
@stop
```

这样，home页面就只会引用home.css，而不会引用common.css。

当然，我们也可以采用以下写法，在不覆盖掉公共样式的同时，引用其他样式：

```html
@section('CSS')
@parent
<link rel="stylesheet" href="home.css" />
@stop
```

`@parent`关键词会保留父模板中事先定义好的内容。上述代码会生成：

```html
<link rel="stylesheet" href="common.css" />
<link rel="stylesheet" href="home.css" />
```

##控制器
在Laravel中，我们能够在路由代码中处理数据，并插入到视图中，但我们不应该这么做，而是应该用到控制器，用控制器统一处理后台逻辑，比如登录注销，表单验证等等。

Laravel的控制器代码统一放在`app/controllers`文件夹下，所有控制器都必须继承`BaseController`。下面我们实现一个HomeController控制器：

```php
class HomeController extends BaseController {
    public function welcome() {
        $user = array('name' => 'lxjwlt', 'age' => '22');
        return View::make('home', array('user' => $user)); // 传入数据
    }
}
```

该控制器中有个welcome方法，该方法会返回一个视图。下面，我们将路由和该控制器的welcome动作绑定起来：

```php
Route::get('home', 'HomeController@welcome');
```

现在，当我们访问`/home`时，home页面视图将显示出来。

##模型
数据库中的每个表都对应一个模型，模型中定义一系列API接口，以便获取对应表中的数据。

Laravel中模型放在`app/modules`文件夹下，每个模型都必须继承`Eloquent`类。我们来实现`users`表的模型：

```php
class User extends Eloquent {
    static public function fetch_by_username($username) {
        // ...
    }
}
```

我们定义了一个通过用户名来获取用户数据的方法，在任何地方我们都可以这样使用：

```php
User::fetch_by_username('lxjwlt');
```

##数据迁移及数据填充
Laravel的数据迁移和填充系统可以重新创建数据库，方便数据库初始化。

可以想象一下，我们将项目文件夹复制到另一台主机上，该主机上没有项目的数据库，但我们只需要运行一条命令，整个数据库就能够重新创建出来，而且初始化数据也已经填充完成，这回非常的方便。

我们先创建一个迁移：

    php artisan migrate:make create_users_table
    
所有的迁移都被存放在`app/database/migrations`文件夹下。该文件夹会自动生成`CreateUsersTable`类，其中包含了两个方法，up方法用于创建表，down方法用于删除表。

我们需要一张users表，可以这样写：

```php
class CreateUsersTable extends Migration {
    public function up() {
        Schema::create('users', function($table)
        {
            $table->increments('id'); // 自增
            $table->string('email')->unique();
            $table->string('password');
            $table->string('name')->unique();
            $table->timestamps(); // Laravel自带时间戳
        });
    }
    
    public function down() {
        Schema::drop('users');
    }
}
```

有了迁移文件，我们可以运行以下命令，初始化数据库：

    php artisan migrate
    
数据库初始化后，我们可能会需要事先插入一些数据，Laravel也提供了数据填充功能，设置文件统一放在`app/database/seeds`文件夹下。一个表对应一个文件，比如我们要为users表填充数据：

```php
class UsersTableSeeder extends Seeder {
    public function run()
    {
        DB::table('users')->delete();
        Users::create(array('name' => 'root', 'password' => '123'));
        Users::create(array('name' => 'lxjwlt', 'password' => '123'));
        Users::create(array('name' => 'john', 'password' => '123'));
    }
}
```

在填充数据前，我们要告诉Laravel，该user表的存在，所以我们要在DatabaseSeeder类声明：

```php
class DatabaseSeeder extends Seeder {
    public function run()
    {
        Eloquent::unguard();

        $this->call('UsersTableSeeder');
    }
}
```

现在，我们可以执行以下命令填充数据：

    php artisan db:seed
    
我们也可以同时执行数据迁移和数据填充：

    php artisan migrate:refresh --seed

##资源文件引用
资源文件，比如JS脚本，CSS样式文件，图片资源等等，建议放在`public`文件夹下，这样，我们就可以用Laravel提供的`url`函数来获取资源的路径：

```html
<link href=" @{{url('common.css')}} " rel="stylesheet" />
```

##参考
更多Laravel的使用方法，请参考[Laravel 手册](http://v4.golaravel.com/docs/4.2)