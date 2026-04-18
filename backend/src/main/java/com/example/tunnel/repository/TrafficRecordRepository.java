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

    @Query("SELECT COUNT(t) FROM TrafficRecord t WHERE t.recordTime >= :start AND t.recordTime <= :end")
    long countTrafficByTimeRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(t) FROM TrafficRecord t WHERE t.deviceId = :deviceId AND t.recordTime >= :start AND t.recordTime <= :end")
    long countTrafficByDeviceAndTimeRange(@Param("deviceId") String deviceId,
                                          @Param("start") LocalDateTime start,
                                          @Param("end") LocalDateTime end);

    @Query("SELECT FUNCTION('DAY', t.recordTime), COUNT(t) FROM TrafficRecord t " +
           "WHERE t.recordTime >= :start AND t.recordTime <= :end " +
           "GROUP BY FUNCTION('DAY', t.recordTime) ORDER BY FUNCTION('DAY', t.recordTime)")
    List<Object[]> countDailyTrafficInRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT FUNCTION('MONTH', t.recordTime), COUNT(t) FROM TrafficRecord t " +
           "WHERE t.recordTime >= :start AND t.recordTime <= :end " +
           "GROUP BY FUNCTION('MONTH', t.recordTime) ORDER BY FUNCTION('MONTH', t.recordTime)")
    List<Object[]> countMonthlyTrafficInRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}