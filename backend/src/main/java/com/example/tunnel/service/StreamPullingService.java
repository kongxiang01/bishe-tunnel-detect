package com.example.tunnel.service;

import org.springframework.stereotype.Service;

@Service
public class StreamPullingService {

    /**
     * 模拟从转发服务器(RTSP/WebRTC)拉取视频流并抽取出一帧画面
     * 终版：这里将使用 JavaCV 或 FFmpeg 进行截流落盘
     * 现版：直接返回传入的测试图片本地绝对路径
     */
    public String pullFrame(String streamUrlOrLocalPath) {
        System.out.println("[StreamPulling] 模拟从流中抽帧成功, 临时暂存路径: " + streamUrlOrLocalPath);
        return streamUrlOrLocalPath;
    }
}