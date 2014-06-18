---
layout: post
title: "论变量即是引用"
category: front-end
excerpt: '其实Javascript 中变量即是引用，有点像C++中的指针，它们不是直接存储数据，而是存储指向数据的地址。'
---
其实Javascript 中**变量即是引用**，有点像C++中的指针，它们不是直接存储数据，而是存储**指向数据的地址**。

```javascript
var a = b = 4;
```

以上语句在语法书中是这么解释的：将4赋值于b，再将b的值赋予a。

这样的解释看似没什么问题，但仔细想来，会有疑问——“改变a的值是否会同时改变b的值呢？”

答案是不会的：

```javascript
var a = b = 4;
a = 5;
console.log(a); // 5
console.log(b); // 4
```

原因在于——在解析时，电脑一开始先创建一个数据为4的内存，接着将 a 和 b 指向该内存，之后将5赋值于a，这实际上是将 a 指向另一个数据为5的内存，所以 a 的赋值不会影响到 b 。

但是，也可以这样解释啊——变量是直接存储数据的，a 和 b 分别存储了数据4，所以 a 的改变就不会影响 b 啦。

这样的解释**貌似**是对的，但如果你是这么看待变量的话，那么你一定会认为javascript中的等号是传送数据用的，这样，当你在做**对象的克隆(clone)**时，将会遇到严重的问题。

所谓对象克隆，也就是将一个对象复制成两份，这样就可以实现——修改“新的对象”的同时，又不会改变“原有对象”的值。

如果你认为变量是直接存储数据的话，那么你实现对象克隆的方法可能会是：

```javascript
var obj = {a : 1}, newObj;
newObj = obj;
```

这样其实并没有真正的实现对象克隆，因为，当修改新对象newObj的同时，也会修改原有对象obj:

```javascript
newObj.a = 2;
console.log(obj); // {a:2}
console.log(newObj); // {a:2}
```

所以“变量直接存储数据”的解释是不合理的！而且这种理解在编写js的时候也是非常危险的。

正确的解释是：**变量不是直接存储数据，而是存储数据的引用地址**。所以js中**等号**只是传送了数据的引用地址，而不是数据。

下面再给出一个佐证：

```javascript
var a = b = [1,2];
// 在数组第二个数后面插入3和4
a.splice(2,0,3,4);
console.log(a); // [1,2,3,4,5]
consoleo.log(b); // [1,2,3,4,5]
```

##参考资料

* [《javascript模式》](http://www.baidu.com/link?url=8u_NI1zPxquBrtAfCkNzcCRgBVjddAjcWeYhXRXqRvqRWUzBGIYhSSsZeCwvvSdniarAzOHKi4cwFXuzhm3TTK)