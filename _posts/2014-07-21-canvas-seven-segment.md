---
layout: post
title: "canvas实现七段数码管时间显示器"
category: front-end
excerpt: '本文主要介绍介绍的是如何通过绘制七段数码管显示器，用来显示时钟效果'
---

用canvas实现七段显示器的完整效果如下：

<iframe width="100%" height="300" src="http://jsfiddle.net/lxjwlt/DVAVY/4/embedded/result,js,html,css/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

##简易实现
先用最简易的方法实现时钟效果，无非就是用冒号连接“时分针”三个数字，然后直接显示出来:

```javascript
var showTime = function showTime() {
	var dateObj = new Date(),
		arr= [];

	arr.push(dateObj.getHours());
	arr.push(dateObj.getMinutes());
	arr.push(dateObj.getSeconds());

	document.body.innerHTML = arr.join(':');
	setTimeout(showTime, 100);
};
showTime();
```

效果：

<iframe width="100%" height="300" src="http://jsfiddle.net/lxjwlt/DVAVY/1/embedded/result,js,html/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

##canvas实现七段显示器
首先，在我们开始绘制七段显示器之前，我们先弄清七段显示器构造。

###七段数码管的编码
七段数码管分为七段，这七块数码管我们按1 - 7来编号：

![七段数码管编码](http://i1273.photobucket.com/albums/y401/lxjwlt/canvas-seven-segment/B103C065-190C-4957-8D36-0102BE31D99E_zps3aa32a95.jpg)

按照上图编号，我们能找到数字与七段数码管编号之间的显示关系，比如要显示数字1，应该点亮编号为2和3的数码管：

![数字1](http://i1273.photobucket.com/albums/y401/lxjwlt/canvas-seven-segment/28FA922F-492E-4E4C-A519-7E3508021D8B_zps3e0c8c7d.jpg)

所以，我们能写出数字0-9与数码管编号之间的关系：

```javascript
// 数字0 - 1对应的编码
var numMap = [
	[1, 2, 3, 4, 5, 6], [2,3], [1, 2, 4, 5, 7], 
	[1, 2, 3, 4, 7], [2, 3, 6, 7], [1, 3, 4, 6, 7],
	[1, 3, 4, 5, 6, 7], [1, 2, 3], [1, 2, 3, 4, 5, 6, 7],
	[1, 2, 3, 4, 6, 7]
];
```

###计算坐标
绘制七段显示器上的数码管，我们只需要知道每一段数码管对应的坐标，比如第一段数码管，只需要知道它对应的四个坐标点：

![坐标集](http://i1273.photobucket.com/albums/y401/lxjwlt/canvas-seven-segment/91E3B920-4467-40B7-A543-5F82D577CB34_zps0bc4d28a.jpg)

我们观察能发现，七段数码管是上下左右对称的——比如第6段和第2段数码管就是以Y轴对称——所以我们只需要计算出一段数码管的坐标，通过计算其对称点就能得到所有的坐标，：

![对称](http://i1273.photobucket.com/albums/y401/lxjwlt/canvas-seven-segment/EAD34033-40B9-4C20-B1EB-AF29A7F8A951_zps3ed5ec2b.jpg)

首先，为了计算对称点，我们需要一个函数来处理：

```javascript
// axisX参数为true，则对称轴是X轴，否则为Y轴
var getSymPoint = function(arr, axisX) {
	var index = axisX ? 1 : 0,
		result;

	result = arr.map(function(val, i) {
		var temp = val.slice();

		temp[index] = -temp[index];

		return temp;
	});

	return result;
};

// 比如有坐标集如下：
// 该坐标集以Y轴为对称轴的坐标集为：
// [[-1, 2], [-3, 4]]
getSymPoint([[1, 2], [3, 4]]);
```

在计算坐标之前，我们定义了以下参数：

* w表示数码管的宽度
* h表示数码管的高度
* thick表示数码管的粗细

![三个参数](http://i1273.photobucket.com/albums/y401/lxjwlt/canvas-seven-segment/BF949153-D191-4ECF-A52F-5C16812E9B58_zps115c7d0b.jpg)

下面我们先计算第6段数码管的坐标集：

```javascript
// 用来存储各个数码管的坐标
var pointArr = [[], [], [], [], [], [], []];

// 计算第6段数码管的坐标集
pointArr[5].push(
	[-w/2, -h/2], [-w/2 + thick, -h/2 + thick],
	[-w/2 + thick, -thick/2], [-w/2 + thick/2, 0],
	[-w/2, -thick/2]
);
```

有了第6段的坐标集，按照Y轴对称的原则，我们能计算出第2段数码管的坐标集：

```javascript
// 第2段坐标集
pointArr[1] = getSymPoint(pointArr[5]);
```

同理我们也能计算出其余所有数码管的坐标集。

###绘制数码管
下面我们实现一个drawSegment函数，只要我们提供坐标集，该函数就能绘制出对应的数码管，负责绘制单个数码管，我们先画出path路径，并描边

```javascript
/*
 参数：
 - cxt: 传入canvas的context对象
 - num: 要绘制的数码管的编码
 - active: 控制数码管的亮灭
*/
drawSegment = function(cxt, num, active) {
	var arr = pointArr[num - 1],
		i, len;
	
	// 遍历坐标集，将各个坐标连成路径
	cxt.beginPath();
	for (i = 0, len = arr.length; i < len; i++) {
		cxt.lineTo.apply(cxt, arr[i]);
	}
	cxt.closePath();
	cxt.stroke();
};
```

接下来，我们添加处理填充部分，如果点亮则是红色`#ff0000`，如果灭就是灰色`rgba(192, 192, 192, 0.1)`，用active参数控制亮灭：

```javascript
drawSegment = function(cxt, num, active) {
    // ...
	// 遍历坐标集，将各个坐标连成路径
	// ...
	
	if (active) {
		cxt.fillStyle = "#ff0000";
	} else {
		cxt.fillStyle = "rgba(192, 192, 192, 0.1)";
	}
	cxt.fill();
};
```

现在我们能够绘制**单个**数码管，下面我们要实现一个函数统一绘制数字0 - 9。

我们要用到数字0-9与数码管编号之间的关系numMap，按照其中的对应关系点亮数码管：

```javascript
var drawNum = function(cxt, num) {
	var map = numMap[num],
		i;

	for (i = 1; i <= 7; i++) {
		if (map.indexOf(i) !== -1) {
		    // 点亮对应的数码管
			drawSegment(cxt, i, true);
		} else {
		    // 熄灭对应的数码管
			drawSegment(cxt, i);
		}
	}
};
```

有了以上的drawNum函数，我们就能用数码管来显示数字了：

```javascript
var canvas = document.getElementById('myCanvas'),
    cxt = canvas.getContext('2d');

// 用数码管显示数字2
drawNum(cxt, 2);
```

没有加黑色背景的效果如下： 

<iframe width="100%" height="300" src="http://jsfiddle.net/lxjwlt/DVAVY/2/embedded/result,js,html/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

##七段数码管时钟显示器
现在我们有了drawNum函数，能够用七段数码管显示数字，接下来，我们可以用数码管显示“时分针”。

首先，我们适当的格式化一下各个数字，使其以两位数的形式显示，比如数字4，格式化之后就变成两个数字0和4：

```javascript
getTimeNum = function() {
	var dateObj = new Date(),
		temp = [], 
		result = [],
		i;

    // 获取时分针三个数字
	temp.push(
		dateObj.getHours(), 
		dateObj.getMinutes(), 
		dateObj.getSeconds()
	);

    // 格式化
	for (i = 0; i < temp.length; i++) {
		result.push(Math.floor(temp[i] / 10));
		result.push(temp[i] % 10);
	}

	return result;
};
```

格式化后我们得到了8个数字，将这些数字传入drawNum函数中，用数码管形式显示出来。要注意的是，在每次刷新canvas画布的时候都要用clearRect函数**清屏**：

```javascript
var showTime = function showTime() {
	var timeArr, x, i, len;
	
	// 获取时分针8位数
	timeArr = getTimeNum();
	
	// 清屏，sWidth和sHeight为canvas宽高
	cxt.clearRect(0, 0, sWidth, sHeight);
	
	// 设置原点居中
	cxt.translate(0, sHeight/2);

	for (i = 0, len = timeArr.length; i < len; i++) {
		cxt.translate(50, 0);
		
		// 用数码管显示
		drawNum(cxt, timeArr[i]);
	}

    // 0.1s刷新频率
	setTimeout(showTime, 100);
};

```

原始效果如下：

<iframe width="100%" height="300" src="http://jsfiddle.net/lxjwlt/DVAVY/3/embedded/result,js,html" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

##参考
* [canvas rendering context2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D#beginPath())
* [canvas tutorial](https://developer.mozilla.org/zh-CN/docs/Web/Guide/HTML/Canvas_tutorial)



