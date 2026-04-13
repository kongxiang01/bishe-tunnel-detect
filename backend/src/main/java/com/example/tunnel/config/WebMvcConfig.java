package com.example.tunnel.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Autowired
    private AuthInterceptor authInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 添加认证拦截器
        registry.addInterceptor(authInterceptor)
                .addPathPatterns("/api/**")         // 拦截全部 API
                .excludePathPatterns("/api/auth/**", "/api/health", "/api/events/upload"); // 排除登录、健康检查、算法端告警上传
    }
}
