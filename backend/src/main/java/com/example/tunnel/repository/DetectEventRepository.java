package com.example.tunnel.repository;

import com.example.tunnel.entity.DetectEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface DetectEventRepository extends JpaRepository<DetectEvent, Long> {
    
    @Query("SELECT e.eventType, COUNT(e) FROM DetectEvent e GROUP BY e.eventType")
    List<Object[]> countEventsByType();
}
