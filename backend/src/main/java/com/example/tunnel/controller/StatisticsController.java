package com.example.tunnel.controller;

import com.example.tunnel.entity.Device;
import com.example.tunnel.entity.DetectEvent;
import com.example.tunnel.repository.DetectEventRepository;
import com.example.tunnel.repository.DeviceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.tunnel.dto.ApiResponse;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/statistics")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StatisticsController {

    private final DetectEventRepository detectEventRepository;
    private final DeviceRepository deviceRepository;

    @GetMapping("/events")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getEventStatistics() {
        // MVP: 简单统计所有事件记录按类型分类的数量
        List<Object[]> stats = detectEventRepository.countEventsByType();
        Map<String, Long> typeCountMap = new HashMap<>();
        for (Object[] stat : stats) {
            typeCountMap.put((String) stat[0], (Long) stat[1]);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("eventCounts", typeCountMap);
        result.put("totalEvents", detectEventRepository.count());

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * 获取交通流量统计数据
     * TODO: 集成真实车流量统计模块
     * - todayTraffic: 可通过车辆检测计数获得
     * - avgSpeed: 可通过速度检测算法计算
     * - hourlyData: 按小时聚合车辆通过数量
     */
    @GetMapping("/traffic")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTrafficStatistics() {
        Map<String, Object> result = new HashMap<>();

        // TODO: 集成真实交通流量统计
        // 临时使用模拟数据，后续接入真实车流统计模块
        result.put("todayTraffic", 1234);
        result.put("avgSpeed", 62.5);
        result.put("totalEvents", detectEventRepository.count());

        // 设备统计
        long onlineDevices = deviceRepository.findAll().stream()
                .filter(d -> "ONLINE".equals(d.getStatus()))
                .count();
        long totalDevices = deviceRepository.count();
        result.put("onlineDevices", onlineDevices);
        result.put("totalDevices", totalDevices);

        // 生成24小时模拟数据
        List<Map<String, Object>> hourlyData = new ArrayList<>();
        Random random = new Random();
        for (int hour = 0; hour < 24; hour++) {
            Map<String, Object> hourEntry = new HashMap<>();
            hourEntry.put("hour", hour);
            // 模拟高峰时段（7-9, 17-19）车流量较大
            int baseCount = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19) ? 80 : 30;
            hourEntry.put("count", baseCount + random.nextInt(20));
            hourlyData.add(hourEntry);
        }
        result.put("hourlyData", hourlyData);

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * 获取设备统计数据
     * 返回各设备的告警事件数量和最后事件时间
     */
    @GetMapping("/devices")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDeviceStatistics() {
        Map<String, Object> result = new HashMap<>();

        List<Device> allDevices = deviceRepository.findAll();
        long totalDevices = allDevices.size();
        long onlineDevices = allDevices.stream()
                .filter(d -> "ONLINE".equals(d.getStatus()))
                .count();
        long offlineDevices = totalDevices - onlineDevices;

        result.put("totalDevices", totalDevices);
        result.put("onlineDevices", onlineDevices);
        result.put("offlineDevices", offlineDevices);

        // 获取每个设备的事件统计
        // TODO: 后续应通过 deviceId 字段关联事件表，此处使用 track_id 前缀匹配模拟
        List<DetectEvent> allEvents = detectEventRepository.findAll();
        Map<String, Long> eventCountByDevice = new HashMap<>();
        Map<String, LocalDateTime> lastEventTimeByDevice = new HashMap<>();

        for (DetectEvent event : allEvents) {
            // 模拟设备事件统计（实际应通过 event.deviceId 关联）
            // 目前 DetectEvent 未关联 Device，此处仅作演示
            String deviceKey = "device_" + ((event.getId() != null) ? (event.getId() % 2 + 1) : 1);
            eventCountByDevice.merge(deviceKey, 1L, Long::sum);

            if (event.getEventTime() != null) {
                lastEventTimeByDevice.compute(deviceKey, (k, existing) ->
                        existing == null || event.getEventTime().isAfter(existing) ? event.getEventTime() : existing
                );
            }
        }

        // 构建设备统计数据
        List<Map<String, Object>> deviceStats = new ArrayList<>();
        for (Device device : allDevices) {
            Map<String, Object> deviceStat = new HashMap<>();
            deviceStat.put("deviceId", device.getId());
            deviceStat.put("deviceName", device.getName());
            // TODO: 集成真实的事件计数，通过事件表的 deviceId 关联查询
            deviceStat.put("eventCount", eventCountByDevice.getOrDefault("device_" + device.getId(), 0L));
            LocalDateTime lastTime = lastEventTimeByDevice.get("device_" + device.getId());
            deviceStat.put("lastEventTime", lastTime != null ? lastTime.toString() : null);
            deviceStats.add(deviceStat);
        }

        result.put("deviceStats", deviceStats);

        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
