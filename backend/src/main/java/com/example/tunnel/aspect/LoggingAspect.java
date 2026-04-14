package com.example.tunnel.aspect;

import com.example.tunnel.annotation.Loggable;
import com.example.tunnel.config.AuthInterceptor;
import com.example.tunnel.entity.SystemLog;
import com.example.tunnel.repository.SystemLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;

/**
 * AOP Aspect that automatically logs POST/PUT/DELETE requests to controllers.
 * Logs are stored in the SystemLog entity with username, action, target resource,
 * timestamp, and details.
 */
@Aspect
@Component
public class LoggingAspect {

    private static final Logger logger = LoggerFactory.getLogger(LoggingAspect.class);

    @Autowired
    private SystemLogRepository systemLogRepository;

    @Around("@annotation(com.example.tunnel.annotation.Loggable)")
    public Object logControllerAction(ProceedingJoinPoint joinPoint) throws Throwable {
        HttpServletRequest request = getCurrentRequest();

        if (request == null) {
            return joinPoint.proceed();
        }

        String method = request.getMethod();
        // Only log POST, PUT, DELETE requests
        if (!("POST".equals(method) || "PUT".equals(method) || "DELETE".equals(method))) {
            return joinPoint.proceed();
        }

        // Extract method information
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method methodSignature = signature.getMethod();
        String action = methodSignature.getName();
        String targetResource = extractResourcePath(request);

        // Get username from request attribute (set by AuthInterceptor)
        String username = (String) request.getAttribute(AuthInterceptor.USERNAME_ATTR);
        if (username == null) {
            username = "anonymous";
        }

        // Get request body for details (if any)
        String details = extractDetails(joinPoint, request);

        long startTime = System.currentTimeMillis();
        Object result = null;
        String level = "INFO";

        try {
            result = joinPoint.proceed();
            return result;
        } catch (Exception e) {
            level = "ERROR";
            details = "Error: " + e.getMessage();
            throw e;
        } finally {
            long duration = System.currentTimeMillis() - startTime;

            // Create and save the log entry
            try {
                SystemLog systemLog = new SystemLog();
                systemLog.setUsername(username);
                systemLog.setAction(action);
                systemLog.setTargetResource(targetResource);
                systemLog.setDetails(details);
                systemLog.setLevel(level);
                systemLogRepository.save(systemLog);
            } catch (Exception logException) {
                logger.error("Failed to save system log", logException);
            }

            logger.info("{} {} by {} on {} - {}ms",
                    method, action, username, targetResource, duration);
        }
    }

    private HttpServletRequest getCurrentRequest() {
        ServletRequestAttributes attributes =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attributes != null ? attributes.getRequest() : null;
    }

    private String extractResourcePath(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String contextPath = request.getContextPath();
        if (contextPath != null && !contextPath.isEmpty()) {
            uri = uri.substring(contextPath.length());
        }
        return uri;
    }

    private String extractDetails(ProceedingJoinPoint joinPoint, HttpServletRequest request) {
        StringBuilder details = new StringBuilder();

        // Add query string if present
        String queryString = request.getQueryString();
        if (queryString != null && !queryString.isEmpty()) {
            details.append("Query: ").append(queryString);
        }

        // Add method arguments
        Object[] args = joinPoint.getArgs();
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String[] paramNames = signature.getParameterNames();

        if (args != null && args.length > 0) {
            for (int i = 0; i < args.length; i++) {
                Object arg = args[i];
                if (arg != null && !isExcludedType(arg)) {
                    String paramName = paramNames != null && i < paramNames.length
                            ? paramNames[i] : "arg" + i;
                    String value = truncate(String.valueOf(arg), 500);
                    if (details.length() > 0) {
                        details.append("; ");
                    }
                    details.append(paramName).append("=").append(value);
                }
            }
        }

        return details.toString();
    }

    private boolean isExcludedType(Object arg) {
        return arg instanceof HttpServletRequest
                || arg instanceof jakarta.servlet.http.HttpServletResponse;
    }

    private String truncate(String str, int maxLength) {
        if (str == null) return "";
        if (str.length() <= maxLength) return str;
        return str.substring(0, maxLength) + "...";
    }
}
