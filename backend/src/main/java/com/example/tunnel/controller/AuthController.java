package com.example.tunnel.controller;

import com.example.tunnel.config.AuthInterceptor;
import com.example.tunnel.dto.ApiResponse;
import com.example.tunnel.dto.LoginRequest;
import com.example.tunnel.dto.LoginResponse;
import com.example.tunnel.entity.User;
import com.example.tunnel.repository.UserRepository;
import com.example.tunnel.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@RequestBody LoginRequest request) {
        Optional<User> userOpt = userRepository.findByUsername(request.getUsername());

        if (userOpt.isPresent() && userOpt.get().getPassword().equals(request.getPassword())) {
            User user = userOpt.get();

            // 检查用户状态是否为 disabled
            if ("disabled".equals(user.getStatus())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error(403, "用户已被停用"));
            }

            // 使用 JWT 生成 Token
            String token = jwtService.generateToken(user.getId(), user.getUsername(), user.getRole());

            // 更新最后登录时间
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);

            return ResponseEntity.ok(ApiResponse.success("登录成功", new LoginResponse(token, user.getUsername(), user.getRole(), "登录成功")));
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
        // JWT 无状态，logout 由前端删除 token 即可
        return ResponseEntity.ok(ApiResponse.success("登出成功", null));
    }
}
