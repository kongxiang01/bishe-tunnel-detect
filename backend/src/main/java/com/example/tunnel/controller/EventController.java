package com.example.tunnel.controller;

import com.example.tunnel.entity.DetectEvent;
import com.example.tunnel.repository.DetectEventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "*") // MVP: 允许跨域请求
public class EventController {

    @Autowired
    private DetectEventRepository detectEventRepository;

    /**
     * API_1：供算法端 POST 上传违规事件数据
     */
    @PostMapping("/upload")
    public ResponseEntity<String> uploadEvent(@RequestBody EventUploadRequest request) {
        DetectEvent event = new DetectEvent();
        event.setEventType(request.getEventType());
        event.setDescription(request.getDescription());
        event.setTrackId(request.getTrackId());
        
        // 使用服务器收到消息时的当前时间作为事件时间
        event.setEventTime(LocalDateTime.now());

        detectEventRepository.save(event);
        return ResponseEntity.ok("Event uploaded successfully");
    }

    /**
     * API_2：供前端 GET 获取最新告警记录
     */
    @GetMapping("/list")
    public ResponseEntity<List<DetectEvent>> listRecentEvents() {
        // 根据流水 ID 降序（最新发生在前）查询
        List<DetectEvent> recentEvents = detectEventRepository.findAll(Sort.by(Sort.Direction.DESC, "id"));
        
        // 限制前端仅展示近期最多 50 条告警记录，防内存堆积
        if (recentEvents.size() > 50) {
            recentEvents = recentEvents.subList(0, 50);
        }
        return ResponseEntity.ok(recentEvents);
    }
}

// 供此 Controller 专用的 DTO 解析类
class EventUploadRequest {
    private String eventType;
    private String description;
    private Integer trackId;

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
}
