package com.example.tunnel.config;

import com.example.tunnel.entity.User;
import com.example.tunnel.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    public static final String USER_ID_ATTR = "userId";
    public static final String USERNAME_ATTR = "username";
    public static final String USER_ROLE_ATTR = "userRole";

    @Autowired
    private UserRepository userRepository;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 放行 OPTIONS 请求，处理跨域预检
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        // 获取请求头中的 token
        String token = request.getHeader("Authorization");
        
        // 允许从 URL 参数获取 token，便于 SSE 或 WebSocket 支持
        if (token == null || token.isEmpty()) {
            String queryToken = request.getParameter("token");
            if (queryToken != null && !queryToken.isEmpty()) {
                token = "Bearer " + queryToken;
            }
        }

        // MVP简易校验，要求必须携带 mvp-token- 前缀的标牌
        if (token != null && token.startsWith("Bearer mvp-token-")) {
            String actualToken = token.substring(7); // Remove "Bearer " prefix
            User user = userRepository.findByToken(actualToken).orElse(null);
            if (user != null) {
                // Set user info as request attributes for later use
                request.setAttribute(USER_ID_ATTR, user.getId());
                request.setAttribute(USERNAME_ATTR, user.getUsername());
                request.setAttribute(USER_ROLE_ATTR, user.getRole());
                return true;
            }
        }

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"message\": \"缺失或非法的 Token 认证信息\"}");
        return false;
    }
}
