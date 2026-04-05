package com.example.tunnel.controller;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

@RestController
@RequestMapping("/api/health")
@CrossOrigin(origins = "*") // 添加这行允许前端跨域
public class HealthController {

    @GetMapping
    public Map<String, String> health() {
        return Map.of("status", "online");
    }
}
