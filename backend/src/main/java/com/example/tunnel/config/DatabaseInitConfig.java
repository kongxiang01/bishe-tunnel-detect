package com.example.tunnel.config;

import com.example.tunnel.entity.User;
import com.example.tunnel.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;

@Configuration
public class DatabaseInitConfig {

    @Bean
    public CommandLineRunner initDatabase(UserRepository userRepository) {
        return args -> {
            // 如果数据表中一个用户都没有，作为MVP演示，自动插入默认管理员账号
            if (userRepository.count() == 0) {
                User admin = new User();
                admin.setUsername("admin");
                // 为简易MVP演示，暂时使用明文123456（后续如果时间充分可引入 PasswordEncoder）
                admin.setPassword("123456");
                admin.setRole("ADMIN");
                admin.setCreatedTime(LocalDateTime.now());
                
                userRepository.save(admin);
                System.out.println("====== [数据库初始化] 已自动注入默认管理员帐号：admin / 123456 ======");
            }
        };
    }
}