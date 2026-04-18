package com.example.tunnel.config;

import com.example.tunnel.service.JwtService;
import io.jsonwebtoken.Claims;
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
    private JwtService jwtService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 放行 OPTIONS 请求，处理跨域预检
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        // 获取请求头中的 Token
        String token = request.getHeader("Authorization");

        // 允许从 URL 参数获取 token，便于 SSE 或 WebSocket 支持
        if (token == null || token.isEmpty()) {
            String queryToken = request.getParameter("token");
            if (queryToken != null && !queryToken.isEmpty()) {
                token = "Bearer " + queryToken;
            }
        }

        // 验证 JWT Token
        if (token != null && token.startsWith("Bearer ")) {
            String actualToken = token.substring(7);
            Claims claims = jwtService.validateToken(actualToken);

            if (claims != null) {
                Long userId = jwtService.getUserIdFromToken(actualToken);
                String username = jwtService.getUsernameFromToken(actualToken);
                String role = jwtService.getRoleFromToken(actualToken);

                if (userId != null && username != null) {
                    request.setAttribute(USER_ID_ATTR, userId);
                    request.setAttribute(USERNAME_ATTR, username);
                    request.setAttribute(USER_ROLE_ATTR, role);
                    return true;
                }
            }
        }

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"message\": \"缺失或非法的 Token 认证信息\"}");
        return false;
    }
}
