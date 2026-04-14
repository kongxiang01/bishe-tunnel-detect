package com.example.tunnel.controller;

import com.example.tunnel.annotation.Loggable;
import com.example.tunnel.entity.DetectEvent;
import com.example.tunnel.repository.DetectEventRepository;
import com.example.tunnel.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 事件控制器
 * 处理事件上传、查询、状态更新等操作
 */
@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "*")
public class EventController {

    @Autowired
    private DetectEventRepository detectEventRepository;

    /**
     * API_1：供算法端 POST 上传违规事件数据
     * 支持新字段：deviceId, deviceName, severity, status, plate
     */
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<String>> uploadEvent(@RequestBody EventUploadRequest request) {
        DetectEvent event = new DetectEvent();
        event.setEventType(request.getEventType());
        event.setDescription(request.getDescription());
        event.setTrackId(request.getTrackId());

        // 使用服务器收到消息时的当前时间作为事件时间
        event.setEventTime(LocalDateTime.now());

        // 设置新增字段
        if (request.getDeviceId() != null) {
            event.setDeviceId(request.getDeviceId());
        }
        if (request.getDeviceName() != null) {
            event.setDeviceName(request.getDeviceName());
        }
        if (request.getSeverity() != null) {
            event.setSeverity(request.getSeverity());
        }
        // 默认状态为待处理
        event.setStatus(request.getStatus() != null ? request.getStatus() : "PENDING");
        if (request.getPlate() != null) {
            event.setPlate(request.getPlate());
        }

        detectEventRepository.save(event);
        return ResponseEntity.ok(ApiResponse.success("Event uploaded successfully"));
    }

    /**
     * API_2：供前端 GET 获取告警记录
     * 支持分页、事件类型筛选、状态筛选、时间范围筛选
     *
     * @param page 页码（从0开始）
     * @param size 每页大小
     * @param type 事件类型筛选（如：accident, illegal_parking）
     * @param status 处理状态筛选（PENDING, RESOLVED）
     * @param startTime 开始时间（格式：yyyy-MM-dd HH:mm:ss）
     * @param endTime 结束时间（格式：yyyy-MM-dd HH:mm:ss）
     */
    @GetMapping("/list")
    public ResponseEntity<ApiResponse<Page<DetectEvent>>> listEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime) {

        // 日期格式解析器
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        // 解析时间参数（使用 final 变量供 lambda 使用）
        final LocalDateTime parsedStartTime = (startTime != null && !startTime.trim().isEmpty())
            ? LocalDateTime.parse(startTime, formatter) : null;
        final LocalDateTime parsedEndTime = (endTime != null && !endTime.trim().isEmpty())
            ? LocalDateTime.parse(endTime, formatter) : null;

        // 构建动态查询条件
        Specification<DetectEvent> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (type != null && !type.trim().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("eventType"), type));
            }

            if (status != null && !status.trim().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }

            if (parsedStartTime != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("eventTime"), parsedStartTime));
            }

            if (parsedEndTime != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("eventTime"), parsedEndTime));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        // 创建分页请求，按id降序排列
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));

        // 执行分页查询
        Page<DetectEvent> events = detectEventRepository.findAll(spec, pageable);

        return ResponseEntity.ok(ApiResponse.success(events));
    }

    /**
     * API_3：更新事件处理状态
     *
     * @param id 事件ID
     * @param request 包含新状态的请求体 {status: "PENDING"或"RESOLVED"}
     */
    @Loggable
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateEventStatus(
            @PathVariable Long id,
            @RequestBody StatusUpdateRequest request) {

        Optional<DetectEvent> eventOpt = detectEventRepository.findById(id);

        if (eventOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        // 验证状态值
        String newStatus = request.getStatus();
        if (newStatus == null || (!newStatus.equals("PENDING") && !newStatus.equals("RESOLVED"))) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(400, "无效的状态值，只支持 PENDING 或 RESOLVED"));
        }

        DetectEvent event = eventOpt.get();
        event.setStatus(newStatus);
        detectEventRepository.save(event);

        return ResponseEntity.ok(ApiResponse.success("状态更新成功", Map.of(
                "id", event.getId(),
                "status", event.getStatus()
        )));
    }

    /**
     * 获取事件统计信息
     * 返回前端需要的格式: {total, pendingCount, resolvedCount}
     */
    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getEventStatistics() {
        Map<String, Object> result = new HashMap<>();
        result.put("total", detectEventRepository.count());
        result.put("pendingCount", detectEventRepository.countByStatus("PENDING"));
        result.put("resolvedCount", detectEventRepository.countByStatus("RESOLVED"));
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * 获取待处理事件数量
     */
    @GetMapping("/pending/count")
    public ResponseEntity<ApiResponse<Long>> getPendingEventCount() {
        long count = detectEventRepository.countByStatus("PENDING");
        return ResponseEntity.ok(ApiResponse.success(count));
    }
}

/**
 * 事件上传请求DTO
 */
class EventUploadRequest {
    private String eventType;
    private String description;
    private Integer trackId;
    private Long deviceId;
    private String deviceName;
    private String severity;
    private String status;
    private String plate;

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getTrackId() {
        return trackId;
    }

    public void setTrackId(Integer trackId) {
        this.trackId = trackId;
    }

    public Long getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(Long deviceId) {
        this.deviceId = deviceId;
    }

    public String getDeviceName() {
        return deviceName;
    }

    public void setDeviceName(String deviceName) {
        this.deviceName = deviceName;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPlate() {
        return plate;
    }

    public void setPlate(String plate) {
        this.plate = plate;
    }
}

/**
 * 状态更新请求DTO
 */
class StatusUpdateRequest {
    private String status;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
