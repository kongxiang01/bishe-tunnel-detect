package com.example.tunnel.controller;

import com.example.tunnel.annotation.Loggable;
import com.example.tunnel.entity.SystemSetting;
import com.example.tunnel.repository.SystemSettingRepository;
import com.example.tunnel.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
public class SystemSettingController {

    private final SystemSettingRepository systemSettingRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SystemSetting>>> getAllSettings() {
        return ResponseEntity.ok(ApiResponse.success(systemSettingRepository.findAll()));
    }

    @Loggable
    @PutMapping
    public ResponseEntity<ApiResponse<List<SystemSetting>>> updateSettings(@RequestBody List<SystemSetting> settings) {
        settings.forEach(setting -> {
            systemSettingRepository.findBySettingKey(setting.getSettingKey()).ifPresent(existing -> {
                existing.setSettingValue(setting.getSettingValue());
                systemSettingRepository.save(existing);
            });
        });
        return ResponseEntity.ok(ApiResponse.success(systemSettingRepository.findAll()));
    }

    /**
     * 创建设置项
     * @param setting 包含 settingKey 和 settingValue 的设置对象
     * @return 创建成功返回201，键已存在返回409
     */
    @Loggable
    @PostMapping
    public ResponseEntity<ApiResponse<SystemSetting>> createSetting(@RequestBody SystemSetting setting) {
        // 检查键是否已存在
        if (systemSettingRepository.findBySettingKey(setting.getSettingKey()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(409, "Setting key already exists"));
        }
        SystemSetting saved = systemSettingRepository.save(setting);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(saved));
    }
}
