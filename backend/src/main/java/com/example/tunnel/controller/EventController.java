package com.example.tunnel.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/events")
public class EventController {

    @GetMapping
    public List<Map<String, Object>> listEvents() {
        return List.of(
            Map.of(
                "id", 1,
                "type", "overspeed",
                "level", "medium",
                "timestamp", LocalDateTime.now().minusMinutes(2).toString()
            ),
            Map.of(
                "id", 2,
                "type", "illegal_stop",
                "level", "high",
                "timestamp", LocalDateTime.now().minusMinutes(1).toString()
            )
        );
    }
}
