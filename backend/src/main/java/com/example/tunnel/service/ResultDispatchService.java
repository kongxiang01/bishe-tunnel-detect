package com.example.tunnel.service;

import com.example.tunnel.dto.FrameDetectResult;
import org.springframework.stereotype.Service;

@Service
public class ResultDispatchService {

    /**
     * 结果调度分发：
     * 1. 甄别危险事件写入数据库
     * 2. 通过 WebSocket 推送给前端浏览器渲染画框
     */
    public void dispatch(FrameDetectResult result) {
        if (result == null) return;
        
        System.out.println("==================================================");
        System.out.println("[ResultDispatch] 准备分发帧检测结果!");
        System.out.println("  1. 帧 ID: " + result.getFrame_id());
        System.out.println("  2. 检测到交通工具数量: " + result.getVehicle_count());
        
        // 模拟后续真实操作的占位符
        System.out.println("  -> [Mock 数据库动作]: 分析轨迹数据，如果违规落盘到 MySQL...");
        System.out.println("  -> [Mock WebSocket]: 向 Topic '/topic/tunnel/stream' 广播检测 BBox 列表...");
        System.out.println("==================================================");
    }
}