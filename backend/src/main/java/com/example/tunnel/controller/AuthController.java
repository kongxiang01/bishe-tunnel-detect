package com.example.tunnel.controller;

import com.example.tunnel.config.AuthInterceptor;
import com.example.tunnel.dto.ApiResponse;
import com.example.tunnel.dto.LoginRequest;
import com.example.tunnel.dto.LoginResponse;
import com.example.tunnel.entity.User;
import com.example.tunnel.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
// 解决跨域问题（如果Vite没有代理这里也备用）
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@RequestBody LoginRequest request) {
        // 从真实数据库中通过用户名查询用户
        Optional<User> userOpt = userRepository.findByUsername(request.getUsername());

        // 校验用户是否存在，以及密码是否正确（MVP版为明文校验）
        if (userOpt.isPresent() && userOpt.get().getPassword().equals(request.getPassword())) {
            User user = userOpt.get();
            // 简单签发一个 UUID 作为 Token（MVP级别实现）
            String token = "mvp-token-" + UUID.randomUUID().toString();
            // Store token in user record
            user.setToken(token);
            userRepository.save(user);
            return ResponseEntity.ok(ApiResponse.success("登录成功", new LoginResponse(token, user.getUsername(), "登录成功")));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(401, "用户名或密码错误"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCurrentUser(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute(AuthInterceptor.USER_ID_ATTR);
        String username = (String) request.getAttribute(AuthInterceptor.USERNAME_ATTR);
        String role = (String) request.getAttribute(AuthInterceptor.USER_ROLE_ATTR);

        if (userId == null || username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(401, "未认证"));
        }

        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "id", userId,
                "username", username,
                "role", role != null ? role : "USER"
        )));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest request) {
        // For MVP, this is a no-op - just return success
        // In production, would invalidate the token
        return ResponseEntity.ok(ApiResponse.success("登出成功", null));
    }
}
