---
title: "链式栈的实现"
date: 2026-06-12
tags: ["数据结构", "栈", "C/C++", "链表"]
description: "链式栈是基于链表实现的栈结构，相比顺序栈具有动态扩容的优势，适合不确定最大容量的场景。"
---

## 栈的基本概念

栈（Stack）是一种**后进先出（LIFO）** 的线性数据结构。只允许在一端（栈顶）进行插入和删除操作。

## 链式栈 vs 顺序栈

| 对比 | 顺序栈 | 链式栈 |
|-----|-------|-------|
| 底层实现 | 数组 | 链表 |
| 容量 | 固定（可动态扩容） | 动态，无上限 |
| 内存分配 | 连续内存 | 非连续 |
| 访问速度 | 快（缓存友好） | 稍慢（指针跳转） |

## 代码实现

### 节点定义

```cpp
template<typename T>
struct StackNode {
    T data;
    StackNode* next;
    
    StackNode(const T& val) : data(val), next(nullptr) {}
};
```

### 链式栈类

```cpp
template<typename T>
class LinkedStack {
private:
    StackNode<T>* topNode;  // 栈顶指针
    size_t count;           // 元素数量

public:
    LinkedStack() : topNode(nullptr), count(0) {}
    
    ~LinkedStack() {
        while (!isEmpty()) pop();
    }
    
    // 入栈
    void push(const T& val) {
        StackNode<T>* newNode = new StackNode<T>(val);
        newNode->next = topNode;
        topNode = newNode;
        count++;
    }
    
    // 出栈
    void pop() {
        if (isEmpty()) throw std::runtime_error("栈为空");
        StackNode<T>* temp = topNode;
        topNode = topNode->next;
        delete temp;
        count--;
    }
    
    // 获取栈顶元素
    T& top() {
        if (isEmpty()) throw std::runtime_error("栈为空");
        return topNode->data;
    }
    
    // 判空
    bool isEmpty() const {
        return topNode == nullptr;
    }
    
    // 大小
    size_t size() const {
        return count;
    }
};
```

### 使用示例

```cpp
int main() {
    LinkedStack<int> stack;
    
    stack.push(10);
    stack.push(20);
    stack.push(30);
    
    std::cout << "栈顶: " << stack.top() << std::endl;  // 30
    
    stack.pop();
    std::cout << "出栈后栈顶: " << stack.top() << std::endl;  // 20
    std::cout << "栈大小: " << stack.size() << std::endl;      // 2
    
    return 0;
}
```

## 复杂度分析

| 操作 | 时间复杂度 | 说明 |
|-----|-----------|------|
| push | O(1) | 头插法 |
| pop | O(1) | 删除头节点 |
| top | O(1) | 直接访问栈顶 |
| isEmpty | O(1) | 判空 |

## 应用场景

- 函数调用栈
- 表达式求值（中缀转后缀）
- 括号匹配
- 浏览器的前进后退
- 撤销操作（Undo）
