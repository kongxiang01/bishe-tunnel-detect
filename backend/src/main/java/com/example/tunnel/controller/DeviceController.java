package com.example.tunnel.controller;

import com.example.tunnel.entity.Device;
import com.example.tunnel.repository.DeviceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/devices")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DeviceController {

    @Autowired
    private DeviceRepository deviceRepository;

    @GetMapping("/list")
    public ResponseEntity<?> listDevices() {
        List<Device> devices = deviceRepository.findAll();
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("message", "Success");
        response.put("data", devices);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/add")
    public ResponseEntity<?> addDevice(@RequestBody Device device) {
        if (deviceRepository.findByDeviceCode(device.getDeviceCode()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("code", 400, "message", "Device code already exists"));
        }
        device.setStatus("ONLINE");
        Device saved = deviceRepository.save(device);
        return ResponseEntity.ok(Map.of("code", 200, "message", "Device added", "data", saved));
    }
    
    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateDevice(@PathVariable Long id, @RequestBody Device updatedDevice) {
        Optional<Device> optionalDevice = deviceRepository.findById(id);
        if (!optionalDevice.isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("code", 404, "message", "Device not found"));
        }
        
        Device device = optionalDevice.get();
        if (updatedDevice.getName() != null) device.setName(updatedDevice.getName());
        if (updatedDevice.getLocation() != null) device.setLocation(updatedDevice.getLocation());
        if (updatedDevice.getStreamUrl() != null) device.setStreamUrl(updatedDevice.getStreamUrl());
        if (updatedDevice.getStatus() != null) device.setStatus(updatedDevice.getStatus());
        if (updatedDevice.getResolution() != null) device.setResolution(updatedDevice.getResolution());
        if (updatedDevice.getFps() != null) device.setFps(updatedDevice.getFps());
        
        deviceRepository.save(device);
        return ResponseEntity.ok(Map.of("code", 200, "message", "Device updated"));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteDevice(@PathVariable Long id) {
        if (!deviceRepository.existsById(id)) {
            return ResponseEntity.badRequest().body(Map.of("code", 404, "message", "Device not found"));
        }
        deviceRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("code", 200, "message", "Device deleted"));
    }
}