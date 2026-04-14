package com.example.tunnel.repository;

import com.example.tunnel.entity.SystemLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SystemLogRepository extends JpaRepository<SystemLog, Long> {

    Page<SystemLog> findByLevel(String level, Pageable pageable);
}
