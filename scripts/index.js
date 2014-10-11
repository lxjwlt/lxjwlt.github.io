define(function(require, exports, module) {
    var loadScript = require('./lib/loadScript');
    var loadButton = document.querySelector('.search-block__load-button'),
        progressBar = document.querySelector('.progress-button__progress'),
        searchBlock = document.querySelector('.search-block__input');

    loadButton.addEventListener('click', function() {
        loadButton.disabled = true;
        loadScript('scripts/activateSearchBlock.js', {
            progress: function(e) {
                if (e.lengthComputable) {
                    console.log(e.loaded, progressBar);
                    progressBar.style.width = e.loaded / e.total * 100 + '%';
                }
            },
            loadend: function() {
                setTimeout(function() {
                    seajs.use('activateSearchBlock');
                    searchBlock.classList.remove('is-noready');
                    loadButton.classList.add('is-loaded');
                }, 500);
            }
        });
    });
});
