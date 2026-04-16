package com.example.tunnel.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 检测事件实体类
 * 用于存储隧道内的违规事件、交通事故等检测结果
 */
@Entity
@Table(name = "detect_event", indexes = {
    @Index(name = "idx_event_type", columnList = "event_type"),
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_event_time", columnList = "event_time"),
    @Index(name = "idx_device_id", columnList = "device_id")
})
public class DetectEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_type", length = 50)
    private String eventType; // 例如 "ILLEGAL_PARKING", "ACCIDENT"

    @Column(length = 255)
    private String description; // 详细描述

    @Column(name = "track_id")
    private Integer trackId; // 绑定算法前端追踪目标的ID号

    @Column(name = "event_time")
    private LocalDateTime eventTime; // 事件发生时间

    /**
     * 检测设备ID
     */
    @Column(name = "device_id")
    private String deviceId;

    /**
     * 检测设备名称（冗余存储，方便查询显示）
     */
    @Column(name = "device_name", length = 100)
    private String deviceName;

    /**
     * 严重程度：严重/警告/普通
     */
    @Column(length = 20)
    private String severity;

    /**
     * 处理状态：PENDING（待处理）/ RESOLVED（已处理）
     */
    @Column(length = 20)
    private String status;

    /**
     * 车牌号（如果检测到车辆）
     */
    @Column(length = 20)
    private String plate;

    /**
     * 回溯录像切片地址
     */
    @Column(name = "video_clip_url", length = 500)
    private String videoClipUrl;

    /**
     * 异常发生瞬间快照地址
     */
    @Column(name = "image_url", length = 500)
    private String imageUrl;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public LocalDateTime getEventTime() {
        return eventTime;
    }

    public void setEventTime(LocalDateTime eventTime) {
        this.eventTime = eventTime;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
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

    public String getVideoClipUrl() {
        return videoClipUrl;
    }

    public void setVideoClipUrl(String videoClipUrl) {
        this.videoClipUrl = videoClipUrl;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}
