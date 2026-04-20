package com.example.tunnel.controller;

import com.example.tunnel.annotation.Loggable;
import com.example.tunnel.config.AuthInterceptor;
import com.example.tunnel.entity.User;
import com.example.tunnel.repository.UserRepository;
import com.example.tunnel.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    private boolean isAdmin(HttpServletRequest request) {
        String role = (String) request.getAttribute(AuthInterceptor.USER_ROLE_ATTR);
        return "ADMIN".equals(role);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success(userRepository.findAll()));
    }

    @Loggable
    @PostMapping
    public ResponseEntity<ApiResponse<User>> createUser(@RequestBody User user, HttpServletRequest request) {
        if (!isAdmin(request)) {
            return ResponseEntity.status(403).body(ApiResponse.error(403, "无权限：仅管理员可操作"));
        }
        user.setCreatedTime(LocalDateTime.now());
        return ResponseEntity.ok(ApiResponse.success(userRepository.save(user)));
    }

    @Loggable
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<User>> updateUser(@PathVariable Long id, @RequestBody User user, HttpServletRequest request) {
        if (!isAdmin(request)) {
            return ResponseEntity.status(403).body(ApiResponse.error(403, "无权限：仅管理员可操作"));
        }
        return userRepository.findById(id).map(existing -> {
            existing.setUsername(user.getUsername());
            if (user.getPassword() != null && !user.getPassword().isEmpty()) {
                existing.setPassword(user.getPassword());
            }
            existing.setRole(user.getRole());
            if (user.getStatus() != null) {
                existing.setStatus(user.getStatus());
            }
            return ResponseEntity.ok(ApiResponse.success(userRepository.save(existing)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @Loggable
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id, HttpServletRequest request) {
        if (!isAdmin(request)) {
            return ResponseEntity.status(403).body(ApiResponse.error(403, "无权限：仅管理员可操作"));
        }
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted successfully", null));
    }
}
