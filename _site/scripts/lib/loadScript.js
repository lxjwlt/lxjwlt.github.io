define(function(require, exports, module) {
    var loadScript = function(url, option) {
        var progressFunc = option.progress,
            loadendFunc = option.loadend;
        var xhr = new XMLHttpRequest();
        xhr.open('get', url, true);
        xhr.send();
        if (typeof progressFunc === 'function') {
            xhr.onprogress = progressFunc;
        }
        xhr.onload = function(e) {

            var script = document.createElement('script');
            script.language = 'javascript';
            script.type = 'text/javascript';
            script.text = xhr.responseText;
            document.head.appendChild(script);

            loadendFunc.apply(this, e);
        };
    };

    module.exports = loadScript;
});
