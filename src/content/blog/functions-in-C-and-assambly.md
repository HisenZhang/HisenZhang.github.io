---
title: C语言 | 从内存视角看函数和指针的本质
pubDate: 2019-03-04 21:26:29
tags:
  - Tutorial
category: Technology
description: "C语言 | 从内存视角看函数和指针的本质"
---
<meta name="descrription" itemprop="descrription" content="C语言 | 从内存视角看函数和指针的本质"/>

近期在尝试编写一个`Simpson's Rule`近似数值积分的例子, 忽然想到可以把被积函数作为一个参数传入, 使这个积分函数更具有通用性. 这个例子我们会在文末作为实际应用来阐述. 在开始之前, 我们先要讨论一下C语言里的函数到底和函数调用到底是什么.

这篇文章篇幅较长, 且涉及较多示例和证明代码, 建议在桌面设备上阅读. 对于证明代码, 请务必亲自动手编译, 只有真正动手敲过的代码才算有深入理解.

<!-- more -->

文章的第一节我们从指令和数据的区别出发, 窥见函数与调用的本质. 第二节分析函数在内存里的位置, 理解程序运行时的内存分布. 第三节在前两板块的基础上描述函数的调用和参数传递之细节. 第四节讨论值传参和指针传参, 包括如何将函数作为参数以传递. 第五节是围绕辛普森法积分例程讲解, 综合前文内容作为函数指针的应用演示.

## 函数与调用的本质

### 数据 vs. 指令

> 函数就是一段计算机指令的序列

![](https://img.vim-cn.com/ab/0ae6b54603d721196f056c3d377a11ca7028e0.png)

在[冯诺依曼架构](https://en.wikipedia.org/wiki/Von_Neumann_architecture)中, 数据和指令存放在一起. 因为这种架构只需要一套存储器, 在计算机工业早期实现成本较低, 也演化成了今天的主流方案.

程序是数据和指令的集合. 程序里预先定义好的常量是数据. 程序要求预留的空间(变量)也是数据. 注意计算机并不能理解数据.

指令定义了计算机的行为, 指示计算机如何处理数据. 那么与数据同样是比特的指令有什么特殊性? 那就是指令可以控制计算机来达到我们预期的操作; 只有一些特殊的控制字(指令)可以达到这个目的, 而控制字`Command Word`和底层的电路设计息息相关.

其次, 在正常情况下, 计算机的控制权不会转交到数据上. 这是因为数据本身并不能控制计算机; 计算机无法理解这些未知的控制字, 就会触发异常.

由于冯诺依曼架构下数据和指令存放在一起, 如果因为某种"巧合", 数据恰好也是对计算机而言有意义的控制字, 那么计算机就会认为这些数据是指令. 利用精心构造的数据来改变计算机的行为, 是一种常见的攻击手法, 如[缓冲区溢出](https://en.wikipedia.org/wiki/Buffer_overflow)的利用. 这个概念下文我们还会简略提到.

读到这里我们总结一下上文: 计算机可以执行(理解)的是指令. 

**函数就是一段计算机指令的序列**, 这段代码的第一条指令的地址也就是函数的入口地址. 要执行一段指令, 只需要让计算机把控制权转交给这个函数. 

### 函数调用

> 调用是把rip指向函数起始地址的行为

我们看一个简单的C语言例子
```c
int abs(int x) {
	return x<0?-x:x;
}

int main() {
	abs(-1024);
	return 0;
}
```
编译&反汇编
```bash
# --no-builtin 排除掉了内建的函数
gcc abs.c -o abs --no-builtin 

# 反汇编
objdump -d abs
```
以下摘取相关反汇编片段
```asm
000000000000061a <abs>:
 61a:	push   %rbp
 61b:	mov    %rsp,%rbp
 61e:	mov    %edi,-0x4(%rbp)  ; pass parameter
 621:	mov    -0x4(%rbp),%eax  ; save it in eax
 624:	cltd                    ; sign-extend
 625:	mov    %edx,%eax        ;
 627:	xor    -0x4(%rbp),%eax  ; tricks
 62a:	sub    %edx,%eax        ; see my previous post
 62c:	pop    %rbp
 62d:	retq   

000000000000062e <main>:
 62e:	push   %rbp
 62f:	mov    %rsp,%rbp
 632:	mov    $0xfffffc00,%edi ; param -1024
 637:	callq  61a <abs>        ; function call
 63c:	mov    $0x0,%eax        ; return 0
 641:	pop    %rbp             ;
 642:	retq                    ;
```
注: 汇编代码里关于`mov`与`xor`的注解请前往我的[这篇博文](/post/利用越界和溢出-C语言/), 此处不深究.

这里的`rip`是`Instruction Pointer`指令指针寄存器, 一个位于CPU的寄存器, 存储着下一条指令的内存地址. 

从高级语言的层面来看, 执行函数的行为叫做`call`调用. **调用是把rip指向函数起始地址的行为**. 函数起始地址即函数第一条指令所在的地址. 控制权的所在, 就是`rip`指向的地址.

默认情况下, rip会顺次指向下一条指令的内存地址. 如X64下`pop`和`push`带上参数`%rbp`以后长度刚好是1字节. 这种情况下执行完一条指令以后, `rip`直接加一即可. 在一些架构上每条指令长度不等, `rip`会根据该指令的长度自动递增. 有一些指令, 如`call`调用指令和`jmp`强制跳转指令会修改`rip`寄存器的值, 以实现循环和条件语句. 前者专门用于函数的调用. 

下面我们单步追踪. 假设将要执行的指令位于`0x00000637`.

#### 0x00000637

例子里我们在`main`中调用了函数`abs`. 此时rip指向`0x00000637`. 

反汇编代码中得知`abs`函数入口位于内存地址`0x0000061a`. 因此调用`abs`的汇编代码为:

```asm
call    0x0000061a
```
使用`jmp`的等价版本. 

```asm
push    %rip
jmp     0x0000061a
```
指令`call`把当前`rip`寄存器的值(也就是`call`的下一条指令地址)先保存在栈上, 然后修改值为跳转的目标地址`0x0000061a`. 这样计算机的控制权就转跳到了这个地址上的指令, 函数开始执行. `jmp`指令则不会保存上下文而仅仅直接跳转.

执行完成后, `rip`值为`0x0000061a`, 栈上保存的值为`0x0000063c`. 换言之, 下一条要被执行的指令是`abs`里的第一条指令`push`.

`abs`函数中间过程我们步过, 直到`abs`的最后一条指令`ret`. 此时`rip`指向`0x0000062d`的`ret`指令.

#### 0x0000062d

函数调用结束的最后需要使用`ret`指令来恢复原来的地址. `ret`指令与`call`指令配对使用. `ret`的操作过程刚好相反, 从栈上弹出原先保存的地址并写回`rip`寄存器. 函数调用至此结束.

栈上保存的地址为`0x0000063c`, 弹出到`rip`.

此时rip指向`0x0000063c`, 是main函数里`call`的下一条指令.


## 函数的内存位置

这一节我们一起动手实操, 探究一下运行时堆栈和函数指令存放的位置. 我们需要写一段程序, 这段程序会在不同的位置创建变量并打印出它们的地址.

注意, 这里的stack和heap都不是准确的地址. 这是因为[main函数并非是真正的程序入口](https://blog.csdn.net/a511244213/article/details/44994755); 在这之前还有一些编译器和链接器附上的初始化或是安全保护(如栈保护)代码. 但是这些地址的相对位置足够说明一些事实了.

```c
#include <stdio.h>
#include <stdlib.h>

char initialized_var = 0;
char uninitialized_var;

void show_stack() {
    char local_var_1;
    char local_var_2;
    printf("stack 1\t\t%p\n", &local_var_1);
    printf("stack 2\t\t%p\n", &local_var_2);
}

int main(int argc, char** argv) {

    // argc, argv
    printf("argv\t\t%p\n", argv);
    printf("argc\t\t%p\n", &argc);

    // stack address 
    show_stack();

    // heap address
    char *heap_addr = (char*) malloc(sizeof(char));
    printf("heap\t\t%p\n",heap_addr);
    free(heap_addr);

    // uninitialized varibles
    extern char uninitialized;
    printf("uninitialized\t%p\n", &uninitialized_var);
    
    // initialized varibles
    extern char initialized;
    printf("initialized\t%p\n", &initialized_var);

    // text segment
    printf("text\t\t%p\n", show_stack);

    return 0;
}
```
输出
```
argv		0x7ffc1d303928
argc		0x7ffc1d30382c
stack 1		0x7ffc1d30380f
stack 2		0x7ffc1d30380e
heap		0x563138330670
uninitialized	0x563138326042
initialized	0x563138326041
text		0x5631381256da
```
对照我们的输出和下面的图示, 逐条分析输出. 分析从高地址向低地址进行.
![](https://img.vim-cn.com/ae/1b6f9da809fafa99be9907cbaf2eab4fc027cc.jpg)

1. argc & argv
    
    这两个变量是主函数的两个参数. argc 是参数个数, argv是参数列表指针, 其中argv[0]指向运行的程序名字符串. 这两个变量是[exec](https://en.wikipedia.org/wiki/Exec_(system_call))赋予的. 在图上, 它们位于最高的地址位置.

2. stack 1与stack 2
    
    栈是由计算机自动分配和释放的, 这套规则由编译器决定. 具体的机器级表示请阅读下一节.
    
    这里为了演示栈的地址增长方向, 我们在show_stack的栈帧上分配了两个局部变量. 还记得局部变量分配在stack栈上吗? 先分配的变量位于高地址, 后分配的位于低地址.

    栈区的空间相比于堆区来说要小很多.

3. heap

    用malloc手动分配的内存的空间位于堆上. 堆是从低地址向高地址增长的. 这里并没有演示出来, 有兴趣的读者可以动手试一试, 方法和上面观察stack增长方向一致.

    图中可以看到, stack和heap是动态区域. 堆起始地址以下的内存是静态空间, 是[exec](https://en.wikipedia.org/wiki/Exec_(system_call))根据[ELF](https://baike.baidu.com/item/ELF/7120560)从外部存储器加载到内存里的一个映像. 关于exec和ELF的一些细节, 以后会再写一篇文章详细讲述.

4. uninitialized

    这里存放着没有初始化的变量. 也称为bss段. 由exec初始化为零.

5. initialized

    这里存放代码里初始化的变量.

    注意, 这里两个变量都是全局变量, declare在所有函数之外, 使用`extern`引入. 为什么不直接在主函数里声明呢? 其实如果仔细阅读了stack这一段的话, 你会意识到函数内声明的变量都是分配在栈上的. main函数也是函数, 如果在函数内定义变量, 则会默认在栈上分配空间. 

6. text

    文本段, 存放程序代码和字符串常量. 我们打印了函数show_stack的地址(等同于其入口地址).

    如果稍加思索, 就会发现正常情况下rip指向的范围只会在text段里.

综上所述, 函数的指令存放在text段, 运行时函数会操作栈区和堆区. 现在再回头看看第一节里指令和数据的区别, 是否更加的清晰了呢?

## 调用规范和参数传递

在函数调用的本质里我们详细阐述了函数调用在机器层面的表示. 但是细心的读者会发现我们并没有讨论到函数参数的传递. 这里涉及到了`callee`被调用函数和`caller`调用者之间的配合.

C风格的函数传参会在函数调用前, 首先把参数从右到左(从参数列表里的最后一个开始)入栈. 在函数内使用到参数的时候则以`%rbp + offset`来表示这个特定的参数. 注意这里是`+`号, 因为 **栈的地址是从高向低增长的**. 

X86默认所有参数从栈上传递, 而X64则把最后四个大小合适的参数[通过寄存器传递](https://docs.microsoft.com/en-us/cpp/build/x64-calling-convention?view=vs-2017#parameter-passing), 其余的参数同样通过栈传递. 这是因为X64多了好几个寄存器, 且通过寄存器传参的速度远快于内存. 当然这也就对参数的类型做出了限制: 最大不可以超过8字节(单个通用寄存器的容量). 具体的传参方式规定在`Calling Convetion`调用规范里. 想要深究的读者, [这里](https://docs.microsoft.com/en-us/cpp/build/x64-calling-convention?view=vs-2017)是X64的调用规范.

刚刚又引入了一个新的寄存器. 准确的说应该是两个:`rbp`与`rsp`,分别是`Base Pointer`栈基指针和`Stack Pointer`栈顶指针. 顾名思义, `rbp`始终指向当前栈帧的底部地址,`rsp`指向顶部地址.

![](https://img.vim-cn.com/11/122d5b0b9965577a5213f202609e5277b207a1.gif)

按照约定, `callee`被调用的函数要负责保存和恢复上一级栈帧的基地址. 这就是为什么你在函数的开头结尾总能看到[这样的代码](https://en.wikipedia.org/wiki/Function_prologue):

```asm
 ; X64 prologue and epilogue

 push   %rbp
 mov    %rsp,%rbp
 ...
 ...
 pop    %rbp
 ret

 ; X86 prologue and epilogue
 
 push   %ebp
 mov    %ebp, %esp
 sub    %esp, N     
 ; N Bytes reserved for local varibles
 ...
 ...
 mov    %esp, %ebp
 pop    %ebp
 ret
 ```

通过prologue, 原先的`rbp`(栈基指针)被保存到栈上, 并把目前的栈顶指针设为栈基指针. 栈底指针更高的地址(加偏移)上保存着参数, 更低的地址(减去偏移)上是预留的局部变量空间.

Epilogue有终场曲之意, 与开场曲的作用相反, 负责释放使用过的内存(把`rsp`改回当前`rbp`),再恢复原先的`rbp`(前一栈帧的栈基地址).

Prologue和epilogue之间就是真正的函数功能代码. 调用结束以后, `caller`调用者需要清除调用前压入栈上的参数.

说句题外话, 上面的代码可以看出32位和64位平台之间的差别不仅仅是CPU总线位数变宽. 在很多细节上, X64也作出了改进.


## 函数指针

最初接触到指针的时候, 我被这个名词迷惑了好久. 后来发现可以这么理解:

> 指针就是内存地址

内存地址是一个类似于`size_t`的整数, 它的长度等同于机器字长(32位机4字节,64位机8字节), 原因就在于它就是一个内存地址. 试想一下:

- 32位机并不能寻址一个64位的地址
- 64位机下32位地址不足以表示全部内存空间

上文我们围绕者函数入口地址讨论了很多. 因为 **指针就是内存地址**, 而这个地址是的内容又是函数, 所以我们可以称函数入口地址为 **函数指针**. 类似的, 如果被指向的内容是一个结构体, 我们就可以称其为结构体指针.

### 函数指针 vs. 指针函数

"函数""指针"同为名词, 前者修饰后者, 后者才是语义上的重点. 因此: 

1. 函数指针是一个 **指向函数** 的 **指针**.
2. 指针函数是一个 **返回指针** 的 **函数**.

### 值传参 vs. 指针传参

C语言默认传参行为是值传递, 具体方式是在栈上创建一个副本. 当传递的数据不是很多, 例如一个整数的时候, 性能表现尚可. 但是这样做存在两个问题:

1. 参数较大(如结构体)时, 涉及到内存读写的复制就会很慢. 当此类函数调用频繁的时候就会出现性能瓶颈.

2. 参数不可以被修改. 这是因为函数里对参数的修改实际上作用在了副本上, 原来的值不受影响. (数组除外, 下有解释)

使用指针传参可以解决以上两个问题. 

1. 当数据过多时, 我们可以不直接告诉函数所需的数据是什么, 而是告诉函数去哪里寻找这些数据. 这就是用指针传参的思想 - 告诉函数所需数据的内存地址. 由于参数的大小最多只有机器字长, 理论上可通过寄存器来传递, 极大提高速度. 

2. 由于指针引用的是源数据而不是副本, 所做的更改会被保留. 这就奠定了C用结构体来实现多个返回值的基础. libcurl里有许多这样的例子.

下面两个例程分别演示了这两点. 

第一个例程演示了值传参和指针传参的效率差别
```c
#include <stdio.h>
#include <stdlib.h>

typedef struct vector_3D
{
    double x;
    double y;
    double z;
} vec;

void do_nothing(vec v) {
    // do nothing
}

int main(int argc, char** argv) {

    vec force;

    for(size_t i = 0; i < 5000000000; i++)
    {
        do_nothing(force);
    }

    return 0;
}
```
运行时间测试(平均值)
```
real	0m12.753s
user	0m12.727s
sys	0m0.012s

```
修改为指针传参版本的两个函数和测试数据
```c
void do_nothing(vec* v) {
    // do nothing
}

int main(int argc, char** argv) {

    vec* force = (vec*) malloc(sizeof(vec));

    for(size_t i = 0; i < 5000000000; i++)
    {
        do_nothing(force);
    }

    return 0;
}
```
```
real	0m10.002s
user	0m9.985s
sys	0m0.000s
```

对比测试数据可以看到指针传参的速度比值传参更快. 当结构体越来越庞大, 这一优势也会越发明显.

第二个例子演示了数组的传参方式.

```c
#include <stdio.h>

int show_arr(int arr[]) {
    printf("ARR ADDR IN CALLEE\t%p\n",arr);
    return 0;
}

int mod_arr(int arr[]) {
    arr[0]++;
    return 0;
}

int main(int argc, char** argv) {

    int big_array[1000] = {0};
    printf("ARR ADDR IN MAIN\t%p\n", big_array);    
    
    // If array were passed as copy, this address shall be different
    show_arr(big_array);


    // This gives zero
    printf("ARR[0] BEFORE MOD\t%d\n",big_array[0]);  
    mod_arr(big_array);
    // if array were passed as copy, a[0] would still be zero.
    printf("ARR[0] AFTER MOD\t%d\n",big_array[0]);

    return 0;
}
```
输出
```
ARR ADDR IN MAIN	0x7ffd78738200
ARR ADDR IN CALLEE	0x7ffd78738200
ARR[0] BEFORE MOD	0
ARR[0] AFTER MOD	1
```
首先, 我们在主函数里创建了一个数组并打印其地址. 然后将这个数组作为参数传入`show_arr`. 该函数答应出其数组参数的地址. 

假设数组是按照值传参的方法传递的话, `show_arr`打印出来的地址应该是值传参创建的副本, 与主函数里打印出来的结果不一致. 但这并非我们所观察到的现象. 这说明数组是以指针方式传递的. (事实上并不奇怪, 数组名实际上也等价于数组的首地址!) 

其次, `mod_arr`修改了数组里的内容. 如果数组是值传递, 修改好的副本并不会影响到原来的内容, 也就是说第二次print的内容也该是零. 通过指针传参, 内存里的源数据得以被直接修改. 在实际开发中, 结构体指针更常用于这种情况. 多个返回值通过修改结构体指针指向的内容, 而用函数的返回值(按照惯例是整数)来表示函数是否出现异常.

有兴趣的读者可以自行证明, 通过值传参后修改其参数并不会影响到源数据. 

### 通过函数指针调用

前文提到, `rip`里存储的就是内存地址. 虽说其他的寄存器也可以存放内存地址, `rip`里的值却有着特殊意义. **这个内存地址的内容将被视为指令来执行**.

同样在前面的反汇编代码里, 调用`abs`函数的时候实际是通过跳转到其第一条指令的地址来实现的. 那么我们是否也可以从函数和函数调用的本质出发来重新审视函数呢?

```c
#include <stdio.h>


int hello() {
    printf("Hello!\n");
    return 0;
}

int main(int argc, char** argv) {
    
    // print address
    printf("%p\n",hello);

    // conventional call
    hello();

    // func pointer call
    int (*FUNC) () = hello;
    printf("%p\n", *FUNC);
    FUNC();

    return 0;
}
```
输出
```
0x56552f75468a
Hello!
0x56552f75468a
Hello!
```
这个程序先打印出函数`hello`的地址, 再分别以普通和函数指针的方式调用一次. 在获取函数指针以后我们打印出来, 和第一句直接用函数名打印出的地址一致. 这再次印证函数名的本质就是函数的入口地址.

我刚开始接触到函数指针的时候觉得这样调用非常麻烦, 似乎没有什么实际的应用. 不要急, 很快我们就要开始展示函数指针的强大了.


## 函数指针应用实例

最后, 我们回到这篇文章最初的写作动机上. 

这里要实现的是一个尽可能通用的积分函数. 如果要给平方-立方-倒数这三个分别写积分函数, 代码量会大幅增加, 而且这样的写法也不具备通用性: 假设有一天新加了自然对数函数, 则又需要给它写一个专门的积分函数. 但是事实上我们不关心被积函数做了什么, 只要被积函数的返回值即可. 

因此如果把被积函数视作像两个`double`类型的`boundry`一样的参数传入, 作为一个通用的函数来调用, 可以大幅简化代码设计.

```c
#include <stdio.h>

typedef double (*FUNC)(double);
double square(double x);
double cube(double x);
double simpson(double a, double b, FUNC f);

// TEST FUNCTION LIST
// 1. X^2 - 1,2
// 2. X^3 - 1,2
// 3. 1/X - 1,2

double square(double x) {
    return x*x;
}

double cube(double x) {
    return x*x*x;
}

double inverse(double x) {
    return 1.0 / x;
}


// simpson's rule of integration

double simpson(double a, double b, FUNC f) {

    return (b - a) / 6.0 * (f(a) + 4 * f((a + b) / 2) + f(b));
}


int main(int argc, char** argv) {
    
    //  header
    
    printf("FUNC\tSTART\tEND\tINTEGRAL\n\n");

    // test table

    printf("SQUARE\t1=\t%lf\n", simpson(1, 2, square));
    printf("CUBE\t1\t2\t%lf\n", simpson(1, 2, cube));
    printf("INVERSE\t1\t2\t%lf\n", simpson(1, 2, inverse));

    return 0;
}
```

输出
```
FUNC	START	END	INTEGRAL

SQUARE	1	2	2.333333
CUBE	1	2	3.750000
INVERSE	1	2	0.694444
```

函数simpson有三个参数:
1. 积分下边界
2. 积分上边界
3. 被积函数

第三个参数是我们关注的重点. 这里我们就实现了利用函数指针来把一个函数作为参数传递到`simpson`里. `simpson`里调用被积函数f的时候, 实际上调用的就是传入的函数指针. 查看`simpson`函数相关汇编片段:

```asm
push   %rbp                 ; prologue
mov    %rsp,%rbp            ;
sub    $0x30,%rsp           ;
movsd  %xmm0,-0x8(%rbp)     ; param start
movsd  %xmm1,-0x10(%rbp)    ; param end
mov    %rdi,-0x18(%rbp)     ; param f
...
...
mov    -0x8(%rbp),%rdx      
mov    -0x18(%rbp),%rax     ; func ptr
mov    %rdx,-0x28(%rbp)     
movsd  -0x28(%rbp),%xmm0
callq  *%rax                ; call func
...
...
```
在调用被积函数前, 函数指针传到`rax`, 被积函数的参数传到`xmm0`(浮点寄存器), 然后调用`rax`里的地址, 即被积函数入口地址.

## 总结

0. 函数就是一段计算机指令的序列
1. 调用是把rip指向函数起始地址的行为
2. 函数名 = 函数起始地址
3. 函数指令位于text段, 运行时数据存放在堆栈
4. 函数通过栈(X86)或寄存器(x64)传参
5. 指针就是内存地址
6. 指针可以高效传参
7. 函数指针是指向函数的指针

## 后记

这是自2019中国新年后的第一篇产出. 本以为申请完成后会有很多的空闲时间, 但是因为给自己安排了各种事务, 实际上并不如预想得这么空闲.

这篇文章最初的写作动机就是在写完simpson积分函数后供自己日后参考的函数指针学习笔记. 不料越写越多, 文章比原来计划的也长了三四倍, 干脆就写成了一篇比较全面的, 给新人指路的文章.

我最初学C语言是看谭先生的书 - 家里的书柜上也就这么一本. 后来读到*The C Programming Language*, 相见恨晚. 这本小册子不是面向零基础的读者, 但是对于想要深入了解C语言的程序员十分友好 (毕竟C语言是K&R自己的思想产物). 每个C程序员都该读一读这本手册.

在这两本书中间我读了*Computer System: A Programmer's Perspective*. CMU的大佬操刀编写, 也是该校计算机原理课的教材. 这本书让我系统的接触了汇编语言, 开始熟悉并喜欢上机器级的编程. 后来还有一本*自己动手编写操作系统*(大概是叫这个名字)给了我上手写汇编和进一步熟悉C语言底层的机会.

C语言虽说是面向过程的语言, 但目前我的感受, 更恰当的描述是面向机器(或面向内存)的编程语言. 就好像开着手动挡的车的乐趣一样, C语言对机器的操控感是其他高级语言无法比拟的.

整个现代计算机的体系给我的感觉是"精妙"二字. 无数处精妙的设计让人们从晶体管开始一步一步构建出可以交互的计算机终端. 去年这个时候我在探寻关于[抽象的力量](/post/道可道): 没有了抽象, 拥有无数细节的计算机系统设计将会变得无比繁琐. 一层一层的抽象让人们可以远离底层的细节而专注于创建出更高层的抽象.

不过有时候回头看看底层的细节, 感受一下字节在电路里的跳动, 也不失为一种乐趣.