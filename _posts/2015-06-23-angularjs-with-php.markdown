---
layout: post
title: "AngularJS接收PHP变量数据"
category: others
excerpt: '理想情况下，AngularJS处理的数据都是通过异步请求获取的，但有些情况下，由于开发环境的限制，只允许页面部分使用AngularJS。这类页面中的数据分为两种，一种是用于初始化页面的数据，一种是用于更新页面的数据。其中用于初始化的数据会决定页面初始化时的内容，如果这类数据也用异步请求获取，那么页面在呈现出来的时候可能是空白或错乱的。'
---

理想情况下，AngularJS处理的数据都是通过异步请求获取的，但有些情况下，由于开发环境的限制，只允许页面部分使用AngularJS。这类页面中的数据分为两种，一种是用于初始化页面的数据，一种是用于更新页面的数据。其中用于初始化的数据会决定页面初始化时的内容，如果这类数据也用异步请求获取，那么页面在呈现出来的时候可能是空白或错乱的。

> 注：理想状态指全站使用AngularJS，就算这种情况下，通过异步请求初始化数据也会造成页面在一开始空白或错乱，但我们监测`$rootScope`上的加载完成事件或监测`$routeProvider`的promise状态来判断是否初始化完成，在未完成前可以通过不显示页面或者给出一个loading的画面，来掩盖错乱的页面。但这些措施在局部使用AngularJS时是不太可能有效的，所以下面要讲诉的是妥协于非理想情况的解决方法。

通常这类页面在生成之前，后台就会初始化主要的数据，我们完全可以把这些后台数据利用起来，而不必再去发起异步请求。

以常见的PHP后台为应用场景，PHP生成页面前便会处理用户数据，用户数据中包含了用户权限，用户名，用户关注等等数据，这些数据在页面中也会被用到，比如用来决定用户面板的显隐：

```php
// 假设%%为PHP模板输出语法
// 假设PHP的$member变量存储用户数据

% if !empty($member) %
<ul class="user-panel">
    <li>% $member.username %</li>
    
    % if $member[authority] > 1000 %
    <li>后台管理</li>
    % /if %
    
    <li>退出</li>
</ul>
% /if %
```

假设AngularJS中也用到用户数据，用于处理回复框的可输入状态，如果用户没有权限则不允许输入：

```php
// $scope.memberData此时为undefined
<div class="reply-box">
    <textarea ng-disabled="memberData.authority > 1000"></textarea>
</div>
```

输入框是否可输入由`memberData.authority`决定，但memberData还没有初始化，所以我们先用后台数据初始化memberData。

##ng-init初始化后台数据
通过ng-init指令在行内初始化AngularJS作用域：

```php
<div class="reply-box" ng-init="memberData = % json_encode($member) %">
    <textarea ng-disabled="memberData.authority > 1000"></textarea>
</div>
```

上述调用PHP的json_encode函数将`$member`转换为JSON格式并输出到页面中，页面渲染结束后，AngularJS对该页面进行二次解析，在这过程中将这段JSON数据解析并赋值到$scope.memberData中。

但实际开发中，上面的写法会导致HTML的解析错误，因为JSON数据的格式是：

```javascript
{"username": "lxjwlt", "authority": 9999}
```

JSON中带有双引号，也可能包含HTML语句，所以直接在HTML中打印出这类JSON要注意将引号和HTML特殊符号都进行HEX编码，PHP中的json_encode可以传入第二个参数，用于设置特殊字符的编码方式：

```php
// JSON_HEX_TAG: 将 < 和 > 等符号编码为 \u003C 和 \u003E
// JSON_HEX_APOS: 将单引号转换为 \u0027
// JSON_HEX_QUOT: 将双引号转换为 \u0022

<div class="reply-box" 
     ng-init="memberData = % json_encode($member, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT) %">
    // ...
</div>
```

这种写法有两点不足：
* 写在行内，要考虑引号等特殊符号的编码
* 公共数据不通用，如果页面中多处用到用户数据，那么就要多次初始化用户数据
* 数据初始化遍布页面各个地方，不利于管理

##module.value全局数据存储

在AngularJS中，我们可以通过module.value来定义全局公用数据：

```javascript
// 初始化angular应用
var app = angular.module('myApp', []);

// 全局数据
app.value('myData', {
    key_1: 'value_1',
    key_2: 'value_2'
});
```

利用AngularJS这一特性，我们可以将后台数据存储到AngularJS中的全局变量中：

```php
<body ng-app="myData">
    <script>
    angular.module('myData')
        .value('memberData', % json_encode($member) %);
    </script>

    // ...
</body>
```

PHP模板会执行json_encode将`$member`数据打印到script标签中，而这段JSON数据在script标签中被当作是JS对象来对待，于是在AngularJS对页面的第二次解析时，直接将这段JS对象存入到全局变量memberData中。

于是，在我们在编写myApp模块时，可以在任意的控制器中获取这段全局数据 -- memberData：

```javascript
angular.module('myApp')

    // 依赖注入memberData
    .controller('MyCtrl', function(memberData) {
        
        // 要在作用域中使用memberData，先赋值给$scope
        $scope.memberData = memberData;
        
    });
```

这样我们就能够使用用户数据：

```
<div class="reply-box">
    <textarea ng-disabled="memberData.authority > 1000"></textarea>
</div>
```

通过全局数据的方式，我们不再需要ng-init指令来初始化数据，也不用再考虑特殊符号的编码转换问题，而且这段数据可以全局复用。


##总结
采用以上的方法，在AngularJS内部，我们能够获取任意后台数据，而我们只需花费数据解析的时间，从而节省下异步请求和第二次后台运行逻辑代码的时间。

##参考

* [3 ways to get backend data to AngularJS](http://codeutopia.net/blog/2013/05/27/3-ways-to-get-backend-data-to-angularjs/)






