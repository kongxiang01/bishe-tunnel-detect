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
     * 按设备ID和事件类型查询事件（分页）
     */
    Page<DetectEvent> findByDeviceIdAndEventType(String deviceId, String eventType, Pageable pageable);

    /**
     * 按时间范围查询事件
     */
    List<DetectEvent> findByEventTimeBetween(LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 按事件类型和时间范围查询事件（分页）
     */
    Page<DetectEvent> findByEventTypeAndEventTimeBetween(String eventType, LocalDateTime startTime, LocalDateTime endTime, Pageable pageable);

    /**
     * 按事件类型和时间范围统计数量
     */
    @Query("SELECT e.eventType, COUNT(e) FROM DetectEvent e " +
           "WHERE e.eventTime >= :start AND e.eventTime <= :end GROUP BY e.eventType")
    List<Object[]> countEventsByTypeAndTimeRange(@Param("start") LocalDateTime start,
                                                  @Param("end") LocalDateTime end);

    /**
     * 按时间范围统计总数
     */
    long countByEventTimeBetween(LocalDateTime start, LocalDateTime end);
}
