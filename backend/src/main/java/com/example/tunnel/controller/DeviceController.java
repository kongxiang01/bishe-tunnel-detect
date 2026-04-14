package com.example.tunnel.controller;

import com.example.tunnel.annotation.Loggable;
import com.example.tunnel.dto.ApiResponse;
import com.example.tunnel.entity.Device;
import com.example.tunnel.repository.DeviceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/devices")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DeviceController {

    @Autowired
    private DeviceRepository deviceRepository;

    @GetMapping("/list")
    public ResponseEntity<ApiResponse<List<Device>>> listDevices() {
        List<Device> devices = deviceRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success(devices));
    }

    @Loggable
    @PostMapping("/add")
    public ResponseEntity<ApiResponse<Device>> addDevice(@RequestBody Device device) {
        if (deviceRepository.findByDeviceCode(device.getDeviceCode()).isPresent()) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Device code already exists"));
        }
        device.setStatus("ONLINE");
        Device saved = deviceRepository.save(device);
        return ResponseEntity.ok(ApiResponse.success("Device added", saved));
    }
    
    @Loggable
    @PutMapping("/update/{id}")
    public ResponseEntity<ApiResponse<Void>> updateDevice(@PathVariable Long id, @RequestBody Device updatedDevice) {
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
    public ResponseEntity<ApiResponse<Void>> deleteDevice(@PathVariable Long id) {
        if (!deviceRepository.existsById(id)) {
            return ResponseEntity.badRequest().body(ApiResponse.error(404, "Device not found"));
        }
        deviceRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Device deleted", null));
    }
}