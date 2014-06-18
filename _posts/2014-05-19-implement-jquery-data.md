---
layout: post
title: "jQuery.data原理介绍"
category: front-end
excerpt: '本文只介绍jQuery.data的基本原理，不涉及细节部分'
---

> 面试官说：你知道jQuery库的原理吗？
> 
> 我说：最近我写了个类似jQuery的库，主要实现的是事件绑定那一块的代码
> 
> 面试官：好，那你说说animate的原理
> 
> 我：……

首先我们来回顾下jQuery.data的使用示例：

```javascript
// 存储 某键的数据
$.data(elem, 'keyName', 'data value');

// 获取 某键的数据
$.data(elem, 'keyName')

// 获取 所有数据
$.data(elem)
```

##简单实现
###存储空间

为了存储数据，需要开辟一个存储空间：

```javascript
jQuery.cache = {};
```

在`jQuery.cache`中，jQuery会为每个DOM元素单独开辟一个的存储空间，问题是：如何区分每个DOM元素从而找到他们的数据呢？

###标识符
jQuery给DOM元素分配一个标识符，DOM元素可以通过这个标识符在`jQuery.cache`中找到自身的数据。以下是jQuery的标识符生成器：

```javascript
// 通过不断的 自加 来生成唯一的标识符
// 类似： 标识符 = jQuery.guid++;
jQuery.guid = 1;
```

现在有了标识符，但是标识符该如何存放呢？

首先，标识符应该以键值的形式存放在对应的DOM元素上，为了避免键名重复，jQuery随机生成了一个**键名**来存放标识符：

```javascript
// 产生的键名 类似于： "jQuery044958585570566356"
jQuery.expando = 'jQuery' + (Math.random() + '').replace(/\D/g, '');
```

于是，用这个随机生成的键名来存放标识符：

```javascript
elem[jQuery.expando] = jQuery.guid++;
```
这样，DOM元素就有了独一无二的标识符了，下面我们可以根据标识符存取数据。

###存取数据

$.data方法实际上调用的是jQuery库内部的`internalData`函数：

```javascript
jQuery.data = function(elem, key, data) {
     return internalData(elem, key, data);
};
```

所以实际上，数据存取的操作是在`internalData`函数内实现的，大致如下：

```javascript
function internalData(elem, key, data) {
    var thisCache,
        internalKey = jQuery.expando,
        id = elem[internalKey];

    // 如果标识符不存在，为elem创建标识符
    if (!id) id = elem[internalKey] = guid++;

    // 如果elem没有存储空间，为elem创建存储空间
    if (!jQuery.cache[id]) jQuery.cache[id] = {};

    // 获取elem的存储空间
    thisCache = cache[id];

    // 存储数据
    if (data !== undefined) thisCache[key] = data;

    // 判断是否指定了键名：
    // - 如果指定了键名，返回对应的数据
    // - 否则，返回所有数据
    return typeof key === 'string' ? thisCache[key] : thisCache;
}
```

jQuery.data的基本原理如上，但是……

##jQuery没这么简单
jQuery作为一个库，要考虑的细节非常的多，所以代码远远比上述代码复杂，下面介绍一下jQuery.data另外一些特性。

###内部数据和用户数据
jQuery库会使用jQuery.data方法存储一些内部使用的数据，比如`queue`队列，`on`事件绑定等等，这些方法都需要存储空间来存储数据。

为了区分内部使用的数据和用户定义的数据，jQuery将**内部使用的数据**直接存储在`cache[id]`里面，而**用户定义的数据**则存储在`cache[id].data`中，形如： 

```javascript
// 标识符
var id = elem[jQuery.expando];

// jQuery.cache[id]形如：
{
    // 存储用户数据
    data: {
        name: 'lxjwlt',
        age: '22'
    },
    
    // 这些都是内部使用的数据
    events: {},
    handle: function() {},
    fxqueue: ['inprogress']
}
```

###检查是否支持支持数据存储

在进行数据存储之前，jQuery库会先检查传进来的对象是否支持数据存储。

支持data方法的有：js普通对象、根节点和大部分元素节点（其中applet、embed和object元素是不支持设置expando属性的，所以不支持data方法）。代码大致如下：

```javascript
jQuery.noData = {
    'applet': true,
    'embed': true,
    'object': true
};
jQuery.acceptData = function(elem) {
    var noData = jQuery.noData[elem.nodeName.toLowerCase()],
    
        // 使用‘或’是为了避免对 js普通对象 的误判
        nodeType = +elem.nodeType || 1;
        
    return nodeType !== 1 && nodeType !== 9 ? false : !noData;
};
```

###js对象的数据存储
其实普通的js对象（plain object）也是可以进行数据存储，但是不同于DOM对象的数据存储方式，js对象的数据是直接存储在该对象本身之中，代码如下：

```javascript
function func(obj, key, data) {
    obj[jQuery.expando][key] = data;
    return typeof key === 'string' ? obj[jQuery.expando][key] : obj[jQuery.expando];
}

// 存储过数据的对象 形如:
{
    // 用户定义的数据
    "jQuery044958585570566356": { //... },
    
    // 对象本身的属性
    prop: 'prop1 value',
    otherProp: 'other value'
    
}
```

###获取HTML5的data数据
当jQuery.data方法在jQuery.cache中没有找到数据时，jQuery.data会在DOM元素的`data-*`属性中查找数据。

我们先回顾一下HTML5中data的用法：

```html
<!-- 
    键的命名要用 横线 分隔 
    键名中大写字母都会被转换成小写字母，所以驼峰法的命名无效
-->
<div data-node-name="div element">...</div>
```

在jQuery中，`dataAtrr`函数用于获取html5的data数据，代码大致如下：

```javascript
function dataAtrr(elem, key) {
    var data, name;
    if (elem.nodeType !== 1) return;
    
    // 键名转换，如： theNodeName  ->  the-node-name
    name = 'data-' + key.replace(/([A-Z])/g, '-$1');
    
    data = elem.getAttribute(name);
    
    // 如果没有设定数据，获取的data为null，要将其改写为undefined
    if (data === null) data = undefined;
    
    return data;
}

```

###移除数据
jQuery提供了删除用户定义数据的方法 jQuery.removeData：

```javascript
jQuery.removeData(elem, key);
```

jQuery还定义了删除所有数据的方法: ```jQuery.cleanData```（只在jQuery内部使用），该方法的使用的场景有：如果某个元素节点被删除，那么它存储的所有数据都没有存在的必要了，所以要清空该元素节点的所有数据。例如在`jQuery.fn.remove`方法中就使用了jQuery.cleanData方法。


值得一提的是，节点上的标识符可以被循环利用，所以当清空了节点的存储空间，jQuery会回收标识符，以供下一个节点使用：

```javascript
// 回收的标识符存储在deleteIds中
deletedIds.push( id );
```

所以，那句老话还是有道理的：

> 既然选择使用jQuery库，那么就尽可能地使用jQuery来实现代码功能

