package com.example.tunnel.controller;

import com.example.tunnel.entity.TrafficRecord;
import com.example.tunnel.repository.TrafficRecordRepository;
import com.example.tunnel.service.ResultDispatchService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/stream")
@CrossOrigin(origins = "*") 
public class StreamSimulationController {

    private final ResultDispatchService resultDispatchService;
    private final TrafficRecordRepository trafficRecordRepository;

    public StreamSimulationController(ResultDispatchService resultDispatchService, TrafficRecordRepository trafficRecordRepository) {
        this.resultDispatchService = resultDispatchService;
        this.trafficRecordRepository = trafficRecordRepository;
    }

    /**
     * 新架构：Java 仅作为事件中台
     * 接收 Python 算法端发现异常（如逆行、停车、事故等）的 HTTP 推送，并负责持久化或大屏预警。
     * 日常的高频密集画框工作已彻底剥离给 WebSocket 和流媒体服务器直连前端。
     */
    @PostMapping("/events")
    public String receiveTrafficEvent(@RequestBody Map<String, Object> eventPayload) {
        System.out.println("[Traffic Event] 收到算法端事件报警: " + eventPayload);
        // TODO: 1. 存入 MySQL 数据库，记录告警时间、坐标、车辆类型
        // TODO: 2. 如果是严重事故，通过 WebSocket (Java版) 强制广播给前端弹出刺耳警报
        return "Event recorded successfully";
    }

    /**
     * 接收 Python 算法端上传的车流撞线信息
     */
    @PostMapping("/traffic/count")
    public String receiveTrafficCount(@RequestBody Map<String, Object> payload) {
        TrafficRecord record = new TrafficRecord();
        record.setDeviceId((String) payload.getOrDefault("deviceId", "cam_default"));
        
        Object trackIdObj = payload.get("trackId");
        if (trackIdObj != null) {
            record.setTrackId(Integer.valueOf(trackIdObj.toString()));
        }
        
        record.setRecordTime(LocalDateTime.now());
        trafficRecordRepository.save(record);
        
        return "Traffic counted successfully";
    }
}