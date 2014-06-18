---
layout: post
title: "实现javascript模块加载"
category: front-end
excerpt: '听朋友说，阿里爸爸有一道这样的面试题：有两个模块A和B，要求加载完A才加载B，说说你的想法。我第一个想法'
---
 
> 面试官：说说null和undefined的区别
> 
> 我心想：null即空，额，空即是色，色即是空，皇后大道东又皇后大……吗旦，我在想什么


听朋友说，阿里爸爸有一道这样的面试题：有两个模块A和B，要求加载完A才加载B，说说你的想法。

我第一个想法就是：

```javascript
moduleA();
moduleB();
```

Bingo！搞定！

屁颠屁颠地去撸一盘lol，撸到一半，感觉不对啊，是不是太简单了？重新打量了打量这个问题，我脑袋一拍想到，其实面试官想问的是：**javascript模块加载的实现方法**。

关于javascript模块加载器，我接触过两种：[seajs](http://seajs.org/docs/) 和 [requirejs](http://www.requirejs.org/)。我比较熟悉的是requirejs，所以我按照requirejs的API实现了一个简单的模块加载器。

我没看过requirejs源码，下面所说只是我个人的想法。

##如何加载js文件？
我用的是最简单的方法：

```javascript
var loadJs = function(name) {
    var script = document.createElement('script');
    script.src = name + '.js';
    document.body.appendChild(script);
};
```

##模块加载
模块加载最关键的问题是：如何保证模块执行的顺序。在解决这个问题之前，我们需要注册（记录）模块的相关信息。

###如何注册模块？
先准备两个函数require和define，这两个函数功能相似，以define为例子，它接受三个参数：

```javascript
// define接收三个参数：
// - 该模块的名字
// - 依赖数组，包含该模块依赖的其他模块名
// - 回调函数，当模块及其依赖加载完后执行
var define = function(name, depArr, callback) {};
```

该函数接收的三个参数就是模块的相关信息，我们将这些信息记录下来：

```javascript
var mixJS = {

    // 存放各个模块的相关信息
    modules: {}
    
},

define = function(name, depArr, callback) {

    // 记录 该模块的信息
    mixJS.modules[name] = {
        depArr: depArr,
        func: callback
    };
    
    // loadJs 加载依赖
    // …… ……
    
};
```

注册完模块，我们还需要继续加载该模块的依赖，依赖继续运行define函数来注册自身模块，再去加载依赖的依赖……

周而复此，我们能注册到所有模块的信息。接下来的问题就是：几时才开始执行模块？

###几时才开始执行模块？
这个问题太简单了不是吗？答案就是：当**最后一个模块**加载完（注册完）之后，就开始执行模块啊。

好，现在问题变成了：在模块加载过程中，如何知道该模块就是最后一个模块呢？

其实模块加载就像举办宴会。假设每个来宾都可以邀请朋友来参加宴会，而且宴会必须等齐所有来宾才能够开始。如此，宴会主办方无法统计实际会有多少人会到场。于是，主办方派人在入场口记录“待参加人数”，每当有来宾到场，工作人员将“待参加人数”减去此次来宾的人数，并询问他邀请了多少个朋友，将人数增添到“待参加人数”上。再有来宾到场，周而复此……

当主办方发现“待参加人数”为0时，意味着所有来宾都到齐了，此时宴会可以开始了！

根据以上的思路，我们同样可以解决 “模块开始执行时间” 的问题了：

```javascript
var mixJS = {
    modules: {},
    
    // 待加载模块的数量，默认值为1，即必须加载main模块
    toLoadCount: 1,
    
    // 模块执行函数
    run: function() {}
},
define = function(name, depArr, callback) {
    // 记录 该模块的信息
    // …… ……

    // loadJs 加载依赖
    // …… ……
    
    // 更新 待加载模块的数量
    // - 该模块已经执行，减1
    // - 加上 依赖的数量
    mixJS.toLoadCount -= 1;
    mixJS.toLoadCount += depArr.length;

    // 如果没有模块等待加载，运行 模块执行函数
    if (mixJS.toLoadCount === 0) mixJS.run();
};
```

oh yeah~！接下来到了最关键的问题：“如何按序执行模块呢？”

###如何按序执行模块？
首先，为何要按序执行模块？这是因为模块之间存在依赖关系，一个模块的执行过程要用到其依赖模块的返回值，所以必须保证被依赖模块在该模块之前被执行。

解决方法就一句话：**在加载模块的过程中，我们将此次模块的依赖压入一个栈中**。由于栈的后进先出，所以我们能保证从该栈中取出来的模块只有两种情况：

* 该模块没有依赖
* 该模块的依赖已经被执行了

依次从该栈中取出模块，依次地执行模块，就能够保证“按序加载模块”了。实现代码大致如下：

```javascript
var mixJS = {
    modules: {},
    toLoadCount: 1,
    
    // 依赖栈
    depStack: [],
    
    // 模块执行函数
    run: function() {
        // 1. 按照后进先出原则，取出depStack中的依赖
        // 2. 根据依赖的名字，在modules中查找该依赖的回调函数
        // 3. 运行该函数并记录下返回值
    }
},
define = function(name, depArr, callback) {
    // 记录 该模块的信息
    // …… ……

    // loadJs 加载依赖
    // …… ……
    
    // 更新 待加载模块的数量
    // …… ……
    
    // 更新依赖栈
    mixJS.depStack = mixJS.depStack.concat(depArr);

    // 如果没有模块等待加载，运行 模块执行函数
    if (mixJS.toLoadCount === 0) mixJS.run();
};
```

wow！ 所有问题都解决了！

##符合AMD规范
我们还需要一些修改才能使这个模块加载器更符合AMD规范，这样才能加载其他一些库，比如jQuery：

```javascript
define.amd = true;
```

AMD的规范可以参考：

* [AMD规范英文文档](https://github.com/amdjs/amdjs-api/wiki/AMD)
* [AMD规范中文文档](http://ued.xinyou.com/2012/07/amd_js.html)

##详细代码
该模块加载器的详细代码可以在这里查看：[mixjs 详细代码](https://github.com/lxjwlt/mixjs/blob/master/mix.js)





