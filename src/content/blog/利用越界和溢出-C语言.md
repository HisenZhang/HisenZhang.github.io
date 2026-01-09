---
title: "C语言 | 利用越界和溢出"
description: "C语言 | 利用越界和溢出"
pubDate: 2018-12-06 12:45:03
tags:
  - "Tutorial"
  - "Spark"
category: "Technology"
---

这篇文章以一道challenge为例, 讲述C语言的越界和溢出. 本篇也是自己的学习记录.

某日[罗德大佬](https://github.com/rod-lin)在群内分享了一道题:



题目与代码如下

> What argument(s) to this program will cause it to print "Admin/Debug rights"?
>
> 什么参数可以使得这段程序输出 "Admin/Debug rights"?


```c
#define N (20)
int admin, debug;
int histogram[N];

static int hash(char* str) {
    int c, h = 0;   //adbm hash
    while (c = *str++)
        h = c + (h << 6) + (h << 16) - h;
    return h;
}

int main (int argc, char** argv) {
    while (argc>1) {
        char* word = argv[--argc];
        int h = hash(word);
        histogram[ (h<0?-h:h) % N ] ++;
    }
    if (admin || debug) puts("Admin/Debug rights");
    return;
}

```

## 初步思路

要打印这个字符串, 就必须修改admin或者debug值.

首先观察整段代码, 发现没有对这两个变量变量操作的语句. 因此可以肯定不是常规操作. 那么就要考虑利用指针来修改这两个变量里的内容.

进一步分析, 发现数组histogram和这两个整型变量在内存中是邻接的. 于是很自然的想到利用越界. 

## 数组越界

C语言为了执行效率, 并不会检查数组越界. 这是因为数组的本质是一段连续的内存空间; 其中的每个元素在使用的时候, 都是通过相对数组首元素的偏移地址来查找:

$$ address_{base} + index * size_{element} $$

也就是说, 使用数组的`[ ]`符号实际上访问的就是线性变换过的地址, 比指针使用起来方便一些 - 你不需要记得地址递增递减的size. 

因此只要计算出来的地址是有效地址, 数组越界的时候就不会报错. 

这里由于两个变量的地址在数组之前, 因此我们使用负的index, 就可以访问到这两个变量的位置. 对负数取模, 结果仍是负数; 操纵数组前面地址的index在0到-19这个区间,包括了那两个变量.

## 负绝对值

### 原理

但是仔细观察index的表达式

```c
histogram[ (h<0?-h:h) % N ] ++;
```

这里的index是先对h取绝对值再取模, 也就是说index应该只能是正数. 

然而有一种特殊的情况, 使得绝对值函数会输出负数. 让我们来看一下` h<0?-h:h`的C语言与反汇编代码
```c
// abs.c

int abs(int x) {
	return x<0?-x:x;
}
```
编译&反汇编
```bash
# --no-builtin 排除掉了内建的函数
gcc -c abs.c --no-builtin 

# 反汇编
objdump -d abs.o
```

以下是排版稍作调整的结果, 去掉了偏移

```asm
push   %rbp
mov    %rsp,%rbp
mov    %edi,-0x4(%rbp)  ; pass parameter
mov    -0x4(%rbp),%eax  ; save it in eax
cltd                    ; sign-extend: see below
mov    %edx,%eax        ; 
xor    -0x4(%rbp),%eax  ; it depends: see below
sub    %edx,%eax
pop    %rbp
retq 
```

注意第5行指令`cltd`. 该指令做符号位拓展. 若`eax`的符号位为0(`eax`值非负), 则`edx`全部置0; 否则全部置1. 例如, 当`eax`为`0x7F000000`,`edx`会变成`0x00000000`.如果`eax`为`0x80000000`,`edx`会变成`0xFFFFFFFF`. 请参考SO上[这个回答](https://stackoverflow.com/a/17170478)和维基百科对[符号位的介绍](https://en.m.wikipedia.org/wiki/Sign_bit).

下面我们来看第7-8行的异或和减法:

1. 当参数为正

   此时参数与`0x00000000`异或, 结果不变;

   随后参数减去`0x00000000`, 结果仍然不变.

2. 参数为负时

   参数与`0xFFFFFFFF`异或, 相当于取反;

   取反后的参数减去`0xFFFFFFFF`, 相当于加一.

   

我们看一下正常情况下, 一个负整数`-1024`作为参数时的运算过程:

```asm
push   %rbp
mov    %rsp,%rbp
mov    %edi,-0x4(%rbp)  ; 0xfffffc00
mov    -0x4(%rbp),%eax  ; eax = 0x80000000
cltd                    ; edx = 0xffffffff
mov    %edx,%eax        ; eax = 0xffffffff
xor    -0x4(%rbp),%eax  ; eax = 0x3ff
sub    %edx,%eax	; eax = 0x400
pop    %rbp
retq 
```

`0x400`也就是`1024`.

### 陷阱

但是这里有一个问题: 当输入为`INT_MIN`(十六进制`0x80000000`,十进制`-2147483648`)时, 我们来看一下

```asm
push   %rbp
mov    %rsp,%rbp
mov    %edi,-0x4(%rbp)  ; 0x80000000
mov    -0x4(%rbp),%eax  ; eax = 0x80000000
cltd                    ; edx = 0xffffffff
mov    %edx,%eax        ; eax = 0xffffffff
xor    -0x4(%rbp),%eax  ; eax = 0x7fffffff
sub    %edx,%eax	; eax = 0x80000000
pop    %rbp
retq 
```

输出仍然是负数`0x80000000`!

这是为什么呢?

执行sub指令前, 寄存器和标志位状态如下:
```
rax            0x7fffffff	2147483647
rdx            0xffffffff	4294967295
eflags         0x206	[ PF IF ]
```

执行`sub  %edx,%eax`后
```
rax            0x7fffffff	2147483647
rdx            0xffffffff	4294967295
eflags         0xa87	[ CF PF SF IF OF ]
```
从elflags可以看出到发生了溢出(`OF`,针对有符号数),进位(`CF`,针对无符号数),`SF`位表明运算结果为负数.

## Hash 暴力搜索解

由于hash的逆运算很困难, 我决定穷举字符串来计算相匹配的hash. 反正输出域只有一个整数, 碰撞应该还是比较容易的.

这里用pthread实现多线程, 搜索所有可打印ascii字符空间(32-126), 这里只搜索6字节的所有可能. 八线程搜索完的时间大约30分钟. 实际上由于hash可以并行计算, 也可以用显卡来加速运算.

```c
// hash_threads.c

#include <stdio.h>
#include <pthread.h>
#include <limits.h>
#include <unistd.h>
#include <errno.h>

#define NO_WORKER 8

static int hash(char *str) {

	int c, h = 0;
	while(c = *str++)
		h = c + (h << 6) + (h << 16) - h;

	return h;
}

void thread(int* no) { 

    int num = *no;
	printf("[RUN] Thread %d.\n",num); 

    unsigned char str[7] = {0};

	for (unsigned char i = 32; i <= 126; i++)
	for (unsigned char j = 32; j <= 126; j++)
	for (unsigned char k = 32; k <= 126; k++)
	for (register unsigned char l = 32; l <= 126; l++)
	for (register unsigned char m = 32; m <= 126; m++)
	for (register unsigned char n = 32+num; n <= 126; n+=NO_WORKER)
	{
		str[0] = i;
		str[1] = j;
		str[2] = k;
		str[3] = l;
		str[4] = m;
		str[5] = n;
        
		if (hash(str) == INT_MIN)
            printf("T[%d]\t,%s, { %d, %d, %d, %d, %d, %d, 0 }\n",
                   num,str,i,j,k,l,m,n);
	}		
    printf("[EXIT] Thread %d.\n",num); 
    pthread_exit(NULL);
}

int main(void) { 

    if(nice(-20)) perror("[INFO] Set priority");

	pthread_t id[NO_WORKER];

    for(int assign = 0;assign < NO_WORKER;assign++)
    {
        if(pthread_create(&id[assign],NULL,(void *)thread,&assign))
        { 
            printf ("Create pthread error!\n");
            return errno;
        } 
        sleep(1);
    }

    for(int i = 0;i < NO_WORKER;i++)
        pthread_join(id[i],NULL);

	return 0; 
} 
```

编译
```bash
gcc -O3 -o hash_threads hash_threads.c -lpthread
```

运行结果(部分)
```
[RUN] Thread 0.
[RUN] Thread 1.
[RUN] Thread 2.
...
...
T[1]	,#,F%9Q, { 35, 44, 70, 37, 57, 81, 0 }
T[1]	,#fzxji, { 35, 102, 122, 120, 106, 105, 0 }
T[1]	,#w}[ky, { 35, 119, 125, 91, 107, 121, 0 }
T[5]	,''lKlM, { 39, 39, 108, 75, 108, 77, 0 }
T[5]	,'/kjLE, { 39, 47, 107, 106, 76, 69, 0 }
T[5]	,'8o.m], { 39, 56, 111, 46, 109, 93, 0 }
T[5]	,'@nMMU, { 39, 64, 110, 77, 77, 85, 0 }
...
...
[EXIT] Thread 2.
[EXIT] Thread 3.
```
以上的解hash结果取模后均为-8, 也是唯一可能的负数; 直接看来, 向前32字节不可以访问到admin或者debug. 但是编译器可能把变量自动对齐, 这样以来就可以修改到其中部分字节了.

## 小插曲

一开始调试的时候并没有出现期望的运行结果. 上GDB看:
```
(gdb) p &admin
$2 = (int *) 0x5555557550b0 <admin>
(gdb) p &debug
$3 = (int *) 0x5555557550b4 <debug>
(gdb) p &histogram 
$4 = (int (*)[20]) 0x555555755060 <histogram>
```
真是无语了 搞了半天histogram居然在两个整型变量的前面....
请教[yv大佬](https://github.com/qyvlik), 查看了[SO上的回答](https://stackoverflow.com/a/21818977): undefined behavior. 看来编译器并不是按照变量定义顺序来决定内存里的数据位置.

于是修改一下变量名为histo:

```
$1 = (int *) 0x555555755060 <admin>
(gdb) p &debug
$2 = (int *) 0x555555755064 <debug>
(gdb) p &histo 
$3 = (int (*)[20]) 0x555555755080 <histo>
```
我使用的编译器为GCC for Debian 7.3.0, 64位, 修改了变量名以后莫名其妙的成了.

## 总结

1. 发现两者内存空间连续, 决定越界
2. 利用溢出得到负的绝对值输出