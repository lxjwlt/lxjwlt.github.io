---
layout: post
title: "[译文]跨浏览器的inline-Block属性"
category: front-end
---

>原文地址：[Cross-Browser Inline-Block](https://blog.mozilla.org/webdev/2009/02/20/cross-browser-inline-block/)


啊，`inline-block`这一`display`的属性值，既难以抓摸又那么吸引人，它那么的有用，却又极少人知道。我已经很多次接收到像这样的PSD文件了：

![PSD](http://blog.mozilla.org/webdev/files/2009/02/gallery-view.jpg)

然后我哭了。

一般来说，这种布局是很容易实现的。固定的宽度，固定的高度，加上向左浮动`float:left`，然后就完成了。但但但但但是，这种设计是需要适用于不定量的内容，这意味着，如果其中一个块包含了比其余块要更多的内容，那它将破坏整个布局：

![breakable layout](http://blog.mozilla.org/webdev/files/2009/02/float-broken.jpg)

因为第一个块比其余的都要高，于是第五个块向左浮动时就顶住了它，而不是在它的下面。其实我们主要是想实现这样一个布局——它既有表格`table`的灵活性又有合适的语义化的标签。

我们以一个设定为`display:inline-block;`的无序列表来创建一个简单的页面：

	<ul>
	    <li>
	        <h4>This is awesome</h4>
	        <img src="http://farm4.static.flickr.com/3623/3279671785_d1f2e665b6_s.jpg"
	        alt="lobster" width="75" height="75"/>
	    </li>
	...
	<ul>

	<style>
	    li {
	        width: 200px;
	        min-height: 250px;
	        border: 1px solid #000;
	        display: inline-block;
	        margin: 5px;
	    }
	</style>

这页面在Firefox 3, Safari 3 和 Opera上看起来没问题：

![step1](http://blog.mozilla.org/webdev/files/2009/02/step1.jpg)

显然，某个块在垂直对齐方面看起来出错了。好吧，这并不是真正的出错，这是正确的表现形式，只是这不并是我们所想要的。

导致这种现象的原因在于——每一个`li`元素的[基线](http://dev.w3.org/csswg/css3-linebox/#baseline)`baseline`都要对齐父元素`ul`的基线。你问，什么是基线`baseline`？一图胜千言：

![baseline](http://blog.mozilla.org/webdev/files/2009/02/baseline.gif)

基线就是那条穿过以上文字的黑线。简单来说，`inline` 或 `inline-block` 元素的 [`vertical-align` 默认值](http://www.w3.org/TR/CSS21/visudet.html#propdef-vertical-align)都是 `baseline`，这意味着这些元素的基线都将向它们的父元素的基线对齐：

![baseline illustrate](http://blog.mozilla.org/webdev/files/2009/02/baseline-inline-block.jpg)

正如你看到的，每个元素的基线都与文本'This is the baseline'对齐。这段文本并不包含在`li`元素中，而只是父元素`ul`中单纯的一段文本而已，这样做是为了说明父元素的基线在哪里。

无论如何，要修复这看似出错的现象是非常简单的——`vertical-align:top`，这样得到一个看起来很不错的布局：

![inline block 2](http://blog.mozilla.org/webdev/files/2009/02/inline-block-2.jpg)

然而这种方法在Firefox 2, IE 6 和 IE 7中不起作用：

![inline-block-ff2](http://blog.mozilla.org/webdev/files/2009/02/inline-block-ff2.jpg)

让我们先解决Firefox 2。

Firefox 2虽然不支持`inline-block`属性值，但它却支持Mozilla独有的`display`属性值 —— `-moz-inline-stack`，这个属性的表现就如同`inline-block`。而且当我们将它添加在`display:inline-block`的前面，Firefox 2会忽略掉规范的声明而留下`-moz-inline-stack`，因为它不支持`inline-block`，而那些支持`inline-block`的浏览器则会使用`inline-block`而忽略掉**前面定义的**`diaplay`属性值。

	<style>
	    li {
	        width: 200px;
	        min-height: 250px;
	        border: 1px solid #000;
	        display: -moz-inline-stack;
	        display: inline-block;
	        vertical-align: top;
	        margin: 5px;
	    }
	</style>

非常不幸，这里还是有个小小的bug：

![inline-block in ff2](http://blog.mozilla.org/webdev/files/2009/02/inline-block-3.jpg)

老实说，我不知道是什么造成这个bug。但这里有个快速修复的方法——只需要将`<li>`中的所有元素都包含进一个`<div>`：

	<li>
        <div>
            <h4>This is awesome</h4>
            <img src="http://farm4.static.flickr.com/3623/3279671785_d1f2e665b6_s.jpg"
            alt="lobster" width="75" height="75"/>
        </div>
	</li>

这种方法看起来像是'重置'了`<li>`里所有的元素，然后让它们表现正常了：

![inlin-block 2](http://blog.mozilla.org/webdev/files/2009/02/inline-block-2.jpg)

现在，轮到IE 7了。IE 7不支持`inline-block`，但我们可以骗它去将`li`渲染成`inline-block`。怎么做？用[hasLayout](http://haslayout.net/haslayout)——一种神奇的IE属性。虽然你不能通过一些类似`hasLayout:true;`的方式来为一个元素明确地设置hasLayout，但是你可以用其他类似`zoom:1;`的声明来开启这一IE属性。

总之，hasLayout有点像小仙女的魔方粉末，你可以将它洒在那些渲染问题上，然后让他们消失不见。

当我们将`zoom:1`和`*display:inline`(针对IE6 & 7的hack方法)添加在`<li>`上，我们可以让IE 7 将这些元素渲染得如同`inline-block`一样：

	<style>
	    li {
	        width: 200px;
	        min-height: 250px;
	        border: 1px solid #000;
	        display: -moz-inline-stack;
	        display: inline-block;
	        vertical-align: top;
	        margin: 5px;
	        zoom: 1;
	        *display: inline;
	    }
	</style>

![inline-block in IE 7](http://blog.mozilla.org/webdev/files/2009/02/inline-block-ie7.jpg)

呼！快完成了，就只剩 IE6 了：

![inline-block IE6](http://blog.mozilla.org/webdev/files/2009/02/inline-block-ie6.jpg)

虽然IE6 并不支持`min-height`属性，但感谢它对`height`属性不规范地处理，我们可以利用这一点来达到同样的效果。将`_height`属性([ IE6 下划线hack](http://www.ejeliot.com/blog/63))设置为`250px`，这样会使所有的`<li>`的高度设为250px，而且如果它们的内容超过这一高度，它们会自动扩大来适应这一高度。其他的浏览器则会忽略掉`_height`属性。

于是，经过了以上所有的工作后，以下是最终的 CSS 和 HTML：

	<style>
	    li {
	        width: 200px;
	        min-height: 250px;
	        border: 1px solid #000;
	        display: -moz-inline-stack;
	        display: inline-block;
	        vertical-align: top;
	        margin: 5px;
	        zoom: 1;
	        *display: inline;
	        _height: 250px;
	    }
	</style>
	
	<li>
        <div>
            <h4>This is awesome</h4>
            <img src="http://farm4.static.flickr.com/3623/3279671785_d1f2e665b6_s.jpg"
            alt="lobster" width="75" height="75"/>
        </div>
	</li>