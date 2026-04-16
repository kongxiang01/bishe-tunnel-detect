package com.example.tunnel.repository;

import com.example.tunnel.entity.TrafficRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface TrafficRecordRepository extends JpaRepository<TrafficRecord, Long> {

    @Query("SELECT COUNT(t) FROM TrafficRecord t WHERE t.recordTime >= :startOfDay AND t.recordTime <= :endOfDay")
    long countTodayTraffic(@Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);

    @Query("SELECT FUNCTION('HOUR', t.recordTime), COUNT(t) FROM TrafficRecord t WHERE t.recordTime >= :startOfDay AND t.recordTime <= :endOfDay GROUP BY FUNCTION('HOUR', t.recordTime) ORDER BY FUNCTION('HOUR', t.recordTime)")
    List<Object[]> countHourlyTrafficToday(@Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);

    @Query("SELECT COUNT(t) FROM TrafficRecord t WHERE t.deviceId = :deviceId AND t.recordTime >= :startOfDay AND t.recordTime <= :endOfDay")
    long countTodayTrafficByDevice(@Param("deviceId") String deviceId, @Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);
}