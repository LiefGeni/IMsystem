---
title: Windows 系统下的 Heroku 部署
tags: [Notes]
---

本篇教程是在 Windows 的 Node.js 环境下使用的~ 如果需要其他语言或平台，请戳 [这里](https://devcenter.heroku.com/start) 看看有没有你要的。

这是官网的 [教程(Node.js)](https://devcenter.heroku.com/articles/getting-started-with-nodejs) ，全英的，英文阅读能力 OK 的同学可以戳戳，但是！竟然来都来了，那就看一下我写的吧~ 欢迎各位同学指正！


# 安装
第一步肯定是安装。这里没有多余的文案，直接甩安装地址给你，请各位同学根据自己的系统选择 [64位](https://cli-assets.heroku.com/heroku-x64.exe) 或 [32位](https://cli-assets.heroku.com/heroku-x86.exe) 的。

假设你阅读本篇文章的时候已安装了 Node v8+ 、 对应版本的 npm 和 git 。接下来让我们继续往下走。


# 本地创建 Heroku 账户
## 在 Windows 的命令提示符上操作
安装完成之后，你可以直接使用 Windows 的命令提示符（<kbd>Win</kbd> + <kbd>R</kbd>），输入 `heroku login` ，即可创建你的 Heroku 账户。
![在命令提示符使用heroku.png](https://i.loli.net/2018/07/20/5b517a5c96035.png)

但是， Windows 的命令行这么难用（且丑），用习惯 [Git Bash](https://gitforwindows.org/) 的我简直没法忍！我是在 Git Bash 上操作的，所以下面介绍一下 Heroku 在 Git Bash 上的使用（本节的命令都可以在命令提示符里使用）。

## 在 Git Bash 上操作
我在 Git Bash 执行 heroku 的命令时，
```bash
$ heroku login
bash: heroku: command not found
```
发现它竟然给我错误提示说找不到该命令！后来我找到它的安装路径（G:\heroku\bin），并尝试运行 `/g/heroku/bin/heroku -v` ，嘿嘿，成了！

![在Git Bash中使用heroku失败.png](https://i.loli.net/2018/07/20/5b518195054af.png)

原来是我没有给 Git Bash 添加环境变量的关系，那么二话不说立马为它添加环境变量吧~ 步骤如下：
1. 如果你没有 `.bashrc` 这个文件，就先创建再编辑。
    ```bash
    $ touch ~/.bashrc && vi ~/.bashrc
    ```
2. 在文件中添加 heroku.cmd 的路径作为其环境变量后（如下所示），保存并退出 `:wq` 即可。
    ```
    export PATH="/g/heroku/bin/:$PATH"
    ```
此时，我们就可以在 Git Bash 上愉快地使用 `heroku [COMMAND]` 了~

![在Git Bash中成功使用heroku.png](https://i.loli.net/2018/08/25/5b8127ec9255c.png)


# 部署项目到 Heroku
首先，我们直接拿 Heroku 提供的 Demo 来学习如何部署。
```bash
$ git clone https://github.com/heroku/node-js-getting-started.git heroku-demo

$ npm install
```
这样我们就在 `heroku-demo` 目录下有了一个 Node.js 的项目，然后我们就可以将项目部署到 Heroku 了。
1. 在 Heroku 上创建一个应用程序，准备让 Heroku 接收我们的代码。
    ```bash
    $ heroku create
    Creating app... done, tranquil-crag-99140
    https://tranquil-crag-99140.herokuapp.com/ | https://git.heroku.com/tranquil-crag-99140.git
    ```
    这时， Heroku 给我们返回这个 app 的编号 `tranquil-crag-99140` 及地址 `https://tranquil-crag-99140.herokuapp.com/` ，即可说明我们已创建成功。

    ![c93fe62e0ba6d6daa7b3416566929c9.png](https://i.loli.net/2018/07/20/5b519199a8a64.png)

2. 接下来我们终于可以部署代码到 Heroku 了。
    ```bash
    $ git push heroku master
    Counting objects: 490, done.
    Delta compression using up to 4 threads.
    Compressing objects: 100% (368/368), done.
    Writing objects: 100% (490/490), 230.24 KiB | 20.93 MiB/s, done.
    Total 490 (delta 87), reused 490 (delta 87)
    remote: Compressing source files... done.
    remote: Building source:
    remote:
    remote: -----> Node.js app detected
    remote:
    remote: -----> Creating runtime environment
    ...
    remote: -----> Installing binaries
    ...
    remote: -----> Restoring cache
    ...
    remote: -----> Building dependencies
    ...
    remote: -----> Caching build
    ...
    remote: -----> Pruning devDependencies
    ...
    remote: -----> Build succeeded!
    remote: -----> Discovering process types
    ...
    remote: -----> Compressing...
    remote:        Done: 18.9M
    remote: -----> Launching...
    remote:        Released v3
    remote:        https://tranquil-crag-99140.herokuapp.com/ deployed to Heroku
    remote:
    remote: Verifying deploy... done.
    To https://git.heroku.com/tranquil-crag-99140.git
    * [new branch]      master -> master
    ```
    从上面的说明 `remote: Verifying deploy... done.` 我们可以知道，项目已被成功部署，我们刷新 `https://tranquil-crag-99140.herokuapp.com/` ，即可看到下图所示的页面。

    ![项目成功部署到heroku.png](https://i.loli.net/2018/07/20/5b51931843694.png)
    当然我们也可以用 `heroku open` 来快速打开这个网页。

好啦，你应该学会了吧~ 那么何不尝试做一个小项目并将其部署上去了~ 温故知新哦！


-----------

# 使用 SSH Git 传输（扩展）
本节是额外补充，上节是使用默认的 HTTP Git 传输，不过 Heroku 也支持使用 SSH Git 传输。所以喜欢用 SSH Git 传输的可以了解一下~

要使用 SSH Git 传输，需要先配置 SSH 密钥。如果你没有生成过 SSH 密钥，那么需要先输入 `ssh-keygen -t rsa` 生成，期间有三次询问的过程（如下所示），直接三次回车即可，它将会自动取其默认值（即括号中显示的内容）。
```bash
$ ssh-keygen -t rsa
Generating public/private rsa key pair.
Enter file in which to save the key (C:\Users\ASUS-NB\.ssh\id_rsa):
Enter passphrase (empty for no passphrase):
Enter same passphrase again:
Your identification has been saved in C:\Users\ASUS-NB\.ssh\id_rsa.
Your public key has been saved in C:\Users\ASUS-NB\.ssh\id_rsa.pub.
...
```
然后， `heroku keys:add` 将公钥上传到 Heroku ，它会询问你是否确定上传，输入 `y` 即可：
```bash
$ heroku keys:add
Found an SSH public key at C:\Users\ASUS-NB\.ssh\id_rsa.pub
Would you like to upload it to Heroku? [Y/n]: y
Uploading C:\Users\ASUS-NB\.ssh\id_rsa.pub SSH key... done
```
此时，你就可以输入 `heroku keys` 查看 Heroku 的 keys 了。下图说明我们已成功上传 SSH key。
![查看heroku密钥.png](https://i.loli.net/2018/07/20/5b519199a598d.png)

你可以点击这里可以了解更多关于 Heroku [管理 SSH 密钥](https://devcenter.heroku.com/articles/keys) 的 API 。

SSH Git 传输跟 HTTP Git 传输，在命令上只有一小点区别。我们只需要添加 `--ssh-git` 到 `heroku create` 、 `heroku git:remote` 和 `heroku git:clone` 命令中即可。例如：
```bash
$ heroku create --ssh-git
```

如果你始终使用 SSH Git 传输，那么可以为其全局配置：
```bash
git config --global url.ssh://git@heroku.com/.insteadOf https://git.heroku.com/
```


本文完。

参考资料总结：
- [Getting Started on Heroku](https://devcenter.heroku.com/start)
- [Managing Your SSH Keys](https://devcenter.heroku.com/articles/keys)