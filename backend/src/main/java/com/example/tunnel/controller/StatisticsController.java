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

    /**
     * 根据时间范围计算起止时间
     * @param timeRange today, week, month, year
     * @return [start, end] 时间数组
     */
    private LocalDateTime[] getTimeRange(String timeRange) {
        LocalDate today = LocalDate.now();
        switch (timeRange) {
            case "week":
                return new LocalDateTime[]{
                    today.with(java.time.DayOfWeek.MONDAY).atStartOfDay(),
                    today.atTime(LocalTime.MAX)
                };
            case "month":
                return new LocalDateTime[]{
                    today.withDayOfMonth(1).atStartOfDay(),
                    today.atTime(LocalTime.MAX)
                };
            case "year":
                return new LocalDateTime[]{
                    today.withDayOfYear(1).atStartOfDay(),
                    today.atTime(LocalTime.MAX)
                };
            default: // "today"
                return new LocalDateTime[]{
                    today.atTime(LocalTime.MIN),
                    today.atTime(LocalTime.MAX)
                };
        }
    }

    @GetMapping("/events")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getEventStatistics(
            @RequestParam(defaultValue = "today") String timeRange) {
        LocalDateTime[] range = getTimeRange(timeRange);

        // 按时间范围统计事件
        List<Object[]> stats = detectEventRepository.countEventsByTypeAndTimeRange(range[0], range[1]);
        Map<String, Long> typeCountMap = new HashMap<>();
        for (Object[] stat : stats) {
            typeCountMap.put((String) stat[0], (Long) stat[1]);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("eventCounts", typeCountMap);
        result.put("totalEvents", detectEventRepository.countByEventTimeBetween(range[0], range[1]));

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * 获取交通流量统计数据
     * 支持时间范围筛选: today, week, month, year
     */
    @GetMapping("/traffic")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTrafficStatistics(
            @RequestParam(defaultValue = "today") String timeRange) {
        Map<String, Object> result = new HashMap<>();
        LocalDateTime[] range = getTimeRange(timeRange);

        // 按时间范围统计车流量
        long traffic = trafficRecordRepository.countTrafficByTimeRange(range[0], range[1]);
        result.put("traffic", traffic);
        result.put("totalEvents", detectEventRepository.countByEventTimeBetween(range[0], range[1]));

        // 设备统计
        long onlineDevices = deviceRepository.findAll().stream()
                .filter(d -> "ONLINE".equals(d.getStatus()))
                .count();
        long totalDevices = deviceRepository.count();
        result.put("onlineDevices", onlineDevices);
        result.put("totalDevices", totalDevices);

        // 根据时间范围返回不同的趋势数据
        List<Map<String, Object>> trendData = new ArrayList<>();

        if ("today".equals(timeRange)) {
            // 24小时趋势
            List<Object[]> hourlyRecords = trafficRecordRepository.countHourlyTrafficToday(range[0], range[1]);
            Map<Integer, Long> hourCountMap = new HashMap<>();
            for (Object[] row : hourlyRecords) {
                Number hr = (Number) row[0];
                Number cnt = (Number) row[1];
                if (hr != null && cnt != null) {
                    hourCountMap.put(hr.intValue(), cnt.longValue());
                }
            }
            for (int hour = 0; hour < 24; hour++) {
                Map<String, Object> entry = new HashMap<>();
                entry.put("label", hour + "时");
                entry.put("count", hourCountMap.getOrDefault(hour, 0L));
                trendData.add(entry);
            }
            result.put("trendType", "hourly");
        } else if ("week".equals(timeRange)) {
            // 7天趋势
            List<Object[]> dailyRecords = trafficRecordRepository.countDailyTrafficInRange(range[0], range[1]);
            Map<Integer, Long> dayCountMap = new HashMap<>();
            for (Object[] row : dailyRecords) {
                Number day = (Number) row[0];
                Number cnt = (Number) row[1];
                if (day != null && cnt != null) {
                    dayCountMap.put(day.intValue(), cnt.longValue());
                }
            }
            LocalDate startDate = range[0].toLocalDate();
            for (int i = 0; i < 7; i++) {
                Map<String, Object> entry = new HashMap<>();
                entry.put("label", startDate.plusDays(i).getDayOfWeek().getValue() + "日");
                entry.put("count", dayCountMap.getOrDefault(startDate.plusDays(i).getDayOfMonth(), 0L));
                trendData.add(entry);
            }
            result.put("trendType", "daily");
        } else if ("month".equals(timeRange)) {
            // 30天趋势
            List<Object[]> dailyRecords = trafficRecordRepository.countDailyTrafficInRange(range[0], range[1]);
            Map<Integer, Long> dayCountMap = new HashMap<>();
            for (Object[] row : dailyRecords) {
                Number day = (Number) row[0];
                Number cnt = (Number) row[1];
                if (day != null && cnt != null) {
                    dayCountMap.put(day.intValue(), cnt.longValue());
                }
            }
            for (int day = 1; day <= 30; day++) {
                Map<String, Object> entry = new HashMap<>();
                entry.put("label", day + "日");
                entry.put("count", dayCountMap.getOrDefault(day, 0L));
                trendData.add(entry);
            }
            result.put("trendType", "daily");
        } else if ("year".equals(timeRange)) {
            // 12个月趋势
            List<Object[]> monthlyRecords = trafficRecordRepository.countMonthlyTrafficInRange(range[0], range[1]);
            Map<Integer, Long> monthCountMap = new HashMap<>();
            for (Object[] row : monthlyRecords) {
                Number month = (Number) row[0];
                Number cnt = (Number) row[1];
                if (month != null && cnt != null) {
                    monthCountMap.put(month.intValue(), cnt.longValue());
                }
            }
            String[] monthNames = {"1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"};
            for (int month = 1; month <= 12; month++) {
                Map<String, Object> entry = new HashMap<>();
                entry.put("label", monthNames[month - 1]);
                entry.put("count", monthCountMap.getOrDefault(month, 0L));
                trendData.add(entry);
            }
            result.put("trendType", "monthly");
        }

        result.put("trendData", trendData);
        result.put("timeRange", timeRange);

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * 获取设备统计数据
     * 返回各设备的告警事件数量和最后事件时间
     */
    @GetMapping("/devices")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDeviceStatistics(
            @RequestParam(defaultValue = "today") String timeRange) {
        Map<String, Object> result = new HashMap<>();
        LocalDateTime[] range = getTimeRange(timeRange);

        List<Device> allDevices = deviceRepository.findAll();
        long totalDevices = allDevices.size();
        long onlineDevices = allDevices.stream()
                .filter(d -> "ONLINE".equals(d.getStatus()))
                .count();
        long offlineDevices = totalDevices - onlineDevices;

        result.put("totalDevices", totalDevices);
        result.put("onlineDevices", onlineDevices);
        result.put("offlineDevices", offlineDevices);

        // 按时间范围查询事件
        List<DetectEvent> rangeEvents = detectEventRepository.findByEventTimeBetween(range[0], range[1]);
        Map<String, Long> eventCountByDevice = new HashMap<>();
        Map<String, LocalDateTime> lastEventTimeByDevice = new HashMap<>();

        for (DetectEvent event : rangeEvents) {
            String deviceKey = event.getDeviceId();
            if (deviceKey != null) {
                eventCountByDevice.merge(deviceKey, 1L, Long::sum);
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
            deviceStat.put("eventCount", eventCountByDevice.getOrDefault(device.getDeviceId(), 0L));
            LocalDateTime lastTime = lastEventTimeByDevice.get(device.getDeviceId());
            deviceStat.put("lastEventTime", lastTime != null ? lastTime.toString() : null);
            // 设备时间范围内车流量
            long trafficCount = trafficRecordRepository.countTrafficByDeviceAndTimeRange(
                    device.getDeviceId(), range[0], range[1]);
            deviceStat.put("trafficCount", trafficCount);
            deviceStats.add(deviceStat);
        }

        result.put("deviceStats", deviceStats);
        result.put("timeRange", timeRange);

        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
