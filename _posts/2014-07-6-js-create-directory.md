---
layout: post
title: "JS生成文章目录"
category: front-end
excerpt: '本文主要介绍介绍的是如何通过JavaScript获取一篇文章的标题并生成目录。对于一篇文章来说，目录起到很重要的作用，读者通过目录能大致地掌握文章的主体内容和内容分布，大致了解当前阅读进度，而且目录提供了各个内容块的跳转链接。'
---

对于一篇文章来说，目录的作用有：

* 大纲作用，读者通过目录能大致地掌握文章的主体内容和内容分布
* 导读作用，读者能大致了解当前阅读进度
* 提供各个内容块的跳转链接

所以，目录能提高一篇文章的可读性。

下面要介绍的是如何通过JavaScript获取一篇文章的标题并生成目录。我们要完成的工作有：

1. 获取标题元素
2. 计算标题的层次关系
3. 创建目录的HTML结构

##获取标题元素
首先，我们需要将一篇文章中的标题元素全部获取出来，简要的代码如下：

```javascript
var nodes = document.getElementById('article').childNodes,
    
    // 用于存储标题元素
    titleElem = [],
    
    // 用于判断tagName是否是H1~H6
    reg = /^H[1-6]$/,
    i, len;

// 遍历文章中的节点，挑出标题元素
for (i = 0, len = nodes.length; i < len; i++) {
    if (nodes[i].nodeType === 1 && reg.test(nodes[i].tagName)) {
        titleElem.push(nodes[i]);
    }
}
```

##标题层次关系
为了构建目录结构，我们还需要知道标题的层次关系。我们可以单纯地将标题序号提取出来，用该序号作为标题的所在层次，比如`<h1>`的序号为1，所以它在第一层。代码大致如下：

```javascript
var numArr = [],
    elem, i, len;
    
for (i = 0, len = titleElem.length; i < len; i++) {
    elem = titleElem[i];
    
    // 将tagName标签名中的数字提取出来，存入numArr中
    numArr = numArr.concat(+elem.tagName.match(/\d/));
}
```

对于**正常排列**的标题列如：`<h1><h2><h2><h3>`，通过上述代码，我们能够正确地获得标题对应的层次为：`[1, 2, 2, 3]`。

但是，也存在**异常**的标题列：`<h1><h4><h2>`。在这个标题列中，h1直接跳到了h4，最后再跳回h2，此时，请问h4和h2是什么关系呢？实际上，**因为h4和h2的父标题都是h1，所以两者位于同一层，是平级的关系**。所以该标题列对应的层次应该是：`[1, 2, 2]`，显然上述代码是无法得到正确结果的。

下面介绍如何通过判断标题之间的关系，计算出正确的层次关系。

###判断标题之间的关系
我们只需要判断**前后两个**标题之间的关系，即当前标题和前一个标题的关系，两者之间的前后关系只有三种：

（父标题, 子标题） （同级标题，同级标题） （子标题，父级标题）

前后标题关系的判断方法如下：

* （父标题，子标题）：当前标题的序号 > 前一个标题的序号
* （同级标题，同级标题）：
    * 当前标题的序号 === 前一个标题的层次
    * 当前标题的序号 > 前一个标题的层次 && 当前标题的序号 <= 前一个标题的序号
* （子标题，父级标题）：当前标题的序号 < 前一个标题的层次

上述判断方法的代码形式如下：

```javascript
/*
 num: 当前标题序号
 lastNum: 前一个标题的序号
 lastRevNum: 前一个标题的层次
*/
var num, lastNum, lastRevNum;

// （父标题，子标题）
if (num > lastNum) {

// （同级标题，同级标题）
} else if (num === lastRevNum || num > lastRevNum && num <= lastNum) {

// （子标题，父级标题）
} else if (num < lastRevNum) {

}

lastNum = num;
```

###层次计算法则
知道前后标题之间的关系，我们能够计算出当前标题的正确层次，计算方法如下：

* （父标题, 子标题）：当前层次 = 前一个标题的层次 + 1
* （同级标题, 同级标题）： 当前层次 = 前一个标题的层次
* （子标题, 父级标题）： 当前层次 = 当前标题的序号

比如我们有标题列：`<h1><h4><h3><h1>`，我们的计算过程如下：

1. 第一个标题为`<h1>`，其层次为1
2. 第二个标题为`<h4>`，由于其父标题的层次为1，所以其层次 =  1 + 1 = 2
3. 第三个标题为`<h3>`，由于它与前一个标题`<h4>`同级，所以其层次 = 前一个标题的层次 = 2
4. 第四个标题为`<h1>`，这个标题不是第一个标题的子标题，所以其层次 = 序号 = 1

我们得到了标题编号为：`[1, 2, 2, 1]`。

所以，在判断前后标题关系的基础上，我们添加计算标题层次的代码：

```javascript
/*
 num: 当前标题序号
 lastNum: 前一个标题的序号
 lastRevNum: 前一个标题的层次
*/
var num, lastNum, lastRevNum;

if (num > lastNum) {
    lastRevNum += 1; // <-- !!!
} else if (num === lastRevNum || num > lastRevNum && num <= lastNum) {
    lastRevNum = lastRevNum; // <-- !!!
} else if (num < lastRevNum) {
    lastRevNum = num; // <-- !!!
}

lastNum = num;
```

###相对层次关系
在上述获得的层次关系的基础上，我们可以计算出标题之间的**相对层次关系**了。相对层次关系是指当前标题相对于前一个标题的层次位置。我们用`1, 0, -n`这三个数字表示标题层次的相对关系：

* `1`表示下一层
* `0`表示同一层
* `-n`表示上n层

我们可以在对比标题之间关系的同时，开始处理相对层次关系：

* （父标题, 子标题）：当前相对关系 = 1
* （同级标题, 同级标题）： 当前相对关系 = 0
* （子标题, 父级标题）： 当前相对关系 = 当前标题序号 - 前一个标题的层次

同样，在判断标题关系和计算层次关系的同时，记录标题的相对关系：

```javascript
// levelArr保存相对关系
var levelArr = [],
    num, lastNum, lastRevNum;

if (num > lastNum) {
    lastRevNum += 1;
    levelArr.push(1); // <-- !!!
} else if (num === lastRevNum || num > lastRevNum && num <= lastNum) {
    lastRevNum = lastRevNum;
    levelArr.push(0); // <-- !!!
} else if (num < lastRevNum) {
    lastRevNum = num;
    levelArr.push(num - lastRevNum); // <-- !!!
}

lastNum = num;
```

##构建目录
知道了标题之间的相对层次关系，我们可以通过生成HTML元素来构建目录，HTML形式如下：

```html
<ul>
    <li>标题内容1</li>
    <li>标题内容2
        <ul>
            <li>标题内容3</li>
        <ul>
    </li>
</ul>
```

首先我们需要一个根目录：

```javascript
/*
 root: 根目录
 currentList: 当前目录
*/
var root, currentList;

// 创建根目录，当前目录就是根目录
currentList = root = document.createElement('ul');
```

接下来，我们循环遍历标题的相对关系。当相对关系为**1**时，意味着当前标题的层次比前一个标题的低，所以当前标题要存储在子目录中。代码如下：

```javascript
// ... 

if (level === 1) {
    // 创建一个新的目录
    var list = document.createElement('ul');
    currentList.lastElementChild.appendChild(list);
    
    // currentList指向当前目录
    currentList = list;
}
```

当相对关系为**-n**（即负数）时，意味着当前标题的层次比前一个标题高n个层次，也意味着当前标题应该存放在当前目录的第n个父级目录，代码如下：

```javascript
if (level < 0) {
    // 由于子目录是保存在li元素中的，所以向上查找
    // 第n个父级ul元素的时候，需要遍历2n次
    level *= 2;
    while (level++) {
        currentList = currentList.parentNode;
    }
}
```

ok！通过上述代码，我们能找到存放标题的对应目录，最后我们要做的就是，将标题存进该目录中：

```javascript
var li = document.createElement('li');
li.innerHTML = content; // content中存储了标题内容
currentList.appendChild(li);
```

##详细代码
以下是详细代码及其实际效果：

<iframe width="100%" height="300" src="http://jsfiddle.net/lxjwlt/fRfD5/embedded/result,html,js/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>
