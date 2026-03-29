package com.example.tunnel.service;

import com.example.tunnel.dto.AlgorithmRequest;
import com.example.tunnel.dto.FrameDetectResult;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class AlgorithmClientService {
    
    private final RestTemplate restTemplate;
    // 算法服务的本地联调地址
    private static final String ALGORITHM_URL = "http://127.0.0.1:8000/infer";

    public AlgorithmClientService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public FrameDetectResult infer(AlgorithmRequest request) {
        System.out.println("[AlgorithmClient] 发送推理请求, 帧 ID: " + request.getFrame_id());
        // 通过 HTTP POST 调用 Python 算法接口
        return restTemplate.postForObject(ALGORITHM_URL, request, FrameDetectResult.class);
    }
}