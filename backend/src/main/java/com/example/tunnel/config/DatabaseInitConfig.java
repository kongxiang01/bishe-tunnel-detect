package com.example.tunnel.config;

import com.example.tunnel.entity.User;
import com.example.tunnel.entity.Device;
import com.example.tunnel.entity.SystemSetting;
import com.example.tunnel.repository.UserRepository;
import com.example.tunnel.repository.DeviceRepository;
import com.example.tunnel.repository.SystemSettingRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;

@Configuration
public class DatabaseInitConfig {

    @Bean
    public CommandLineRunner initDatabase(
            UserRepository userRepository,
            DeviceRepository deviceRepository,
            SystemSettingRepository systemSettingRepository) {
        return args -> {
            // 自动插入默认管理员账号
            if (userRepository.count() == 0) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setPassword("123456");
                admin.setRole("ADMIN");
                admin.setCreatedTime(LocalDateTime.now());

                userRepository.save(admin);
                System.out.println("====== [数据库初始化] 已自动注入默认管理员帐号：admin / 123456 ======");
            }

            // 自动插入默认的两路摄像头设备
            if (deviceRepository.count() == 0) {
                Device cam1 = new Device();
                cam1.setDeviceCode("CAM_TUNNEL_A_01");
                cam1.setName("隧道A段监控探头");
                cam1.setLocation("京台高速西行隧道入口");
                cam1.setStreamUrl("http://127.0.0.1:5000/stream/camera_01");
                cam1.setStatus("ONLINE");
                cam1.setResolution("1920x1080");
                cam1.setFps("30");
                deviceRepository.save(cam1);

                Device cam2 = new Device();
                cam2.setDeviceCode("CAM_TUNNEL_A_02");
                cam2.setName("隧道B段监控探头");
                cam2.setLocation("京台高速西行隧道中段");
                cam2.setStreamUrl("http://127.0.0.1:5000/stream/camera_02");
                cam2.setStatus("ONLINE");
                cam2.setResolution("1280x720");
                cam2.setFps("25");
                deviceRepository.save(cam2);

                System.out.println("====== [数据库初始化] 已自动注入两路测试摄像头配置 ======");
            }

            // 自动插入默认系统设置
            if (systemSettingRepository.count() == 0) {
                createSettingIfNotExists(systemSettingRepository, "MAX_TRAFFIC_THRESHOLD", "500", "最大车流阈值");
                createSettingIfNotExists(systemSettingRepository, "SPEED_LIMIT", "120", "限速值 km/h");
                createSettingIfNotExists(systemSettingRepository, "OVERSPEED_THRESHOLD", "20", "超速百分比");
                createSettingIfNotExists(systemSettingRepository, "PARKING_TIMEOUT", "300", "违停超时秒数");
                createSettingIfNotExists(systemSettingRepository, "EVENT_RETENTION_DAYS", "30", "事件保留天数");

                System.out.println("====== [数据库初始化] 已自动注入默认系统设置 ======");
            }
        };
    }

    private void createSettingIfNotExists(
            SystemSettingRepository repository,
            String key,
            String value,
            String description) {
        if (repository.findBySettingKey(key).isEmpty()) {
            SystemSetting setting = new SystemSetting();
            setting.setSettingKey(key);
            setting.setSettingValue(value);
            setting.setDescription(description);
            repository.save(setting);
        }
    }
}
