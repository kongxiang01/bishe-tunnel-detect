package com.example.tunnel.controller;

import com.example.tunnel.entity.SystemSetting;
import com.example.tunnel.repository.SystemSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
public class SystemSettingController {

    private final SystemSettingRepository systemSettingRepository;

    @GetMapping
    public ResponseEntity<List<SystemSetting>> getAllSettings() {
        return ResponseEntity.ok(systemSettingRepository.findAll());
    }

    @PutMapping
    public ResponseEntity<List<SystemSetting>> updateSettings(@RequestBody List<SystemSetting> settings) {
        settings.forEach(setting -> {
            systemSettingRepository.findBySettingKey(setting.getSettingKey()).ifPresent(existing -> {
                existing.setSettingValue(setting.getSettingValue());
                systemSettingRepository.save(existing);
            });
        });
        return ResponseEntity.ok(systemSettingRepository.findAll());
    }
}
