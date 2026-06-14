---
title: "基于 C++11 的线程池实现与性能对比"
date: 2026-06-14
tags: ["C++", "线程池", "并发编程", "C++11"]
description: "深入分析5种C++11线程池模型的实现原理与性能差异，涵盖packaged_task、future等现代C++特性的应用。"
---

## 为什么需要线程池？

在高并发服务端程序中，频繁地创建和销毁线程会带来巨大的开销（线程创建约占用 1MB 栈空间 + 内核对象）。线程池的核心思想是：**复用线程**，避免频繁创建销毁的开销。

## 线程池的核心组件

一个基本的线程池包含：

1. **任务队列**：存放待执行的任务
2. **工作线程**：从队列中取任务执行
3. **同步机制**：保证线程安全
4. **管理策略**：动态调整线程数量

## 5种线程池模型

### 1. 固定大小线程池

```cpp
class FixedThreadPool {
    std::vector<std::thread> workers;
    std::queue<std::function<void()>> tasks;
    std::mutex queue_mutex;
    std::condition_variable cv;
    bool stop;

public:
    FixedThreadPool(size_t threads) : stop(false) {
        for (size_t i = 0; i < threads; ++i) {
            workers.emplace_back([this] {
                while (true) {
                    std::function<void()> task;
                    {
                        std::unique_lock<std::mutex> lock(queue_mutex);
                        cv.wait(lock, [this] {
                            return stop || !tasks.empty();
                        });
                        if (stop && tasks.empty()) return;
                        task = std::move(tasks.front());
                        tasks.pop();
                    }
                    task();
                }
            });
        }
    }
};
```

### 2. 动态线程池

根据任务数量动态调整线程数，适用于任务量波动大的场景。

### 3. 带优先级的线程池

使用 `priority_queue` 替代普通队列，高优先级任务先执行。

### 4. 带返回值的线程池

利用 `std::packaged_task` 和 `std::future`：

```cpp
template<class F, class... Args>
auto enqueue(F&& f, Args&&... args)
    -> std::future<typename std::result_of<F(Args...)>::type> {
    
    using return_type = typename std::result_of<F(Args...)>::type;
    
    auto task = std::make_shared<std::packaged_task<return_type()>>(
        std::bind(std::forward<F>(f), std::forward<Args>(args)...)
    );
    
    std::future<return_type> result = task->get_future();
    {
        std::unique_lock<std::mutex> lock(queue_mutex);
        tasks.emplace([task]() { (*task)(); });
    }
    cv.notify_one();
    return result;
}
```

### 5. 窃取工作线程池

每个线程有自己的任务队列，空闲时可以"窃取"其他线程的任务（类似 Go 的 GMP 模型）。

## 性能对比

| 模型 | 适用场景 | 吞吐量 | 延迟 |
|-----|---------|-------|-----|
| 固定大小 | 负载稳定 | ★★★★★ | 低 |
| 动态调整 | 负载波动 | ★★★★ | 中 |
| 优先级 | 任务分级 | ★★★ | 中 |
| 带返回值 | 需要结果 | ★★★★ | 低 |
| 工作窃取 | CPU密集 | ★★★★★ | 极低 |

## 总结

选择线程池模型需要结合实际场景：
- **I/O 密集**：线程数可设置较多（2 * CPU 核心数）
- **CPU 密集**：线程数 = CPU 核心数
- **混合型**：动态调整策略效果更好

完整的源码实现见我的 GitHub：[threadpool](https://github.com/mizzen-ink/threadpool)
