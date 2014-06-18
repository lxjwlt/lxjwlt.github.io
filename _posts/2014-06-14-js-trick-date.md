---
layout: post
title: "JavaScript小小技巧——Date篇"
category: front-end
excerpt: '本文主要介绍Date对象的常用方法和一些在开发过程中会用到的小技巧，比如如何控制时间输入格式，如何获取一个月的总天数。'
---

首先我们回顾一下Date的基本用法。

##创建Date对象
Date构造函数可以创建当前时间的Date对象，也可以根据任意指定时间创建相应的Date对象：

```javascript

    // 当前时间的Date对象
var today = new Date(),

    // 2014年1月1日 的Date对象
    time1 = new Date(2014, 0, 1),
    
    // 通过getTime，将time1对象转化为数值
    // 将该数值传入Date构造函数中，同样能创建 2014年1月1日 的Date对象
    // 所以getTime方法可用于数据传输
    time2 = new Date(time1.getTime());
```

##常用方法

以下是Date对象常用方法，注意返回值的**范围**（特别要注意月份，月份的取值为[0 - 11]）：

```javascript
var time = new Date();

time.getTime(); // 将时间转换成数值形式，一般用于数据传输

time.getFullYear();  // 获取年份
time.getMonth();     // 获取月份 [0 - 11]
time.getDate();      // 获取月份中的日子 [1 - ?]
time.getDay();       // 获取一周中的日子 [0 - 6]，0表示星期天
time.getHours();     // 获取时 [0 - 23]
time.getMinutes();   // 获取分 [0 - 59]
time.getSeconds();   // 获取秒 [0 - 59]
```

##如何‘计算’某年某月的总天数？
    
首先我们知道，月份的总天数可以通过一些闰年神马的法则计算出来，但这无疑将问题复杂化了。实际上，计算机本身就是一个万年历，想想看，如果我们手中有一个万年历，我们会怎么做呢？还会去做那些繁琐的计算？不，我们会**先找到那个月份，接着找到该月的最后一天，这一天的日期就是该月的总天数**。很好，现在问题是：如何找到某个月的最后一天？

还记得上面介绍“创建Date对象”吗？如果我们想创建 2014年1月1日 的Date对象，可以这样写：

```javascript
var time = new  Date(2014, 0, 1);
```

我们知道，Date构造函数中传入了三个参数，分别是年、月、日。但是，如果“日”的参数为0会怎么样呢？由于0在1之前，所以意味着2014年1月1日的**前一天**，即2013年12月的**最后一天**：

```javascript
// 2013年12月的最后一天
var time = new Date(2014, 0, 0);

// 通过getDate方法获得日期
// 2013年12月的最后一天是31日，说明2013年12月份有31天
time.getDate();
```

oh~yeah！现在我们知道，2013年12月有31天。同理，通过这个小小的trick，我们能够获取任意月份的总天数了！

##格式化
关于时间输出格式，Date对象没有对应方法，非常遗憾！但是我们可以自己封装一个方法来实现这一点，下面是简易代码，这真的是一个非常实用的方法：

```javascript
Date.prototype.format = function(str) {
  var monthName = [
        'January', 'February', 'March',
        'April', 'May', 'June',
        'July', 'Aguest', 'September',
        'October', 'November', 'December'
      ],
      year = this.getFullYear(),
      month = this.getMonth(),
      day = this.getDate();
  
  // 替换字符串中的'y' 'm' 'd'字符
  return str.replace(/(y+)/g, year)
    .replace(/m+(\s+)/g, monthName[month] + '$1')
    .replace(/m+(\S+)/g, (month + 1) + '$1')
    .replace(/d+/g, day);
};

var time = new Date(2014, 6, 3);

time.format('y年m月d日'); // "2014年7月3日"
time.format('y-m-d');    // "2014-7-3 "
time.format('m y');      // "July 2014"
```

##那又如何？
了解了这些Date的常见用法，我们可以制作出类似Windows系统日历的效果：

<iframe width="100%" height="300" src="http://jsfiddle.net/lxjwlt/drS62/embedded/result,js/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

上述代码主要的工作就是：向**6行乘7列**的格子中填入日期。这过程中，我们需要知道上个月的最后一天的日期和这个月的总天数。前面提到的小技巧正好能派上用场。

##参考

* [mozilla developer network](http://developer.mozilla.org/)
* [ javascript Date format](http://blog.csdn.net/vbangle/article/details/5643091)