---
title: "Mac双系统之删除Windows系统"
description: "Mac双系统之删除Windows系统"
pubDate: 2019-04-27 14:08:16
tags:
  - "Mac"
  - "Fix"
  - "Tutorial"
category: "[\"Technology\"]"
---

很多同学在Mac上通过Bootcamp安装了双系统之后, 由于种种原因, 想要卸载Windows操作系统并释放磁盘空间. 这一篇教程教你如何卸载Windows, 部分内容编译自StackOverflow的[这个回答](https://apple.stackexchange.com/a/344481).



## Bootcamp 卸载

由于Bootcamp分区的特殊性, 不可以直接通过格式化来释放空间. 

在软件列表里打开Bootcamp, 按照向导提示完成. 如果出现了以下错误:

> The startup disk cannot be partitioned or restored to a single partition.

请继续阅读以下部分.

## 命令行卸载

0. 打开磁盘实用程序(Disk Utility), 在左侧查看分区. 右侧的详细信息里中如果写有NTFS则表明这是个Windows分区. 记下这个分区的名字(左侧显示的名字).

1. 在软件列表里搜索"terminal", 打开终端(默认白底黑字的窗口).

2. 格式化Windows分区:
    > 这一步操作不慎可能导致数据丢失.

    依次输入命令(大小写敏感, 每行末尾有回车):
    ```bash
    sudo diskutil eraseVolume free none disk0s4
    sudo diskutil eraseVolume free none disk0s3
    ```
    在输入第一行回车后会询问登录密码. 密码输入的时候没有回显. 输入完成后回车确认. 
    成功的输出看上去像这样
    ```
    Started erase on disk0s4 BOOTCAMP
    Unmounting disk
    Finished erase on disk0
    ```
    通常来说只有`disk0s3``disk0s4`被占用. 少数机器`disk0s5`也被占用. 这种情况需要灵活应对, 把上面命令里的分区名改为需要擦除的分区名即可.

3. 调整苹果分区大小
    继续输入
    ```bash
    sudo diskutil apfs resizeContainer disk0s2 0
    ```
    成功的输出看上去像这样
    ```
    ...(省略)
    Growing APFS data structures
    Finished APFS operation
    ```

4. 清理启动文件
    ```bash
    sudo diskutil mount disk0s1
    cd /Volumes/EFI/EFI
    rm -r Boot
    rm -r Microsoft
    cd ~
    diskutil unmount disk0s1
    ```
    rm这一步如果出现Error, 无需采取措施. 这个错误说明安装时候采用的是legacy方式. 

5. 所有工作已完成. 再次打开Disk Utility来确认刚刚的工作成果.