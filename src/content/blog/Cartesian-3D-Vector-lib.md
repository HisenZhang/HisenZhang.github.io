---
title: 'Cartesian 3D Vector lib'
pubDate: 2018-11-21 20:47:04
tags:
  - Resources
category: Technology
description: "Cartesian 3D Vector lib"
---
[View on GitHub](https://github.com/HisenZhang/Cartesian-3D-Vector-lib)

A simple vector library written in plain C for educational purpose.

## Introduction

This library is written in hope to simplify the coding process for non-professional vector computation.

This library **should not** be used for industrial or scientific use due to the limited precision and performance; Complex number is not supported either.

<!-- more -->

## Usage

1. You may copy the files in `./include` to your project directory and compile it seperately;

2. You may generate a single head file `vector.h` for your project:
    ```bash
    $ make single
    ```
    This generate a single head file in the project root directory `./`. Copy the `./vector.h` to your project and include it.

## Example

This is a brief demonstration on the commonly used functions' usage. The output of each statement follows in comments. 

Several practical examples are available in `./example`.

```c
#include "include/vector.h"

int main(int argc, char const *argv[])
{
    // Initialize vectors

    vector A = vecSet(1.0, 2.0, 0.0); 
    vector B = vecSet(0.0, 1.0, 3.0);


    // vecPrint() pretty print the vector
    // in the form of <x,y,z> |modulus|
    
    printf("Vector A,B\n");
    vecPrint(A); // < 1.00, 2.00, 0.00> | 2.24| 
    vecnPrint(B, 4); // < 0.0000, 1.0000, 3.0000> | 3.1623|

    // Arithmetic operations
	// The comming statements demonstarte 
    // 1. Vector Addtion
    // 2. Vector Subtraction
    // 3. Vector Cross Product
    // 4. Vector Dot Product
    // 5. Vector Scalar Product
        
    printf("\nADD, SUB, CRX, DOT, SCL\n");
    vecPrint(vecAdd(A, B));  // < 1.00, 3.00, 3.00> | 4.36|
    vecPrint(vecSub(A, B));  // < 1.00, 1.00,-3.00> | 3.32|
    vecPrint(vecCrx(A, B));  // < 6.00,-3.00, 1.00> | 6.78|
    printf("% .2f\n",vecDot(A, B)); // 2.00
    vecPrint(vecScl(A, 4.0));  // < 8.00, 0.00, 0.00> | 8.00|
    
    // Find unit vector
    
    printf("\nUnit A,B\n");
    vecPrint(vecUnit(A));  // < 0.45, 0.89, 0.00> | 2.24|
    vecPrint(vecUnit(B));  // < 0.00, 0.32, 0.95> | 3.16|

    // Take negative

    printf("\nNEG A,B\n");
    vecPrint(vecNeg(A));  // <-1.00,-2.00,-0.00> | 2.24|
    vecPrint(vecNeg(B));  // <-0.00,-1.00,-3.00> | 3.16|

    // Take modulus
    
    printf("\nMOD A,B\n");
    printf("|% .2f|\n",vecMod(A));  // 2.24
    printf("|% .2f|\n",vecMod(B));  // 3.16

    return 0;
}
```
## Type

### vector

```c
typedef struct Vector{
    double x;
    double y;
    double z;
    double mag;
}vector;

```

The `vector` type contains components in three dimensions and the overall magnitude. All these data are in `double` type. Each time an operation is performed to a vector, the magnitude would update automatically. 

You may get a component directly:

```c
vector V = vecSet(1.1, 2.2, 3.3);
printf("%f", V.x); // This prints out the x component of vector V
```

## Functions

### Arithmetic
#### Addition

`vecAdd(A, B)` returns the sum: `A + B`.

#### Subtraction

`vecSub(A, B)` returns the difference: `A - B`.

#### Negative

`vecNeg(V)` returns the negative: `- V`.

#### Modulus

`vecMod(V)` returns the modulus: `| V |`.

#### Unit Vector

`vecUnit(V)` returns the unit vector: `^ V`.

#### Scalar Product

`vecScl(V, s)` returns the vector `s * V`.

#### Dot Product

`vecDot(A, B)` returns the dot product: `A · B`.

#### Cross Product

`vecCrx(A, B)` returns the Cross product: `A × B`.

### Utilities
#### Initialization

There're two ways to initialize a vector:
1. `vecSet(x, y, z)` returns a vector specify the coordinates (x,y,z).
2. `vecInit()` returns a vector with coordinates all of `0.0`. However, you should use `vecSet(0.0, 0.0, 0.0)` instead for better readability.

#### Pretty Print

1. `vecPrint(V)` prints the vector in the form of `<x, y, z> | modulus |`, 2 decimal places by default
2. `vecnPrint(V, p)` using the specified precision `p`. If p is 0, print in exponential form.