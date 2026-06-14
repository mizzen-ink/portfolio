---
title: "C++ 工厂模式：从入门到进阶，彻底掌握对象创建的艺术"
date: 2026-06-14
tags: ["C++", "设计模式", "工厂模式", "C++11"]
description: "从简单工厂到抽象工厂，结合现代C++特性给出工程级最佳实现，拆解不同场景下的选型原则。"
---

工厂模式作为最经典的创建型设计模式，核心思想是将对象的创建与使用分离：把易变的对象创建逻辑封装在工厂类内部，上层业务代码仅依赖抽象接口，不感知具体产品的实现细节，从而大幅提升代码的扩展性、可维护性与可读性。

本文将从最简单的简单工厂讲起，逐步深入工厂方法、抽象工厂两种经典形态，结合现代 C++ 特性给出工程级最佳实现，并拆解不同场景下的选型原则。

## 一、简单工厂模式：入门级封装

### 1.1 核心思想

用一个统一的工厂类，根据传入的参数动态决定创建哪一个具体产品的实例。所有产品的创建逻辑都集中在这一个工厂中，客户端无需关心对象创建细节，只需传入类型标识即可获取对应产品。

### 1.2 代码实现

以图形创建为例，基于现代 C++ 智能指针实现：

```cpp
#include <iostream>
#include <memory>
#include <string>

// 抽象产品
class Shape {
public:
    virtual ~Shape() = default;
    virtual void draw() const = 0;
};

class Circle : public Shape {
public:
    void draw() const override {
        std::cout << "绘制圆形" << std::endl;
    }
};

class Rectangle : public Shape {
public:
    void draw() const override {
        std::cout << "绘制矩形" << std::endl;
    }
};

// 简单工厂
class ShapeFactory {
public:
    static std::unique_ptr<Shape> createShape(const std::string& type) {
        if (type == "circle") return std::make_unique<Circle>();
        else if (type == "rectangle") return std::make_unique<Rectangle>();
        return nullptr;
    }
};
```

### 1.3 优缺点

| 优点 | 缺点 |
|-----|------|
| 实现简单，代码量少 | 违反开闭原则 |
| 客户端无需记忆产品类名 | 工厂类职责过重 |

## 二、工厂方法模式

### 2.1 核心思想

将单一工厂拆分为抽象工厂接口 + 多个具体工厂，每个具体产品对应一个专属工厂。完全符合开闭原则。

```cpp
class ShapeFactory {
public:
    virtual ~ShapeFactory() = default;
    virtual std::unique_ptr<Shape> createShape() const = 0;
};

class CircleFactory : public ShapeFactory {
public:
    std::unique_ptr<Shape> createShape() const override {
        return std::make_unique<Circle>();
    }
};
```

## 三、抽象工厂模式

用于创建一系列相互关联的产品对象（产品族）。例如 UI 主题系统：浅色主题对应浅色按钮、浅色输入框。

## 四、三种模式对比

| 维度 | 简单工厂 | 工厂方法 | 抽象工厂 |
|-----|---------|---------|---------|
| 核心逻辑 | 一个工厂创建所有 | 一对一 | 一对产品族 |
| 开闭原则 | 不符合 | 符合 | 产品族扩展符合 |
| 复杂度 | 低 | 中 | 高 |

## 五、现代 C++ 进阶：注册式工厂

这是大型项目最推荐的实现方式，通过注册表 + 回调函数实现产品的自动注册，新增产品完全无需修改工厂代码：

```cpp
class ShapeFactory {
public:
    using Creator = std::function<std::unique_ptr<Shape>()>;
    
    static ShapeFactory& instance() {
        static ShapeFactory factory;
        return factory;
    }
    
    void registerShape(const std::string& key, Creator creator) {
        creators_[key] = std::move(creator);
    }
    
    std::unique_ptr<Shape> create(const std::string& key) {
        auto it = creators_.find(key);
        if (it != creators_.end()) return it->second();
        return nullptr;
    }

private:
    std::unordered_map<std::string, Creator> creators_;
};

#define REGISTER_SHAPE(Class, Key) \
    static bool _reg_##Class = []() { \
        ShapeFactory::instance().registerShape(Key, []() { \
            return std::make_unique<Class>(); \
        }); \
        return true; \
    }()
```

## 六、选型原则

- **产品少且稳定** → 简单工厂
- **产品多、频繁迭代** → 工厂方法
- **多系列关联产品** → 抽象工厂
- **大型项目插件化** → 注册式工厂
