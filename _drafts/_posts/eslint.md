---
title: ESlint自定义规则
date: '2016-09-30 05:11:00'
layout: post
---
本文介绍ESlint自定义规则。

[更好的阅读体验>>](https://www.zybuluo.com/lxjwlt/note/503766)

## ESlint默认规则

为了更好的学习ESlint自定义规则，我们应该多多参考ESlint的内置默认规则的写法。在ESlint源代码目录下我们能找到这些默认规则：

* 规则目录 `lib/rules`
* 规则测试目录 `tests/lib/rules`

## 规则写法

规则模块暴露一个配置对象，其中定义规则的相关信息和具体实现，相关信息可以省略，但create方法其中实现规则具体的逻辑，不可省略：

```js
module.exports = {

    // context提供了很多实用方法，比如获取注释、获取源码...
    create: function (context) {
        
        return {
            CallExpression: function (node) {}
        };
        
    }
    
};
```

在分析代码前，ESlint会通过[Estree](https://github.com/estree/estree)将代码解析一棵抽象语法树（AST），将不同类型的代码语句分成不同类型的节点，一份代码文件便形成了一个树状的结构，之后ESlint会依次遍历语法树上的节点。

create方法中要返回一个object，键名对应语法树节点的类型。ESlint在遍历语法树节点时，会执行该节点类型名所对应的回调函数。

比如上述的`callExpression`对应的是语法树中**函数调用语句**，所以当ESlint每次遍历到函数调用语句，就会执行这句`callExpression`回调函数。

回调函数接受一个含有当前语句的所有信息的节点对象，我们根据这些信息来判断当前语句是否非法。通过`context.report`来抛出代码异常，传入node和message告诉ESlint代码的位置和代码错误信息：

```js
module.exports = {
    create: function (context) {
        return {
            CallExpression: function (node) {
            
                // 如果函数名为alert，则报错
                if (node.callee.name === 'alert') {
                    context.report({
                        node: node,
                        message: 'unexpected alert'
                    });
                }
            }
        };
    }
};
```

了解基本用法后，我们开始尝试实现简单的规则。

## 例子：switch必须要有default case

一般来说，我们会推荐switch语句涵盖所有情况的处理。为了避免switch语句遗漏default case的情况，我们通过ESlint自定义规则来进行检查。

首先列出非法代码：

```js
switch (name) {
    case 'lxj':
        break;
}
```

由于所有代码语句都会解析为语法树，我们需要找到非法代码在语法树上的特征。

我们用[AST explore工具](http://astexplorer.net/)来解析非法代码的结构图：

![](http://7xslv0.com1.z0.glb.clouddn.com/eslint-rule/switch1.png)

接着列出合法代码，并对比查看其特征：

```js
switch (name) {
    case 'lxj':
        break;
    default:
}
```

![](http://7xslv0.com1.z0.glb.clouddn.com/eslint-rule/switch2.png)

我们能发现：

* switch语句的类型（type）为`SwitchStatement`
* case节点存放在switch节点的cases属性中，而且普通case和default case的区别在于，default case节点的test属性为null

最后将这些特性判断转化成代码：

```js
module.exports = {
    create: function(context) {
        return {
        
            // 处理SwitchStatement类型语句
            SwitchStatement: function (node) {
            
                // 判断是否存在default case
                var hasDefaultCase = node.cases.some(function (caseNode) {
                    return caseNode.test === null;
                });

                // 不存在default case则报错
                if (!hasDefaultCase) {
                    context.report({
                        node: node,
                        message: "switch statement expect a 'default' case"
                    });
                }

            }
        };
    }
};
```

> ESlint自带有[default case](https://github.com/eslint/eslint/blob/master/lib/rules/default-case.js)的验证器，还支持注释占位功能，可以参考下官方写法美如画

综上，编写ESlint规则的基本步骤如下：

1. 分别列出合法与非法的代码
2. 在抽象语法树中找出非法代码特征
3. 将这些特征用JS代码描述出来

## 例子：属性选择器

不管querySelector还是jQuery，非法的属性选择器都会报错。比如`[name=^&*]`会报错， 正确的写法应该是`[name="^&*"]`，这种问题在开发的时候都会觉察出来并能及时改正

但是，如果涉及到字符串和变量的拼接，开发过程无法发现这一风险，报错可能发生在代码发布之后：

```js
// bad
document.querySelector('[name=' + value +']');

// good
document.querySelector('[name="' + value +'"]');
```

我们用ESlint自定义规则来避免这种情况。首先列出合法和非法代码：

```js
// 合法
'[name="' + value +']';

// 非法
'[name=' + value +']';
'.class' + '[name=' + value + name +'] p';
```

挑选最后一句比较复杂的语句——往往复杂的语句更能体现出非法代码的特性，查看它的结构：

![](http://7xslv0.com1.z0.glb.clouddn.com/eslint-rule/attr1.png)

我们能发现，字符串结合的语句类型为`BinaryExpression`，其中分为左（left）和右（right）节点。右节点总是当前结合式最右边的一个元素，如果结合式内嵌了多个结合式，那么左节点也会是结合式：

结合式 = 左节点 + 右节点 = 内嵌结合式 + 最右边的结合元素

根据这个规律派生下去，直到左节点不为`BinaryExpression`，形成一个树状结构：

![](http://7xslv0.com1.z0.glb.clouddn.com/eslint-rule/attr2.png)

根据这个结构，我们总结出非法代码的**特征**：左边形如`[name=`，中间有若干变量，右边形如`]`，则判断为非法代码。

接下来先准备两个函数，一个匹配`[name=`情况，一个匹配`]`情况：

```js
// 匹配形如‘[name=’
function hasLeftBracket (node) {
    return node.type === 'Literal' && typeof node.value === 'string' &&
        node.value.match(/\[[^"'=]+=[^\]]*$/);
}

// 匹配形如‘]’
function hasRightBracket (node) {
    return node.type === 'Literal' && typeof node.value === 'string' &&
        node.value.replace(/\[.*?]/g, '').match(/]/);
}
```

> 字符串节点的特点：类型（type）为`Literal`，value属性值为字符串类型。

接下来我们定好规则的大致框架，要注意的是，由于结合式里面内嵌结合式，内嵌的结合式也会触发BinaryExpression回调函数，所以我们过滤掉内嵌的结合式，只处理最顶层的结合式：

```js
module.exports = {
    create: function(context) {
        return {
            BinaryExpression: function (node) {

                // 只处理顶级的结合式
                if (node.parent && node.parent.type === 'BinaryExpression') {
                    return;
                }

            }
        };
    }
};
```

由于内嵌结合式形成树状结构，我们通过循环来遍历左节点：

```js
while (node && node.type === 'BinaryExpression') {
    // ...

    node = node.left;
}
```

非法代码特征要同时满足以下**特征**：

1. 右边有字符串满足`hasLeftBracket`函数，形如`']'`
2. 中间有若未知变量的拼接，变量类型为Identifier
3. 左边有字符串满足`hasRightBracket`函数，形如`'[name='`

转换为代码语言：

```js
var matchRight, matchVariable, matchLeft;

while (node && node.type === 'BinaryExpression') {

    // 1. 右边形如']'
    if (!matchRight) {
        matchRight = hasRightBracket(node.right);
    }

    // 2. 中间若干变量
    if (!matchVariable) {
        matchVariable = node.right.type === 'Identifier';
    }

    if (matchRight && matchVariable) {
    
        // 3. 左边形如'[name='
        matchLeft = hasLeftBracket(node.right) || hasLeftBracket(node.left);

        if (matchLeft) {
            context.report({
                node: node,
                message: "The variable in attribute selector should wrap in quote"
            });

            return;
        }
    }

    node = node.left;
}
```

综上，自定义规则的本质就是找到非法代码的特征，将合法代码和非法代码区分开来。

## 测试

每个ESlint规则都要配备一套单元测试，目录放置也有考究，如果自定义规则文件在 `lib/rules/switch-expect-default.js`，那么测试文件要放在`tests/lib/rules/switch-expect-default.js`。

测试中必须同时提供合法代码和非法代码。以上面的switch为例，合法代码是具有default case的情况，而非法代码是没有default case的情况：

```js
const rule = require('../rules/detect-switch-default');
const RuleTester = require('eslint').RuleTester;

const ruleTester = new RuleTester();

ruleTester.run('detect-switch-default', rule, {
    valid: [
        `switch(name) {
            case 'lxj':
                break;
            default:
        }`
    ],
    invalid: [
        {
            code: `
                switch(name) {
                    case 'lxj':
                        break;
                }
            `,
            errors: [{
                message: "switch statement expect a 'default' case",
                type: 'SwitchStatement'
            }]
        }
    ]
});
```

我们使用[mocha](https://github.com/mochajs/mocha)来测试代码，首先安装mocha：

```
npm install mocha -D
```

在npm scripts里面配置测试命令，在package.json里配置：

```
{
    // ...
    "scripts": {
        "test": "mocha --reporter dot tests/" 
    }
    // ...
}
```

`--reporter dot` 为了提高测试输出结果的可读性，可以省略。

这样，我们可以在命令行输入以下命令执行测试：

```
npm run test
```

## 调试

我们编写的ESlint规则往往需要多次调试和修改才能通过测试。

为了方便调试，也为了能够跟踪到具体哪句代码出错或者不符合预期，我们使用[iron-node](http://s-a.github.io/iron-node/)来调试代码。iron-node和node-inspector一样使用Chrome的调试界面来调试nodejs。

> [node-inspector](https://github.com/node-inspector/node-inspector)不稳定，不推荐使用

安装iron-node：

```
 npm install -g iron-node
```

安装过程耗时可能比较久，请耐心等待。iron-node安装好，我们可以调试一些普通的nodeJS代码，比如代码文件test.js：

```
iron-node test.js
```

但调试devDependences需要一点技巧，[官方文档](https://github.com/s-a/iron-node/blob/master/docs/DEBUG-NODEJS-COMMANDLINE-APPS.md)有详细介绍。为了调试mocha，我们需要在package.json里加多一句命令：

```
{
    // ...
    "scripts": {
        "test": "mocha --reporter dot tests/",
        "debug": "iron-node node_modules/mocha/bin/_mocha --reporter dot tests/"
    }
    // ...
}
```

在规则代码需要调试的地方加入`debugger;`语句，然后运行以下命令调试：

```
npm run debug
```

## 更多阅读

[ESlint - working with rules](http://eslint.org/docs/developer-guide/working-with-rules)