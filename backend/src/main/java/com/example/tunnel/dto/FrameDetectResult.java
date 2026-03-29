package com.example.tunnel.dto;

import java.util.List;

public class FrameDetectResult {
    private Integer frame_id;
    private String timestamp;
    private Integer vehicle_count;
    private List<Detection> detections;
    private List<Object> events;

    public static class Detection {
        private String class_name;
        private Double confidence;
        private List<Double> bbox;

        public String getClass_name() { return class_name; }
        public void setClass_name(String class_name) { this.class_name = class_name; }
        public Double getConfidence() { return confidence; }
        public void setConfidence(Double confidence) { this.confidence = confidence; }
        public List<Double> getBbox() { return bbox; }
        public void setBbox(List<Double> bbox) { this.bbox = bbox; }
    }

    public Integer getFrame_id() { return frame_id; }
    public void setFrame_id(Integer frame_id) { this.frame_id = frame_id; }
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    public Integer getVehicle_count() { return vehicle_count; }
    public void setVehicle_count(Integer vehicle_count) { this.vehicle_count = vehicle_count; }
    public List<Detection> getDetections() { return detections; }
    public void setDetections(List<Detection> detections) { this.detections = detections; }
    public List<Object> getEvents() { return events; }
    public void setEvents(List<Object> events) { this.events = events; }
}