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
