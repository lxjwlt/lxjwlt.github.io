---
layout: post
title: "Canvas处理头像上传"
category: front-end
excerpt: '最近社区系统需要支持移动端，其中涉及到用户头像上传，头像有大中小三种尺寸，在PC端，社区用Flash来处理头像编辑和生成，但该Flash...'
---

[开启更好的阅读模式](https://www.zybuluo.com/lxjwlt/note/101343)

最近社区系统需要支持移动端，其中涉及到用户头像上传，头像有大中小三种尺寸，在PC端，社区用Flash来处理头像编辑和生成，但该Flash控件的界面不友好而且移动端对Flash的支持不好，考虑到这些问题，最后我们选用Canvas来完成图像尺寸缩放和图片数据获取。

##等边处理

头像一般都是正方形，首先我们需要获取图片宽度和高度的最小值，用该最小值作为边长居中裁剪图片，最终得到一个正方形的图片：


```javascript
var ImageEditor = function() {
    // 用离线canvas处理图片数据
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
};

var fn = ImageEditor.prototype;

fn.resizeCanvas = function(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
};

fn.clipSquareImage = function(url, callback) {
    var that = this,
        img = new Image();
        
    img.src = url;
    img.onload = function() {
    
        // 取宽高最小值作为正方形边长
        var eLength = Math.min(img.width, img.height),
            picture = img;
        
        // canvas不支持局部截屏，截屏前必须先调节canvas的宽高
        that.resizeCanvas(eLength, eLength);
        
        // 将图片以居中裁剪的方式画到canvas中。
        // drawImage支持9个参数：图片对象，图片上的剪切坐标XY，
        // 剪切宽高，图片在canvas上的坐标XY及图片宽高
        that.context.drawImage(picture,
            (picture.width - eLength) / 2, (picture.height - eLength) / 2,
            eLength, eLength, 0, 0, eLength, eLength);
        
        // 截屏，即获取base64数据
        callback.call(that, that.canvas.toDataURL('image/png'));
        
    };
};
```

##Canvas元素大小限制问题

上述`clipSquareImage`函数中，由于`canvas.toDataURL`接口不提供宽高参数，只能够一次性把整个canvas的屏幕数据截取下来，所以在对Canvas截屏前，我们必须先设置Canvas元素的大小。然而移动端拍照的分辨率极高，宽高大多会在3000以上，当我们根据相片宽高的最小值来设置Canvas的尺寸时，Canvas元素的最小宽度也高达到3000以上。

问题在于，每个平台对Canvas的大小都有限制，如果Canvas的宽度或高度任意一个值超过了平台限制，Canvas将无法进行渲染，`canvas.toDataURL`只能获取一张透明的图片数据。

[Maximum size of a canvas element](http://stackoverflow.com/questions/6081483/maximum-size-of-a-canvas-element)中提到了部分平台下Canvas的尺寸限制：

```
chrome          = 32767x32767
iPod Touch 16GB = 1448x1448
iPad Mini       = 2290x2289
iPhone 3        = 1448x1448
iPhone 5        = 2290x2289
```

参考以上数据，我们先给Canvas设置一个最大的宽度：

```
var MAX_WIDTH = 1000;
```

在`clipSquareImage`函数中加入最大宽度的检测，如果超过限制，则创建一个临时的canvas进行图片缩放处理，最后对该**临时的Canvas**进行居中剪切：

```javascript
fn.clipSquareImage = function(url, callback) {
    var that = this,
        img = new Image();
        
    img.src = url;
    img.onload = function() {
         // 取图片宽高和Canvas的最大宽度的最小值作为等边长
        var eLength = Math.min(img.width, img.height, MAX_WIDTH),
        
            // 剪切对象
            picture = img,
            
            tempEditor,
            ratio;
        
            // 如果图片尺寸超出限制
            if (eLength === MAX_WIDTH) {
            
                // 创建一个临时editor
                tempEditor = new ImageEditor();
                
                ratio = img.width / img.height;

                // 按图片比例缩放canvas
                img.width < img.height ？
                    tempEditor.resizeCanvas(MAX_WIDTH * ratio, MAX_WIDTH) ：
                    tempEditor.resizeCanvas(MAX_WIDTH, MAX_WIDTH / ratio);
                    
                tempEditor.context.drawImage(img, 0, 0, tempEditor.canvas.width, tempEditor.canvas.height);

                // 将临时Canvas作为剪切对象
                picture = tempEditor.canvas;
                
                eLength = Math.min(tempEditor.canvas.width, tempEditor.canvas.height);

            }
            
            // 居中剪切
            // ... ...
        
            // 截屏操作
            // ... ...
            
    };
};
```


##Canvas锯齿问题
上面我们已经能够通过Canvas裁剪出一张正方形的图片，接下来我们还需要处理头像图片大中小三种尺寸。在Canvas中，`drawImage`接口提供非常方便的缩放功能：

```javascript
var editor = new ImageEditor;

// 将图片缩放到300x300
// drawImage支持5个参数：图片对象，及图片在canvas上的坐标和宽高
editor.context.drawImage(squareImage, 0, 0, 300, 300);
```

然而大尺寸图片直接用`drawImage`进行缩小处理会导致图片出现锯齿。在stack overflow上[HTML5 canvas drawImage: how to apply antialiasing](http://stackoverflow.com/questions/17861447/html5-canvas-drawimage-how-to-apply-antialiasing)提出了一个方案：对图片进行若干次的等比例缩小，最后再放大到目标尺寸：

![canvas高清缩放](http://i1273.photobucket.com/albums/y401/lxjwlt/canvas%20deal%20width%20avatar/canvas%20_zpsgsfeet7n.png)

参考这个方案，我们可以实现`antialiasScale`抗锯齿缩放函数：

```javascript
fn.antialisScale = function(img, width, height) {
    var offlineCanvas = document.createElement('canvas'),
        offlineCtx = offlineCanvas.getContext('2d'),
        sourceWidth = img.width,
        sourceHeight = img.height,
        
        // 缩小操作的次数
        steps = Math.ceil(Math.log(sourceWidth / width) / Math.log(2)) - 1,
        
        i;
        
    // 渲染图片
    offlineCanvas.width = sourceWidth;
    offlineCanvas.height = sourceHeight;
    offlineCtx.drawImage(img, 0, 0, offlineCanvas.width, offlineCanvas.height);
    
    // 缩小操作
    // 进行steps次的减半缩小
    for(i = 0; i < steps; i++) {
        offlineCtx.drawImage(offlineCanvas, 0, 0,
            offlineCanvas.width * 0.5, offlineCanvas.height * 0.5);
    }
    
    // 放大操作
    // 进行steps次的两倍放大
    this.context.drawImage(offlineCanvas, 0, 0,
        offlineCanvas.width * Math.pow(0.5, steps), 
        offlineCanvas.height * Math.pow(0.5, steps),
        0, 0, width, height);
};
```

我们可以用这个函数代替drawImage完成缩放工作，生成头像图片的三种尺寸：

```javascript
fn.scaleSquareImage = function(url, sizes, callback) {
    var that = this;
    
    // 先裁剪一个正方形
    that.clipSquareImage(url, sizes, function(data) {
        var squareImage = new Image(),
            result = [],
            i;
            
        squareImage.src = data;
        
        // 抗锯齿缩放
        for (i = 0; i < sizes.length; i++) {
            that.antialisScale(squareImage, sizes[i], size[i]);
            result.push(that.canvas.toDataURL('image/png'));    
        }
        
        callback.call(that, result);
    });
};
```

##PHP存储base64图片数据

`Canvas.toDataURL()`获取的**默认**图像数据格式是：`data:image/png;base64,` + base64数据：

```javascript
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAADElEQVQImWNgoBMAAABpAAFEI8ARAAAAAElFTkSuQmCC
```

当把Canvas截屏数据传给后台时，后台需要截断开头的字段`data:image/png;base64,`，获取后面那串真正的base64数据：

```php
<?php
	$imgData = $_POST['imgData'];
	
	// 截取有用的部分
	list($type, $imgData) = explode(';', $imgData);
    list(, $imgData)      = explode(',', $imgData);
    
    // base64 编码中使用了加号，
    // 如果通过url传递base64数据，+号会转换成空格
    $imgData = str_replace(' ', '+', $imgData);
    
    // 存储文件
	$success = file_put_contents('PATH/XXX.png', base64_decode($imgData));
```

###参考

* [Save a Base64 Encoded Canvas image to a png file using PHP](http://j-query.blogspot.com/2011/02/save-base64-encoded-canvas-image-to-png.html)
* [Html5 canvas drawImage: how to apply antialiasing](http://stackoverflow.com/questions/17861447/html5-canvas-drawimage-how-to-apply-antialiasing)
* [Maximum size of a canvas element](http://stackoverflow.com/questions/6081483/maximum-size-of-a-canvas-element)
* [How to save a PNG image server-side, from a base64 data string](http://stackoverflow.com/questions/11511511/how-to-save-a-png-image-server-side-from-a-base64-data-string)
* [How to send FormData objects with Ajax-requests in jQuery?](http://stackoverflow.com/questions/6974684/how-to-send-formdata-objects-with-ajax-requests-in-jquery)













