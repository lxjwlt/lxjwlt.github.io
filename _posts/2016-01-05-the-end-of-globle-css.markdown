---
layout: post
title: "全局CSS的终结"
category: front-end
excerpt: '所有的CSS选择器共享同一个全局作用域。每个接触CSS足够长时间的人一定都对CSS全局特性感到困扰 - 这种在文档型网页时代设计出来的模式，面对当...'
---

[>>更好的阅读体验](https://www.zybuluo.com/lxjwlt/note/256564)

[原文链接](https://medium.com/seek-ui-engineering/the-end-of-global-css-90d2a4a06284#.mep0k0rrc)

---

所有的CSS选择器共享同一个全局作用域。

每个接触CSS足够长时间的人一定都对CSS全局特性感到困扰 - 这种在文档型网页时代设计出来的模式，面对当今的Web应用，想要提供良好的开发环境却未免显得乏力。

每个选择器都有可能带来意想不到的影响，比如指向不需要的元素或者与其他选择器产生冲突。更始料不及的是，选择器的权重甚至可能在全局作用域中败下阵来，导致样式在页面中发挥不了任何作用。

任何时候我们修改CSS文件，我们都需要小心翼翼地考虑这些样式在全局环境下的影响。没有任何一个前端技术是需要如此之多的规范，仅仅是为了保证代码最小程度的可维护性。

但这本不该如此。

是时候将全局样式抛之脑后。

是时候拥抱本地CSS。

---

**其他语言中，全局环境下少量的永久性修改是可以被接受的。**

感谢JavaScript社区提供的这些工具，[Browserify](http://browserify.org/)，[Webpack](http://webpack.github.io/)和[JSPM](http://jspm.io/)，让我们的代码可以由一小块一小块的模块组合而成，这些模块中只需要明确指定它们的依赖，并且导出少量的API接口。

然而，不知为何，CSS似乎依旧无人问津。

我们中的许多人 - 包括我自己，直到现在 - 使用CSS太久了以至于我们觉得CSS缺失本地作用域是一个我们无法解决，只能等所有人都用上支持[Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Shadow_DOM)的浏览器才能解决的问题。

我们使用过一系列的命名规范来解决全局作用域的问题，比如[OOCSS](http://oocss.org/)，[SMACSS](https://smacss.com/)，[BEM](https://en.bem.info/)和[SUIT](https://suitcss.github.io/)，这些规范为我们提供了避免命名冲突的方法并提供了一套可用的作用域规则。

毫无疑问，这是迈向良性CSS的关键一步，但即便如此，这些规范都没有解决样式表的真正问题。无论我们选择使用哪种规范，我们还是会被全局选择器所困扰。

但2015年4月22日这天，一切都迎来改变。

---

正如我们不久前的博文 - [“BEM 你的下一代JavaScript组件”](https://medium.com/seek-ui-engineering/block-element-modifying-your-javascript-components-d7f99fcab52b) - 中提到的，我们可以使用[Webpack](http://webpack.github.io/)在JavaScript模块中导入CSS。如果这对于你来说不太熟悉，你最好先阅读[这篇文章](https://medium.com/seek-ui-engineering/block-element-modifying-your-javascript-components-d7f99fcab52b)，不然你可能会忽略接下来介绍的关键点。

使用Webpack的[css-loader加载器](https://github.com/webpack/css-loader)，像这样导入组件的CSS：

```javascript
require('./MyComponent.css');
```

乍一看 - 即使没注意到我们导入的是CSS而不是JavaScript - 这行代码也显得相当奇怪。

通常，require调用会给当前的作用域提供一些东西。如果没有，这很可能是引入了影响全局的模块 - 通常这都是糟糕的设计。

但这是CSS - 全局的影响是必须的。

至少我们是这么认为的。

---

在[2015年4月22日](https://github.com/webpack/css-loader/commit/d2c9c25721a711b0fe041c597b43646e82d9f145)，[Tobias Koppers](https://github.com/sokra) - 永不知疲惫的Webpack作者 - 为css-loader加载器一个新功能的提交了第一个迭代版本，当时该功能名叫placeholders，就是现在众所周知的[local scope](https://github.com/webpack/css-loader#local-scope)。

这个功能让我们能够从CSS文件中把类名导入到JavaScript代码中。

简单来说，不这么写：

```javascript
require('./MyComponent.css');
```

而是这么写：

```javascript
import styles form './MyComponent.css';
```

那么，这个例子中，styles变量到底等于什么？

为了了解CSS文件到底输出了什么，让我们来看看样式表的写法：

```css
:local(.foo) {
  color: red;
}
:local(.bar) {
  color: blue;
}
```

上述代码中，我们使用css-loader加载器的特定语法`:local(.identifier)`输出了两个标识 - foo和bar。

我们可以在JavaScript文件中使用这些标识对应的类名。例如，我们使用[React](http://facebook.github.io/react/)：

```javascript
import styles from './MyComponent.css';
import React, { Component } from 'react';
export default class MyComponent extends Component {
  render() {
    return (
      <div>
        <div className={styles.foo}>Foo</div>
        <div className={styles.bar}>Bar</div>
      </div>
    );
  }
}
```

重要的是，这些标识在全局环境下生成出来类名都是唯一的。

我们不再需要给所有的选择器添加长长的前缀来实现作用域了。组件可以定义专属的foo和bar标识 - 不像传统的全局选择器模式 - 而不造成任何的命名冲突。

---

更重要的是，我们要知道这里面发生了什么重大的改变。

现在当我们修改CSS文件，我们有信心不会对网页的其他元素造成影响。我们给CSS文件引入了一个良好的作用域模式。

全局CSS的优点 - 实用的类可以复用到各个组件中... - 在这个模式下依旧得到保留。关键的不同点在于，就像我们使用别的技术那样，我们可以明确的导入我们想要的类。在代码中，我们不可以对全局环境进行任何的假设。

**如今我们都应该编写可维护的CSS，不是通过小心翼翼地遵守命名规范，而是在开发过程中对样式进行封装。**

---

由于这种作用域化的方式，类名交由Webpack进行控制生成。幸好，这是可以进行配置的。

默认情况下，css-loader加载器将标识转换为哈希值。

例如：

```css
:local(.foo) { … }
```

会被编译成：

```css
._1rJwx92-gmbvaLiDdzgXiJ { … }
```

在开发时，这对debug来说没有任何帮助。为了让类名更可读，我们可以在Webpack的配置文件中给css-load加载器传个参数来配置类名的格式：

```javascript
loaders: [
  ...
  {
    test: /\.css$/,
    loader: 'css?localIdentName=[name]__[local]___[hash:base64:5]'
  }
]
```

这样，foo类名将会编译为：

```css
.MyComponent__foo___1rJwx { … }
```

现在我们可以清晰的看到标识的名称，同样也能辨别出它所在的组件。

使用`node_env`环境变量，我们可以为开发环境和打包环境配置不同的类名生产方式。

```javascript
loader: 'css?localIdentName=' + (
  process.env.NODE_ENV === 'development' ?
    '[name]__[local]___[hash:base64:5]' :
    '[hash:base64:5]'
)
```

**现在通过Webpack控制类名的生成，在生产环境中压缩类名变得非常简单。**

---

当我们知道了这个功能，我们迫不及待的给项目的样式都进行本地化。如果我们已经通过BEM命名规范来本地化CSS样式，那么我们只需要简单的修改。

有趣的是，这模式的引入是如此的简单。我们大部分的CSS文件只需要加入local标识：

```
:local(.backdrop) { … }
:local(.root_isCollapsed .backdrop) { … }
:local(.field) { … }
:local(.field):focus { … }
```

等等...

在开发中，需要用到全局选择器的地方并不多。所以这让我们自然而然地想到了一个非常重要的问题。

假如选择器默认是本地作用域 - 并不需要特殊的语法 - 而全局的选择器则是可选择性的加入，这样会不会比较好呢？

> 译注：作者的意思是，当我们引入了CSS作用域的技术后，我们会发现大部分模块的CSS都会进行本地化，只有少量的全局CSS存在，那么，我们应该对这少部分的全局CSS进行特殊处理，而不是对大部分的具有作用域的CSS进行标识。

假设我们可以这么写：

```css
.backdrop { … }
.root_isCollapsed .backdrop { … }
.field { … }
.field:focus { … }
```

即使一般情况下看来，这些选择器的表达模糊不清，但通过css-loader加载器的本地化可以解决这个问题，而且也能够把它们作用域限定在当前模块中。

在少数的情况下，我们不可避免的要使用到全局样式，我们可以将它们用指定的`:global`语法来标记出来。

比如我们用[ReactCSSTransitionGroup](https://facebook.github.io/react/docs/animation.html#high-level-api-reactcsstransitiongroup)来生成全局的类名：

```css
.panel :global .transition-active-enter { … }
```

在这例子中，我们不只将panel标识限定在模块中， 而且我们还定义了一个全局的类名`transition-active-enter`。

---

当我们着手研究该如何实现这种“默认自带作用域”的类名语法时，我们发现其实这并不是非常困难。

为了实现这功能，我们要用到[PostCss](https://github.com/postcss/postcss) - 这是一个出色的工具，他能让你将自定义的CSS转换器编写成组件。如今最流行的CSS构建工具之一 - [Autoprefixer](https://github.com/postcss/autoprefixer) - 就是用PostCss开发出来的独立插件工具。

为了实现本地CSS，我已开源了一个实验性的PostCss插件，叫做[postcss-local-scope](https://github.com/markdalgleish/postcss-local-scope)。该工具依旧在开发中，你可以在个人的项目中使用。

如果你正在使用Webpack，那么你可以在CSS构建流程中结合使用[postcss-loader](https://github.com/postcss/postcss-loader)加载器和[postcss-local-scope](https://github.com/postcss/postcss-loader)工具。这里不贴出例子，我已经创建了一个示例代码库，里面给出了示例 - [postcss-local-scope-example](https://github.com/markdalgleish/postcss-local-scope-example)。

---

让人激动的是，引入本地作用域只是个开始。

通过构建工具生成类名，我们能实现更多的事情。长远来看，我们可以不再需要人工参与编译而是让计算机来优化编辑结果。

不久将来，我们将可以让构建工具自动地生成组件共用的类，在编辑的过程中对可复用样式进行优化。

当你已经试着开始使用本地CSS时，你真的再也不会使用以前的那套老做法了。在样式表中体验一下真正的本地CSS吧 - 使用这种兼容所有浏览器的方法 - 这真的让你会终生难忘的。

引入本地CSS对我们看待CSS造成一连串的显著影响，无论是命名习惯，复用原则，还是样式提取分离，但这仅仅是CSS本地化这新领域的起点。

一旦你将它赋予实践，你会知道，全局CSS完结这一天终将会到来。CSS的未来属于本地化。

---

注意：组件之间可复用样式的自动优化将是一个惊人的飞跃，但这需要比我更聪明的人来实现。希望这会是你。☺

##附录

2015年5月24日：post-local-scope工具最开始的设想已经被Tobias koppers引入到了Webpack中，这意味着这个项目已经不再推荐使用了。现在css-loader加载器中可使用模块标识来实现CSS的模块化了。我用css-loader加载器写了个[CSS模块的例子](https://github.com/markdalgleish/css-modules-example)来演示它们的用法，其中也包括了类继承来实现组件之间样式智能复用。