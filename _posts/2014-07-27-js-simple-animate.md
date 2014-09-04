---
layout: post
title: "JS实现简易animate动画"
category: front-end
excerpt: '本文主要介绍的是如何实现类似jQuery.fn.animate的动画效果'
---


<iframe width="100%" height="300" src="http://jsfiddle.net/lxjwlt/S6Fzs/embedded/result,js/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

参照jquery animate，我简单地实现了animate动画效果，下面为大家介绍其中基本原理。

##单步动画
**单步动画**是相对**多步动画**而言的，单步动画是指物体的多个动画同步执行，而多步动画是指物体的多个动画是按照步骤执行的。由于多步动画是基于单步动画实现的，所以本文主要介绍单步动画。

###缓动函数
我们都知道，动画是有一帧一帧画面构成的，每一帧的画面都记录着物体在动画中某时刻下的状态。为了绘制出每一帧画面，我们需要用到缓动函数。

缓动函数是决定物体状态变化方式的一种函数，只要我们给出四个数值：已过时间、初始状态、改变量、持续时间，缓动函数就能帮助我们计算出这一帧画面下物体的状态。比如`easeInQuad`缓动函数：

```javascript
// t: 已过时间，已过时间 = 当前时间 - 动画开始时间，范围是[0-d]
// b: 初始状态
// c: 改变量，改变量 = 最终状态 - 初始状态
// d: 动画持续时间
var easeInQuad = function(t, b, c, d) {
    return c*(t/=d)*t + b;
};
```

现在假设页面中有个矩形，它的动画是：在1000毫秒内从`left:100px`变为`left:300px`，我们可以计算出500毫秒时矩形的`left`属性值：

```javascript
/*
    已过时间 t = 500
    初始状态 b = 100
    改变量   c = 300 - 100 = 200
    持续时间 d = 1000
*/

easeInQuad(500, 100, 200, 1000); // <-- 150
```

该缓动函数返回150，由此我们知道：在动画开始500毫秒后，矩形的`left`属性值**应该**为150px。

缓动函数有很多种，相同动画下不同缓动函数绘制出来的每一帧画面都各不相同。就上述矩形而言，在不同缓动函数下，矩形的移动可能是匀速的，可能是先慢后快，也可能是其他效果。所幸的是，这些缓动函数都已经写好了，我们可以参考：[jQuery.easing](http://gsgd.co.uk/sandbox/jquery/easing/)。

由于下面会用到，所以我们先将这些缓动函数稍微改改，并添加到代码中：

```javascript
var easing = {
    def: 'easeOutQuad',
    swing: function (t, b, c, d) {
        return easing[easing.def](t, b, c, d);
    },
    
    // ...
    
};
```

###绘制
对于网页来说，要绘制动画，就要获取和改变元素的样式，所以我们可以实现一个类似于`jQuery.fn.css`的函数：

```javascript
var css = function(elem, obj) {
    if (arguments.length === 3) {
        elem.style[arguments[1]] = arguments[2];
    } else {
        return getComputedStyle(elem, null)[obj];
    }
};

// 获取样式
css(elem, 'left');

// 改变样式
css(elem, 'left', 100);
```

我们都知道，动画的流畅程度与每秒的帧数有关，那么，对于动画来说，每秒多少帧才能达到画面流畅？

其实玩过游戏的同学都知道，如果游戏运行能达到60帧，则游戏画面是流畅的，而低于60帧的画面会让我们就觉得卡顿，所以同样，我们绘制动画只要达到每秒60帧就足够了。

结合缓动函数，我们用`setInterval`以每秒60帧来绘制动画，我们先写出代码形式：

```javascript
// 每秒60帧意味着每16.6666毫秒就要绘制一帧动画
setInterval(function() {
    var val = easeInQuad(t, b, c, d);
    css(elem, 'left', val)
}, 16);
```

###动画池
刚刚开始学js的时候，我们也许都试过为每一个执行动画的元素新建一个`setInterval`。但是，想想看，如果有100个元素要执行动画，就有100个`setInterval`在运行，这是非常影响性能的。

实际上，`setInterval`的作用不过是绘制每一帧的动画，所以我们可以将所有动画集中起来，统一用一个`setInterval`来处理。

所以，我们设想是这样的：创建一个动画池，将待执行动画都扔到这个池子中，然后用一个`setInterval`统一绘制。

我们先创建一个动画池：

```javascript
var pool = [];
```

接下来，我们准备一个函数`animation`，负责获取绘制动画所需要的所有信息，并将这些信息打包成一个对象扔到动画池中，并开启动画绘制函数。（注意，为了计算已过时间，我们还需要记录下动画开始时间）：

```javascript
/*
    elem: 元素
    attr: 要改变的样式属性，形式如：{'left': 100, top: 300}
    duration: 动画持续时间，默认400
    type: 缓动函数类型，默认为swing
*/
var animation = function(elem, attr, duration, type) {
    var beginVal, prop;

    // 记录所需信息
    for (prop in attr) {
        beginVal = parseInt(css(elem, prop));
        pool.push({
            elem: elem,
            propName: prop, // 样式属性名
            beginVal: beginVal, // 初始状态
            changeVal: attr[prop] - beginVal, // 改变量
            bTime: new Date().getTime(), // 动画开始时间
            duration: duration || 400, // 动画持续时间
            type: type || 'swing' // 缓动函数类型
        });
    }

    // 开启动画绘制
    run(pool, easing);
};
```

当我们将所有信息都打包扔到动画池后，我们开启动画绘制，下面介绍如何扫描动画池并绘制动画

###扫描动画池并绘制动画
一旦动画池中装载了待绘制的动画，我们需要用一个函数不断地扫描动画池中的各个动画，并统一绘制这些动画。我们准备一个`run`函数来负责这部分工作：

```javascript
var run = function(pool, easing) {
    var timeId = setInterval(function() {
        // ...
    }, 16);
};
```

为了避免`run`函数创建多个`setInterval`，我们要采取一定的措施：如果有`setInterval`正在处理动画池，则此时动画池的状态为`running`，`run`函数不执行：

```javascript
var run = function(pool, easing) {
    // 如果动画池正在被处理 或 为空，则不执行
    if (pool[0] === 'running' || !pool.length) return;
    
    // 在处理动画池之前，先为动画池加上状态标识
    pool.unshift('running');
    
    var timeId = setInterval(function() {
        // ...
    }, 16);
};
```

有了以上保证，下面我们可以安心处理动画池内的动画了：

```javascript
var run = function(pool, easing) {
    // ...

    var timeId = setInterval(function() {
        var obj, val, i, t, b, c, d;

        // 扫描动画池 并 绘制动画
        for(i = pool.length - 1; i > 0; i--) {
            obj = pool[i];
            
            t = new Date().getTime() - obj['bTime'];
            b = obj['beginVal'];
            c = obj['changeVal'];
            d = obj['duration'];
            type = obj['type'];

            // 计算状态
            // 超过时间，则表示动画完成，从动画池中剔除该动画
            if (t >= d) {
                val = b + c;
                pool.splice(i, 1);
            } else {
                val = easing[type](t, b, c, d); 
            }

            // 改变状态
            css(obj['elem'], obj['propName'], val);
        }

        // 如果动画池只剩下‘running’标识，即动画池为空
        // 则删除Interval和状态标志
        if (pool.length === 1) {
            clearInterval(timeId);
            pool.pop();
        }

    }, 16);
};
```

###实际效果
假设我们有如下代码：

```javascript
animation(block, {
    'left': '200px'
}, 800, 'easeOutBounce');
animation(block, {
    'top': '100px'
}, 800, 'easeOutBounce');
```

效果为：

<iframe width="100%" height="300" src="http://jsfiddle.net/lxjwlt/S6Fzs/5/embedded/result,js/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

以上矩形有两个动画，一个是向右移动，一个是向下移动，这两个动画是同时执行的，这是因为**animation**函数负责单步动画，无法让动画按步骤执行的。

##多步动画
多步动画的实现需要结合上述的单步动画和队列。其原理在于：多步动画有多个步骤，每个步骤就是一个单步动画，分别将这些单步动画包装成独立的函数并压入队列中，在绘制多步动画的过程中，每次从队列中拿出一个单步动画来执行，只有当**前一个**单步动画执行完，才去处理队列中的**下一个**动画，这样每个单步动画之间就有了先后的关系。代码形式如下：

```javascript
var animate = function(elem, attr, duration, type) {

    // 将单步动画包装成一个独立的函数
    var fnc = animation.bind(window, elem, attr, duration, type);
    
    // 压入队列
    queue(elem, fnc);
};
```

（由于多步动画涉及数据存储以及queue队列的实现，介绍起来会比较繁琐，所以点到为止，想了解的同学可以看看下面的详细代码）

###实际效果

结合队列的操作，动画终于能够按步骤执行了：

```javascript
// 同一个animate下的动画同步执行，不同animate下的动画按先后顺序执行
animate(block, {
    'left': '200px',
    'opacity': 0.5
}, 800, 'easeOutBounce');
animate(block, {
    'top': '100px',
    'opacity': 1
}, 800, 'easeOutBounce');
```

效果如下：
<iframe width="100%" height="300" src="http://jsfiddle.net/lxjwlt/S6Fzs/7/embedded/result,js/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>


##参考

* [jquery.easing plugin](http://gsgd.co.uk/sandbox/jquery/easing/)
* [JavaScript Tween算法及缓动效果](http://www.cnblogs.com/cloudgamer/archive/2009/01/06/1369979.html)