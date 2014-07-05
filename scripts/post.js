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
            revNumArr, levelArr, root, level,
            currentList, list, li, link, i, len;

        // 获取标题编号 标题内容
        revNumArr = (function(article, contentArr, titleId) {
            var titleElem = children(article.childNodes, /^h\d$/),
                revNumArr = [],
                lastNum = 1,
                guid = 1,
                id = 'directory' + (Math.random() + '').replace(/\D/, ''),
                lastRevNum, num, dnum, elem;

            while (titleElem.length) {
                elem = titleElem.shift();

                // 保存标题内容
                contentArr.push(elem.innerHTML);

                // 当前的标题编号
                num = +elem.tagName.match(/\d/)[0];

                // 获取前一个标题的修正编号
                lastRevNum = revNumArr[revNumArr.length - 1] || 1;

                // 修正
                if (num > lastNum) {
                    revNumArr.push(lastRevNum + 1);
                } else if (num === lastRevNum ||
                    num > lastRevNum && num <= lastNum) {
                    revNumArr.push(lastRevNum);
                } else if (num < lastRevNum) {
                    revNumArr.push(num);
                }

                lastNum = num;

                // 添加标识符
                elem.id = elem.id || (id + guid++);
                titleId.push(elem.id);
            }

            if (revNumArr.indexOf(1) === -1) {
                dNum = revNumArr.slice()
                    .sort(function(a, b) { return a - b; }).shift() - 1;
                revNumArr = revNumArr.map(function(val, i) {
                    return val - dNum;
                });
            }
            return revNumArr;
        })(article, contentArr, titleId);

        // 计算层次关系
        levelArr = (function(revNumArr) {
            var levelArr = [],
                level = 1;

            while (revNumArr.length) {
                num = revNumArr.shift();
                
                levelArr.push(num - level > 0 ? 1 : num - level);

                level = num;
            }
            return levelArr;
        })(revNumArr.slice());

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

    document.body.addEventListener('click', function(e) {
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