(function(global) {

    // 查找子元素
    var children = function children(childNodes, reg) {
        var result = [],
            isReg = typeof reg === 'object',
            isStr = typeof reg === 'string',
            node, i, len;

        for (i = 0, len = childNodes.length; i < len; i++) {
            node = childNodes[i];

            if ((node.nodeType === 1 || node.nodeType === 9) &&
                (!reg ||
                isReg && reg.test(node.tagName.toLowerCase()) || 
                isStr && node.tagName.toLowerCase() === reg)) {
                
                result.push(node);
            }
        }
        return result;
    },

    // 创建目录
    createDirectory = function(article, directory, isDirNum) {
        var contentArr = [],
            titleId = [],
            levelArr, root, level,
            currentList, list, li, link, i, len;

        // 获取标题编号 标题内容
        levelArr = (function(article, contentArr, titleId) {
            var titleElem = children(article.childNodes, /^h\d$/),
                levelArr = [],
                lastNum = 1,
                lastRevNum = 1,
                count = 0,
                guid = 1,
                id = 'directory' + (Math.random() + '').replace(/\D/, ''),
                lastRevNum, num, elem;

            while (titleElem.length) {
                elem = titleElem.shift();

                // 保存标题内容
                contentArr.push(elem.innerHTML);

                // 当前的标题编号
                num = +elem.tagName.match(/\d/)[0];

                // 修正
                if (num > lastNum) {
                    levelArr.push(1);
                    lastRevNum += 1;
                } else if (num === lastRevNum ||
                    num > lastRevNum && num <= lastNum) {
                    levelArr.push(0);
                    lastRevNum = lastRevNum;
                } else if (num < lastRevNum) {
                    levelArr.push(num - lastRevNum);
                    lastRevNum = num;
                }

                count += levelArr[levelArr.length - 1];
                lastNum = num;

                // 添加标识符
                elem.id = elem.id || (id + guid++);
                titleId.push(elem.id);
            }

            // 避免一开始就进入下一层
            if (count !== 0 && levelArr[0] === 1) levelArr[0] = 0;

            return levelArr;
        })(article, contentArr, titleId);

        // 构造目录
        currentList = root = document.createElement('ul');
        dirNum = [0];
        for (i = 0, len = levelArr.length; i < len; i++) {
            level = levelArr[i];
            if (level === 1) {
                list = document.createElement('ul');
                if (!currentList.lastElementChild) {
                    currentList.appendChild(document.createElement('li'));
                }
                currentList.lastElementChild.appendChild(list);
                currentList = list;
                dirNum.push(0);
            } else if (level < 0) {
                level *= 2;
                while (level++) {
                    if (level % 2) dirNum.pop();
                    currentList = currentList.parentNode;
                }
            }
            dirNum[dirNum.length - 1]++;
            li = document.createElement('li');
            link = document.createElement('a');
            link.href = '#' + titleId[i];
            link.innerHTML = !isDirNum ? contentArr[i] :
                dirNum.join('.') + ' ' + contentArr[i] ;
            li.appendChild(link);
            currentList.appendChild(li);
        }

        directory.appendChild(root);
    };

    createDirectory(document.getElementById('post'), 
        document.getElementById('directory__container'), true);

})(window);

(function(global) {
    var button = document.getElementById('expand-button'),

        directory = document.getElementById('directory');

    document.addEventListener('click', function(e) {
        var classList, index;

        if (directory.className.indexOf('active') !== -1) {
            classList = directory.className.split(' ');
            index = classList.indexOf('active');
            classList.splice(index, 1);
            directory.className = classList.join(' ');
        }
    });

    button.addEventListener('click', function(e) {
        var classList, index;

        if (directory.className.indexOf('active') === -1) {
            directory.className += ' active';
        } else {
            classList = directory.className.split(' ');
            index = classList.indexOf('active');
            classList.splice(index, 1);
            directory.className = classList.join(' ');
        }

        e.stopPropagation();
        e.preventDefault();
    });

    directory.addEventListener('click', function(e) { 
        e.stopPropagation(); 
    });
})(window);

(function(global) {
    var topButton = document.getElementById('top-button');
    topButton.addEventListener('click', function(e) {
        global.scroll(0, 0);
        e.stopPropagation();
        e.preventDefault();
    });
})(window);