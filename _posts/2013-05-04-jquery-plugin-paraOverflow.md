---
layout: post
title: "段落溢出处理——jQuery插件"
category: front-end
excerpt: '‘段落溢出’（这名字是我杜撰的）是指段落高度超过了父元素的高度了。为了解决这种情况，我们希望做到的是——截除多出来的那部分，并在末尾加上省略号或跳转详细页的链接。CSS3中提供了一个 text-overflow 属性来处理‘行溢出’，但这一属性不适用于段落溢出。'
---

‘段落溢出’（这名字是我杜撰的）是指段落高度超过了父元素的高度了。为了解决这种情况，我们希望做到的是——截除多出来的那部分，并在末尾加上省略号或跳转详细页的链接。

CSS3中提供了一个 text-overflow 属性来处理‘行溢出’（这也是我胡诌的）的，即在不换行的情况下 text-overflow 是可以截除单行文字的溢出部分文字并添加省略号，但这一属性不适用于段落溢出。

竟然CSS不成，那我们可以转而依靠Javascript，折腾个函数来解决这个问题。

##思路
###我之前的想法是

先通过行高（line-height）和超出的高度来确定段落应删除多少行，再通过字体大小（font-size），文字间距（letter-space,word-space）和缩进（text-indent）来确定一行中有多少个字，于是可以算出总共应删去多少字。

可这想法实在太天真了，因为在英文字体中，单词过长的话会被自动分配到下一行，于是这行末尾就会出现无法预料的空白区域；而且最重要的是，font-size指的是字体所占的空间的高度，而不是宽度，我 …… Orz

下面说说工作室同仁在讨论中提出的两个思路，感觉很有启发性。

###思路一

>将‘溢出高度’（即段落高度超过这个高度就算段落溢出）和段落高度相除，接着用求得的百分比值与段落字数相乘，求得要保留的字数，最后根据这个数值截去不要的字就可以了。

这思路好！可实现过程中发现一个小小的问题——因为段落行高的问题，段落的高度有些情况下会比父元素高那么几个像素。（强迫症作祟，老大不爽的说）

###思路二

>在一个新的块内的导入段落的文字，同时，实时的检测这个块的最终解析高度，当块的高度快要大过‘溢出高度’时停止导入，并将导入的文字重新载入段落中。

看罢，直叫我茅塞顿开，抚掌不已。反观我之前的想法，简直是傻透了。

不过这种方法是挺耗性能的，想想，如果每个段落有百来个字，一个页面七八个段落，这方法运行起来是很吃性能的。

###思路一 + 思路二

看完两个方法，我想，为何将两者结合起来呢？**思路一**性能好但精度差，而**思路二**精度高但性能差，两者恰好能互补：

>用思路一的方法，将段落中要保留的文字大致地筛选出来，然后转换一下思路二的方法，将‘在新添div块中导入文字’的方式改为‘直接对段落进行不断的删减操作，直到段落不再溢出为止’。

基于这两个思路，我敲了个jQuery插件。

##代码

###完整代码4

	;(function($){
	    // 段落溢出处理函数
	    $.fn.extend({
	        paraOverflow:function(options){
	            return this.each(function(){
	                var $this=$(this);
	                var thisHeight=function(){
	                    return $this.innerHeight();
	                };
	                var defaults=$.extend({
	                    height:$this.parent().innerHeight(),
	                    word:'......',
	                    link:$this.find('.get-more').length?$this.find('.get-more').attr('href'):'#',
	                    dNum:5
	                },$.fn.paraOverflow.setup,options);
	                if(thisHeight()>defaults.height){
	                    var $getMore=defaults.word!=='......'?
	                        $('<a href="'+defaults.link+'">'+' '+defaults.word+'</a>'):$('<span>'+defaults.word+'</span>');
	                    var text=$this.text();
	                    var maxNum=Math.floor(text.length*(defaults.height/$this.innerHeight()));
	                    do{
	                        $this.text(text.slice(0,maxNum)).append($getMore);
	                        maxNum-=defaults.dNum;
	                    }while(thisHeight()>defaults.height&&maxNum>0&&defaults.dNum!==0);
	                }
	            });
	        }
	    });
	    $.fn.paraOverflow.setup={};
	}(jQuery));

###说明

* 第一行的分号是为了避免“合并代码时，受他人不规范代码（漏写行尾分号）的影响而发生的”错误：

	;(function($){
		// …… ……
	})(jQuery);

* 为了使调用这个插件的jQuery变量继续支持**链式操作**，需要返回该jQuery变量，而 each() 函数本身是支持链式操作（意思是，它返回的值就是this，也就是该当前的jQuery变量），所以这里直接返回 each() 函数：

		return this.each(function (){
			// …… ……
		});
	
	需要注意的是，插件函数作用域内的上下文(this)是**jQuery变量**而不是DOM变量，不需要转换

* each()的回调函数作用域内上下文(this)是**DOM变量**而不是jQuery变量，所以需要将其转化为jQuery变量，方便之后的调用：

		var $this = $(this);

* 定义了一串默认值，该默认值可以被重新定制（`$.fn.paraOverflow.setup`），也可被传入的参数重写（`options`），合并这三者的方法是依靠jQuery库函数 `$.extend` 来实现的:

		var defaults=$.extend({
	        height:$this.parent().innerHeight(),
	        word:'......',
	        link:$this.find('.get-more').length?$this.find('.get-more').attr('href'):'#',
	        dNum:5
		},$.fn.paraOverflow.setup,options);

* 首先判断此时的段落高度是否超过了“溢出高度”，如果超过了，执行接下来核心的代码，代码实现的正是“思路一+思路二”中的方法来处理段落溢出:

		if(thisHeight()>defaults.height){
            var $getMore=defaults.word!=='......'?
                $('<a href="'+defaults.link+'">'+' '+defaults.word+'</a>'):$('<span>'+defaults.word+'</span>');
            var text=$this.text();
            var maxNum=Math.floor(text.length*(defaults.height/$this.innerHeight()));
            do{
                $this.text(text.slice(0,maxNum)).append($getMore);
                maxNum-=defaults.dNum;
            }while(thisHeight()>defaults.height&&maxNum>0&&defaults.dNum!==0);
        }

* 最后这行孤零零的代码是用来自定义插件默认值的：

		$.fn.paraOverflow.setup={};

##用法

示例HTML：

	<div class="box1">
		春天的原野里，你一个人正走着，对面走来一只可爱的小熊，眼睛圆鼓鼓的，它这么对你说道：“你好，小姐，和我一起打滚玩好么？”接着，你就和小熊抱在了一起，顺着长满三叶草的山坡咕噜咕噜滚下去，整整玩了一大天......我就是这么喜欢你的(《挪威的森林》)<a class="get-more" href="http://book.douban.com/subject/2159042/">更多</a>
	</div>
	<div class="box2">
		她的笑容稍微有些紊乱，如同啤酒瓶盖落入一泓幽雅而澄寂的清泉时激起的静静波纹在她脸上荡漾开来，稍纵即逝。消逝时，表情比刚才略有逊色。我饶有兴味地观察着这细微而复杂的变化，不由觉得很可能有清泉精灵在眼前闪出，问我刚才投入的是金瓶盖还是银瓶盖（《舞舞舞》）<a class="get-more" href="http://book.douban.com/subject/1767736/">更多</a>
	</div>

下面是未进行溢出处理的段落，显然，这两个段落均溢出了父元素：

![未进行溢出处理前的页面](http://i1273.photobucket.com/albums/y401/lxjwlt/paragraph-overflow-handling-jquery-plugins/zaPYkxo_zps52a8f097.png)

###直接调用插件

为这两个段落调用溢出处理插件,代码如下:

	$('p').paraOverflow();

效果图：

![段落溢出处理后](http://i1273.photobucket.com/albums/y401/lxjwlt/paragraph-overflow-handling-jquery-plugins/8CTDboB_zpsf8351df4.png)

由于没有传入什么参数，在默认设置下，溢出处理插件会根据’段落的父元素的高度’截除‘段落’的多余部分，并直接在段落末尾添加单纯的省略号。

###‘更多’链接

如果想要将省略号换成其他符号文字，那么可以传入word参数。

	$('p').paraOverflow({word:'readmore'});

效果图：

![传入word参数](http://i1273.photobucket.com/albums/y401/lxjwlt/paragraph-overflow-handling-jquery-plugins/FTQhEhu_zpsbbdd7c78.png)

最末尾的省略号不但变成了我们设定的字符‘readmore’，而且它转变成了一个链接，用来链接到详细页面。它的链接地址是提取自原段落中类名为get-more链接的地址，这样方便后台为不同段落的链接绑定数据。如果链接不存在，地址将设为为‘#’。

###自定义溢出高度

如果不想段落基于父元素的高度来进行溢出处理或段落的父元素的高度不固定时，可以自定义‘溢出高度’，单位默认为像素，如下：

	$('p').paraOverflow({
		word:'readmore',
		height:'50'
	});

效果图：

![自定义溢出高度](http://i1273.photobucket.com/albums/y401/lxjwlt/paragraph-overflow-handling-jquery-plugins/9M1pKd9_zpsfb5d8ef8.png)

###参数dNum

当一个段落经过**思路一**方法处理后，如果它的高度仍然大于’溢出高度‘，那么插件会运用**思路二**的方法，通过不断删除它其中的文字来缩减它的高度。在这个过程中，每次删除的字数是由**dNum参数**来控制的，该参数的默认值为5，即每次删去5个字，可以重设这个参数，当这个参数越小时，处理效果会越精准：

	$('p').paraOverflow({
		dNum : 1
	});

另外，如果dNum参数设为0时，将不执行思路二的方法，如果觉得几个像素不是大问题，可以将dNum设为0。

###自定义默认值

>一个好的插件都会为使用者提供修改默认值的方法

这是《jQuery基础》中的一句话，该插件也极力地想做到这一点。

如果需要重设插件默认值，比如，需要该插件每次默认调用时，都：

* 添加 “名为*更多…*并跳转到*vtmerhome.com*” 的链接
* 溢出高度为200

可以这么设置：

	// 重设默认值
	$.fn.paraOverflow.setup={
		word : '更多...',
		link : 'http://vtmerhome.com',
		height : '200'
	}
	
	// 调用插件
	$('p').paraOverflow();

效果图：

![自定义默认值](http://i1273.photobucket.com/albums/y401/lxjwlt/paragraph-overflow-handling-jquery-plugins/IGmpYyA_zps711f672f.png)

##不足

如果是英文的段落调用该插件，那么英文单词极可能会被从中截断。想过对中文和英文赋予不同的方法来处理，但这样会使插件变得复杂起来，所以就放弃了……o(╯□╰)o

##参考

* [《锋利的jquery》](http://book.douban.com/subject/10792216/)
* [《jquery基础教程》](http://book.douban.com/subject/10569608/)