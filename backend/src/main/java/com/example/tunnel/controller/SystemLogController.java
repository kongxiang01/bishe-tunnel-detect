package com.example.tunnel.controller;

import com.example.tunnel.entity.SystemLog;
import com.example.tunnel.repository.SystemLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/logs")
@RequiredArgsConstructor
public class SystemLogController {

    private final SystemLogRepository systemLogRepository;

    @GetMapping
    public ResponseEntity<Page<SystemLog>> getLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String level) {

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createTime"));

        if (level != null && !level.isEmpty()) {
            return ResponseEntity.ok(systemLogRepository.findByLevel(level.toUpperCase(), pageRequest));
        }
        return ResponseEntity.ok(systemLogRepository.findAll(pageRequest));
    }
}
