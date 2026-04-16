package com.example.tunnel.repository;

import com.example.tunnel.entity.DetectEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 检测事件数据访问层
 */
@Repository
public interface DetectEventRepository extends JpaRepository<DetectEvent, Long>, JpaSpecificationExecutor<DetectEvent> {

    /**
     * 按事件类型统计数量
     */
    @Query("SELECT e.eventType, COUNT(e) FROM DetectEvent e GROUP BY e.eventType")
    List<Object[]> countEventsByType();

    /**
     * 按设备ID查询事件（分页）
     */
    Page<DetectEvent> findByDeviceId(String deviceId, Pageable pageable);

    /**
     * 按事件类型查询事件（分页）
     */
    Page<DetectEvent> findByEventType(String eventType, Pageable pageable);

    /**
     * 按处理状态查询事件（分页）
     */
    Page<DetectEvent> findByStatus(String status, Pageable pageable);

    /**
     * 按事件类型和处理状态查询事件（分页）
     */
    Page<DetectEvent> findByEventTypeAndStatus(String eventType, String status, Pageable pageable);

    /**
     * 按设备ID和事件类型查询事件（分页）
     */
    Page<DetectEvent> findByDeviceIdAndEventType(String deviceId, String eventType, Pageable pageable);

    /**
     * 按设备ID和处理状态查询事件（分页）
     */
    Page<DetectEvent> findByDeviceIdAndStatus(String deviceId, String status, Pageable pageable);

    /**
     * 按设备ID、事件类型和处理状态查询事件（分页）
     */
    Page<DetectEvent> findByDeviceIdAndEventTypeAndStatus(String deviceId, String eventType, String status, Pageable pageable);

    /**
     * 按时间范围查询事件（分页）
     */
    Page<DetectEvent> findByEventTimeBetween(LocalDateTime startTime, LocalDateTime endTime, Pageable pageable);

    /**
     * 按事件类型和时间范围查询事件（分页）
     */
    Page<DetectEvent> findByEventTypeAndEventTimeBetween(String eventType, LocalDateTime startTime, LocalDateTime endTime, Pageable pageable);

    /**
     * 按处理状态和时间范围查询事件（分页）
     */
    Page<DetectEvent> findByStatusAndEventTimeBetween(String status, LocalDateTime startTime, LocalDateTime endTime, Pageable pageable);

    /**
     * 按事件类型、处理状态和时间范围查询事件（分页）
     */
    Page<DetectEvent> findByEventTypeAndStatusAndEventTimeBetween(
            String eventType, String status, LocalDateTime startTime, LocalDateTime endTime, Pageable pageable);

    /**
     * 统计待处理事件数量
     */
    long countByStatus(String status);

    /**
     * 统计某设备待处理事件数量
     */
    long countByDeviceIdAndStatus(String deviceId, String status);
}
