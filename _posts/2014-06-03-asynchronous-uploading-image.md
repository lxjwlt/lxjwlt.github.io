---
layout: post
title: "异步上传图片"
category: front-end
excerpt: '用户可能会不断上传头像图片来查看头像呈现出来的效果，而在这过程中，用户的页面不断地被刷新，这是一种极其不友善的交互方式。所以在这种情况下，我们希望不刷新页面的同时能够将图片上传至服务器，即异步上传图片'
---


首先，我们看看图片上传的一般做法：

```html
<!-- 
    注意 enctype属性和method属性的设置
-->
<form enctype="multipart/form-data" method="post" action="upload.php">
    <input type="file" name="file" />
    <button type="submit" />
</form>
```
按照这种方式，每次上传图片都要提交表单，而每次提交表单都要刷新页面。然而在上传用户头像的情况下，这种方式是极其不友善的。

我们试着考虑一下，用户可能会不断上传头像图片来查看头像呈现出来的效果，而在这过程中，用户的页面不断地被刷新，这是一种极其不友善的交互方式。所以在这种情况下，我们希望不刷新页面的同时能够将图片上传至服务器，即异步上传图片。

说到异步上传，我们立马想到Ajax，然而Ajax只能传输纯文本的数据，<del>没法传输图片数据，所以我们需要另寻他径。</del>在HTML5之前，Ajax是无法实现图片上传的，所以下面先介绍兼容性良好的方案。

##iframe模拟异步上传
我们都听说过iframe，iframe是一种内联框架，在该框架内可以访问（加载）其他页面。

iframe模拟异步上传的关键在于——使用iframe打开表单的action URL：

```html
<!-- 
    注意！此时form的target属性指向 名为theIframe的iframe标签
-->
<form enctype="multipart/form-data" method="post" action="upload.php" target="theIframe">
    <input type="file" name="file" />
    <iframe name="theIframe"></iframe> <!-- 添加一个iframe -->
    <button type="submit" />
</form>
```

由于表单的action URL是在iframe里面打开的，所以用户的页面是不会被刷新的。于是我们实现了图片的异步上传。

然而**这是不够的**，关于用户头像上传，不仅仅需要上传头像图片，我们还需要将该图片的展现出来，这才是重点。为了显示该图片，我们需要该图片在服务器上的实际地址。

既然iframe打开了一个页面upload.php，那么就让后台的同学通过这个页面将图片实际地址传递给我们前端吧。关于后台的实现，可以参考笔者写的一个小demo：

```php
<html>
<head>
    <meta charset="UTF-8">
    <title>upload</title>
</head>
<body>

    <?php
        // 获取上传文件的文件名
        $filename = $_FILES['file']['name'];
        
        // 定义存储地址
        $target = 'images/' . $filename;
        
        // 将临时图片 拷贝到 存储地址
        move_uploaded_file($_FILES['file']['tmp_name'], $target);
    ?>
    
    <!-- 
        输出一个img标签，用其src属性存储实际地址，方便前端获取
    -->
    <img src=<?php echo "$target" ?> />

</body>
</html>
```

ok！那么我们前端如何从iframe中获取这个地址呢？相信这对于各位来说不难，所以我稍微提一下：

```javascript
var doc, src;

// 获取 名为theIframe的iframe的 document对象
doc = top.frames['theIframe'].document;

// 获取iframe中的image标签，该img的src属性上存储了图片实际的地址
src = doc.images[0].src;

// 更新头像
$('.avatar').prop('src', src);
```

##Ajax实现图片上传
XMLHttpRequest level 2新增了对FormData对象接口的支持，FormData对象是什么东东？FormData对象能够将上传文件转换为表单数据，如此一来，XMLHttpRequest 的 send 方法便能将这些数据传送到后台，从而实现文件上传。

首先创建FormData对象，并通过`append`方法将数据以键值对的形式添加到FormData对象中：

```javascript
var formData = new FormData(),

    // 获取上传文件的File对象
    theFile = $('input[type=file]')[0].files[0];

// 将上传文件添加到FormData对象中
formData.append('file', theFile);
```

然后，将FormData对象作为Ajax的数据传送到后台，以下是原生方法：

```javascript
var xhr = new XMLHttpRequest();

xhr.open('post', 'upload.php', true);
xhr.send(formData);

xhr.onreadystatechange = function() {
    if (this.readyState === 4 && this.status === 200) {
    
        // 获取xhr.responseText 并 更新用户头像
        // ...
        
    }
};
```

当然，我们也能通过jQuery库提供的`jQuery.ajax`方法来实现，但有几点我们是必须注意的：

```javascript
$.ajax({
    type: 'POST',
    url: 'upload.php',
    
    // contentType必须为false！避免jQuery添加Content-Type头部信息
    contentType: false,
    
    // processData必须为false！不然jQuery会将formData转换为字符串
    processData: false,
    
    data: formData,
    dataType: 'text',
    success: function(data) {
        // 更新 用户头像
        $('.avatar').prop('src', data.trim());
    }
});
```

由于FormData是HTML5新增的构造方法，所以上述通过FormData来实现Ajax上传文件的方法只适用于IE10+。

##有没有其他方法？
相信我们都会这么考虑：其实完全没必要上传图片，用户不就是想看看图片的实际效果吗？直接将上次图片显示出来就行了。

然而，由于浏览器的安全策略，浏览器禁止`<image>`直接引用本地地址。虽然本地地址行不通，但我们可以通过HTML5获取上传文件的临时地址：

```javascript
    // 获取上传文件的File对象
var theFile = $('input[type=file]')[0].files[0],

    // 获取上传文件的临时地址
    src = window.URL.createObjectURL(theFile);
    
// 通过该临时地址 更新 用户头像
$('.avatar').prop('src', src);
```

用`createObjectURL`生成的URL是会占用内存空间的，所以当我们不再需要图片显示时，我们必须释放它的内存空间：

```javascript
window.URL.revokeObjectURL(theFile);
```

尽管`window.URL.createObjectURL`方法非常简洁实用，但遗憾的是，该方法只支持IE10+。

另外，异步上传图片也能通过flash来实现，有兴趣的同学可以去了解了解。

##参考
* [Using files from web applications](https://developer.mozilla.org/en-US/docs/Using_files_from_web_applications#Example.3a_Using_object_URLs_to_display_images)
* [Using FormData Object](https://developer.mozilla.org/en-US/docs/Web/Guide/Using_FormData_Objects)
* [Sending multipart/formdata with jQuery.ajax](http://stackoverflow.com/questions/5392344/sending-multipart-formdata-with-jquery-ajax)