---
layout: post
title: "sublime快捷键及常用插件——工欲善其事，必先利其器"
category: others
excerpt: '本文介绍 sublime text2 相关的插件和快捷键的使用。'
---
##快捷键
###默认快捷键：

* 查找当前选中文本的**下一个**相同的文本，并将其选中——鼠标选中文本，反复按 `CTRL+D`

* 查找当前选中文本的**所有**相同的文本，并将其选中——鼠标选中文本，按下 `Alt+F3`

* 为当前选中文本中的**每行行末**创建光标——鼠标选中多行，按下 `Ctrl+Shift+L` 

* 在**每行同一个位置**创建多个光标——`Shift+鼠标右键` 或 按住鼠标中键并上下拖动

* 在**任意位置**创建多个光标——`Ctrl+鼠标左键`

* 选中整行——`ctrl+L`

* 删除从光标至行末的所有文本——`ctrl+kk`

* 合并多行——选中多行，按下 `ctrl+j`

* 注释当前行——`ctrl+/`

* 于当前行**前**插入新的一行——`ctrl+shift+enter`

* 与当前行**后**插入新的一行——`ctrl+enter`

* 将选中的文本上下移动——`shift+ctrl+上下键`

###常用Emmet快捷键：

* 选中整个HTML标签——`ctrl+,`

* 删除整个HTML标签——`shift+ctrl+;`

* 于当前选择器下，同步所有相同的CSS属性下的属性值(css3属性不再需要每个不同前缀都去修改，非常好用)——选中其中一个CSS属性，按下 `ctrl+shift+r`

* CSS属性数值增减1——选中某个CSS属性的属性数值，按下 `ctrl+上下键`

##推荐插件

###[Emmet（原名Zen Coding）](https://github.com/sergeche/emmet-sublime)

用法：

* [怎么用Emmet & 相关快捷键](https://github.com/sergeche/emmet-sublime#available-actions)
* [Emmet 的 cheat-sheet](http://docs.emmet.io/cheat-sheet/)

演示：

![zen coding](http://i.minus.com/ib1KcOZid7qaRD.gif)

![数值增减1](http://i.minus.com/id2EGlHI6PjCD.gif)

Emmet是一款用于HTML、CSS和XSL的高效编程插件，原先zen coding需要按快捷键 ctrl+alt+enter才能运行，现在更新了另一种方式——直接在文本中输入zen coding的语句，然后按tag键就可以实现同样功能，非常棒。

###[jQuery-snippets](https://github.com/aaronpowell/sublime-jquery-snippets)

用法：按`ctrl+shift+p`查找jQuery代码，充当字典功能

演示：
![jQuery-snippets](http://i.minus.com/itoTuAIBmd4zz.gif)

这个插件提供jQuery的提示功能，不过每次提示都需要快捷键ctrl+shift+p上查找，不过如果和CodeIntel插件（下面说到）配合使用能互补不足，因为两个插件都有些jQuery代码缺少。

###[Alignment](https://github.com/wbond/sublime_alignment)

用法：选定要对齐的行，按`ctrl+alt+a`

演示：
![Alignment](http://i.minus.com/iTfyxnYEF4gsu.gif)

等号对齐插件，使代码更美观

###[BracketHighlighter](https://github.com/facelessuser/BracketHighlighter)

演示：
![brackerhightlighter](http://i.minus.com/ibfRUoeoflEuN8.gif)

高亮显示光标所在的括号和引号，类似于代码匹配，可以匹配括号，引号等符号内的范围

###[Clipboard History](https://github.com/kemayo/sublime-text-2-clipboard-history)

用法：按`ctrl+shift+v`
演示：
![clipboard history](http://i.minus.com/ixXpoR85SY7Tv.gif)

粘贴板历史记录，方便使用复制/剪切的内容，快捷键ctrl+shift+v可调出该历史记录面板

###[CodeIntel](https://github.com/Kronuz/SublimeCodeIntel)

演示：
![codeIntel](http://i.minus.com/izNM5ohTBvVS1.gif)

代码自动提示，支持大多数语言，能很好地提示大部分jQuery API

###[SideBarEnhancements](https://github.com/titoBouzout/SideBarEnhancements)

用法：`F12`
演示：

![SideBarEnhancements](http://i.minus.com/i3Us4Fx9hUTWv.gif)

这个插件能实现很多功能，比如改变菜单栏的选项，加入一些文件的打开方式，可以直接在sublime菜单中选择用photoshop打开图片什么的，但我看中它的功能是，按F12可用默认浏览器打开当前html页面，还可以通过修改来实现用其他浏览器打开当前页面

###[sublimeLinter](https://github.com/SublimeLinter/SublimeLinter)

前提：[安装Node.js和npm](http://www.infoq.com/cn/articles/nodejs-npm-install-config)
演示：

![sublimeLinter](http://i.minus.com/iVDWsMtw62ack.gif)

插件原文件中只定义了一些基础的js检查机制，你可以通过修改自由的定制它，是它更严格些（js检查机制是基于jshint，相关选项可以参照[此处](http://www.jshint.com/docs/#directives)添加）
该插件可以高亮显示发生了js错误或css错误的行，这两种检查机制均可自由定制

###[sublime-v8](https://github.com/akira-cn/sublime-v8)

用法：

* 按`ctrl+alt+j`调出js简易控制台（与chrome那个类似，但貌似很多功能都无法实现）
* 按 `ctrl+alt+H` 调出js调试界面

演示：

![sublime-v8](http://i.minus.com/il58Vxax648bC.gif)

和sublimeLinter一样都是基于jshint的，不同是这插件会显示出错原因，而且没有精力去折腾node.js的同学，可以直接用这个插件，这插件不需要Node.js

###[daylerees-schemes](https://github.com/daylerees/colour-schemes)
用法：菜单 preferences –> color schemes –> daylerees schemes

演示：以上演示图的代码颜色均为该插件中的snappy主题
超多漂亮的代码颜色标记，相信一定有你喜欢的

**以上插件均可在此处[打包](http://s.yunio.com/gQXB4j)下载**

##小技巧

###取消自动输出双括号

默认状态下，输入左括号时sublime会自动将右括号打出来了，如果不习惯这种，可以打开菜单栏 `Preferences->Setting-user` 设置 `auto_match_enabled` 为 `false` 即可。

###自定义快捷键的设置和插件的设置

插件的快捷键和自定义设置一般在 `菜单 —>preferences —>package settings` 中设置，其中快捷键的设置选项一般包含 `key` 字样，而插件本身的设置一般包含 `setting` 字样。

如果通过上述方式打开的文件中为空，则需要前去**插件文件**中找到真正的设置文件 `菜单 —> preferences —> browse packages`，在打开的文件夹中找到你的插件文件，进入再通过 `key` 、 `setting` 字样来一个个找到设置文件，然后打开自行定制，一般设置选项都为 `true` 或 `false`，比如：

* 设置 sublime-v8 插件的js检查规则：

	`菜单 —> preferences —> browse packages`，找到插件文件夹，进去后打开文件 `JSHINT.sublime-settings`，里面可设置jshint规则

* 设置 sublimeLinter 插件的js检查规则：

	`菜单 —>preferences —>package settings —> sublimeLinter —> setting–Default` ，其中 `sublimelinter` 选项可以设置插件的启动条件， `jshint option` 可添加/删除js检查规则