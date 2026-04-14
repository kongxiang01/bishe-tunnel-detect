package com.example.tunnel.controller;

import com.example.tunnel.repository.DetectEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/statistics")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StatisticsController {

    private final DetectEventRepository detectEventRepository;

    @GetMapping("/events")
    public ResponseEntity<Map<String, Object>> getEventStatistics() {
        // MVP: 简单统计所有事件记录按类型分类的数量
        List<Object[]> stats = detectEventRepository.countEventsByType();
        Map<String, Long> typeCountMap = new HashMap<>();
        for (Object[] stat : stats) {
            typeCountMap.put((String) stat[0], (Long) stat[1]);
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("eventCounts", typeCountMap);
        result.put("totalEvents", detectEventRepository.count());
        
        return ResponseEntity.ok(result);
    }
}
