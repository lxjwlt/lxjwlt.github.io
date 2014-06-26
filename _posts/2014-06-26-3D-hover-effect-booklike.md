---
layout: post
title: "CSS3实现图片的3D-hover效果"
category: front-end
excerpt: '本文主要介绍CSS3实现图片的3D-hover效果，用到`preserve-3d`和透视等等CSS3技术。'
---

在网上发现一个非常炫酷的hover效果，我花了些时间研究了一下，做了一个相似的小DEMO，效果如下：

<iframe width="100%" height="400" src="http://jsfiddle.net/lxjwlt/83k7H/8/embedded/result,html,css/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

我们一看就知道，实现这个效果需要用到CSS3的`transition`渐变属性，使用`transition`属性的关键在于**把握好初始状态和末状态**。所以这个效果无非就是三个元素（封面 书脊 阴影）和两种状态（立着 躺着）。这样看来，这个3D-hover效果也不难实现嘛。

下面为大家介绍这个效果的实现方法（下面只介绍主要的代码，不会具体到所有的代码，比如transition属性，CSS3前缀，宽高设置等等）。

##两位一体：封面 + 书脊
首先对于一本书来说，封面和书脊是一体的，不能分离，也不能重叠，所以封面元素应该包含书脊元素（即父子关系，这比同级关系更好处理两者的相对位置）：

```html
<div class="book">
    <!-- 封面 -->
    <div class="book__cover">
        <!-- 书脊 -->
        <div class="book__back"></div>
    </div>
</div>
```

接下来，我们意识到——封面和书脊的相对位置：**互为90度垂直**。实现方法就像我们折纸：

1. 将书脊放在封面的下面

    ```css
    .book__cover {
        position: relative;
    }
    
    .book__back {
        /* 将书脊放到封面的正下方 */
        position: absolute;
        left: 0;
        top: 100%;
    }
    ```
    
2. 再将书脊向后折90度

    ```css
    .book_back {
        /* 其余代码... */
    
        /* 以顶部为基点，将书脊向后面折叠90度 */
        transform-origin: top;
        transform: rotateX(-90deg);
    }
    ```

此时书脊和封面的相对位置不再是2D的了，而是处于3D空间中，所以这里涉及到了`transform-style`属性和透视的使用：

* `transform-style`：该属性用于设置呈现`transform`变形效果的维度，是2D还是3D。使用该属性能确保旋转的过程，封面和书脊的相对位置不会发生改变
* 透视：在旋转过程中，使HTML元素遵循立体空间中的**近大远小**原则

我们添加以下代码：

```javascript
.book__cover {
    /* 其余代码... */
    
    /* 以远离屏幕1000px的位置作为视点 */
    transform: perspective(1000px);
    transform-style: preserve-3d;
}
```

以上，我们完成了封面和书脊的初始状态，下面我们要实现**末状态**。

我们可以这样考虑——在hover变化过程中，无非就是整个封面向后旋转了一定的度数，我们不必管书脊的变化，因为封闭元素包含着书脊元素，当封面旋转的时候，`preserve-3d`属性值保证了封面和书脊的垂直关系，书脊会随着封面旋转，所以我们只需要旋转封面：

```css
.book:hover .book__cover {
    /* 向后旋转70度 */
    /* 为了实现远离的感觉，适当的缩小封面元素 */
    transform: perspective(1000px) rotate(70deg) scale(0.85);
}
```

有了立着和躺着这两种状态，书本就有了**倒下**的动作了，效果如下：

<iframe width="100%" height="400" src="http://jsfiddle.net/lxjwlt/83k7H/7/embedded/result,html,css/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

##阴影
为了显得更立体，我们可以为书本添加阴影效果。

首先，我们选用封面的before元素`.book__cover:before`作为阴影元素，这样不必增加HTML标签。

其次，为了让该元素更像阴影，其背景色和阴影颜色必须一致，同时为了消除背景色和阴影色之间唐突的边界，我们要增大`box-shadow`的半径（同时也要缩小`.book__cover:before`元素，更下面会看到）：

```css
/* 阴影元素 */
.book__cover:before {
    background: rgba(0,0,0, 0.5);
    box-shadow: 0 0 40px 120px rgba(0,0,0, 0.5);
    /* 淡化阴影效果 */
    opacity: 0.2;
}
```

接着，我们要实现阴影的初始位置——由于书本是立着的，此时阴影应该在书脊正下方，阴影的形状应该和书脊的形状一致，代码如下：

```css
.book__cover:before {
    /* 其余代码... */
    
    /* 注意这里要用scale缩小该元素 */
    transform: rotateX(90deg) translateZ(-50px) scale(0.54);
    transform-origin: bottom;
}
```

ok，接着，下面我们要实现**末状态**，我们可以这样考虑的：

* 书本倒下的同时，书本也贴近“桌面”，所以阴影要**贴近**书本，而且阴影要变浓，即**颜色加深**
* 当书本倒下时，封面的形状就是阴影的形状，所以此时阴影应该是和封面平行的。我们知道，当**不旋转**的时候，页面中所有元素都是平行的，所以阴影元素应设置`rotate(0)`

最后，我们用CSS将这个状态画出来：

```css
.book:hover .book__cover:before {
    /* 颜色加深 */
    opacity: 1;
    /* 减小translateZ值实现贴近桌面效果 并且 旋转角度为0 */
    transform: rotateX(0) translateZ(-30px) scale(0.52);
}
```

最后效果如下：

<iframe width="100%" height="400" src="http://jsfiddle.net/lxjwlt/83k7H/6/embedded/result,html,css/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

##参考

* [3D Hover Effect for Thumbnails and Images](http://thecodeplayer.com/walkthrough/3d-thumbnail-image-hover-effect)
* [CSS3 3D transform变换，不过如此](http://www.zhangxinxu.com/wordpress/2012/09/css3-3d-transform-perspective-animate-transition/)
* [CSS3 Transition](http://www.w3cplus.com/content/css3-transition/)