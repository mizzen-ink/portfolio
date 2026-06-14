---
title: "讲讲IO复用三个函数的底层逻辑"
date: 2026-06-14
tags: ["Linux", "IO复用", "select", "poll", "epoll"]
description: "深入剖析select、poll、epoll三种IO复用机制的底层实现原理与性能差异，帮助理解高并发网络编程的核心。"
---

## 为什么需要 IO 复用？

在传统的阻塞 IO 模型中，一个线程只能处理一个连接。当需要处理大量并发连接时，为每个连接创建一个线程是不现实的——线程的创建、切换、销毁都有很大开销。

**IO 复用** 正是为了解决这个问题：一个线程可以同时监视多个文件描述符，当某个 fd 就绪时通知应用程序去读写。

## select

```c
int select(int nfds, fd_set *readfds, fd_set *writefds,
           fd_set *exceptfds, struct timeval *timeout);
```

### 底层实现

1. 用户态将 fd_set 拷贝到内核态
2. 内核遍历所有 fd，调用每个 fd 对应的 poll 函数
3. 如果有 fd 就绪，标记并返回
4. 没有就绪则进程休眠，直到超时或被唤醒

### 缺点

- **fd 数量受限**：默认 1024 个
- **每次都要遍历**：O(n) 复杂度
- **每次都要拷贝**：fd_set 在用户态和内核态之间拷贝
- **需要重新设置**：内核会修改 fd_set，每次调用前要重新添加

## poll

```c
int poll(struct pollfd *fds, nfds_t nfds, int timeout);
```

poll 使用链表存储 fd，**没有数量上限**，解决了 select 1024 的限制。

但其他问题仍然存在：每次调用仍要遍历所有 fd，仍需要在用户态和内核态之间拷贝。

## epoll（Linux 下最优解）

```c
int epoll_create(int size);
int epoll_ctl(int epfd, int op, int fd, struct epoll_event *event);
int epoll_wait(int epfd, struct epoll_event *events, int maxevents, int timeout);
```

### 三大优势

### 1. 事件驱动，无需遍历

epoll 注册 fd 时指定关心的事件类型，内核收到事件后直接将就绪的 fd 加入**就绪链表**。调用 epoll_wait 时**只返回就绪的 fd**，复杂度 O(1)。

### 2. mmap 共享内存

epoll 通过 `mmap` 在内核和用户空间共享一块内存，**避免了数据拷贝**。

### 3. 红黑树管理 fd

epoll 用**红黑树**管理注册的 fd，增删改查都是 O(log n)，效率极高。

### 工作模式

| 模式 | 说明 | 触发方式 |
|-----|------|---------|
| LT（水平触发） | 只要缓冲区有数据就一直通知 | epoll 默认模式 |
| ET（边沿触发） | 只在状态变化时通知一次 | 高效但必须用非阻塞 IO |

## 总结

| 特性 | select | poll | epoll |
|-----|--------|------|-------|
| 最大连接数 | 1024 | 无限制 | 无限制 |
| 遍历方式 | 全量遍历 O(n) | 全量遍历 O(n) | 回调 O(1) |
| 数据拷贝 | 每次拷贝 | 每次拷贝 | mmap 共享 |
| 工作模式 | LT | LT | LT + ET |
