---
layout: post
title: "[译]《Sphinx权威指南》 - Sphinx入门"
category: front-end
excerpt: '最近社区搜索功能要进行优化，由于需求点比较多，功能要求比较“夸张”，我们弃用了Discuz本身那套搜索逻辑代码，自行引入Sphinx搜索引擎进行重新开发（Discuz本身带有Sphinx，但只提供基本选项，可定制度低）。Sphinx搜索引擎提供全文搜索，且性能比MySQL查询好，加之国人在Sphinx之上开发的CoreSeek，使得...'
---

> 最近社区搜索功能要进行优化，由于需求点比较多，功能要求比较“夸张”，我们弃用了Discuz本身那套搜索逻辑代码，自行引入Sphinx搜索引擎进行重新开发（Discuz本身带有Sphinx，但只提供基本选项，可定制度低）。Sphinx搜索引擎提供全文搜索，且性能比MySQL查询好，加之国人在Sphinx之上开发的CoreSeek，使得Sphinx支持中文搜索，所以引入Sphinx是必要的。大半个月的开发渐进尾声，我原先打算将开发过程中的要点记录下来，但没用过Sphinx的同学看到这种文章无疑云里雾里，我转而想总结一篇详尽的入门使用指南，于是google各种资料，构思目录框架，可是细想下来，才疏学浅，成文不过是Sphinx官方文档的另一个版本。一次我查如何合并数据源的时候，无意间找到了这本书《Introduction to Search with Sphinx》，书中不仅详细的介绍了sphinx的基本使用，而且也提及到Sphinx背后的搜索机制，很有参考意义。以下选取其中入门篇以便大家了解Sphinx。

* [英文原文链接：Introduction to Search with Sphinx -- Chapter 2.Getting Started with Sphinx](https://www.safaribooksonline.com/library/view/introduction-to-search/9780596809546/ch02.html)
* [Sphinx & CoreSeek官方文档](http://www.coreseek.cn/docs/coreseek_4.1-sphinx_2.0.1-beta.html)

本章中，我们会讨论到Sphinx基础的安装、配置和维护。不要被“基础”这形容词糊弄而跳过这个章节。对于“基础”，我不是指简单到显而易见的东西，而是指所有人都会用到的功能。

一般来说，Sphinx会使用MySQL作为它的数据源，同时，Sphinx假定你已经安装好了MySQL和MySQL开发库文件。当然你可以把Sphinx运行在其他相关的数据库或数据源上，但MySQL非常流行，所以方便起见本章内容都基于MySQL。


##工作流简略

总的来说，我们要讨论的内容有安装、配置和使用。一个完整的搜索是由四个关键部分组成的：

* 客户端程序

客户端程序接收用户的搜索字符串（或者根据程序配置构建一个搜索字符串），发送查询给searchd程序并显示返回结果。

* 数据源

数据源存储的数据会被indexer程序用来查询。大部分的Sphinx站点使用MySQL或其他SQL服务器作为存储。但这不是硬性要求 -- 因为Sphinx在非SQL数据源上也能运行良好。而且在接下来的章节中，我们会发现，我们可以把Sphinx的索引文件从应用程序中迁移出来，而不像数据库那种固定的源文件。

* indexer程序

indexer程序从数据源中获取数据并将该数据生成一个全文索引。你可以按照你特定的需求，定期性地运行indexer程序。例如，每日新闻报的文章索引一般可以每天更新一次。而较为动态的数据应该更频繁的重建索引。比如，你会为拍卖的物品每分钟生成一次索引。

* searchd程序

searchd程序直接和你的客户端程序进行对话，并使用indexer程序构建的索引来快速地处理搜索查询。然而searchd程序要做的远远不止是搜索而已。它同时会对搜索结果进行处理（筛选、排序和分组）；它可以和远程searchd程序的拷贝进行对话从而实现分布式搜索；除了搜索，它提供了其他一些实用函数，例如创建搜索片段，将给定的文本分割成关键字(即分词器)等等。

所以，数据或多或少的从存储空间（数据源）传送到indexer程序，indexer程序生成索引并将索引传递给searchd程序，然后再传递到你的程序。每次你运行indexer程序都会触发第一部分的传递。当索引构建完毕并且indexer程序通知searchd程序索引构建完毕，这时触发第二部分的传递，而你的每次查询都会触发最后一部分的传递（即传递给客户端程序）。请看图-1。

![Data flow with Sphinx](https://www.safaribooksonline.com/library/view/introduction-to-search/9780596809546/httpatomoreillycomsourceoreillyimages829415.png)

图-1. Sphinx的数据流

现在，我们不从数据出发而是从服务功能出发构建一张流程图。在图-2中，searchd程序是一个提供你对话的持续运行的服务进程，它实时地对搜索查询进行应答，就像一个相关的数据库对数据查询进行应答。indexer是一个分离的工具，它提取数据，生成索引并将索引传递给searchd。

![Database, Sphinx, and application interactions](https://www.safaribooksonline.com/library/view/introduction-to-search/9780596809546/httpatomoreillycomsourceoreillyimages829419.png)

图-2 数据库、Sphinx和应用之间的交互流程

实际上，这是一个“提取”模型：indexer程序去数据库那里提取数据，生成单个或多个索引，并将它们传递给searchd程序。这其中一个重要的结论就是，Sphinx是无关存储引擎、数据库和数据源的东西。你可以使用任意内置的或外部的MySQL存储引擎（MyISAM, InnoDB, ARCHIVE, PBXT, 等等）或PostgreSQL, Oracle, MS SQL, Firebird等等引擎，或甚至不使用数据库。只要indexer程序可以直接查询你的数据库或可以从代理程序中接受到XML内容并获取到数据，那么indexer程序就可以生成索引。

图-1和图-2只是从后台的角度涵盖了基于磁盘的索引构建。对于实时索引来说，工作流程实际上是不一样的 -- indexer程序不会被用到，应用或数据库需要把用于生成索引的数据直接传递给searchd程序。

##准备工作 ... 只需一分钟

Sphinx最简单的搭建方法就是安装二进制安装包。你几乎只需要一次点击，就能够搭建起一个工作环境。为了更好的使用，安装成功后，Sphinx会提供如何使用的简略说明。

```
[root@localhost ~]# rpm -i sphinx-1.10-1.el5.i386.rpm
```

Sphinx 安装成功！

现在我们创建一个全文索引，并启动一个search后台进程，你已经准备好了。

编写索引规则：

```
editor /etc/sphinx/sphinx.conf
```

重新生成全部索引：

```
sudo -u sphinx indexer --all --rotate
```

启动/关闭searchd进程：

```
service searchd start/stop
```

使用MySQL客户端对searchd进程进行查询：

```
mysql -h 0 -P 9306
mysql> SELECT * FROM test1 WHERE MATCH('test');
```

查阅/usr/share/doc/sphinx-1.10 手册，了解更多细节。

上述rpm命令的安装成功后，会提供/etc/sphinx/sphinx.conf配置文件和一个示例文件，并预加载了两个测试用的全文索引：基于硬盘的索引test1，和一个实时索引testrt。

Windows系统下，你可以通过拷贝示例文件模版（都以.conf为后缀名）来创建一个sphinx.conf配置文件，只需进行小部分的修改，下面的测试例子就可以正常运行：


* 将@CONFDIR@换成存储数据和日志的路径。

* 将src1配置中的带`sql_`前缀的参数都补全。假设你是以用户名root且密码为空登录进MySQL，那么参数如下：

```
sql_host     = localhost
sql_user     = root
sql_pass     =
sql_db       = test
```

test1索引是从示例MySQL数据表（test.documents）中获取数据，所以为了使用这个索引，你需要事先进入对应的数据表中，然后运行indexer程序生成索引数据。根据你MySQL的版本，你可能需要手动创建test数据库。你也可以使用不同的数据库名，将其代替test数据库完成以下的示例。你可以注入/usr/share/doc/下的example.sql文件，通过里面的SQL示例语句来创建数据表。

```
[root@localhost ~]# mysql -u root test < /usr/share/doc/sphinx-1.10/example.sql
[root@localhost ~]# indexer test1
Sphinx 1.10-id64-beta (r2420)
Copyright (c) 2001-2010, Andrew Aksyonoff
Copyright (c) 2008-2010, Sphinx Technologies Inc (http://sphinxsearch.com)

using config file '/etc/sphinx/sphinx.conf'...
indexing index 'test1'...
collected 4 docs, 0.0 MB
sorted 0.0 Mhits, 100.0% done
total 4 docs, 193 bytes
total 0.007 sec, 24683 bytes/sec, 511.57 docs/sec
total 3 reads, 0.000 sec, 0.1 kb/call avg, 0.0 msec/call avg
total 9 writes, 0.000 sec, 0.1 kb/call avg, 0.0 msec/call avg
```

然后，你可以启动searchd程序，并使用示例PHP test程序或MySQL客户端来查询索引：

```
[root@localhost ~]# service searchd start
Starting searchd: Sphinx 1.10-id64-beta (r2420)
Copyright (c) 2001-2010, Andrew Aksyonoff
Copyright (c) 2008-2010, Sphinx Technologies Inc (http://sphinxsearch.com)

using config file '/etc/sphinx/sphinx.conf'...
listening on all interfaces, port=9312
listening on all interfaces, port=9306
precaching index 'test1'
[root@localhost ~]# mysql -u root test < /usr/share/doc/sphinx-1.10/example.sql
precached 2 indexes in 0.005 sec
[  OK  ]
[root@localhost ~]# mysql -h0 -P9306
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 1
Server version: 1.10-id64-beta (r2420)

Type 'help;' or '\h' for help. Type '\c' to clear the buffer.

mysql> select * from test1 where match('test');
+------+--------+----------+------------+
| id   | weight | group_id | date_added |
+------+--------+----------+------------+
|    1 |   2421 |        1 | 1283729225 |
|    2 |   2421 |        1 | 1283729225 |
|    4 |   1442 |        2 | 1283729225 |
+------+--------+----------+------------+
3 rows in set (0.00 sec)

mysql> exit
Bye
[root@localhost ~]# php /usr/share/sphinx/api/test.php test
Query 'test ' retrieved 3 of 3 matches in 0.000 sec.
Query stats:
'test' found 5 times in 3 documents

Matches:
1. doc_id=1, weight=101, group_id=1, date_added=2010-09-06 03:27:05
2. doc_id=2, weight=101, group_id=1, date_added=2010-09-06 03:27:05
3. doc_id=4, weight=1, group_id=2, date_added=2010-09-06 03:27:05
[root@localhost ~]#
```

实时索引更加简单。它们在运行时被生成，所以你不需要具备数据库或者运行indexer程序。只需要启动searchd程序就可以开始工作：

```
[root@localhost ~]# mysql -h0 -P9306
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 1
Server version: 1.10-id64-beta (r2420)

Type 'help;' or '\h' for help. Type '\c' to clear the buffer.

mysql> select * from testrt;
Empty set (0.00 sec)
```

让我们在这里暂停一下，然后把你的注意力集中在一些容易忽略但非常重要的东西上。

这不是MySQL语句！

这仅仅是MySQL客户端和我们的Sphinx服务器进行的对话。注意看Server的版本字段的版本号：注意，这是Sphinx的版本标签（和修订版本ID）。而且我们选取数据的testrt也不是一个MySQL数据表。它是一个Sphinx的实时索引名叫作testrt，定义在默认的配置文件中。

现在我们已经可以筛选出结果，下面让我们更进一步，给我们的索引注入一些数据：

```
mysql> insert into testrt (id, title, content, gid)
-> values (1, 'hello', 'world', 123);
Query OK, 1 row affected (0.01 sec)

mysql> insert into testrt (id, title, content, gid)
-> values (2, 'hello', 'another hello', 234);
Query OK, 1 row affected (0.00 sec)

mysql> select * from testrt;
+------+--------+------+
| id   | weight | gid  |
+------+--------+------+
|    1 |      1 |  123 |
|    2 |      1 |  234 |
+------+--------+------+
2 rows in set (0.00 sec)

mysql> select * from testrt where match('world');
+------+--------+------+
| id   | weight | gid  |
+------+--------+------+
|    1 |   1643 |  123 |
+------+--------+------+
1 row in set (0.00 sec)
```

实时索引的数据注入方式和一般的索引是不同的。为了让test1索引起作用，我们向MySQL注入了示例文件example.sql，然后告诉indexer去获取这部分的数据并生成索引。而对于实时索引testrt，我们只需要连接searchd并直接向testrt索引导入数据，略过了MySQL和indexer程序。我们使用INSERT语句，就像我们插入数据到MySQL一样。此外，我们使用MySQL客户端发送这些语句到Sphinx，因为Sphinx作为MySQL的网络协议能够识别同样的语言。只是Sphinx不像MySQL，Sphinx的SELECT语句不会返回数据本身；Sphinx只会返回文档的ID集合和经过计算得到的权值。这是因为title和content字段被识别为全文搜索字段，而Sphinx只会存储全文索引（就像第一章的描述）而不是原始文本。

非常简单，不是么？当然，在实际开发中，你需要一个配置文件和你的数据相绑定。让我们看看示例配置文件的内容，然后创建自己的配置文件。

##基本配置

sphinx.conf配置文件包含的部分有三种主要类型：

* 数据源定义，描述用于生成索引的数据的存储位置和这些数据如何获取。
* 全文索引定义，可以进行许多索引配置。
* indexer和searched的程序设置

下面一小节会覆盖配置文件中每个部分的命令，这对于你开始使用Sphinx来说是非常重要的。

### 定义数据源

就像我在第一章所说的，那些事先存在并要批量转换成索引的数据通常存在你的SQL数据库或XML文件中，但Sphinx允许其他方式的引入。sphinx.conf中的数据源定义告诉indexer程序数据存储位置和如何获取这些数据。典型的数据源定义看起来就像：

```
source src1
{
type               = mysql
sql_host           = localhost
sql_user           = test
sql_pass           =
sql_db             = test
sql_port           = 9306 # optional, default is 9306

sql_query          = \
SELECT id, group_id, UNIX_TIMESTAMP(date_added) date_added, \
title, content \
FROM documents

sql_attr_uint      = group_id
sql_attr_timestamp = date_added
}
```

这里做了什么？首先，我们定义了一个数据源的名字（src1）还有数据源的类型（mysql）。其次，我们为indexer程序提供了MySQL访问的认证信息，当获取数据时要用到。再者，通过使用sql_query命令，我们定义了查询（也叫作主查询），事实上indexer会用这个查询去获取数据。我们还定义了用于索引属性而不用于全文搜索的列字段还有它们各自的类型。那么接下来，我们要将group_id（正整数）和date_added（时间戳）设为属性：

```
sql_attr_uint      = group_id
sql_attr_timestamp = date_added
```

以上为Sphinx提供了足够的信息去获取数据并生成索引。

另外，数据源的类型也是可选的。大部分类型都类似于MySQL，但你也可以实用其他SQL数据库，比如PostgreSQL, MS SQL, Oracle等等。虽然有一种类型不是SQL数据库。这个类型叫做xmlpipe，你可以将特殊格式的XML文档提供给indexer程序，而不需要进入数据库中获取数据。

为了了解属性的使用，让我们回到第一章使用书籍摘要的例子。书籍的标题和摘要用作全文搜索，而价格和出版年份作为属性。Sphinx要求SELECT语句中的第一个字段必须是独一无二的ID。为了满足以上要求，配置选项可以这么写：

```
sql_query = SELECT id, title, abstract, price, year FROM books
sql_attr_float = price
sql_attr_uint = year
```

我们显式地定义了两个属性，而其余的都会自动被当作是全文字段。细心的读者可能会问，为什么我们不把ID标记为属性。答案是，indexer把第一个字段返回的值当做ID，在内部会对它进行特殊处理。

### 基于磁盘的索引

当你定义好你的数据源，是时候告诉Sphinx该如何对这些数据生成索引了。下面介绍全文索引配置，以下给出简单的示例：

```
index test1
{
source              = src1
charset_type        = sbcs
path                = /usr/local/sphinx/data/test1
}
```

这配置会创建一个叫test1的索引，它会从数据源src1中获取数据，期望文本数据是single-byte编码格式，而且使用/usr/local/sphinx/data/test1.*作为索引文件的基本名。

你可以定义多个数据源并将他们的数据合并到单独一个全文索引中。当数据库是分布式（亦称共享式），这会非常有用，但这既不要求全文索引是分布式的，也不要求全文索引转换成分布式的。所有的数据源结构，也就是说，字段和属性的集合，都必须相同，这样才能进行合并；否则，indexer程序会执行失败并抛出错误。为了定义多个数据源，我们只需要枚举它们：

```
index test2
{
source              = src1
source              = src2
source              = src3
charset_type        = sbcs
path                = /usr/local/sphinx/data/test2
}
```

当生成索引test2时，所有来自上述例子中三个数据源的数据都会合并到一个单独的索引中。只要这些数据源结构相同，那么它们可以来自不同的位置和不同的存储方式。举个例子，你可以从机器A中MySQL服务器中获取一半的数据，而另一半的数据则从机器B的PostgreSQL服务器中得到。

字符编码设置支持sbcs（指Single Byte Character Set）和utf-8。然而，通过使用charset_table指令，任何单字节字符编码都可以被支持。这提供了大量的选项去操作字符集：你可以选取字符集用于生成索引，选择用于替换空白字符的字符，控制如何将一种字符集映射另一种字符集。在第三章会详细介绍。

path指令设置存储文件的路径为/usr/local/sphinx/data/test1，而indexer程序会将这个路径作为前缀生成出索引文件名。例如，属性集会存在/usr/local/sphinx/data/test1.spa中，等等。

上述例子非常简单，但事实上，索引定义比我们预期更强大，它允许其余许多选项不进行设置，保留默认值。大部分这些选项都控制索引生成期间和搜索期间的文本处理，你可以：

* 选择一个或多个关键字处理器（stemmers, soundex, 或 metaphone）
* 不对暂停符进行索引生成
* 指定词形字典，该字典会用来将关键字转换成词元（词形）
* 指定生成分词的例外情况，这会覆盖通用的字符编码配置。假如说“C++”作为一个单独的关键字进行索引拆分，虽说“+”是常规的字符，但却不是一个有效的字符（例外情况）。
* 指定特殊的字符类型（忽略字符集，短语分界符集，混合字符集）
* 高级模式下的去除HTML结构（html_strip）
* 子字符串的索引生成和搜索配置
* 索引生成和搜索在时间方面的多种控制，比如属性存储策略（docinfo），索引数据缓存微调（mlock 和 ondisk_dict），反转配置（inplace_enable）等等。你可以平衡indexer程序使用和索引生成速度之间的关系。
* 配置分布式索引

这些选项中一部分会在后面详细介绍，而另一部分在对应的文档中能找到详细解释。

###实时索引

实时索引不使用数据源，但Sphinx依然需要知道你在索引中要用到哪个字段和哪个属性，所以你需要在配置文件中将这些都指定处理。以下是例子：

```
index rt
{
type              = rt
path              = /usr/local/sphinx/data/rt
rt_field          = title
rt_field          = content
rt_attr_uint      = group_id
rt_attr_timestamp = published
rt_mem_limit      = 256M
}
```

这个例子创建了一个实时索引叫作rt，这个索引有两个全文字段，一个整数属性和一个时间戳属性。这里有几点是和常规索引不一样的，也就是在实时索引中：

* 实时索引的类型需要显式的指定。
* 所有全局文本字段需要显式地指定。
* 属性的定义是以rt_attr前缀开始的，而是不是sql_attr
* 没有数据源的配置
* 有一个实时索引独有的rt_mem_limit选项

配置文件中最后一个命令rt_mem_limit非常重要。这个命令控制实时的内存中的索引块（内存块）的最大尺寸，Sphinx会为该索引使用该内存块。你每次对实时索引作的改变都会造成部分内存的使用，而当searchd程序使用的内存达到了上限，它就必须将数据存储在硬盘上，并重新申请一块内存空间。

因此，这个命令能够高效的控制实时索引每一块的大小。rt_mem_limit默认为32MB，所以默认值适用于更小的存储。但如果你计划要向你的实时索引中导入G字节的数据，你肯定不希望它会划分为上百个32MB的小块。因此，你需要根据你心中期望的数据大小，小心调整rt_mem_limit选项。

Sphinx不会占用超出实际使用的内存，所以如果实时索引只使用了1MB，即使limit设置到2GB，Sphinx无论如何也只会占用1MB的内存。另一方面，处理太多小的磁盘块会带来很大的影响。所以合理的超出这个限制不会带来太多的不利影响，当你为设置多大的值犹豫不决的时候，指定更大的空间比更小的空间要更好。

###分布式索引
最后注意，Sphinx支持所谓的分布式索引。有时候，你会想要搜索的其他任意的索引 -- 任意指的是任意一种 -- 它可以是普通索引或者实时索引，不论是在本地机器上还是在远程机器上，或者甚至是指向其他分布式索引或远程机器的指针。下面给出例子：

```
index dist1
{
type  = distributed
local = archive
local = rtdelta
agent = server2.vpn.mycompany.net:9312:archive2
agent = server3.vpn.mycompany.net:9312:archive3
}
```

每一次我们使用dist1索引进行搜索，searchd程序都会向两个本地索引archive和rtdelta进行搜索，并连接网络到远程服务器，对archive2索引和archive3索引进行查询，最后将结果合并到一起，发送给应用。所有远程服务端（代理）都会被并行的查询，所以如果每个服务器都花费了一秒，那么整个查询过程也仅仅只花费了一秒的时间。在dist_thread指令的帮助下，本地索引查询也是可以并行处理的，这条指令我们晚点会讨论到。


###为SQL数据定义字段和属性
我们要进行索引的SQL列都是不一样的。部分列会作为生成索引和搜索的字段；部分列作为属性，存储在索引中以备后用，而部分列可能甚至不是真正的列，而是可计算的表达式。

Sphinx支持大量的常用属性类型和多个实用的功能，以便更好的将存储在数据库上的各类型文本字段进行索引。

大部分情况下，所有sql_query生成的列都是常规的文本字段。主要的例外是第一列，第一列作为文档的ID，而其余的列都可以显式定义为其他类型。这种规范能让Sphinx识别出：引入的列是文本字段，还是给定类型的属性，或者是一类除了进行全文索引还需要额外处理的特殊字段。

受制于技术限制，Sphinx只允许限定数量的字段。当前的索引格式可接受高达255个字段，但匹配引擎的技术限制限定了字段数量只能有32个。

下面是支持的属性类型：

* 整数属性（sql_attr_uint指令）

```
sql_attr_uint = publication_year
```

* 位字段属性（sql_attr_uint指令）

相同指令的特殊格式，你可以给出一个整数，并规定最大的位数。比如：

```
sql_attr_uint = forum_id:4
sql_attr_uint = thread_id:28
```

位字段的接收会有点慢，但它占用的内存会更少。位的长度范围是从1到32，包括1和32。你定义的不同的位字段都会串联成32位大小的字段存储在Sphinx文档集合中。

所以，在上述例子中，每个文档存储forum_id和thread_id字段都需要32位的空间。如果没有定义字段的位长度，那么每个字段的值都需要32位的空间，这总共会占用64位的空间。

* 布尔属性（sql_attr_bool 指令）

1位宽的位字段定义，例如：

```
sql_attr_bool = is_available
```

* 大整数属性（sql_attr_bitint指令）
有符号的64位正整数，例如：

```
sql_attr_bigint = wide_id
```

* 时间戳属性（sql_attr_timestamp指令）
UNIX标准的32位时间戳，即32位正整数，可用于data-和time-相关的函数上，比如：

```
sql_attr_timestamp = published_ts
```

对于时间戳，Sphinx期望的Unix形式时间戳是一个正整数值，比如129037560，而不是类似于“2010-11-22 00:40:07”这种日期时间字符串。所以你要在MySQL中使用UNIX_TIMESTAMP或者在各个数据库中，用其他转换函数来处理时间值存储。

* 浮点属性（sql_attr_float指令）
IEEE-754单精度浮点数存储范围从 1.17e-38 到 3.40e+38 ，可以有六位小数或24位的精度。例如：

```
sql_attr_float = latitude_radians
sql_attr_float = longitude_radians
```

* 字符串属性（sql_attr_string指令）
任意文本或者二进制字符串，最多能达到4,194,303个字节（4MB减去一个字节）。例如：

```
sql_attr_string = author
sql_attr_string = title
```

* 多值属性（sql_attr_multi指令）
由任意32位正整数组合而成的排序集；可以从文本字段中生成（在字段名前面添加uint标志）或者从一段分割的查询语句中生成。例如：

```
sql_attr_multi = uint author_ids from field

sql_attr_multi = uint tags from query; \
SELECT id, tag FROM tags

sql_attr_multi = uint tags from ranged-query; \
SELECT id, tag FROM tags WHERE id>=$start AND id<=$end; \
SELECT MIN(id), MAX(id) FROM tags
```

除了多值属性，其余所有属性都以同样的方式定义。你可以使用其中一种sql_attr_TYPE指令来定义一个列。

多值属性是不一样的，因为你需要定义不止一个属性名，而且需要存储不止一个数值。这里有三种不同的方式定义多值属性：

* 从SQL字段中获取数据，然后从中提取整数数值。
* 执行一段单独的SQL查询，然后使用其返回的多组文档ID和多值数据。
* 一直大量的单独的“范围”SQL查询，然后使用它们返回的多组文档ID和多值数据。

多值属性便于展现，通常用于一些一对多的对应关系 -- 书籍作者列表、产品分类、博文标签等等。多值属性是一份整数列表，但它直接映射到了正确的规范化数据库中，在数据库中，你可以用这些整数主键找到你的作者，分离和标签等等。而且多值属性也用于筛选和分组，就像其他正常的数值属性一样。

SQL数据源也支持特殊的字段类型：

* 文件字段（sql_file_field指令）
使用SQL的列值作为文件名，加载文件的内容，然后对这些内容进行索引生成。例如：

```
sql_file_field = filename_column
```

在这个例子中，Sphinx从SQL数据库中接收filename_column数据并用每个文件的内容进行替换。例如，如果filename_column的值是/storage/123.txt，那么对应的文件就会进行索引生成，除了文件名字。

* 带字符串属性的字段（sql_field_string指令）
把原始的列数据存储到索引中，作为全文字段并生成一个同名的字符串属性。例如

> 注：意思是，不对列数据进行分词，整个列数据当作一个索引词

```
sql_field_string = author
```

* 进行字数统计的属性字段(sql_field_str2wordcount指令)
通过使用该命令存储索引关键字的数量，该列作为全文字段生成索引并生成同名的整数属性。例如：

```
sql_field_str2wordcount = title
```

最后要注意的，这里提供了一个特殊的命令，使你能够从额外的生成附加的全文字段：

* 联合字段（sql_joined_field指令）
通过执行给定的SQL查询并结合查询结果，生成一个新的全文字段。例如：

```
sql_joined_field = authors from query; \
SELECT docid, CONCAT(firstname, ' ', lastname) FROM document_authors \
ORDER BY docid ASC

sql_joined_field = tags from query; \
SELECT docid, tagname FROM tags ORDER BY docid ASC
```

sql_joined_field命令本质上是在Sphinx端，对生成索引时进行JOIN操作的一种实现。这非常便捷也是对MySQL的GROUP_CONCAT()函数的一种更高效替换物。

##Sphinx配置

配置文件中indexer和searchd的配置填充了大量的指令用于程序的维护和性能调试。这些指令通常包括一列接口，用来设置绑定、日志打印和查询日志文件的位置、多个完整性检查限制、缓存大小等等。只有一个配置是必要的：你需要使用pid_file指令定义searchd程序的PID文件的存储位置。为了生成索引达到更好性能，大部分的安装过程会用到mem_limit指令来减少indexer程序占用的内存。

###通过继承管理配置
配置文件可能会变得非常大。幸运的是，两个实用的工具可以帮助你将它们保持简洁明了。首先，数据源和索引配置可以被继承，通过拷贝父级的所有配置，你可以对不一样的选项进行重写。例如，把SQL访问权限信息写在一个独立的数据源配置中，其余配置继承于它，这是非常好的实践：

```
source base
{
sql_host = localhost
sql_user = root
sql_pass = supersecret
sql_db = myprojectdatabase
}
```

为了继承前面的配置，像下面那样，在每一个数据源中引入它：

```
source books : base
{
sql_query = SELECT * FROM books
}

source freshbooks : books
{
sql_query = SELECT * FROM books WHERE DATE_ADD(added,INTERVAL 1 DAY)<NOW()
}

source authors : base
{
sql_query = SELECT * FROM authors
}
```

如果新的配置项有了新的值，那么该选项的继承值都会被废弃。即使这个指令是多值指令 -- 意思是该指令可以在同一配置块中定义多次。（比如，数据源配置中的sql_attr_uint） -- 如果你定义了新的值，那么整列数值都会被废弃。例如，下面例子中的test2数据源只具有其中定义的新的sql_attr_uint属性（books_written），而没有上一级test1数据源中的三个数值：

```
source test1
{
sql_query = SELECT * FROM books
sql_attr_uint = year_published
sql_attr_uint = num_pages
sql_attr_uint = isbn
}

source test2 : test1
{
sql_query = SELECT * FROM authors
sql_attr_uint = books_written
}
```

其次，你可以编译配置文件。也就是说，如果配置文件以 #!/usr/bin/program 开头，那么Sphinx程序不会直接读取它，而是通过那指定的程序运行配置文件，并将其返回结果用作配置文件。

当配置文件准备就绪，便执行初始indexer程序，生成索引数据，然后启动search进程，之后你便可以开始搜索了：

```
$ indexer --all
$ searchd
```

search进程可以使用多种不同的API来访问（虽然都提供相同功能的访问权限），下面逐一介绍。

##访问searchd程序

###配置端口

首先，让我们先回到配置文件，看看选择使用哪个API。一个叫作listen的指令可以让你将searchd程序绑定和指定的TCP端口或Unix 套接字相绑定，你可以选择一个用于通信通道的网络协议。下面的配置，设置了让searchd与原生Sphinx API协议在9312端口进行通信，并与MySQL网络协议在9306端口进行通信：

```
searchd
{
listen = localhost:9312         # protocol defaults to "sphinx"
listen = localhost:9306:mysql41 # but we can override it
}
```

默认情况下，searchd监听所有的接口，使用TCP 9312端口对SphinxAPI进行监听，并使用9360端口连接MySQL。上述的配置和默认情况是几乎一样的，但它只监听localhost接口，而不是所有的接口（万一你只需要在Sphinx所在的同一个服务器上接收Sphinx的数据，这样的配置对于提高安全性来说是很有用的）。

###使用Sphinx API
从调用程序的角度看，原生的API只提供了SphinxClient类，这个类提供了大量的实用方法。当然，重要的是，Query()方法承担了所有搜索的工作：

```
$cl = new SphinxClient();
$result = $cl->Query("this is my query", "myindex");
var_dump($result);
```

非常简单。第一个参数是要搜索的字符串，而第二个参数则是指定配置文件中的一个Sphinx索引。然而，就如同配置文件中有多个index配置选项，在查询进行时也有多种配置选项。你可以在客户端对象（上述例子中的$cl）上调用方法来控制这些配置选项。客户端对象可以分为这些主要的功能组块：

* 通用的客户端方法
* 查询设置
* 全文匹配配置
* 筛选配置（类似于SQL的WHERE语句）
* 分组配置（类似于GROUP BY语句）
* 排序配置（类似于ORDER BY语句）
* 各种工具（搜索片段构造，关键字提取，转义特殊查询字符等等）

通用的客户端方法是任何你能想到的关于网络客户端API：你可以指定进行对话的searchd实例、指定超时时间、对错误和警告信息的检测等等。

查询配置和全文匹配配置会影响searchd进程处理的查询过程。它们提供方法去控制查询过程中有多少匹配结果缓存在RAM内存中和多少匹配结果会返回到你的程序中；如果达到了查询匹配或查询时间的上限，那么searchd会强制中止查询（并返回已经查询到的结果）；控制如何对匹配结果进行权值计算和控制每个字段的权值；指定结果集合中应当返回的属性和表达式。而且没错，Sphinx支持算术表达式的计算。

查询设置是独立的一组配置，因为Sphinx可以处理的查询条件对全文搜索来说并不是必须的。如果你传入一个空字符串作为你的查询文本，Sphinx默认情况下会匹配所有的已生成索引的文档，计算你写的表达式，并进行属性、排序和分组。这种查询通常被称作全扫描，因为在内部它们的确是通过对属性数据进行全扫描来实现的。因为普遍需求，全扫描功能得到支持：在一些情况下，Sphinx查询比相同的SQL查询要更快，尽管全扫描也是如此的。

原生API提供的匹配筛选、排序和分组配置和SQL语法提供的WHERE、ORDER BY和GROUP BY语句的效果是一样的，你可以对匹配结果进行你需要的筛选、排序和分组匹配。例如，如果你要搜索MySQL中1990年代的书籍，并按照价格排序，可以这么写：

```
$cl = new SphinxClient();
$cl->SetFilterRange("year_published", 1990, 1999);
$cl->SetSortMode(SPH_SORT_EXTENDED, "price DESC");
$result = $cl->Query("mysql", "booksindex");
```

上述代码不仅一目了然而且也展示了通用API的使用模式：首先创建一个客户端对象，配置所有查询设置，然后启动搜索并获取结果。当然，产品级的代码应当添加错误处理：

```
$cl = new SphinxClient();
$cl->SetFilterRange("year_published", 1990, 1999);
$cl->SetSortMode(SPH_SORT_EXTENDED, "price DESC");
$result = $cl->Query("mysql", "booksindex");
if (!$result)
{
// oops, there was an error
DisplayErrorPage($cl->GetLastError());
} else
{
// everything was good
DisplaySearchResult($result);
}
```

为了进一步完善，让我们也看看如何使用原生API来对年份来分组和计算数据：

```
$cl = new SphinxClient();
$cl->SetFilterRange("year_published", 1990, 1999);
$cl->SetSortMode(SPH_SORT_EXTENDED, "price DESC");
$cl->SetGroupBy("year_published", SPH_GROUPBY_ATTR);
$cl->SetSelect("*, MIN(price) AS minprice,
MAX(price) AS maxprice, AVG(price) AS avgprice");
$result = $cl->Query("mysql", "booksindex");
```

你会发现，当我们进一步地为查询添加更多的处理时，代码也开始越来越像SQL了。但我们用的是零散的接口而不是单一的表达式来构建查询的。





