package com.example.tunnel.repository;

import com.example.tunnel.entity.TrafficRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface TrafficRecordRepository extends JpaRepository<TrafficRecord, Long> {

    @Query("SELECT COUNT(t) FROM TrafficRecord t WHERE t.recordTime >= :startOfDay AND t.recordTime <= :endOfDay")
    long countTodayTraffic(@Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);
}