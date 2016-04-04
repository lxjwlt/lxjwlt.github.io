---
layout: post
title: "angularJS中组件复用和封装"
category: front-end
excerpt: '在angularJS项目开发中遇到使用表格的场景，于是引入了号称angularJS中扩展性最好的表格smart-table组件，代码只有四五百行，功能只提供了渲染、数据项选择、排序等等简单的功能。而我的任务是给表格加入加载状态监控、全选、更多按钮等等功能...'
---

[更好的阅读体验](https://www.zybuluo.com/lxjwlt/note/331587)

在angularJS项目开发中遇到使用表格的场景，于是引入了号称angularJS中扩展性最好的表格smart-table组件，代码只有四五百行，功能只提供了渲染、数据项选择、排序等等简单的功能。而我的任务是给表格加入加载状态监控、全选、更多按钮等等功能，这过程涉及到angularJS组件的复用。

我们都熟悉jQuery组件开发模式，定义组件类，在该组件类的原型链上添加方法，然后在jQuery上绑定相应的入口函数，大致如下：

```javascript
(function ($) {
    function Dropdown (options) { /* ... */ }

    Dropdown.prototype.close = function () {};
    Dropdown.prototype.open = function () {};

    $.fn.dropdown = function (options) {

        // 触发行为
        if (typeof options === 'string') {
            this.data('dropdown')[options]();

        // 实例化
        } else {
            this.data('dropdown', new Dropdown(options));
        }
    };

    $.fn.dropdown.Constructor = Dropdown;
})(jQuery);
```

我们定义了一个下拉框组件，匿名函数中定义组件类Dropdown，而组件的方法都添加到Dropdown类原型链中，接着我们通过jQuery的原型链`$.fn.dropdown`将入口函数暴露出去，入口函数用于处理组件的创建和动作分发，最后通过Constructor属性将构造函数暴露出去。

jQuery插件的复写很简单，直接对类方法进行改写：

```javascript
var proto = $.fn.dropdown.Constructor.prototype;

proto.close = function () {};
```

然而angularJS不像jQuery简单的暴露，angularJS层层封装使得在外部进行复写变得困难。下面通过标签页组件和弹窗组件的例子，分别从控制器，指令和作用域三个层面介绍，如何在**尽可能**不改动源码的前提下进行angularJS组件的复用。

##控制器继承

我们常用控制器来写具体页面的业务逻辑，很少涉及到其中this的使用，这往往让我们忘记，angularJS控制器是一个类。而在angularJS组件开发中，控制器中定义的是了整个组件的核心代码，比如一个简单的标签页组件：

```html
<tab-box>
    <tab name="tabA">标签页A</tab>
    <pane name=tabA>
        标签页A内容
    </pane>
</tab-box>
```

标签页组件包含了tab-box、tab、pane三个指令，分别是标签页容器，标签，标签页内容块，其定义如下：

```javascript
app.directive('tabBox', function () {
    return {
        controllerAs: 'tabBoxCtrl',
        controller: function ($scope) {
            $scope.state = {
                page: null
            };

            this.setPage = function (page) {
                $scope.state = page;
            }
        }
    };
});

app.directive('tab', function () {
    return {
        require: 'tabBox',
        link: function (scope, $elem, attr, ctrl) {
            $elem.on('click', function () {
                ctrl.setPage(attr.name);
            });
        }
    };
});
```

上面的代码所做的事情是：父指令的控制器tabBoxCtrl明确的定义作用域结构，并暴露出一个setPage方法，用于标签页的切换，而tab指令中则使用require指明和父指令之间的依赖关系，link函数的第四个参数中可以拿到tabBoxCtrl的实例，从而在tab指令后续的点击事件中，便可以调用到父指令控制器中的方法setPage

tab-box是标签页的最顶层指令，即父指令，其中定义的控制器tabBoxCtrl统一负责作用域和暴露方法，而tab子指令中则使用父指令暴露出来的方法，而不是直接操作作用域。

以上是angularJS组件开发的简单流程。当我们引入第三方组件，我们希望在原组件的基础上构建一个新的组件，我们只需要保留原组件的核心逻辑。我们可以采用控制器继承的方法，通过$controller服务将指定控制器进行实例化，该指定控制器的行为和状态就能够完美的拷贝下来。

比如我们要修改tab-box组件的行为，我们希望标签页在鼠标悬浮的时候进行标签页切换。我们可以新建另一个指令my-tab-box，直接复用tab-box控制器的主逻辑：

```javascript
app.directive('myTabBox', function () {
    return {
        controller: function ($scope, $controller) {

            // 实例化控制器
            var parent = $controller('tabBoxCtrl', {
                $scope: $scope
            });

            angular.extend(this, parent);

            // 新增方法
            this.myMethod = function () {};
        }
    };
});

app.directive('myTab', function () {
    return {
        require: 'myTabBox',
        link: function (scope, $elem, attr, ctrl) {
            $elem.on('hover', function () {

                // 依旧可以调用setPage方法
                ctrl.setPage(attr.name);

            });
        }
    };
});
```

以上代码我们创建了一个新的组件my-tab-box，在控制器中通过$controller实例化父控制器，并通过angular.extend将父控制器的方法绑定到了当前控制器的上下文中。这过程中，my-tab-box的状态和行为就完全拷贝了tab-box了。正是如此，之后的myTab子指令中，我们可以调用到setPage方法。

这种方式适用于仅复用原组件的主逻辑和方法。除此之外，我们很可能需要直接复用原组件，只修改其中少量功能。

##指令复写

angularJS中，同名指令是可以多次定义，按照定义的先后顺序依次执行。

上述tab-box的复用中，如果仅仅是标签页的点击事件改成了鼠标悬浮事件，我们可以通过指令二次定义的方式，对指令行为进行修改：

```javascript
// 在外部再次定义tab指令
app.directive('tab', function () {
    return {
        require: 'tabBox',
        link: function (scope, $elem, attr, ctrl) {
            $elem
            .off('click')
            .on('hover', function () {
                ctrl.setPage(attr.name);
            });
        }
    };
});
```

在angularJS解析tab指令时，会按照源码中的第一次定义为标签绑定点击事件，接着执行外部复写代码中第二次定义，为标签解除点击事件绑定，并绑定鼠标悬浮事件。

多次定义指令的方式还可以直接改写控制器。

在控制器继承的介绍中，我们提到了使用$controller对tab-box标签页组件的逻辑进行复用，重新开发一个新的组件，但如果我们希望直接修改tab-box的行为，而不是重新开发一个新的组件，那么我们可以通过指令来对控制器进行修改。比如tab-box指令新增一个方法：

```javascript
app.directive('tabBox', function () {
    return {
        require: '^tabBox',
        link: function (scope, $elem, attr, ctrl) {

            // 新增方法
            ctrl.newMethod = function () {};

        }
    };
});
```

以上，我们在外部代码中对tabBox进行再次声明，通过`require:'^tabBox'`，让tabBox依赖于其本身，从而我们就可以拿到tabBox本身的控制器实例（link函数的第四个参数），之后，我们就可以在这个实例上进行功能扩展或者功能改写了。

##封装

组件开发还有种情况是，我们只需要对组件进行封装，而不需要改写组件的行为，比如我们页面使用统一界面的趋势图，我们只需对highcharts提供统一的参数，这些代码封装成一个trendChart组件，每次调用只需要传入相应的数据`trendChart.update(data)`，而不需要在业务代码中重复编写相关公共的配置项。

在angularJS项目开发中，引入了angular-bootstrap库提供的弹窗组件，其调用方式是：

```javascript
app.controller('myCtrl', function ($scope, $uibModal) {
    $uibModal.open({
        templateUrl: 'myWindow.html',
        scope: $scope
    });
});
```

由于项目中弹窗分成头部、主体、底部三个部分，弹窗的模版需要进行统一的改写，我们可以新建一个服务myModal对$uibModal进一步封装：

```javascript
app.factory('myModal', function ($uibModal) {
    return {
        open: function (options) {
            var scope = options.scope;

            // 错误的将自定义数据绑定到了原作用域上
            scope.newData = {};

            // 错误的将自定义操作绑定到了原作用域上
            scope.newMethod = function () {};

            $uibModal.open(options);
        }
    };
});
```

由于我们需要改动模版，其中又有新增的逻辑代码，这处理过程中自定义操作和自定义数据都需要保存到作用域下，就想上述代码中，自定义数据和操作都绑定到了`options.scope`中，然而`options.scope`是外层的作用域（控制器中存放业务逻辑的作用域），组件的数据就污染了当前存放业务逻辑的作用域，特别是触发多层弹窗组件时，数据就会互相污染。所以我们希望每个弹窗都有自己的作用域，而且弹窗的作用域继承于原作用域。所以我们应该使用原作用域创建一个子作用域：

```javascript
app.factory('myModal', function ($uibModal) {
    return {
        open: function (options) {

            // 创建子作用域
            var scope = options.scope.$new();

            // 在子作用域中存储数据和操作
            scope.newData = {};

            scope.newMethod = function () {};

            options.scope = scope;

            $uibModal.open(options);
        }
    };
});
```

通过`$new`方法，我们能创建一个继承原作用域的子作用域，现在我们自定义的数据和方法都存储到了子作用域中，而没有污染到原作用域。

梳理一下封装的过程：控制器在调用弹窗时，控制器的作用域传给了myModal中，myModal服务使用该作用域生成了一个子作用域，而子作用域会传给`$uibModal`组件，`$uibModal`拿到子作用域后，再生成一个子作用域，所以这里面一共有三个作用域，他们的关系是：控制台作用域->myModal存储数据作用域->`$uibModal`作用域。

在angularJS中，作用域的继承是通过原型链来实现的，我们要注意到的是，myModal自定义作用域是作为中间层出现的，如果其中某些数据项覆盖了顶层作用域，那么作为最底层作用域的`$uibModal`弹窗，其内部对应的数据就无法访问到顶层作用域。所以我们在涉及到作用域继承的封装时，用来存储中间操作和状态的作用域，其名下开辟的存储空间一定是越少越好，而且名称也是越特殊越好，下面是相应的改写:

```javascript
app.factory('myModal', function ($uibModal) {
    return {
        open: function (options) {
            var scope = options.scope.$new();

            // 取用特殊名称，避免覆盖父作用域
            scope._modalData_ = {};

            // 不要开辟太多存储空间，通常方法、状态、数据各一个足矣
            scope._modalMethod_ = {
                newMethod: function () {}
            };

            options.scope = scope;

            $uibModal.open(options);
        }
    };
});
```