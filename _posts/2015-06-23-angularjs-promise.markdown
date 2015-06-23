---
layout: post
title: "[译]AngularJS之道 - Promise编程模式"
category: front-end
excerpt: 'AngularJS通过内置的$q服务提供Promise编程模式。通过将异步函数注册到promise对象，Promise编程模式提供一种链式调用异步函数的方式。Promise模式作为ES6规范之一，取得JavaScript原生支持。AngularJS中$q服务提供的接口，非常近似这一新的规范，所以代码移植到ES6版本将会非常容易。'
---

原文链接：[a better way to learn AngularJS - promises](https://thinkster.io/a-better-way-to-learn-angularjs/promises)

AngularJS通过内置的$q服务提供Promise编程模式。通过将异步函数注册到promise对象，Promise编程模式提供一种链式调用异步函数的方式。

> Promise模式作为ES6规范之一，取得JavaScript原生支持。AngularJS中$q服务提供的接口，非常近似这一新的规范，所以代码移植到ES6版本将会非常容易。

初始化：

```html
<html>
    <head>
        <title>Promise fun</title>
    <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.4.0-beta.5/angular.min.js"></script>
        <script src="app.js"></script>
    </head>
    <body ng-app="app">
    </body>
</html>
```

```javascript
function getData($timeout, $q) {
  return function() {
    var defer = $q.defer()

    // 模拟异步函数
    $timeout(function() {
    }, 2000)

    return defer.promise
  }
}

angular.module('app', [])
    .factory('getData', getData)
    .run(function(getData) {
        var promise = getData();
    })
```

为了简单起见，我们使用`$timeout()`服务来模拟异步函数。但实际而言，Promose模式最常见的应用场景是运用$http服务的AJAX回调函数。

##defer对象

defer对象只是一种暴露promise对象和promise对象相关方法的对象。defer对象通过调用`$q.deferred()`方法构造出来，而且defer对象暴露了三个主要方法：resolve()，reject()，和notify()。对应的promise对象可以通过`.promise`属性访问。

我们可以使用defer对象发送“异步函数成功完成”的信号：

```javascript
function getData($timeout, $q) {
  return function() {
    var defer = $q.defer()

    // 模拟异步函数
    $timeout(function() {
      defer.resolve('data received!')
    }, 2000)

    return defer.promise
  }
}
```

这里，我们先创建了一个新的defer对象，然后返回它的`.promise`属性。同时，我们执行我们的异步函数，当在该函数完成的时候，我们执行defer对象的`resolve()`方法。`resolve()`函数的参数会被传递给接下来的回调函数。

##promise对象

现在，我们得到了一个promise对象（通过`defer.promise`得到），接下来，让我们注册一个回调函数，该回调函数会在异步函数执行完成后被调用。

使用`then()`方法为promise对象绑定一个回调函数，该回调函数将返回的字符串打印出来：

```javascript
.run(function(getData) {
  var promise = getData()
    .then(function(string) {
      console.log(string)
    })
})
```

现在，当你刷新页面，两秒后你会看到控制台打印出`"data recived!"`。

##reject一个promise对象

> 注：简而言之，promise的resolve是发出“执行成功”的信号，而reject则是发出“执行失败”的信号。当信号发出，promise会根据不同的信号，执行不同的回调函数。

我们已经知道如何resolve一个promise对象，但如果一个异步函数调用失败了，会怎么样呢？

我们使用`Math.random()`函数模拟promise对象有50%的机会被reject：

```javascript
function getData($timeout, $q) {
  return function() {
    var defer = $q.defer()

    // 模拟异步函数
    $timeout(function() {
      if(Math.round(Math.random())) {
        defer.resolve('data received!')
      } else {
        defer.reject('oh no an error! try again')
      }
    }, 2000)
    return defer.promise
  }
}
```

`then()`方法的第二个参数可以（可选的）接受一个错误处理回调函数，当promise被reject时才会调用该回调函数。

将错误处理函数作为第二参数传给`then()`：

```javascript
.run(function(getData) {
  var promise = getData()
    .then(function(string) {
      console.log(string)
    }, function(error) {
      console.error(error)
    })
})
```

现在，如果你再次刷新页面，你有50%的几率能看到错误消息！

通过调用多个不同`then()`方法，在同一个promise对象上可以注册多个回调函数。这些函数会按照他们注册的顺序一一被调用。

##使用$q构造函数

$q服务本身也是一个函数，它能够让你快速的将一个异步回调函数转换成一个基于Promise模式的函数。

将这个模拟异步函数重写成一个使用`$q()`返回promise对象的函数：

```javascript
function getData($timeout, $q) {
  return function() {
    
    // 模拟异步函数
    return $q(function(resolve, reject) {
      $timeout(function() {
        if(Math.round(Math.random())) {
          resolve('data received!')
        } else {
          reject('oh no an error! try again')
        }
      }, 2000)
    })
    
  }
}
```

这个方法实现的效果跟手动创建defer对象的效果是一样的 -- 你采用哪种方式取决于你的偏好和你是否想要在代码中使用`notify()`。 

##finally方法

Promise模式保证成功回调函数和错误回调函数中，其中必定有一个会被执行，但两者永远不会同时执行。如果你需要确保不论promise对象的结果如何，都执行某一个特殊的函数，那该怎么办？你可以在promise对象上注册一个`finally()`方法。对于将代码重置为可知状态下，这方法是非常有帮助的。

使用`finally()`方法将异步函数完成时的时间戳打印出来：

```javascript
.run(function(getData) {
  var promise = getData()
    .then(function(string) {
      console.log(string)
    }, function(error) {
      console.error(error)
    })
    .finally(function() {
      console.log('Finished at:', new Date())
    })
})
```

不管promise对象是被resolve还是被reject，你都能看到控制台打印出当前时间。



##Promise链式编程

Promise模式一个非常强大的特性是能够链式编写回调函数。这个特性使数据能够在回调链的每一步上进行传递，处理和改变。虽然这一语法非常容易理解，但有时候这语法也会令人困惑。

让我们先看一个基础例子。

首先，我们对我们的异步函数进行修改，我们给`resolve`函数传入一个0-9之间的随机数(不再是"data received"字符串):

```javascript
function getData($timeout, $q) {
  return function() {
    // 模拟异步函数
    return $q(function(resolve, reject) {
      $timeout(function() {
        resolve(Math.floor(Math.random() * 10))
      }, 2000)
    })
  }
}
```

当页面刷新，你应该能够看到一个0-9之间的整数被打印出来。

为了链式调用，我们需要修改回调函数，使其能够返回一个值。

修改promise回调函数，使其返回上述随机数乘以2的值：

```javascript
.run(function(getData) {
  var promise = getData()
    .then(function(num) {
      console.log(num)
      return num * 2
    })
})
```

现在，我们可以使用`then()`函数将另一个回调函数绑定到我们的promise对象上，该函数会在第一个回调函数返回值时被调用。上述随机数两倍的值会传递到第二个回调函数中：

```javascript
.run(function(getData) {
  var promise = getData()
    .then(function(num) {
      console.log(num)
      return num * 2
    })
    .then(function(num) {
      console.log(num) // = random number * 2
    })
})
```

虽然这只是一个简单的例子，但是它阐述了一个非常强大的概念。此外，你不但可以从promise回调函数中返回一个简单的值，你还能够返回一个新的promise对象。那么，promise链会“暂停”直到这个返回的promise对象被resolve。这个特性使你能够链式编写多个异步函数调用（比如多个服务端请求）。

##总结

在angularJS框架中，Promise模式编程已经发挥起重要的作用，随着ES6的发布，将来Promise模式在JavaScript中的作用也会越来越重要。虽然它一开始看起来难以理解（尤其是链式调用），但promise模式为解决异步代码提供了一套直观且简洁的接口，也正因如此，Promise成为了现代JavaScript中的一个基础构建模块。
 




