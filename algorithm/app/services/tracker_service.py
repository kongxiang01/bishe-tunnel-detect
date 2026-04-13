import sys
import numpy as np
from app.core.config import settings

# 动态加载 ByteTrack 的依赖路径
sys.path.append(settings.BYTETRACK_DIR)
sys.path.append(settings.YOLO_DIR)
from yolox.tracker.byte_tracker import BYTETracker

class ByteTrackArgs:
    """内部 Mock 参数类以满足 ByteTrack 的初始化需求"""
    track_thresh = 0.5
    track_buffer = 30
    match_thresh = 0.8
    mot20 = False

class TrackerService:
    def __init__(self):
        self.tracker = BYTETracker(args=ByteTrackArgs(), frame_rate=30)
        self.tracker.low_thresh = 0.2
        print("[TrackerService] ByteTrack 跟踪引擎初始化完成")
        
    def track_and_match(self, raw_dets, frame_shape, class_names):
        """
        利用 byte_tracker 完成车辆的多目标追踪，并将非车辆目标(如火灾、事故、行人)直接透传合并。
        由于这类异常事件通常作为全局警示且无需精细轨迹分析，分配固定的伪 ID 满足后续防抖逻辑即可。
        """
        vehicle_dets = []
        other_dets = []
        
        for d in raw_dets:
            cls_name = class_names[int(d[5])]
            if cls_name == "vehicle":
                vehicle_dets.append(d)
            else:
                other_dets.append(d)

        # 仅对 vehicle 进行深度的外观和运动跟踪
        if len(vehicle_dets) > 0:
            output_results = np.array([[d[0], d[1], d[2], d[3], d[4]] for d in vehicle_dets], dtype=np.float64)
            img_h, img_w = frame_shape[:2]
            tracked_tracks = self.tracker.update(output_results, [img_h, img_w], [img_h, img_w])
        else:
            tracked_tracks = self.tracker.update(
                np.empty((0, 5)), 
                [frame_shape[0], frame_shape[1]], 
                [frame_shape[0], frame_shape[1]]
            )

        detections = []
        
        # 通过 IoU 反向匹配 track_id 和 vehicle 类目
        for track in tracked_tracks:
            track_tlbr = track.tlbr
            max_iou = 0
            best_cls_id = None
            
            for d in vehicle_dets:
                det_tlbr = [d[0], d[1], d[2], d[3]]
                # 计算边界框 IoU
                inter_x1 = max(track_tlbr[0], det_tlbr[0])
                inter_y1 = max(track_tlbr[1], det_tlbr[1])
                inter_x2 = min(track_tlbr[2], det_tlbr[2])
                inter_y2 = min(track_tlbr[3], det_tlbr[3])
                inter_area = max(0, inter_x2 - inter_x1) * max(0, inter_y2 - inter_y1)
                
                track_area = (track_tlbr[2] - track_tlbr[0]) * (track_tlbr[3] - track_tlbr[1])
                det_area = (det_tlbr[2] - det_tlbr[0]) * (det_tlbr[3] - det_tlbr[1])
                iou = inter_area / (track_area + det_area - inter_area + 1e-6)
                
                if iou > max_iou:
                    max_iou = iou
                    best_cls_id = int(d[5])
            
            if best_cls_id is not None:
                detections.append({
                    "class_name": class_names[best_cls_id],
                    "confidence": round(track.score, 3),
                    "bbox": [round(x, 1) for x in track_tlbr],
                    "track_id": track.track_id
                })

        # 对于 fire, accident, person 等静态异常目标，分配基于空间网格计算的“稳定”伪 ID。
        # 这里用 50x50 像素的一个网格区块作为区分，只要异常不发生大跨越，即便 YOLO 框稍微抖动，它的追踪 ID 也是唯一且固定的。
        # 稳定的 ID 是维持后端 event_service 执行两帧 (len>1) 连续性防抖的硬性前提。
        for i, d in enumerate(other_dets):
            cls_id = int(d[5])
            # 取框中心点
            cx = (d[0] + d[2]) / 2.0
            cy = (d[1] + d[3]) / 2.0
            grid_x = int(cx / 50)
            grid_y = int(cy / 50)
            
            pseudo_track_id = 10000 + (cls_id * 1000) + (grid_x * 100) + grid_y
            
            detections.append({
                "class_name": class_names[cls_id],
                "confidence": round(float(d[4]), 3),
                "bbox": [round(d[0], 1), round(d[1], 1), round(d[2], 1), round(d[3], 1)],
                "track_id": pseudo_track_id
            })
            
        return detections