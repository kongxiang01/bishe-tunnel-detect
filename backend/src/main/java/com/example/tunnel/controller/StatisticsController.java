package com.example.tunnel.controller;

import com.example.tunnel.entity.Device;
import com.example.tunnel.entity.DetectEvent;
import com.example.tunnel.repository.DetectEventRepository;
import com.example.tunnel.repository.DeviceRepository;
import com.example.tunnel.repository.TrafficRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.tunnel.dto.ApiResponse;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/statistics")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StatisticsController {

    private final DetectEventRepository detectEventRepository;
    private final DeviceRepository deviceRepository;
    private final TrafficRecordRepository trafficRecordRepository;

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
     * MVP: 返回今日真实车流量记录以及24小时数据趋势
     */
    @GetMapping("/traffic")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTrafficStatistics() {
        Map<String, Object> result = new HashMap<>();

        // 查询今日真实车流量数据
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
        long todayTraffic = trafficRecordRepository.countTodayTraffic(startOfDay, endOfDay);
        
        result.put("todayTraffic", todayTraffic);
        result.put("totalEvents", detectEventRepository.count());

        // 设备统计
        long onlineDevices = deviceRepository.findAll().stream()
                .filter(d -> "ONLINE".equals(d.getStatus()))
                .count();
        long totalDevices = deviceRepository.count();
        result.put("onlineDevices", onlineDevices);
        result.put("totalDevices", totalDevices);

        // 获取2真实24小时数据趋势
        List<Object[]> hourlyRecords = trafficRecordRepository.countHourlyTrafficToday(startOfDay, endOfDay);
        Map<Integer, Long> hourCountMap = new HashMap<>();
        for (Object[] row : hourlyRecords) {
            Number hr = (Number) row[0];
            Number cnt = (Number) row[1];
            if (hr != null && cnt != null) {
                hourCountMap.put(hr.intValue(), cnt.longValue());
            }
        }

        List<Map<String, Object>> hourlyData = new ArrayList<>();
        for (int hour = 0; hour < 24; hour++) {
            Map<String, Object> hourEntry = new HashMap<>();
            hourEntry.put("hour", hour);
            hourEntry.put("count", hourCountMap.getOrDefault(hour, 0L));
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

        // 获取今日时间范围
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);

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
            // 设备今日车流量
            long trafficCount = trafficRecordRepository.countTodayTrafficByDevice(device.getDeviceId(), startOfDay, endOfDay);
            deviceStat.put("trafficCount", trafficCount);
            deviceStats.add(deviceStat);
        }

        result.put("deviceStats", deviceStats);

        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
