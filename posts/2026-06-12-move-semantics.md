---
title: "讲讲移动语义：深入理解C++11右值引用"
date: 2026-06-12
tags: ["C++", "C++11", "移动语义", "右值引用"]
description: "从底层原理出发，彻底讲清C++11的移动语义、右值引用、std::move和完美转发。"
---

## 为什么需要移动语义？

C++11 之前，对象的拷贝无处不在：

```cpp
std::vector<int> createVec() {
    std::vector<int> v(1000000);
    return v;  // 拷贝？还是移动？
}
```

传统的拷贝需要深拷贝所有资源，而很多时候源对象马上就要销毁了——**"偷"走它的资源比"复制"要高效得多**。

## 左值与右值

### 核心区分

- **左值（lvalue）**：可以取地址、有名字的表达式
- **右值（rvalue）**：不能取地址、没有名字的临时对象

```cpp
int x = 42;    // x 是左值，42 是右值
int* p = &x;   // OK
// int* q = &42;  // 错误！不能对右值取地址
```

## 右值引用

```cpp
int&& rref = 42;  // 右值引用绑定到右值
```

### std::move

`std::move` 本质上只是一个 **static_cast**，将左值转换为右值引用：

```cpp
template<typename T>
constexpr typename std::remove_reference<T>::type&&
move(T&& t) noexcept {
    return static_cast<typename std::remove_reference<T>::type&&>(t);
}
```

## 移动构造函数

```cpp
class MyString {
    char* data;
    size_t size;
public:
    // 移动构造函数
    MyString(MyString&& other) noexcept
        : data(other.data), size(other.size) {
        other.data = nullptr;  // 置空源对象
        other.size = 0;
    }
    
    // 拷贝构造函数
    MyString(const MyString& other)
        : data(new char[other.size]), size(other.size) {
        memcpy(data, other.data, size);
    }
};
```

## 完美转发

```cpp
template<typename T>
void wrapper(T&& arg) {
    // 保持 arg 的原始类型（左值/右值）
    func(std::forward<T>(arg));
}
```

`std::forward` 根据模板参数 T 的类型决定转发为左值还是右值引用。
