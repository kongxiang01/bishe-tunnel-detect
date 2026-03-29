package com.example.tunnel.controller;

import com.example.tunnel.dto.AlgorithmRequest;
import com.example.tunnel.dto.FrameDetectResult;
import com.example.tunnel.service.AlgorithmClientService;
import com.example.tunnel.service.ResultDispatchService;
import com.example.tunnel.service.StreamPullingService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@RequestMapping("/api/stream")
@CrossOrigin(origins = "*") // 允许前端 Vite(localhost:5173) 跨域调用
public class StreamSimulationController {

    private final StreamPullingService streamPullingService;
    private final AlgorithmClientService algorithmClientService;
    private final ResultDispatchService resultDispatchService;
    
    // 模拟统一递增的帧序号
    private final AtomicInteger frameCounter = new AtomicInteger(1);

    public StreamSimulationController(StreamPullingService streamPullingService,
                                      AlgorithmClientService algorithmClientService,
                                      ResultDispatchService resultDispatchService) {
        this.streamPullingService = streamPullingService;
        this.algorithmClientService = algorithmClientService;
        this.resultDispatchService = resultDispatchService;
    }

    /**
     * 联调专用接口：触发生命周期
     * 传入体长这样: {"imagePath": "F:\\workspace\\graduation_project\\algorithm\\yolov5\\data\\images\\bus.jpg"}
     */
    @PostMapping("/mock-frame")
    public FrameDetectResult processMockFrame(@RequestBody Map<String, String> payload) {
        String mockImagePath = payload.get("imagePath");

        // 1. [模拟] 流媒体抽帧，拿到本地临时文件路径
        String framePath = streamPullingService.pullFrame(mockImagePath);

        // 2. 将抽帧文件发往 Python 端去跑 YOLOv5
        AlgorithmRequest request = new AlgorithmRequest();
        request.setFrame_id(frameCounter.getAndIncrement());
        request.setImage_path(framePath);
        
        FrameDetectResult result = algorithmClientService.infer(request);

        // 3. 拿到结果后进行业务落盘与推流前台广播
        resultDispatchService.dispatch(result);

        // 将最终结果直接 Response 返给调用方方便咱们观阅
        return result;
    }
}