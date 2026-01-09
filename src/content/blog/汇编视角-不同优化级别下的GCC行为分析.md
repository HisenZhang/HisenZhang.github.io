---
title: 汇编视角:不同优化级别下的GCC行为分析
description: 汇编视角:不同优化级别下的GCC行为分析
pubDate: 2018-11-02T23:58:55.000Z
tags:
  - Spark
  - Tutorial
category: Technology
---

> 本篇以memcpy这一函数为例, 分别在0-3的gcc优化级别下编译并反汇编, 并对反汇编得到的代码进行分析, 以观察不同优化级别下gcc的行为.
>
> 本文使用的gcc版本 7.3.0
>
> 以下汇编与反汇编均在x64平台上进行

## Overview

[gcc的官方文档](https://gcc.gnu.org/onlinedocs/gcc-7.3.0/gcc/Optimize-Options.html#Optimize-Options)中有对于优化参数`-O`的描述. 简要概括如下:

| 优化级别 |                             描述                             |
| :------: | :----------------------------------------------------------: |
|    0     |                   关闭优化. gcc的默认选项                    |
|    1     |    在不明显拖慢编译速度的情况下减小代码尺寸, 提升执行速度    |
|    2     | 在不以存储空间换运行时间的前提下, 采用几乎所有gcc支持的优化方法 |
|    3     |                  二级优化的基础上进一步优化                  |

还有便于debug的`Og`, 骚操作(极致优化但不遵从编码规范)的`Ofast`, 介于2-3级别间的`Os`.

整体上而言, 优化级别越高, 编译速度会越慢, 占用的内存越大; 同时, 生成的代码运行时速度越快, 可读性越低.

下面我们用实际的例子来看一看不同优化级别下gcc的具体行为. 选择memcpy作为例子是因为它的实现代码足够简单, 但是涉及了传参, 条件判断和循环, 是逻辑密集型的代码, 能很好的体现gcc在逻辑上的优化.



## 代码分析

### C 实现

```c
// This is the implementation in coreutils

// Since no stdlib included, define size_t
// On x64 size_t is defined as unsigned long

#define size_t unsigned long	

void * memcpy (void *destaddr, void const *srcaddr, size_t len)
{
    char *dest = destaddr;
    char const *src = srcaddr;

    while (len-- > 0)
        *dest++ = *src++;
    return destaddr;
}
```

### Assembly

编译与反汇编命令

```bash
gcc -c -o memcpy.o memcpy.c -Ox # x为优化级别
objdump -d memcpy.o
```

#### 关闭优化

```assembly
0000000000000000 <memcpy>:
   0:	55                   	push   %rbp					; save old rbp
   1:	48 89 e5             	mov    %rsp,%rbp			; set rsp = new rbp
   4:	48 89 7d e8          	mov    %rdi,-0x18(%rbp)		; destaddr -> rbp-18h
   8:	48 89 75 e0          	mov    %rsi,-0x20(%rbp)		; srcaddr -> rbp-20h
   c:	48 89 55 d8          	mov    %rdx,-0x28(%rbp)		; len -> rbp-28h
  10:	48 8b 45 e8          	mov    -0x18(%rbp),%rax		; dest -> rbp-8h
  14:	48 89 45 f8          	mov    %rax,-0x8(%rbp)		;
  18:	48 8b 45 e0          	mov    -0x20(%rbp),%rax		; src -> rbp-10h
  1c:	48 89 45 f0          	mov    %rax,-0x10(%rbp)		;
  20:	eb 1d                	jmp    3f <memcpy+0x3f>
  22:	48 8b 55 f0          	mov    -0x10(%rbp),%rdx		; inc src
  26:	48 8d 42 01          	lea    0x1(%rdx),%rax		;
  2a:	48 89 45 f0          	mov    %rax,-0x10(%rbp)		;
  2e:	48 8b 45 f8          	mov    -0x8(%rbp),%rax		; inc dest
  32:	48 8d 48 01          	lea    0x1(%rax),%rcx		;
  36:	48 89 4d f8          	mov    %rcx,-0x8(%rbp)		;
  3a:	0f b6 12             	movzbl (%rdx),%edx			; move content in src
  3d:	88 10                	mov    %dl,(%rax)			; into dest bytewise
  3f:	48 8b 45 d8          	mov    -0x28(%rbp),%rax		; len --
  43:	48 8d 50 ff          	lea    -0x1(%rax),%rdx		;
  47:	48 89 55 d8          	mov    %rdx,-0x28(%rbp)		;
  4b:	48 85 c0             	test   %rax,%rax			; if old len = 0 escape
  4e:	75 d2                	jne    22 <memcpy+0x22>
  50:	48 8b 45 e8          	mov    -0x18(%rbp),%rax		; return dest
  54:	5d                   	pop    %rbp					; restore rbp
  55:	c3                   	retq  
```

关闭优化生成的代码比较呆板, 但是严格按照x64的调用规范`call convention`操作, 入栈`rbp`. 这里比较低效的是gcc将所有通过寄存器传入的参数保存到栈内, 像是x86风格, 导致数据的读写变慢.

指针后自增的操作是先从内存取出变量放到中间寄存器

```assembly
mov    -0x8(%rbp),%rax
```

自增这个地址

```assembly
lea    0x1(%rax),%rcx
```

再写回内存

```assembly
mov    %rcx,-0x8(%rbp)
```

关键的复制操作是利用中间寄存器里的值来完成, 和正常的认知有些不一样.

有个奇怪的地方:还有明明是bytewise的复制操作(18行), 为什么这里拷贝了四字节再取低8位, gcc真是奇怪.

#### 一级优化

```assembly
   0:	48 89 f8             	mov    %rdi,%rax			; dest addr for return
   3:	48 85 d2             	test   %rdx,%rdx			; if len = 0 escape 
   6:	74 17                	je     1f <memcpy+0x1f>		; 
   8:	b9 00 00 00 00       	mov    $0x0,%ecx			; initialize counter
   d:	44 0f b6 04 0e       	movzbl (%rsi,%rcx,1),%r8d	; copy src+count into ecx
  12:	44 88 04 08          	mov    %r8b,(%rax,%rcx,1)	; into dest+count
  16:	48 83 c1 01          	add    $0x1,%rcx			; inc counter
  1a:	48 39 d1             	cmp    %rdx,%rcx			; if count != len continue 
  1d:	75 ee                	jne    d <memcpy+0xd>		;
  1f:	f3 c3                	repz retq 
```

开启优化后得到另外一种风格. 可以看出参数没有被放入内存, 而是直接读写寄存器, 从时间效率上来看要快不少. 这也是x64的一个优点之一: 四个整形变量可以直接从寄存器传参而不用入栈, 节约了压栈和读写内存的时间.

复制的关键代码只有三行:

```assembly
movzbl (%rsi,%rcx,1),%r8d	; copy src+count into ecx
mov    %r8b,(%rax,%rcx,1)	; into dest+count
add    $0x1,%rcx			; inc counter
```

不得不承认, gcc的这个写法还是挺漂亮的.

#### 二级优化

```assembly
0000000000000000 <memcpy>:
   0:	48 85 d2             	test   %rdx,%rdx			; if len = 0 escape
   3:	48 89 f8             	mov    %rdi,%rax			; dest addr for return
   6:	74 1a                	je     22 <memcpy+0x22>		; if len = 0 escape
   8:	31 c9                	xor    %ecx,%ecx			; set ecx to 0
   a:	66 0f 1f 44 00 00    	nopw   0x0(%rax,%rax,1)		; for alignment
  10:	44 0f b6 04 0e       	movzbl (%rsi,%rcx,1),%r8d	; copy src+count into ecx
  15:	44 88 04 08          	mov    %r8b,(%rax,%rcx,1)	; into dest+count			
  19:	48 83 c1 01          	add    $0x1,%rcx			; inc counter
  1d:	48 39 d1             	cmp    %rdx,%rcx			; if count != len continue
  20:	75 ee                	jne    10 <memcpy+0x10>		;
  22:	f3 c3                	repz retq 
```

这一段代码和O1生成的大同小异.

第5行`ecx`与自己异或的操作一开始没看懂, 但是想了想XOR的运算规则:

| 情况 |  X   |  Y   | X XOR Y |
| :--: | :--: | :--: | :-----: |
|  A   |  0   |  0   |    0    |
|  B   |  0   |  1   |    1    |
|  C   |  1   |  0   |    1    |
|  D   |  1   |  1   |    0    |

由于是和自己异或, 那么输入的`X`与`Y`必定相等, 也就是`情况A`和`情况D` - 这两种情况结果均为零.也就是说, 一个变量与自己异或得0.

所以

```assembly
xor %ecx,%ecx
```

等价于

```assembly
mov $0,%ecx
```

这样写的可读性降低了. 但是为什么编译器认为前者是更好的方案呢?

我也为此感到困扰. 不过stackoverflow上我找到了一个[回答](https://stackoverflow.com/a/1396552):

> The opcode is shorter than `mov eax, 0`, only 2 bytes

仔细一看, 后者的操作码确实只有两字节:

```assembly
   8:	31 c9                	xor    %ecx,%ecx			; set ecx to 0
```

相对的, 需要五个字节(其中有四个是空字节)

```assembly
   8:	b9 00 00 00 00       	mov    $0x0,%ecx			; initialize counter
```

从而优化.

回答中还提到了, 与自己异或这个操作在现代处理器上有着很小的执行成本. 本文不展开深究.

这里还有一段`nop`.

```assembly
nopw   0x0(%rax,%rax,1)	
```

这里的`nop`和它的参数可能是用来填充字节以对齐.



最终我们发现二级优化生成的代码还是比一级优化的要多那么一些, 符合我们概要里面的描述.

#### 三级优化

```assembly
0000000000000000 <memcpy>:
   0:	85 d2                	test   %edx,%edx
   2:	48 89 f8             	mov    %rdi,%rax
   5:	0f 8e 7d 02 00 00    	jle    288 <memcpy+0x288>
   b:	48 8d 7e 10          	lea    0x10(%rsi),%rdi
   f:	8d 4a ff             	lea    -0x1(%rdx),%ecx
  12:	48 39 f8             	cmp    %rdi,%rax
  15:	48 8d 78 10          	lea    0x10(%rax),%rdi
  19:	41 0f 93 c0          	setae  %r8b
  1d:	48 39 fe             	cmp    %rdi,%rsi
  20:	40 0f 93 c7          	setae  %dil
  24:	41 08 f8             	or     %dil,%r8b
  27:	0f 84 33 02 00 00    	je     260 <memcpy+0x260>
  2d:	83 fa 16             	cmp    $0x16,%edx
  30:	0f 86 2a 02 00 00    	jbe    260 <memcpy+0x260>
  36:	41 89 c9             	mov    %ecx,%r9d
  39:	48 89 f1             	mov    %rsi,%rcx
  3c:	53                   	push   %rbx
  3d:	48 f7 d9             	neg    %rcx
  40:	83 e1 0f             	and    $0xf,%ecx
  43:	8d 79 0f             	lea    0xf(%rcx),%edi
  46:	41 39 f9             	cmp    %edi,%r9d
  49:	0f 82 41 02 00 00    	jb     290 <memcpy+0x290>
  4f:	85 c9                	test   %ecx,%ecx
  51:	0f 84 3e 02 00 00    	je     295 <memcpy+0x295>
  57:	0f b6 3e             	movzbl (%rsi),%edi
  5a:	83 f9 01             	cmp    $0x1,%ecx
  5d:	48 8d 5e 01          	lea    0x1(%rsi),%rbx
  61:	4c 8d 40 01          	lea    0x1(%rax),%r8
  65:	44 8d 4a fe          	lea    -0x2(%rdx),%r9d
  69:	40 88 38             	mov    %dil,(%rax)
  6c:	0f 84 7e 01 00 00    	je     1f0 <memcpy+0x1f0>
  72:	0f b6 7e 01          	movzbl 0x1(%rsi),%edi
  76:	83 f9 02             	cmp    $0x2,%ecx
  79:	48 8d 5e 02          	lea    0x2(%rsi),%rbx
  7d:	4c 8d 40 02          	lea    0x2(%rax),%r8
  81:	44 8d 4a fd          	lea    -0x3(%rdx),%r9d
  85:	40 88 78 01          	mov    %dil,0x1(%rax)
  89:	0f 84 61 01 00 00    	je     1f0 <memcpy+0x1f0>
  8f:	0f b6 7e 02          	movzbl 0x2(%rsi),%edi
  93:	83 f9 03             	cmp    $0x3,%ecx
  96:	48 8d 5e 03          	lea    0x3(%rsi),%rbx
  9a:	4c 8d 40 03          	lea    0x3(%rax),%r8
  9e:	44 8d 4a fc          	lea    -0x4(%rdx),%r9d
  a2:	40 88 78 02          	mov    %dil,0x2(%rax)
  a6:	0f 84 44 01 00 00    	je     1f0 <memcpy+0x1f0>
  ac:	0f b6 7e 03          	movzbl 0x3(%rsi),%edi
  b0:	83 f9 04             	cmp    $0x4,%ecx
  b3:	48 8d 5e 04          	lea    0x4(%rsi),%rbx
  b7:	4c 8d 40 04          	lea    0x4(%rax),%r8
  bb:	44 8d 4a fb          	lea    -0x5(%rdx),%r9d
  bf:	40 88 78 03          	mov    %dil,0x3(%rax)
  c3:	0f 84 27 01 00 00    	je     1f0 <memcpy+0x1f0>
  c9:	0f b6 7e 04          	movzbl 0x4(%rsi),%edi
  cd:	83 f9 05             	cmp    $0x5,%ecx
  d0:	48 8d 5e 05          	lea    0x5(%rsi),%rbx
  d4:	4c 8d 40 05          	lea    0x5(%rax),%r8
  d8:	44 8d 4a fa          	lea    -0x6(%rdx),%r9d
  dc:	40 88 78 04          	mov    %dil,0x4(%rax)
  e0:	0f 84 0a 01 00 00    	je     1f0 <memcpy+0x1f0>
  e6:	0f b6 7e 05          	movzbl 0x5(%rsi),%edi
  ea:	83 f9 06             	cmp    $0x6,%ecx
  ed:	48 8d 5e 06          	lea    0x6(%rsi),%rbx
  f1:	4c 8d 40 06          	lea    0x6(%rax),%r8
  f5:	44 8d 4a f9          	lea    -0x7(%rdx),%r9d
  f9:	40 88 78 05          	mov    %dil,0x5(%rax)
  fd:	0f 84 ed 00 00 00    	je     1f0 <memcpy+0x1f0>
 103:	0f b6 7e 06          	movzbl 0x6(%rsi),%edi
 107:	83 f9 07             	cmp    $0x7,%ecx
 10a:	48 8d 5e 07          	lea    0x7(%rsi),%rbx
 10e:	4c 8d 40 07          	lea    0x7(%rax),%r8
 112:	44 8d 4a f8          	lea    -0x8(%rdx),%r9d
 116:	40 88 78 06          	mov    %dil,0x6(%rax)
 11a:	0f 84 d0 00 00 00    	je     1f0 <memcpy+0x1f0>
 120:	0f b6 7e 07          	movzbl 0x7(%rsi),%edi
 124:	83 f9 08             	cmp    $0x8,%ecx
 127:	48 8d 5e 08          	lea    0x8(%rsi),%rbx
 12b:	4c 8d 40 08          	lea    0x8(%rax),%r8
 12f:	44 8d 4a f7          	lea    -0x9(%rdx),%r9d
 133:	40 88 78 07          	mov    %dil,0x7(%rax)
 137:	0f 84 b3 00 00 00    	je     1f0 <memcpy+0x1f0>
 13d:	0f b6 7e 08          	movzbl 0x8(%rsi),%edi
 141:	83 f9 09             	cmp    $0x9,%ecx
 144:	48 8d 5e 09          	lea    0x9(%rsi),%rbx
 148:	4c 8d 40 09          	lea    0x9(%rax),%r8
 14c:	44 8d 4a f6          	lea    -0xa(%rdx),%r9d
 150:	40 88 78 08          	mov    %dil,0x8(%rax)
 154:	0f 84 96 00 00 00    	je     1f0 <memcpy+0x1f0>
 15a:	0f b6 7e 09          	movzbl 0x9(%rsi),%edi
 15e:	83 f9 0a             	cmp    $0xa,%ecx
 161:	48 8d 5e 0a          	lea    0xa(%rsi),%rbx
 165:	4c 8d 40 0a          	lea    0xa(%rax),%r8
 169:	44 8d 4a f5          	lea    -0xb(%rdx),%r9d
 16d:	40 88 78 09          	mov    %dil,0x9(%rax)
 171:	74 7d                	je     1f0 <memcpy+0x1f0>
 173:	0f b6 7e 0a          	movzbl 0xa(%rsi),%edi
 177:	83 f9 0b             	cmp    $0xb,%ecx
 17a:	48 8d 5e 0b          	lea    0xb(%rsi),%rbx
 17e:	4c 8d 40 0b          	lea    0xb(%rax),%r8
 182:	44 8d 4a f4          	lea    -0xc(%rdx),%r9d
 186:	40 88 78 0a          	mov    %dil,0xa(%rax)
 18a:	74 64                	je     1f0 <memcpy+0x1f0>
 18c:	0f b6 7e 0b          	movzbl 0xb(%rsi),%edi
 190:	83 f9 0c             	cmp    $0xc,%ecx
 193:	48 8d 5e 0c          	lea    0xc(%rsi),%rbx
 197:	4c 8d 40 0c          	lea    0xc(%rax),%r8
 19b:	44 8d 4a f3          	lea    -0xd(%rdx),%r9d
 19f:	40 88 78 0b          	mov    %dil,0xb(%rax)
 1a3:	74 4b                	je     1f0 <memcpy+0x1f0>
 1a5:	0f b6 7e 0c          	movzbl 0xc(%rsi),%edi
 1a9:	83 f9 0d             	cmp    $0xd,%ecx
 1ac:	48 8d 5e 0d          	lea    0xd(%rsi),%rbx
 1b0:	4c 8d 40 0d          	lea    0xd(%rax),%r8
 1b4:	44 8d 4a f2          	lea    -0xe(%rdx),%r9d
 1b8:	40 88 78 0c          	mov    %dil,0xc(%rax)
 1bc:	74 32                	je     1f0 <memcpy+0x1f0>
 1be:	0f b6 7e 0d          	movzbl 0xd(%rsi),%edi
 1c2:	83 f9 0f             	cmp    $0xf,%ecx
 1c5:	48 8d 5e 0e          	lea    0xe(%rsi),%rbx
 1c9:	4c 8d 40 0e          	lea    0xe(%rax),%r8
 1cd:	44 8d 4a f1          	lea    -0xf(%rdx),%r9d
 1d1:	40 88 78 0d          	mov    %dil,0xd(%rax)
 1d5:	75 19                	jne    1f0 <memcpy+0x1f0>
 1d7:	0f b6 7e 0e          	movzbl 0xe(%rsi),%edi
 1db:	48 8d 5e 0f          	lea    0xf(%rsi),%rbx
 1df:	4c 8d 40 0f          	lea    0xf(%rax),%r8
 1e3:	44 8d 4a f0          	lea    -0x10(%rdx),%r9d
 1e7:	40 88 78 0e          	mov    %dil,0xe(%rax)
 1eb:	0f 1f 44 00 00       	nopl   0x0(%rax,%rax,1)
 1f0:	29 ca                	sub    %ecx,%edx
 1f2:	41 89 ca             	mov    %ecx,%r10d
 1f5:	31 ff                	xor    %edi,%edi
 1f7:	41 89 d3             	mov    %edx,%r11d
 1fa:	4c 01 d6             	add    %r10,%rsi
 1fd:	31 c9                	xor    %ecx,%ecx
 1ff:	41 c1 eb 04          	shr    $0x4,%r11d
 203:	49 01 c2             	add    %rax,%r10
 206:	66 2e 0f 1f 84 00 00 	nopw   %cs:0x0(%rax,%rax,1)
 20d:	00 00 00 
 210:	66 0f 6f 04 0e       	movdqa (%rsi,%rcx,1),%xmm0
 215:	83 c7 01             	add    $0x1,%edi
 218:	41 0f 11 04 0a       	movups %xmm0,(%r10,%rcx,1)
 21d:	48 83 c1 10          	add    $0x10,%rcx
 221:	41 39 fb             	cmp    %edi,%r11d
 224:	77 ea                	ja     210 <memcpy+0x210>
 226:	89 d7                	mov    %edx,%edi
 228:	83 e7 f0             	and    $0xfffffff0,%edi
 22b:	89 fe                	mov    %edi,%esi
 22d:	41 29 f9             	sub    %edi,%r9d
 230:	49 8d 0c 30          	lea    (%r8,%rsi,1),%rcx
 234:	48 01 de             	add    %rbx,%rsi
 237:	39 fa                	cmp    %edi,%edx
 239:	74 22                	je     25d <memcpy+0x25d>
 23b:	45 8d 41 01          	lea    0x1(%r9),%r8d
 23f:	31 d2                	xor    %edx,%edx
 241:	0f 1f 80 00 00 00 00 	nopl   0x0(%rax)
 248:	0f b6 3c 16          	movzbl (%rsi,%rdx,1),%edi
 24c:	40 88 3c 11          	mov    %dil,(%rcx,%rdx,1)
 250:	48 83 c2 01          	add    $0x1,%rdx
 254:	44 89 c7             	mov    %r8d,%edi
 257:	29 d7                	sub    %edx,%edi
 259:	85 ff                	test   %edi,%edi
 25b:	7f eb                	jg     248 <memcpy+0x248>
 25d:	5b                   	pop    %rbx
 25e:	c3                   	retq   
 25f:	90                   	nop
 260:	48 83 c1 01          	add    $0x1,%rcx
 264:	31 d2                	xor    %edx,%edx
 266:	66 2e 0f 1f 84 00 00 	nopw   %cs:0x0(%rax,%rax,1)
 26d:	00 00 00 
 270:	0f b6 3c 16          	movzbl (%rsi,%rdx,1),%edi
 274:	40 88 3c 10          	mov    %dil,(%rax,%rdx,1)
 278:	48 83 c2 01          	add    $0x1,%rdx
 27c:	48 39 ca             	cmp    %rcx,%rdx
 27f:	75 ef                	jne    270 <memcpy+0x270>
 281:	f3 c3                	repz retq 
 283:	0f 1f 44 00 00       	nopl   0x0(%rax,%rax,1)
 288:	f3 c3                	repz retq 
 28a:	66 0f 1f 44 00 00    	nopw   0x0(%rax,%rax,1)
 290:	48 89 c1             	mov    %rax,%rcx
 293:	eb a6                	jmp    23b <memcpy+0x23b>
 295:	48 89 f3             	mov    %rsi,%rbx
 298:	49 89 c0             	mov    %rax,%r8
 29b:	e9 50 ff ff ff       	jmpq   1f0 <memcpy+0x1f0>
```

非人类可读代码, 不予评述.

这个优化级别下代码量明显增多, 猜想是gcc采用空间换时间的策略. 

## 实验数据

主函数没有实际的意义, 仅供测试

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(){
    for (size_t i = 0; i<1000000; i++)
    {
        char* str = (char*) malloc(sizeof(char)*1024);
        strcpy(str,"abcdefg");

        char* new_str = (char*) malloc(sizeof(char)*1024);
        memcpy(new_str,str,1024);	// customized memcpy() here
    }

    return 0;
}
```

编译命令(主函数关闭优化)

```bash
gcc -c -o memcpy_test.o memcpy_test.c
gcc -o test memcpy_test.o memcpy.o
```

使用linux下的`time`命令测得(单位:秒)

| 优化级别 | real  | user  |  sys  |
| :------: | :---: | :---: | :---: |
|    0     | 6.084 | 4.792 | 1.292 |
|    1     | 2.602 | 1.306 | 1.290 |
|    2     | 2.450 | 1.195 | 1.250 |
|    3     | 1.770 | 0.498 | 1.268 |

从上表可以看出优化级别越高, 执行速度越快. 虽然三级优化生成的代码长度明显变大, 但是性能确实最优.

优化级别1-2差别并不是很大 - 不仅从运行速度上来看, 从代码的角度看两者也相差无几.

