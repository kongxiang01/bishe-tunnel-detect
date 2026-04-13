package com.example.tunnel.dto;

public class FrameDetectResult {
    private String frame_id;
    private int vehicle_count;

    public String getFrame_id() {
        return frame_id;
    }

    public void setFrame_id(String frame_id) {
        this.frame_id = frame_id;
    }

    public int getVehicle_count() {
        return vehicle_count;
    }

    public void setVehicle_count(int vehicle_count) {
        this.vehicle_count = vehicle_count;
    }
}
