package com.example.tunnel.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 车流量统计实体类
 * 用于记录车辆撞线事件，以便统计各时段和各设备的车流量
 */
@Entity
@Table(name = "traffic_records")
@Data
public class TrafficRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "device_id")
    private String deviceId;

    @Column(name = "track_id")
    private Integer trackId;

    @Column(name = "record_time")
    private LocalDateTime recordTime;

}