package com.example.tunnel.controller;

import com.example.tunnel.dto.LoginRequest;
import com.example.tunnel.dto.LoginResponse;
import com.example.tunnel.entity.User;
import com.example.tunnel.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        // 从真实数据库中通过用户名查询用户
        Optional<User> userOpt = userRepository.findByUsername(request.getUsername());
        
        // 校验用户是否存在，以及密码是否正确（MVP版为明文校验）
        if (userOpt.isPresent() && userOpt.get().getPassword().equals(request.getPassword())) {
            // 简单签发一个 UUID 作为 Token（MVP级别实现）
            String token = "mvp-token-" + UUID.randomUUID().toString();
            return ResponseEntity.ok(new LoginResponse(token, userOpt.get().getUsername(), "登录成功"));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new LoginResponse(null, null, "用户名或密码错误"));
        }
    }
}
