---
layout: post
title: "[译文]深入浅出AngularJS作用域"
category: front-end
excerpt: '在AngularJS中，子作用域通常会原型继承于父作用域。这种情况的唯一例外是当一个指令设置了`scope:{ ... }` -- 这会创建一个孤立的作用域，该作用域不会进行原型继承。这种设置通常用于创建可复用组件。在指令中...'
---

[开启更好的阅读模式](https://www.zybuluo.com/lxjwlt/note/107324)

原文链接：[Understanding Scopes](https://github.com/angular/angular.js/wiki/Understanding-Scopes)

####名词解释
* 指令： 原文为directive，AngularJS 中提供*directive*接口，通常用于DOM操作，也常用于自定义组件
* 作用域：原文为Scope，AngularJS中充斥各种作用域，作用域用于存储视图数据，相当于MVVM中的View Model，即视图模型
* 服务: 原文为Service，用于存储公共数据，想到于MVVM中的Model，即模型

####摘要
在AngularJS中，子作用域通常会原型继承于父作用域。这种情况的唯一例外是当一个指令设置了`scope:{ ... }` -- 这会创建一个孤立的作用域，该作用域不会进行原型继承。这种设置通常用于创建可复用组件。在指令中，默认情况下直接使用父作用域，这意味着，你在指令中作的任何改动都会同时改变父作用域。如果你设置`scope:true`（而不是`scope:{ ... }`），那么该指令会进行原型继承。

一般来说，作用域继承是很简单的，通常你甚至不需要知道它正在运作...直到你试图从子作用域中对父级作用域的基本类型数据（比如，数字，字符串，布尔值）进行数据双向绑定（即表单元素，ng-model指令）。这种做法通常不会符合我们的预期。这是因为子作用域会创建自身的属性，从而隐藏/遮蔽了父级作用域的同名属性。这种特性是JavaScript原型链运作原理，而不是AngularJS本身实现造成的。AngularJS初学者通常没有意识到，ng-repeat、ng-switch、ng-view和ng-include所有这些指令都会创建一个子作用域，所以当执行这些指令时便会出现问题。（想了解这个问题，请查看[这个例子](http://plnkr.co/edit/zZfUQN?p=preview)）

如果我们遵循[记得在ng-model指令中使用'.'](https://www.youtube.com/watch?v=ZhfUv0spHCY&feature=youtu.be&t=30m)文章中的“最佳实现”-- 值得花3分钟看看，我们能轻易地回避这个问题。Misko用ng-switch阐述了基本类型数据绑定的问题。

在你的ng-model指令中使用`.`能保证原型继承链起作用。所以，我们应该使用`<input type="text" ng-model="someObj.prop1">`而不是`<input type="text" ng-model="prop1">`。

如果你真的想或者真的需要用到基本类型数据，这里有两种变通方案：

1. 在子作用域中使用`$parent.parentScopeProperty`，防止子作用域创建自身的属性
2. 在父作用域中定义一个函数，并在子作用域中调用并传递基本类型数据给父作用域（并不是总能够做到）

####细节:

* [JavaScript Prototypal Inheritance](https://github.com/angular/angular.js/wiki/Understanding-Scopes#javascript-prototypal-inheritance)
* [Angular Scope Inheritance](https://github.com/angular/angular.js/wiki/Understanding-Scopes#angular-scope-inheritance)
    * [ng-include](https://github.com/angular/angular.js/wiki/Understanding-Scopes#ng-include)
    * [ng-switch](https://github.com/angular/angular.js/wiki/Understanding-Scopes#ng-switch)
    * [ng-repeat](https://github.com/angular/angular.js/wiki/Understanding-Scopes#ng-repeat)
    * [ng-view](https://github.com/angular/angular.js/wiki/Understanding-Scopes#ng-view)
    * [ng-controller](https://github.com/angular/angular.js/wiki/Understanding-Scopes#ng-controller)
    * [ng-directives](https://github.com/angular/angular.js/wiki/Understanding-Scopes#directives)

##JavaScript 原型继承
首先，我们要对JavaScript的原型继承有个良好的认知，这很重要，如果你有服务端编程的背景，更是如此。所以让我们先回顾一下原型继承的原理。

假设父级作用域有以下属性aString、aNumber、anArray、anObject 和 aFunction。如果子作用域原型继承于父作用域，我们有：

![](https://camo.githubusercontent.com/85ec776a0dd4acbe687f3db6367fa56872abb87f/687474703a2f2f692e737461636b2e696d6775722e636f6d2f61544147672e706e67)

当我们试图从子作用域中访问父作用域上定义的属性，JavaScript会先在子作用域上查询该属性，如果没有找到该属性，再访问父级作用域并查询该属性。（如果在父作用域中依旧没有找到这个属性，JavaScript会继续顺着原型链往上查找... 直到根作用域）。因此，以下均为true:

```javascript
childScope.aString === 'parent string'
childScope.anArray[1] === 20
childScope.anObject.property1 === 'parent prop1'
childScope.aFunction() === 'parent output'
```

假设我们接下来进行以下操作：

```javascript
childScope.aString = 'child string';
```

原型链并未被查询，而子作用域中新增了一个 aString 属性。**这个新的属性隐藏/遮蔽了父作用域的同名属性**。当我们下面讨论到ng-repeat指令和ng-include指令时，这特性会变得非常重要。

![](https://camo.githubusercontent.com/be4cd25951780638cf181b743b723ba6fb6ddb47/687474703a2f2f692e737461636b2e696d6775722e636f6d2f4f795650572e706e67)

接下来假设我们执行：

```
childScope.anArray[1] = '22'
childScope.anObject.property1 = 'child prop1'
```
因为在子作用域中没有找到 anArray 和 anObject 对象，所以原型链被查询了。在父作用域中被找到这两个对象，所以属性值被更新到了原始的对象上。子作用域上没有添加新的属性，也没有创建新的对象。（注意，在JavaScript中数组和函数都是对象）。

![](https://camo.githubusercontent.com/57f1938d241122bf49583ed64ee093e45e5dd012/687474703a2f2f692e737461636b2e696d6775722e636f6d2f32516365552e706e67)

接着，假设我们这么做：

```javascript
childScope.anArray = [100, 555]
childScope.anObject = { name: 'Mark', country: 'USA' }
```

原形链并未被访问，并且子作用域获得了两个新的对象属性，这两个属性也会遮蔽父作用域上的同名属性。

![](https://camo.githubusercontent.com/4679189c134e25e7dd7fcee18bc676cf9ec6b295/687474703a2f2f692e737461636b2e696d6775722e636f6d2f684b6574482e706e67)

顺便提一下：

* 如果我们读取`childScope.propertyX`，并且子作用域有 propertyX 属性，那么原型链将不会被访问。
* 如果我们设置`childScope.propertyX`，那么原型链也不会被访问。

最后一种情况：

```javascript
delete childScope.anArray
childScope.anArray[1] === 22  // true
```

我们先删除子作用域的属性，然后当我们试图再次访问该属性，此时原型链会被访问。

![](https://camo.githubusercontent.com/7f2d4d76e472463fa2980802a08cb3bedca7e0cd/687474703a2f2f692e737461636b2e696d6775722e636f6d2f3536756f652e706e67)

你可以从这个[jsfiddle](http://jsfiddle.net/5qjLd/)中看到上述关于原型继承的例子和结果（打开你浏览器的控制台查看输出结果。控制台输出结果可以看作是根目录的内部构造）。

##Angular 作用域的继承

两种不同的情况：

* 以下指令会创建新的作用域，而且原型继承父级作用域：ng-repeat、 ng-include、ng-switch、ng-view、ng-controller、带`scope: true`的指令、设置了`transclude:true`的指令
* 以下指令会创建新的作用域，但不会原型继承：设置了`scope: { ... }`的指令。这指令创建的是封闭的作用域。

注意，通常情况下，即默认情况下`scope:false`，指令不会创建新的作用域。

###ng-include

假设我们的控制器中有：

```javascript
$scope.myPrimitive = 50;
$scope.myObject    = {aNumber: 11};
```

而且在我们的HTML中：

```html
<script type="text/ng-template" id="/tpl1.html">
    <input ng-model="myPrimitive">
</script>
<div ng-include src="'/tpl1.html'"></div>


<script type="text/ng-template" id="/tpl2.html">
    <input ng-model="myObject.aNumber">
</script>
<div ng-include src="'/tpl2.html'"></div>
```

每一个ng-include指令都生成一个新的子作用域，这些子作用域都原型继承于其父作用域。

![](https://camo.githubusercontent.com/67fc2d40487725fde10b669426c8b6b74213e6c6/687474703a2f2f692e737461636b2e696d6775722e636f6d2f7a694466782e706e67)

在第一个输入框中输入77，子作用域将会得到一个新的myPrimitive属性，该属性会遮蔽了父作用域的同名属性。这可能不是你想要的。

![](https://camo.githubusercontent.com/f1c9d54bd5b13d1e479b41ca6062b4b9fecc8fe2/687474703a2f2f692e737461636b2e696d6775722e636f6d2f376c3864672e706e67)

在第二个输入框中输入99不会新建一个子作用域属性。因为tpl2.html绑定的数据是一个对象属性。当ngModel指令查询该对象，原型继承起到了作用，最终在父作用域中查找到该对象。

![](https://camo.githubusercontent.com/5a6ff2644b1b7a15621c2a20928abfce0a2018bb/687474703a2f2f692e696d6775722e636f6d2f6f764a6547706f2e706e67)

如果我们不想将我们的数据从基本类型改为对象，我们可以用$parent变量重写第一个模版：

```html
<input ng-model="$parent.myPrimitive">
```

在该输入框中输入22不会生成一个新的子作用域属性。现在，这个模型是绑定在父级作用域的一个属性上（因为`$parent`是子作用域上指向父作用域的属性值）。

![](https://camo.githubusercontent.com/40767f9e9cc824e5c9ef178e385c9daa40ade6ba/687474703a2f2f692e737461636b2e696d6775722e636f6d2f6b6438706a2e706e67)

对于所有的作用域（无论是否原型继承），Angular总会通过`$parent`、`$$childHead`和`$$childTail`记录下父-子关系（即一种层级关系）。以上的图表并没有展示这些属性值。

对于一些不涉及表单元素的情况，另一种解决方法是在父级作用域中定义一个函数用来修改基本类型数值。然后保证其子作用域都调用该函数，由于原型继承，其子作用域都能够访问的该函数。比如：

```javascript
// in the parent scope
$scope.setMyPrimitive = function(value) {
    $scope.myPrimitive = value;
}
```

这里有个[示例fiddle](http://jsfiddle.net/mrajcok/jNxyE/)运用这类”父级函数“方法。

更多阅读[http://stackoverflow.com/a/13782671/215945](http://stackoverflow.com/a/13782671/215945)和[http://stackoverflow.com/a/13782671/215945](http://stackoverflow.com/a/13782671/215945)

###ng-switch
ng-switch指令的作用域继承的运行原理就类似于ng-include指令。所以如果你需要对父级作用域中的一个基本类型值进行双向版定，你可以使用`$parent`，或者将数据模型改成对象的形式，然后绑定该对象上的属性。这可以避免子作用域遮蔽到了父作用域上的属性。

更多阅读[AngularJS, bind scope of a switch-case?](http://stackoverflow.com/questions/12405005/angularjs-bind-scope-of-a-switch-case/12414410)

###ng-repeat

ng-repeat指令的运行原理有点不一样。假设我们控制器中有：

```javascript
$scope.myArrayOfPrimitives = [ 11, 22 ];
$scope.myArrayOfObjects    = [{num: 101}, {num: 202}];
```

而且我们的HMTL中：

```html
<ul><li ng-repeat="num in myArrayOfPrimitives">
       <input ng-model="num"></input>
    </li>
</ul>
<ul><li ng-repeat="obj in myArrayOfObjects">
       <input ng-model="obj.num"></input>
    </li>
</ul>
```

每次迭代，ng-repeat指令都会创建一个新的作用域，该作用会原型继承于其父级作用域，**但是同时该指令会给这个新作用域的一个新的属性分配本次迭代对应数值**。（这个属性的名称就是循环变量的名字）。以下就Angular源码中ng-repeat具体实现：

```javascript
childScope = scope.$new(); // child scope prototypically inherits from parent scope ...     
childScope[valueIdent] = value; // creates a new childScope property
```

如果迭代项为基本类型，实质上把该值的拷贝分配给了子作用域新的属性。改变这个属性值（即子作用域的属性`num`）不会改变父作用域引用的数组。所以在上述第一个ng-repeat指令中，每个子作用域都获得一个独立于`myArrayOfPrimitives`数组的`num`属性：

![](https://camo.githubusercontent.com/3254baf91afdd969e6f167eeeb59950a0399a8f1/687474703a2f2f692e737461636b2e696d6775722e636f6d2f6e4c6f69572e706e67)

这个ng-repeat指令不会如你期望搬工作。在Angular1.0.2及之前版本中，在输入框中输入，会改变灰色框框内的值，即子作用域的属性值。在Angular 1.0.3+版本，在文本框中输入不会有任何效果（参考Artem的在[stackOverflow](http://stackoverflow.com/a/13723990/215945)上的解释）。我们想要的是，输入的值能改变myArrayOfPrimitives数组，而不是子作用域的属性值。为了实现这一点，我们需要将模型改成一个包含对象的数组。

所以，如果迭代元素是一个对象，那么分配到子作用域上的就是一个对原始对象的引用（而不是拷贝）。改变子作用域的属性值便会同时改变父级作用域引用的对象。所以在上述第二个ng-repeat指令中，我们有：

![](https://camo.githubusercontent.com/881318ad2d70364cf61d50faf536a7ce08f39777/687474703a2f2f692e737461636b2e696d6775722e636f6d2f51536a544a2e706e67)
（我用灰色标记其中一条线，以便清晰展现它的指向）

这将如期工作。在文本框中的输入将改变灰色框框中的值，这将同时反映到子作用域和父级作用域中。

更多阅读[Difficulty with ng-model, ng-repeat, and inputs](http://stackoverflow.com/questions/13714884/difficulty-with-ng-model-ng-repeat-and-inputs)和[ng-repeat and databinding](http://stackoverflow.com/a/13782671/215945)

###ng-view

待定，但我认为该指令和ng-include指令表现一致。

###ng-controller

使用ng-controller指令嵌套控制器会造成常规的原型继承，就像ng-include指令和ng-switch指令，所以我们可以用相同的方法解决。然而，“通过作用域继承，在两个控制器中共享数据是一种非常糟糕的实现” -- [http://onehungrymind.com/angularjs-sticky-notes-pt-1-architecture/ ](http://onehungrymind.com/angularjs-sticky-notes-pt-1-architecture/ )，我们应该用服务在控制器之间共享数据。

（如果你真的要通过控制器的作用域继承来分享数据，你不需要做额外的工作。子作用域可以访问所有父级作用域的属性。更多阅读[Controller load order differs when loading or navigating](http://stackoverflow.com/questions/13825419/controller-load-order-differs-when-loading-or-navigating/13843771#13843771)）。

###指令

1. 默认设置`scope: false` - 指令不会新建一个作用域，所以这里不存在继承关系。这很简单，但同时也很危险，比如某指令中可能会创建一个新的属性，然而事实上，这个属性影响到了另一个已经存在的属性。对于书写可复用组件的指令来说，这不是一个好的选择。

2. `scope: true` - 指令会创建一个新的子作用域，原型继承于父级作用域。如果多个指令（在同一个DOM元素上）请求新的作用域，那么只会创建一个作用域。因为涉及到原型继承，就像ng-include和ng-switch，所以我们要谨慎对待父级作用域基本类型数据的双向绑定和子作用域遮掩父级作用域属性的问题。

3. `scope: { ... }` - 指令会新建一个封闭的作用域。该作用域不会进行原型继承。这样的配置通常是你创建可复用组件的最好选择，因为这指令不会意外地读取或修改父级作用域。然而，有些指令通常需要访问父作用域的数据。设置对象是用来配置父作用域和封闭作用域之间的双向绑定（使用`=`）或单向绑定（使用`@`）。这里也可以使用`&`绑定父作用域上的表达式。所以，这些配置都会将来自父作用域的数据创建到本地作用域属性中。要注意的是，这些配置选项只是用来设置绑定方式 -- 你只能运用Dom元素的属性引入父作用域的属性们，而不可以在配置选项中直接引用。比如你想将父作用域的属性`parentProp`绑定到封闭的作用域：`<div my-directive>`和`scope: { localProp: '@parentProp'}`，这不会起作用。我们必须用DOM元素属性定义指令需要绑定的每一个父作用域属性：`<div my-directive the-Parent-Prop=parentProp>`和`scope: { localProp: '@theParentProp' }`。

封闭作用域的`__proto__`引用的是一个[Scope](http://docs.angularjs.org/api/ng.%24rootScope.Scope)对象。封闭作用域的`$parent`指向父作用域，所以，虽然该作用域保持封闭而且不会原型继承于父作用域，但它依旧是一个子作用域。

对于下图我们有`<my-directive interpolated="{{parentProp1}}" twowayBinding="parentProp2">`和`scope: { interpolatedProp: '@interpolated', twowayBindingProp: '=twowayBinding' }`，而且假设这个指令在link函数中进行如下操作：`scope.someIsolateProp = "I'm isolated"`

![](https://camo.githubusercontent.com/0c650e5b62347beec5ebbb4990673a523a80968c/687474703a2f2f692e737461636b2e696d6775722e636f6d2f45586a5a712e706e67)

更多关于封闭作用域的信息请查阅[http://onehungrymind.com/angularjs-sticky-notes-pt-2-isolated-scope/](http://onehungrymind.com/angularjs-sticky-notes-pt-2-isolated-scope/)

4. `transclude: true` - 指令新建一个用于"transclude（嵌入）"的子作用域，该作用域原型继承于父作用域。所以如果你嵌入的内容（指替换ng-transclude指令的内容）中需要对父作用域中的数据进行双向绑定，你应该使用`$parent`或把数据模型改成对象，然后把需要的属性绑定在这对象上。这样能够避免子作用域遮蔽父作用域的属性。

如果ng-transclude指令和封闭作用域是同级关系，那么它们各自作用域的`$parent`属性都指向同一个父作用域。如果ng-transclude指令和封闭作用域同时存在，那么封闭作用域上的`$$nextSibling`会指向ng-transclude作用域。

更多ng-transclude指令作用域的信息请查阅[AngularJS two way binding not working in directive with transcluded scope ](http://stackoverflow.com/a/14484903/215945)

假设上面的指令加上`transclude:true`，我们有下面这张图：

![](https://camo.githubusercontent.com/4d9a7cbb029bb29d66cbbef0f0527b2d40202d90/687474703a2f2f692e737461636b2e696d6775722e636f6d2f41684f47482e706e67)

这个[fiddle]有个showScope函数，该函数可以用来检测封闭作用域及其关联的ng-transclude作用域。注意看fiddle中的评论结构。

##总结
一共有3种类型的作用域：

1. 常规的原型继承的作用域 -- ng-include, ng-switch, ng-controller, 设置了`scope: true`的指令。
2. 封闭作用域 -- 设置`scope: {...}`的指令。这种作用域没有原型继承，但'=', '@', 和 '&'提供了一套通过元素属性访问父作用域的机制。
3. transclude作用域 -- 设置了`transclude: true`的指令。这种作用域也是常规的原型继承，但它和任何封闭作用域是同级关系。

对于所有作用域（无论是否原型继承），Angular都会通过作用域的属性`$parent``$$childHead``$$childTail`记录下父-子关系。
