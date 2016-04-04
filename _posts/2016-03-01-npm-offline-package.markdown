---
layout: post
title: "NPM离线包"
category: front-end
excerpt: 'NPM在安装的过程中会自动下载安装包的依赖文件，离线环境下由于无法下载安装包必要的依赖文件会导致安装失败。以下提供两种方式获取NPM离线包，以供...'
---

[更好的阅读体验](https://www.zybuluo.com/lxjwlt/note/297879)

NPM在安装的过程中会自动下载安装包的依赖文件，离线环境下由于无法下载安装包必要的依赖文件会导致安装失败。以下提供两种方式获取NPM离线包，以供离线环境安装。

##npm打包功能

使用npm提供打包功能，假设package.json文件如下：

```javascript
{
    "dependencies": {
        "commander": "^2.8.1",
        "markdown": "^0.5.0"
    }
}
```

我们需要新增一个字段bundledDependencies，并将依赖文件名以数组形式列出来：

```javascript
{
    "dependencies": {
        "commander": "^2.8.1",
        "markdown": "^0.5.0"
    },
    "bundledDependencies": ["commander", "markdown"]
}
```

最后用命令行工具在根目录下执行：


```
npm pack
```

目录下会生成一个后缀为`.tar`的压缩文件，将该文件拷贝到离线环境上解压，进入解压文件目录执行`npm install`进行安装。

这种方式需要将依赖文件名一个个复制粘贴一遍，操作起来很不方便。如果需要处理大量的离线安装包，推荐用以下做法。

##npmbox

npmbox原名叫npmzip，用于压缩npm安装包。npmbox工具会直接在npm服务器上自动查找并下载好我们指定的安装包，并将安装包压缩成一个后缀为.npmbox的压缩文件。

首先在联网环境中全局安装npmbox工具：

```
npm install npmbox -g
```

由于npmbox工具压缩的文件也需要由npmbox工具来解压，所以离线环境上也要安装npmbox。我们在联网环境上用npmbox工具对其自身的安装包进行压缩：

```
npmbox npmbox
```

目录下生成一个新的文件“npmbox.npmbox”，将该文件拷贝到离线环境中，执行以下命令进行解压安装：

```
tar --no-same-owner --no-same-permissions -xvzf npmbox.npmbox
```

> Windows系统的命令行貌似没有tar命令，建议使用第三方的命令行工具，如[Git-bash](https://git-scm.com/)

解压后得到一个缓存文件夹，不需理会继续执行以下命令全局安装npmbox（windows环境下）：

```
npm install --global --cache .\.npmbox.cache --optional --cache-min 99999 --shrinkwrap false npmbox
```

如果没有报错，npmbox工具已经在离线环境中安装成功了。

接下来要获取npm离线安装包就非常简单了，比如我们想获取bootstrap离线包，只需要在联网环境下执行：

```
npmbox bootstrap
```

然后将压缩文件bootstrap.npmbox拷贝到离线环境，执行以下命令进行解压：

```
npmupbox bootstrap.npmbox
```

##更多阅读

* [npm issues#1349: How can I install packages with all dependencies offline?](https://github.com/npm/npm/issues/1349)
* [Github: arei/npmbox](https://github.com/arei/npmbox#readme)