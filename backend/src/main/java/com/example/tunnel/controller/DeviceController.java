package com.example.tunnel.controller;

import com.example.tunnel.annotation.Loggable;
import com.example.tunnel.config.AuthInterceptor;
import com.example.tunnel.dto.ApiResponse;
import com.example.tunnel.dto.PageResponse;
import com.example.tunnel.entity.Device;
import com.example.tunnel.repository.DeviceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.persistence.criteria.Predicate;
import jakarta.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/devices")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DeviceController {

    @Autowired
    private DeviceRepository deviceRepository;

    private boolean isAdmin(HttpServletRequest request) {
        String role = (String) request.getAttribute(AuthInterceptor.USER_ROLE_ATTR);
        return "ADMIN".equals(role);
    }

    /**
     * 获取设备列表（支持分页和动态查询）
     * @param page 页码（从0开始）
     * @param size 每页大小
     * @param name 设备名称（模糊匹配）
     * @param location 设备位置（模糊匹配）
     * @param status 设备状态（精确匹配）
     */
    @GetMapping("/list")
    public ResponseEntity<ApiResponse<PageResponse<Device>>> listDevices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String status) {

        // 构建动态查询条件
        Specification<Device> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (name != null && !name.trim().isEmpty()) {
                predicates.add(criteriaBuilder.like(root.get("name"), "%" + name + "%"));
            }

            if (location != null && !location.trim().isEmpty()) {
                predicates.add(criteriaBuilder.like(root.get("location"), "%" + location + "%"));
            }

            if (status != null && !status.trim().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        // 创建分页请求，按id降序排列
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "id"));

        // 执行分页查询
        Page<Device> pageResult = deviceRepository.findAll(spec, pageable);

        PageResponse<Device> pageResponse = new PageResponse<>(
                pageResult.getContent(),
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages()
        );

        return ResponseEntity.ok(ApiResponse.success(pageResponse));
    }

    @Loggable
    @PostMapping("/add")
    public ResponseEntity<ApiResponse<Device>> addDevice(@RequestBody Device device, HttpServletRequest request) {
        if (!isAdmin(request)) {
            return ResponseEntity.status(403).body(ApiResponse.error(403, "无权限：仅管理员可操作"));
        }
        // 强制生成唯一的 deviceId，不依赖前端传递
        device.setDeviceId(java.util.UUID.randomUUID().toString().replace("-", ""));
        device.setStatus("ONLINE");
        Device saved = deviceRepository.save(device);
        return ResponseEntity.ok(ApiResponse.success("Device added", saved));
    }

    @Loggable
    @PutMapping("/update/{id}")
    public ResponseEntity<ApiResponse<Void>> updateDevice(@PathVariable Long id, @RequestBody Device updatedDevice, HttpServletRequest request) {
        if (!isAdmin(request)) {
            return ResponseEntity.status(403).body(ApiResponse.error(403, "无权限：仅管理员可操作"));
        }
        Optional<Device> optionalDevice = deviceRepository.findById(id);
        if (!optionalDevice.isPresent()) {
            return ResponseEntity.badRequest().body(ApiResponse.error(404, "Device not found"));
        }

        Device device = optionalDevice.get();
        if (updatedDevice.getName() != null) device.setName(updatedDevice.getName());
        if (updatedDevice.getLocation() != null) device.setLocation(updatedDevice.getLocation());
        if (updatedDevice.getStreamUrl() != null) device.setStreamUrl(updatedDevice.getStreamUrl());
        if (updatedDevice.getStatus() != null) device.setStatus(updatedDevice.getStatus());
        if (updatedDevice.getResolution() != null) device.setResolution(updatedDevice.getResolution());
        if (updatedDevice.getFps() != null) device.setFps(updatedDevice.getFps());

        deviceRepository.save(device);
        return ResponseEntity.ok(ApiResponse.success("Device updated", null));
    }

    @Loggable
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDevice(@PathVariable Long id, HttpServletRequest request) {
        if (!isAdmin(request)) {
            return ResponseEntity.status(403).body(ApiResponse.error(403, "无权限：仅管理员可操作"));
        }
        if (!deviceRepository.existsById(id)) {
            return ResponseEntity.badRequest().body(ApiResponse.error(404, "Device not found"));
        }
        deviceRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Device deleted", null));
    }
}