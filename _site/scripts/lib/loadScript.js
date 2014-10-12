define(function(require, exports, module) {
    var loadScript = function(url, option) {
        var progressFunc = option.progress,
            loadendFunc = option.loadend,
            xhr = new XMLHttpRequest();
        xhr.open('get', url, true);
        xhr.send();
        if (progressFunc) xhr.onprogress = progressFunc;
        xhr.onloadend = function(e) {

            var script = document.createElement('script');
            script.language = 'javascript';
            script.type = 'text/javascript';
            script.text = xhr.responseText;
            document.head.appendChild(script);

            if (loadendFunc) setTimeout(loadendFunc.bind(this, e), 400);
        };
    };

    module.exports = loadScript;
});
