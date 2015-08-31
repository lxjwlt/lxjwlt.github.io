---
layout: post
title: "[译]《Sphinx权威指南》 - Sphinx入门"
category: front-end
excerpt: '最近社区搜索功能要进行优化，由于需求点比较多，功能要求比较“夸张”，我们弃用了Discuz本身那套搜索逻辑代码，自行引入Sphinx搜索引擎进行重新开发（Discuz本身带有Sphinx，但只提供基本选项，可定制度低）。Sphinx搜索引擎提供全文搜索，且性能比MySQL查询好，加之国人在Sphinx之上开发的CoreSeek，使得...'
---

[原文链接](https://www.lvh.io/posts/queryselectorall-from-an-element-probably-doesnt-do-what-you-think-it-does.html)

现代浏览器提供了querySelector和querySelectorAll这两API。它们用来查询匹配CSS选择器的单个或多个元素。这类似CSS选择器：用class或ID选取元素。如果你没有用过它们，MDN上有非常棒的[介绍](https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Getting_started/Selectors)。

想象下面的HTML页面：

```html
<!DOCTYPE html>
<html>
<body>
    <img id="outside">
    <div id="my-id">
        <img id="inside">
        <div class="lonely"></div>
        <div class="outer">
            <div class="inner"></div>
        </div>
    </div>
</body>
</html>
```

`document.querySelectorAll("div")`返回页面中所有div元素组成的节点列表（NodeList类型的对象），而`document.querySelector("div.lonely")`返回一个单独的div元素。

`document`元素支持querySelector和querySelectorAll，你可以在整个页面文档中查找元素。元素本身也支持querySelector和querySelectorAll，你可以查找该元素的子代元素。例如，下面的表达式会查找#my-id下的图片子代元素：

```javascript
document.querySelector("#my-id").querySelectorAll("img")
```

在上述html页面例子中，这个表达式将查询到` <img id="inside">` 而不会匹配` <img id="outside">`

好好想想，下面这两个表达式做了什么？

```
document.querySelectorAll("#my-id div div");
document.querySelector("#my-id").querySelectorAll("div div");
```

你可能想当然地认为它们是等价的。毕竟，第一个是查询一个被#my-div下div包裹的div元素，而另一个是查询一个被div包裹的div元素，而这个div是#my-id的子代元素。然而，当你看这个[http://jsbin.com/hineco/edit?html,js,output](JSbin)时，你会发现，它们返回了非常不一样的结果：

```
document.querySelectorAll("#my-id div div").length === 1;
document.querySelector("#my-id").querySelectorAll("div div").length === 3;
```

这里到底是怎么回事？

这是因为，`element.querySelectorAll`不是从`element`开始匹配元素的。而事实上，它会在`element`的子代元素中匹配查询条件。因此，我们找到了三个div元素： div.lonely，div.outer，div.inner。我们找它们是因为它们都匹配`div div`选择符，而且它们都是#my-id的子代元素。

我们要记住，querySelector/querySelectorAll下的CSS选择器是绝对的。它们并不会相对于任何特定的元素，甚至不会相对于调用querySelectorAll的元素。

这甚至对调用querySelectorAll的元素的外部元素生效。例如，这个选择器：

```javascript
document.querySelector("#my-id").querySelector("div div div")
```

...在这个代码段（[JSbin](http://jsbin.com/woropuc/edit?html,js,output)）中匹配`div.inner`：

```html
<!DOCTYPE html>
<html>
  <body>
    <div>
      <div id="my-id">
        <div class="inner"></div>
      </div>
    </div>
  </body>
</html>
```

这个API让我觉得很意外，我所问过的前端工程师也同意我的观点。然而，这个并不是一个bug。这就是规范定义它的工作方式，而浏览器也一致地按这种方式实现了它。[John Resig 评论](http://ejohn.org/blog/thoughts-on-queryselectorall/)道，当这个规范出来的时候，他和其他人都感到这个API的行为相当的诡异。

如果你无法轻易地将选择器重写为“绝对的”形式，这里有两个选择：`:scope`CSS伪选择器和`query/queryAll`。

`:scope`伪选择器是相对当前作用域进行匹配的。这名字来自CSS的作用域标识符，它能够限定样式在文档中的范围。

```javascript
document.querySelector("#my-id").querySelectorAll(":scope div div");
```

不幸的是，支持作用域CSS和`:scope`伪选择器的浏览器非常少。只有最新的火狐浏览器默认支持它。Chrome和Opera需要隐藏的很深的实验功能来开启它。Safari的实现则漏洞白出。而IE干脆没有实现。

另一个选择是`element.query/queryAll`。它们是`querySelector`和`querySelectorAll`的替代方法，存在DOM父节点上。它们也接受选择器，但这些选择器的解析是相对于调用这些方法的元素。不幸的是，这些方法更加模糊不清：MDN或caniuse.com里都没有提及它们，并且2015年6月18日的DOM4草案中也不见踪影。他们仍然存在于一个较旧的版本中，于2014年二月4日，也出现在WHATWG 现存文档中。他们已经被至少两个扩展兼容库实现：

* [Dom4](https://webreflection.github.io/dom4/)
* [dom-elements](https://github.com/barberboy/dom-elements)

总的来说，DOM规范不是总是清晰明了的。了解像这些坑很重要，因为从它们的行为中很难了解它们的实质特性。幸运的是，你可以重写你的选择器，所以没什么关系。如果你无法重写选择器，这里会有一些实现库为你提供你要的现代API。另外，类似jQuery的库会为你提供一套稳定的友好的接口来查找DOM元素。


