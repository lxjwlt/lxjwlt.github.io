---
layout: post
title: "2D空间碰撞检测"
category: front-end
excerpt: '本文主要介绍2D游戏中的碰撞检测，要说到分离轴定理以及js垃圾回收机制'
---

<iframe width="100%" height="400" src="http://jsfiddle.net/lxjwlt/dLs25pa3/embedded/result,js" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

在游戏中要模拟物体间的一次碰撞，我们需要做的有：碰撞检测和碰撞行为。碰撞检测指判断物体之间是否发生了碰撞。碰撞行为是指如果物体间发生了碰撞，物体状态应该如何改变。本文将简要地介绍一下碰撞检测。

首先要提的是，碰撞检测又分为两个阶段：

* broad phase(粗略)：获取最有可能发生碰撞的物体集合。
* narrow phase(精密)：对可能发生碰撞的物体之间进行碰撞检测。

以下内容介绍的是narrow phase阶段。

##简易碰撞检测
一般的2D游戏只会用到的形状有：矩形和圆形，比如超级玛丽，坦克大战这类游戏，所以要检测三种碰撞：矩形和矩形、圆形和圆形、矩形和圆形。

###矩形碰撞矩形
判断矩形之间的碰撞不难，代码如下：

```javascript
rectB.x > rectA.x - rectB.width &&
rectB.x < rectA.x + rectA.width + rectB.width &&
rectB.y > rectA.y - rectB.height &&
rectB.y < rectA.y + rectA.height + rectB.height
```

###圆形碰撞圆形

圆形之间的碰撞就更简单了，只要两圆的圆小于两圆的半径之和就能认定两圆发生了碰撞，代码形式如下：

```javascript
Math.sqrt(Math.pow(circleA.x - circleB.x, 2) + Math.pow(circleA.y - circleB.y, 2)) < circleA.radius + circleB.radius
```

###圆形和矩形的碰撞
当我们要检测圆形和矩形之间的碰撞，我们可以将圆形看成一个矩形，用矩形与矩形之间的那套方法来检测碰撞。

这种检测方法不太精确，圆形越大就越不精确，比如圆形和矩形的顶角发生碰撞，但是在不需要精确判断的游戏中，这种方法是可行的，代码如下：

```javascript
circle.x > rect.x - circle.radius &&
circle.x < rect.x + rect.width + circle.radius &&
circle.y > rect.y - circle.radius &&
circle.y > rect.y + rect.height + circle.radius
```

##分离轴定理
前面提到的这些检测方法非常简单，足够应对一般的2D游戏。但是这些方法都不精确，不稳妥，不能应对所有的情况，比如矩形和矩形的碰撞检测方法，无法检测有一定旋转角度的矩形之间的碰撞。

2D游戏有个较为稳定的碰撞检测方法：分离轴定理。这个方法能够检测凸多边形之间的碰撞同时也解决了物体碰撞后分离和反弹等一系列问题。

另外，分离轴定理会用到向量计算，下面会一一提到。

###原理
通俗来说，分离轴定理的原理就是：用光线从各个角度照射进行检测的两个物体，在垂直于光线的位置放置一堵墙，观察两个物体在墙上的投影，如果在某个角度下，两者的投影不重叠，意味着这两个物体之间有空隙，两者不重叠，即没有发生碰撞。如果在所有角度下，这两个物体的投影都是重叠的，意味着两者重叠，即发生了碰撞。

用下图阐述分离轴的原理：

![分离轴原理](http://i1273.photobucket.com/albums/y401/lxjwlt/collide-check/IMG_0088_zps9e043061.jpg)

三角形和矩形在某一个投影轴上的投影不重叠，所以两者没有发生碰撞。

###投影轴
如果我们每个角度都对物体进行投影检测，这无疑是最保险的，但是这样做花费会非常大而且也是没有必要的。

我们多次观察会发现，需要检测的投影轴都垂直于多边形的边，所以实际上需要的投影轴的数量等同于多边形的边的数量：

![投影轴](http://i1273.photobucket.com/albums/y401/lxjwlt/collide-check/IMG_0089_zpsc1a4c681.jpg)

比如上图，我们只需要6条投影轴，而且这些投影轴都垂直于多边形的某一条边。所以当我们要对两个多边形进行碰撞检测，通过求出各条边的垂直线，我们就能够找到所有投影轴。

问题是：如何求一条边的垂直线呢？这问题用向量很容易解决。我们先给出向量的定义：

```javascript
var Vector = function(x, y) {
	this.x = x;
	this.y = y;
};
```

现在我们先要用向量来表示多边形的某一条边，原理看下图：

![边的向量](http://i1273.photobucket.com/albums/y401/lxjwlt/collide-check/IMG_0091_zps245511d6.jpg)

所以边为两点的向量之差：

```javascript
// 向量求差
Vector.prototype.subtract = function(vector) {
	return new Vector(this.x - vector.x, this.y - vector.y);
};

/*
	假设已知两个点point1和point2
*/
var v1, v2, edge;

// 两点的向量
v1 = new Vector(point1.x, point1.y);
v2 = new Vector(point1.x, point2.y);

// 两点向量的差 就是 边的向量
edge = v2.subtract(v1);
```

现在我们知道了边向量的求法，接下来就是解决如何求一个矢量的垂直向量：

![垂直向量](http://i1273.photobucket.com/albums/y401/lxjwlt/collide-check/IMG_0092_zps1d831af6.jpg)

根据上图，我们能够为`Vector`添加一个求垂直向量的方法：

```javascript
Vector.prototype.prependicular = function() {
	return new Vector(this.y, -this.x);
};
```

由于投影轴不需要定义长度，所以可以说，投影轴是边向量的法向量：

```javascript
// 求向量长度 
Vector.prototype.getMagnitude = function() {
	return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
};
// 求单位向量
Vector.prototype.normalize = function() {
	var v = new Vector(0, 0),
		m = this.getMagnitude();
	if (m !== 0) {
		v.x = this.x / m;
		v.y = this.y / m;
	}
	return v;
};

// 投影轴的单位向量
var axisVector = edge.prependicular().normalize();
```

###投影
我们有了投影轴，就能够计算出多边形在该轴上的投影。多边形在某一投影轴上的投影就是：该多边形各个顶点在该投影轴上的投射点所组成的直线（最大点和最小点之间）：

![投影](http://i1273.photobucket.com/albums/y401/lxjwlt/collide-check/IMG_0093_zps8c9e612d.jpg)

为了求一个点在某轴线上的投射点，我们要用到向量的点乘计算。请看下图：

![投射点](http://i1273.photobucket.com/albums/y401/lxjwlt/collide-check/IMG_0090_zpsd12ff044.jpg)

所以一个点与投影轴（**单位向量**）的点积就是其投射点：

```javascript
// 求矢量点积
Vector.prototype.dotProduct = function(vector) {
	return this.x * vector.x + this.y * vector.y;
};

/*
	假设存在：
	 - 点point
	 - 投影轴矢量axisVector
*/
var pointVector = new Vector(point.x, point.y);
// 投射点
pointVector.dotProduct(axisVector);
```

最后，我们只需要遍历多边形的顶点，找出这些点相对于投影轴的投射点，这些投射点的最大值和最小值构成了投影。

有了以上方法，我们通过分离轴定理就能够检测碰撞了：

<iframe width="100%" height="400" src="http://jsfiddle.net/lxjwlt/dLs25pa3/2/embedded/result,js" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

###最小平移量
游戏中判断发生碰撞的依据是：两个物体发生重叠了。所以当我们监测到两个物体发生碰撞的时候，这两个物体是重叠在一起。这导致的问题有：

* 代码方面，碰撞后会改变运行状态，如果不马上分离这两个物体，很可能下一帧，两者依旧处于重叠状态，那么此时两者运行状态又会被改变，依次下来，就产生了死循环，两个物体会一直粘合在一起。
* 如果两个物体重叠部分面积非常的大，玩家觉察到明显的不真实，因为现实中，两个能够发生碰撞的物体是不会重叠的。

所以游戏中两个物体发生了碰撞，我们需要马上分开这两个物体。为了分开两个物体，我们需要找到两者分离所需要的最小移动距离和移动方向，即**最小平移量**。

对于分离轴定理来说，最小平移量的求解是非常简单的，可以说是“顺手而已”。此话怎讲？

这是因为我们知道，用分离轴定理判断碰撞的过程中，我们需要为多边形的每条边对应的投影轴上进行投影，然后对比两个物体在该轴上投影是否都用重叠，这过程中，我们就能够算出两者投影的重叠部分，**理论上**，我们可以说，两者的最小投影重叠部分就是最小平移距离，而平移方向则是该投影所对应的投影轴的方向。

![最小向量](http://i1273.photobucket.com/albums/y401/lxjwlt/collide-check/IMG_0094_zps0f5d1178.jpg)

上图我们可以看出，最小平移量不过就是投影的重叠部分和此时的投影轴，前者决定最小平移距离，后者决定平移方向。

我们来看一下，加上最小平移量后，前一个demo能达到什么效果：

<iframe width="100%" height="400" src="http://jsfiddle.net/lxjwlt/dLs25pa3/3/embedded/result,js" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

有了最小平移量，我们能轻易实现物体碰撞反弹效果：

<iframe width="100%" height="400" src="http://jsfiddle.net/lxjwlt/dLs25pa3/4/embedded/result,js" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

至此，我们已经介绍完分离轴定理和最小平移量，这两个算法能帮助我们很好地处理2D游戏中绝大部分的碰撞检测，但同时我们也应该知道，分离轴定理是**不适用**于凹多边形的碰撞检测。

##js性能优化
我们知道，60帧才能保证游戏画面的流畅，这意味着，js代码的执行要在16ms以内完成，所以哪怕是1ms也是值得我们去争取的。由于可用的时间非常短，我们需要尽可能地提升js的执行效率，影响js效率的一个非常关键因素就是**js的垃圾回收**。在js执行过程中，垃圾回收大概会占用10%的时间，如果在短时间内js代码不断地进行垃圾回收，那么整个画面就会有明显的卡顿，所以我们要降低垃圾回收的执行频率。

在js代码运行过程，浏览器会监测程序占用的内存空间，如果占用大小超过分配的内存大小，浏览器会进行垃圾回收，遍历并释放一些不用的内存空间。

我们在写代码时，为了方便计算或者传递数据，我们会创建**临时**的数组或者对象。在一般的程序中这做法是没问题的，但是在游戏运行中，这就产生大量的临时内存空间，也就是所谓的**垃圾**。假设有个函数在执行过程中会创建两个临时对象，想想看，一秒60帧来算，也就是一秒运行60次，那就是120个临时对象。所以在游戏中如果处理不当，短时间内就轻易地产生大量的垃圾，造成垃圾回收机制被频繁的触发。

改善这一问题的方法就是：事先创建好相应的对象或数组，要使用的时候直接拿来用：

```javascript
var tempArr = [];

function func() {
	var result = tempArr;

	// 一系列操作
	// ...

	return result;
}
```

当然这样的解决方案也是有不足之处的，比如有个函数是递归执行的，同时它执行过程中也需要临时的数组或对象，那么上述解决方法是不适用的。

于是有人也提出一个方法，就是创建一个方法来管理这些临时空间，预设一些临时空间，每次需要临时空间，该方法则查看是否有可用的临时空间，如果有，则分配出去，否则创建新的空间。这方法不错，不过我想这不是浏览器的工作吗？

下面会介绍一些常见情况，在这些情况下会产生一些我们意识不到的临时的内存空间。

###会产生垃圾哦
有时候我们需要清空数组，也许我们这么做：

```javascript
// bad
var arr = [1, 2, 3, 4];

arr = []; 
```

这样，实际上是创建了另一个新的数组`[]`，而弃用了原数组`[1,2,3,4]`。所以为了真正地复用这块内存空间，我们可以这样清空数组：

```javascript
// good
arr.length = 0;
```

当然，有时候我们只需要删除数组中的某段数据，我们会使用`splice`来实现:

```javascript
// 清除数组前四个元素，并以新数组的形式返回这四个元素
arr.splice(0, 4); 
```

然而`splice`方法在删除数组中某段元素的同时，也会将这些元素创建为新的数组。如果我们的目的只是清除元素，我们需要自定义一个新的方法：

```javascript
// 用于删除arr[index] ~ arr[index + num - 1]
var removeItem = function(arr, index, num) {
    var i, len;
    for (i = index + num, len = arr.length; i < len; i++) {
        arr[i - num] = arr[i];
    }
    arr.length = len - num;
};
```

在绘制动画帧的过程中，要尽量避免用函数直接返回一个对象，比如获取canvas的鼠标坐标，我们会用一个函数对鼠标坐标进行转换，最后将x和y包装进一个对象中返回：

```javascript
var getLoc = function(canvas, x, y) {
	var locX, locY;

	// 一系列操作
	// ...

    return {
        x: locX,
        y: locY
    };
};
```

然而，这样的方法会产生一个临时的对象，即产生了垃圾，针对这点，我们的解决方法是分开获取x和y，避免产生垃圾：

```javascript
var getLocX = function(canvas, x) { /* ... */ },
    getLocY = function(canvas, y) { /* ... */ };

```

总而言之，当我们着手改善垃圾回收机制的时候，除了自己写的代码我们还需要留意其中用到的js原生方法，比如数组的`splice`和`concat`。

以上。

##参考
碰撞检测：

* [《HTML5 Canvas核心技术》](http://book.douban.com/subject/24533314/)

垃圾回收相关：

* [How to write low garbage real-time Javascript](https://www.scirra.com/blog/76/how-to-write-low-garbage-real-time-javascript)
* [Javascript memory optimization and texture loading](http://blog.tojicode.com/2012/03/javascript-memory-optimization-and.html)
* [GDC 2012: From Console to Chrome](https://www.youtube.com/watch?v=XAqIpGU8ZZk)
* [Writing Fast, Memory-Efficient JavaScript](http://www.smashingmagazine.com/2012/11/05/writing-fast-memory-efficient-javascript/)
* [内存管理--MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Memory_Management)