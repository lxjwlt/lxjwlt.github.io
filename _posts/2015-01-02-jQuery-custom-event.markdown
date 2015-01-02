---
layout: post
title: "jQuery自定义事件"
category: front-end
excerpt: '本文会简要的介绍一下jQuery自定义事件的使用场景'
---

[更好的阅读模式](https://www.zybuluo.com/lxjwlt/note/58483)

> 我：之前研究过jQuery的事件绑定
> 
> 面试官：不是有addEventListener吗？
> 
> 我： ......

之前看过jQuery的事件绑定的源代码，惊叹是何等神人能想出这样实现方法，jQuery.on事件绑定不是原生`addEventListener`可以代替的，它解决了以下问题：

* 兼容性地实现了`addEventListener`的全部功能，包括多事件绑定，事件函数按绑定顺序执行
* 动态事件绑定，这不是`addEventListener`内部简单判断一下`event.target`就能够实现的
* 自定义事件，自定义事件还能冒泡
* 事件函数分组，方便事件函数解绑

如果再有人反着白眼问我，不是有`addEventListener`吗？我只想说，jQuery团队在事件绑定上编写的几百行代码可不是白写的。

本文会简要的介绍一下jQuery自定义事件的使用场景。

##事件绑定
我们为`document`绑定两个click事件：

```javascript
$(document).on('click', function handler_1() {});
$(document).on('click', function handler_2() {});
```

我们想一下，jQuery内部是用下面这种形式实现么？

```javascript
document.addEventListener('click', function handler_1() {});
document.addEventListener('click', function handler_2() {});
```

是也不是，因为元素的事件绑定肯定是要用到`addEventListener`的，但在jQuery内部实现中，每个元素对应的每个事件，只会调用一次`addEventListener`，用来触发*事件分派函数*

```javascript
document.addEventListener('click', function() {
    // 筛选并调用符合条件的事件函数
});
```

handler_1，handler_2两个事件函数去哪了？实际上，jQuery是利用`jquery.data`函数将这两个函数存在`document`专属的存储空间里，当触发了click事件的同时也触发了事件分派函数，该函数会遍历`document`专属的存储空间，根据一系列的条件筛选事件函数，这些条件包括子选择符，事件组名等等，最后将筛选出来的函数一一执行。

##自定义事件
由于jQuery这种实现事件绑定的机制，自定义事件变得非常简单。

```javascript
$(document).on('smile', function () {});
```

上述代码，`document`元素绑定了一个自定义事件smile，我们可以用trigger或triggerHandler来触发这个事件：

```javascript
$(document).trigger('smile');
$(document).triggerHandler('smile');
```

trigger和triggerHandler的区别在于，trigger方法触发的事件会顺着DOM树向上冒泡，而triggerHandler方法只是调用该元素上对应的事件函数，不会冒泡。

自定义事件一般用于给元素绑定一系列的**动作**，比如，我们要实现弹框效果，我们需要一个掩层和若干窗体。

```html
<div id="overlay">
    <div class="window window--login"></div>
    <div class="window window--register"></div>
    ...
</div>
```

弹框需要两个动作： 关闭窗体和打开窗体。考虑到窗体可能动态增加，我们用到了动态事件绑定(动态绑定的原理在于，子元素触发的事件总会**冒泡到父元素上**，所以我们只需要把事件函数绑定在父元素上)

```javascript
$('#overlay').on('close', '.window', function() {});
$('#overlay').on('open', '.window', function() {});
```

由于动态绑定依赖冒泡来触发事件函数，所以当我们 **只能使用** trigger，来触发动态绑定的事件。比如我们要打开登录窗口：

```javascript
$('.window--login').tigger('open');
```

通过自定义事件，我们将DOM元素和其DOM操作一一对应起来。

##事件返回值
如果某些情况下，我们需要知道事件函数的返回值，我们可以用`jQuery.Event`生成一个event对象，用这个对象来触发事件函数，事件函数的返回值将保存在event对象的result属性中，这样，我们就能够获取事件函数的返回值了：

```javascript
$(document).on('customEvent', function() { return 'hello world!'; });

var event = $.Event('customEvent');
$(document).trigger(event);

event.result; // 'hello world'
```



##参考
- [jquery custom events](http://blog.socialcast.com/jquery-custom-events/)
- [jQuery API - trigger](http://jqapi.com/#p=trigger)



