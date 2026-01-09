---
title: "C语言 | register变量"
description: "C语言 | register变量"
pubDate: 2018-12-14 13:18:16
tags:
  - "Tutorial"
category: "Lecture"
---

本文译自The C Programming Language的4.7章节.



`register`变量声明会告知编译器该变量会被频繁使用. `register`变量在运行时存放在机器的寄存器里, 这样生成的程序更短小, 速度也更快. 但是编译器也可能忽略这些建议.

`register`变量的声明看起来像这样:

```c
    register int  x;
    register char c;
```

这样的声明只可以用于局部变量和函数的形式参数. 

```c
    f(register unsigned m, register long n)
    {
        register int i;
        ...
    }
```

实际上, 寄存器变量受到一些来自于底层硬件的限制. 每个函数中只有一部分某种类型的变量才会被放在寄存器里. 但是过量的申明并不会造成不良后果, 因为过量的`register`声明会被编译器忽略. `register`修饰的变量也不可以被取地址(这个话题在第五章里讨论), 无论是否该变量真的放在寄存器里. 具体的数量和类型限制由特定的机器决定.