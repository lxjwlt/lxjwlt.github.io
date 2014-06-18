---
layout: post
title: "SASS用法"
category: front-end
excerpt: 'Sass是CSS预编译器，提供一些便捷的写法——嵌套、变量、函数等——来生成常规的CSS。Sass支持SCSS和SASS两种语法来写CSS，本文的叙述是基于SCSS语法。'
---

Sass是CSS预编译器，提供一些便捷的写法——嵌套、变量、函数等——来生成常规的CSS。

Sass支持SCSS和SASS两种语法来写CSS，本文的叙述是基于**SCSS语法**。

##安装

前提已经安装了[ruby](https://www.ruby-lang.org/zh_cn/)，在命令行中运行：

	gem install sass

检查是否安装成功：

	sass -v

如果返回版本号，则安装成功。

##编译
###如何编译？
将input.scss文件编译为output.css文件：
	
	sass input.scss output.css

如果想批量地编译某个目录(目录名scss)下的SCSS文件，并将编译后的css文件放在另一个目录（目录名css）下，可以这样执行（注意：用**冒号**来指定生成目录）：

    sass --update  scss:css

在开发过程中，如果每次修改后都需要手动地运行该命令行来查看效果，那就显得太繁琐了。

幸好，SASS提供实时监控更新的功能，比如让Sass监控input.scss文件的改动，当文件有改动过，sass就自动执行编译：

	sass --watch input.scss:output.css

当然也可以监控一个目录下的文件：

    sass --watch scss:css

###如何指定编译格式？

SASS提供四种编译格式，即编译出来的css语句的格式，如常用的代码压缩，下面是四种格式：

* 嵌套格式：`nested`
* 正常格式：`expanded`
* 单行格式：`compact`
* 压缩格式：`compressed`

编译格式默认为`nested`嵌套格式，可以指定其他格式，如压缩格式`compressed`:

	sass --style compressed input.scss output.css

###还有什么功能？
SASS的所有功能，包括上面所说的，都可以通过`--help`参数来了解：

	sass --help

##SCSS语法

附上[sass在线编译器](http://sassmeister.com/)，方便学习理解。

###编码

scss文件中需要明确地设置编码，否则，当遇到中文注释时可能会出现编译错误，所以如果文件的编码是"utf-8"，则在文件开头写上：

```scss
@charset "utf-8";
```

###注释

SCSS支持三种形式的注释： SCSS注释、CSS常规注释、压缩文本用的注释。

SCSS注释，该注释用来说明SCSS文本中的语句，在编译后，**不会**保留在CSS文本中：

```scss
// 注释……
```

CSS常规注释，编译后会保留在CSS文件中，但**不会**保留在以**压缩格式**编译生成CSS文本：

```scss
/* 注释 */
```

而以下的注释，将保留在CSS文件以及压缩后的CSS文件中：

```scss
/*! 注释 */
```

###嵌套

在写父元素和子元素样式时，嵌套语法可以使它们显得更为紧凑，其从属关系更加的一目了然。

比如，我们想实现的是下面这部分CSS：

```css
.class1{
	width: 500px;
}
.class1 a{
	color: red;
}
.class1:hover{
    width: 100px;
}
```

那么，在SCSS中，可以这样写：

```scss
.class1{
	width: 500px;
	a{
		color: red;
	}
	&:hover{
	    width: 100px;
	}
}
```

在嵌套中，`&`符指代的是父元素本身，此处指代的是`.class1`。

CSS属性也可以嵌套：

```scss
a{
	font: {
		size: 23px;
		family: aril;
	}
}
```

编译后为：

```css
a{
	font-size: 23px;
	font-family: aril;
}
```

###变量

SCSS中可以使用变量，用法可以是：

* 充当全局变量，方便修改
* 语义化，为某些值赋予文字意义

SCSS中变量都必须以`$`开头，变量声明如下：

```scss
$color: white;
```

当**在属性值中**使用变量，直接引用即可：

```scss
body{
	background: $color;
}
```

当**在属性值之外**使用变量，一般来说，需要用`#{}`括起来：

```scss
$position: left;

body{
	border-#{$position}: 1px solid #000;
}
```

###!defaul

使用`!defaul`操作符控制变量的赋值——如果该变量的值非空，那么不赋值，如果该变量的值为空值，则赋值：

```scss
$content: null;
$value: 1;
$content: 'content' !default; // 因为$content为空值，所以此次赋值成功，值为'content'
$value: 10000; // 因为$content已经有值，所以此次不进行赋值，值依旧为1
```

###继承：@extend
在CSS中，相同的样式重复出现是常有的事，为了使CSS更简洁，通常会使用一些手段来合并相同的样式，如一系列的按钮：

```html
<button class='btn btn-yellow' />
<button class='btn btn-red' />
```

```css
.btn {
	width: 4em;
	height: 3em;
	border: 1px solid #000;
	border-radius: 4px;
}
.btn.disable {
	background-color: grey;
}

.btn-yellow {
	background-color: yellow;
}
.btn-red {
	background-color: red;
}
```

上面实现相同样式合并的方式是将相同的样式写入一个`btn`总类中。

还有一种处理方式是用分组选择器来合并相同的样式，相对于上一中处理方式，该方法的好处在于可以**节省一个类名**：

```html
<button class='btn-yellow' />
<button class='btn-red' />
```

```css
.btn-yellow, .btn-red {
	width: 4em;
	height: 3em;
	border: 1px solid #000;
	border-radius: 4px;
}
.btn-yellow.disable, .btn-red.disable {
	background-color: grey;
}

.btn-yellow {
	background-color: yellow;
}
.btn-red {
	background-color: red;
}
```

这样就不必多设一个`btn`总类了，而且能合并相同样式。

虽说如此，但在CSS开发中，我们往往采用第一种处理手段，原因在于，第二种处理方法下，如果想添加另一个子类，如新增一个`btn-green`，我们需要为多处的分组选择器添加上该子类的选择器`.btn-green`，再试着想想，如果这些样式是分开多个文件的，如果下次设计师心血来潮，导致又要新增一个`btn-blue`……

在第二种处理方式下，如果新增的子类能**自动地**添加到相应的分组选择器中，那该多好啊。针对这一点，SCSS的继承语法可以为我们解决这一繁琐的过程，SCSS中的**继承的实质**就是将相同的样式以分组选择器的形式合并到一起，下面用SCSS的继承实现第二种处理方式：

```scss
.btn {
	width: 4em;
	height: 3em;
	border: 1px solid #f00;
	border-radius: 4px;
}
.btn.disable {
	background-color: grey;
}

.btn-yellow {
	@extend .btn;
	background-color: yellow;
}
.btn-red {
	@extend .btn;
	background-color: red;
}
```

编译后：

```css
.btn, .btn-yellow, .btn-red {
  width: 4em;
  height: 3em;
  border: 1px solid #f00;
  border-radius: 4px;
}

.btn.disable, .disable.btn-yellow, .disable.btn-red {
  background-color: #333;
}

.btn-yellow {
  background-color: yellow;
}

.btn-red {
  backgroud-color: red;
}
```

这时，如果要新增一个`btn-green`，只需要添加：

```scss
.btn-green {
    @extend .btn;
    background-color: green;
}
```

由于页面中不需要用到`btn`类，所以该`btn`可以充当一个模板的作用，而不需要被编译出来，可以写成（注意%符号）:

```scss
%btn {
    // …… ……
}

%btn.disable {
    // …… ……
}

.btn-yellow {
	@extend %btn;
    // …… ……
}
.btn-red {
	@extend %btn;
	// …… ……
}
```

编译后：

```css
.btn-yellow, .btn-red {
  width: 4em;
  height: 3em;
  border: 1px solid #f00;
  border-radius: 4px;
}

.disable.btn-yellow, .disable.btn-red {
  background-color: grey;
}

.btn-yellow {
  background-color: yellow;
}

.btn-red {
  background-color: red;
}
```

>>当 媒体查询`@media` 和 `@extend` 的混用使用时，`@extend` 不能跨域进行继承，也就是说，`@media`内的选择器不能继承 `@media` 外的选择器，只能继承其中的选择器。

###混合嵌入：@mixin && @include && @content

SCSS中的`@mixin`混合嵌入有些类似程序中的宏定义。下面用`@mixin`可以用来简写css3:

```scss
@mixin border-radius($value) {
	-webkit-border-radius: $value;
	-moz-border-radius: $value;
	border-radius: $value;
}
```

用`@include`来调用：

```scss
button{
    @include border-radius(1px 2px);
}
```

为了方便阅读，可以标明参数名，这样做的另一个好处是可以按任意顺序传入参数：

```scss
@mixin background-rgba($color, $alpha) {
    background-color: rgba($color, $alpha);
}

body{
    @include background-rgba($alpha: 0.3, $color: #000);
}
```

如果需要向`@mixin`中插入CSS样式，可以结合`@content`来实现，常用于浏览器的兼容：

```scss
@mixin apply-to-ie6 {
	* html {
		@content;
	}
}

@include apply-to-ie6 {
	#logo{
		color: yellow;
	}
}
```

`@include`后面`{}`中的内容都会替换到`@content`中，编译结果如下：

```css
* html #logo {
	color: yellow;
}
```

`@include`后`{}`中的变量的取值是取决于该选择器所在的作用域：

```scss
$color: white;
@mixin colors($color: blue) {
    background-color: $color;
    @content;
    border-color: $color;
}
.colors {
    @include colors { color: $color; };
}
```

编译后：

```css
.colors {
  background-color: blue;
  color: white;
  border-color: blue;
}
```

如果`@mixin`的参数不定，可以在参数后面跟上`...`：

```scss
@mixin box-shadow($value...){
	-moz-box-shadow: $value;
  	-webkit-box-shadow: $value;
  	box-shadow: $value;
}
```

如此，就可以这样使用了：

```scss
div {
    @include box-shadow(0px 4px 5px rgba(0,0,0,.5), 2px 6px 10px rgba(0,0,0,.5));
}
```

也可以传入多位数参数：

```scss
@mixin colors($text, $background, $border) {
  color: $text;
  background-color: $background;
  border-color: $border;
}

$values: #ff0000, #00ff00, #0000ff;
.primary {
  @include colors($values...);
}
```

再如：

```scss
@mixin wrapped-stylish-mixin($args...) {
  font-weight: bold;
  @include stylish-mixin($args...);
}

.stylish {
  // The $width argument will get passed on to "stylish-mixin" as a keyword
  @include wrapped-stylish-mixin(#00ff00, $width: 100px);
}
```

##函数定义

SCSS中可以自定义函数：

```scss
@function add($a, $b) {
	@return $a + $b;
}

.class1 { 
	width: add(3px, 4px); 
}
```

编译后：

```css
.class1 {
	width: 7px;
}
```

##内置函数

SCSS中提供了内置函数，下面列举几个实用的内置函数：

* rgb颜色模式转换为十六进制模式：

		rgb(20, 23, 90) => #14175a

* 十六进制模式转换为rgb模式：

		rgba(#14175a, .2) => rgba(20, 23, 90, 0.2) 

* 提取数字中的单位：

		unit(12px) => "px"

* 去除引号：

		unquote("px") => px

* ie滤镜可识别颜色转换：

		ie-hex-str(#000) => #FF000000
		ie-hex-str(rgba(#000, .5)) => #80000000

想了解更多内置函数，请查看[sass所有内置函数](http://sass-lang.com/documentation/Sass/Script/Functions.html)。

###媒体查询：@media
SCSS中的媒体查询`@media`可以嵌套使用：

```scss
a{
	color: black;
	@media screen and (min-width: 1200px) {
		color: red;
	}
}
```

编译后：

```css
a {
	color: black;
}
@media screen and (min-width: 1200px) {
	a {
		color: red;
	}
}
```

###导入：@import
一般来说，我们会把一些预定义代码——如混合嵌入`@mixin`、函数等——统一写入一个公共文件中，如此，任何一个导入了该预设文件的SCSS文件都可以使用其中的预定义函数、@mixin或继承其中的模板，比如要导入名为‘predefine.scss’文件：

```scss
@import 'predefine.scss';
```

该语句在编译后不会存在于CSS文件中。SCSS文件可以省略其后缀：

```scss
@import 'predefine';
```

如果导入的是CSS文件：

```scss
@import 'foo.css';
```

该语句会被保留在编译后的CSS文本中，而不会对SCSS文件产生任何影响，注意这和导入SCSS文件的区别。

如果某个SCSS文件只用来被导入（`@import`），而不需要编译生成单独一个css文件，比如上述的预定义文件，可以在该文件名字前加上**下划线**，如`_predefine.scss`，注意的是，导入时**不需要**带下划线：

```scss
@import 'predefine';
```

而且，为了避免冲突，同目录下不可以存在名为`predefine.scss`的文件。

##参考

* [sass documentation](http://sass-lang.com/documentation/file.SASS_REFERENCE.html)