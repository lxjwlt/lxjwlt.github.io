---
layout: post
title: "字符串结合和ES6模板字符串"
category: front-end
excerpt: 'ES6提供了一种新的字符串格式化的语法功能：模板字符串(template string)，该语法允许字符串内嵌代码表达式。本文简要介绍其中的使用...'
---

[>>更好的阅读体验](https://www.zybuluo.com/lxjwlt/note/213462)

ES6提供了一种新的字符串格式化的语法功能：模板字符串(template string)，该语法允许字符串内嵌代码表达式。本文简要介绍其中的使用。

> 注：下面临时写的几个字符串结合函数只起到说明的作用，容错率低，不可用于实际开发，开发中应使用长期维护的代码库，比如[ESJ模板引擎](http://www.embeddedjs.com/)、[mustache](http://mustache.github.io/)、[jade](http://jade-lang.com/)...

## 传统的字符串结合

```javascript
var user = {
    name: 'lxjwlt',
    age：23
};

user.name + ' who is in age ' + user.age + '.'; 
// 结果："lxjwlt who is in age 23."
```

项目开发中，这类代码很常见，但遇到更复杂的场景时，比如构建html，这类代码会变得难以书写，可读性差，而且维护难度大。

这时，我们可以使用字符串格式化函数来处理，简要例子：

```javascript
format('{0} who is in age {1}', user.name, user.age); 
// 结果："lxjwlt who is in age 23."

function format (template) {
    var reg = /\{(\d)\}/g,
        dataList = Array.prototype.slice.call(arguments, 1);
        
    return template.replace(reg, function (match, $1) {
        return dataList[$1];
    });
}
```

这是最简单的字符串格式化，但是这种方式下，字符串中无法嵌入表达式，也就是说控制字符串生成的逻辑代码必须写到JS代码中。

所以再进一步，再复杂一点，我们希望模板内可以使用表达式，下面我们来实现一个最简单的模板引擎，只实现表达式和条件语句：

```javascript
var user = {
    name: 'lxjwlt',
    age: 23
};

template('%this.name% is a %if (this.age > 18) { % adult % } else { % child % }%.', user);
// 结果："lxjwlt is a  adult ."

// 模板引擎
function template (template, context) {
    var templateCode = templateToCode(template);
    
    return (new Function(templateCode)).apply(context);
}

// 模板转换为可执行代码
function templateToCode (template, context) {
    var reg = /%([^%]+)%/g,
        conditionReg = /if \(.+\) \{|\} else \{|\}/,
        code = ['var str = "";'],
        lastIndex = 0,
        matchs;
        
        while (matchs = reg.exec(template)) {
            code.push(
                'str = str + "' + 
                    template.slice(lastIndex, reg.lastIndex - matchs[0].length) + 
                '";'
            );
            
            if (conditionReg.test(matchs[1])) {
                code.push(matchs[1]);
            } else {
                code.push('str = str + (' + matchs[1] + ');');
            }
            
            lastIndex = reg.lastIndex;
        }
        
    code.push('str = str + "' + template.slice(lastIndex) + '";');
    
    code.push('return str;');
    
    return code.join('');
}
```

模板引擎使得模板与代码分离开来，同时，模板中也保留了逻辑处理。javascript框架中通常都会带有模板引擎功能。

上面列举了字符串三种方式，从字符串相加，到字符串格式化处理函数，再到模板引擎，三种方式各不同，使用场景也不一样，对应着不同的需求。那么，ES6引入的模板字符串语法实现了什么功能？能代替上述三种方式么？

##模板字符串

首先，我们来看看最基本使用:

```javascript
var username = 'lxjwlt';

`hi! ${username}.`; // "hi! lxjwlt."
```

注意！上面用的是**反引号**来包裹住字符串的，而不是单引号。反引号在键盘tab键的正上方。下面列出引号和反引号，我们可以仔细分辨一下其中的区别：

* `""` 双引号
* `''` 单引号
* <code>``</code> 反引号

我们能发现，用反引号括住文本内容，文本内容中使用`${}`字面量插入逻辑表达式，这样就构成了一个模板字符串了。

ES6模板字符串的兼容性如下：

* 服务器端， io.js 支持
* 浏览器端， FF34+ , chrome 41+
* 移动端 IOS 8, Android 4.4
* IE Tech Preview

如果我们的chrome版本不太旧的话，现在完全可以打开控制台，我们马上来一发：

```javascript
`${1+1}`; // "2"
```

##模板字符串预处理
有些情况下，我们需要对字符串中插入的值进行预处理，比如后台返回的值要进行htmlEncode处理，模板字符串支持使用函数来进行处理，该函数接收的参数形式如下：

strings, [value1, [value2, [value3 ...]]]

字符串会被`${}`分隔成一个个字符串片段保存在一个数组中，在函数的第一个参数中传入，对应上面的strings，而`${}`中表达式的返回值则从函数的其他参数中依次传入。我们现在可以实现“安全的”模板字符串了：

```javascript
var username = '<span>click me!</span>'
safeTemplate`hi! ${username}.`;
// 结果："hi! &lt;span&gt;click me!&lt;/span&gt;"

function safeTemplate (strings) {
    var str = [],
        values = Array.prototype.slice.call(arguments, 1),
        i;
    
    for (i = 0; i < strings.length; i++) {
        str.push(strings[i]);
        str.push(htmlEncode(values[i])); // 对插入值进行htmlEncode
    }
    
    return str.join('');
}

function htmlEncode () { /* ... */ }
```

## 字符串转换模板字符串

实际开发中，我们的模板可能会以字符串的形式从别的地方请求回来，这时候要把字符串转换为模板字符串，然而js中没有提供任何转换的方法。下面我们自己来实现一个：

```javascript
format("hi! ${name}", {name: "lxjwlt"}); // "hi! lxjwlt"

function format (template, data) {
    var keys = Object.keys(data),
        dataList;
        
    dataList = keys.map(function (key) {
        return data[key]
    });
    
    // 这里使用反引号来构建模板引擎
    return new Function(keys.join(','), 'return `' + template + '`;')
        .apply(null, dataList);
}
```

##模板字符串的不足

* 兼容性差
* 有局限性

    ES6模板字符串其实更准确的叫法是格式化字符串，它不是模板引擎，其中可插入的表达式不支持这种写法：
    
    ```javascript
    `${if (true)}`; // Uncaught SyntaxError: Unexpected token if
    `${true ? 1 ：2}`; // Uncaught SyntaxError: Unexpected token ILLEGAL
    ```
    所以ES6模板字符串不能代替模板引擎，只能在字符串结合逻辑不复杂的场景下使用。

##更多阅读

* [MDN - String.raw](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/raw)
* [MDN - Template String](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/template_strings)
* [触摸ES6 - 模板字符串](http://segmentfault.com/a/1190000003092875?hmsr=toutiao.io&utm_campaign=socialShare&utm_medium=toutiao.io&utm_source=toutiao.io)