import { create } from 'zustand'

/**
 * 监控大屏模块状态管理
 * - isDetecting: 是否正在检测
 * - layoutMode: 布局模式 (1, 2, 3)
 * - selectedDevices: 选中的设备ID列表
 */
const useMonitorStore = create((set, get) => ({
  // 检测状态
  isDetecting: true,
  setIsDetecting: (isDetecting) => set({ isDetecting }),
  toggleDetecting: () => set((state) => ({ isDetecting: !state.isDetecting })),

  // 布局模式: 1列, 2列, 3列
  layoutMode: '2',
  setLayoutMode: (layoutMode) => set({ layoutMode }),

  // 选中的设备ID列表
  selectedDevices: [],
  setSelectedDevices: (selectedDevices) => set({ selectedDevices }),
  toggleDevice: (deviceId) => set((state) => {
    const isSelected = state.selectedDevices.includes(deviceId)
    return {
      selectedDevices: isSelected
        ? state.selectedDevices.filter(id => id !== deviceId)
        : [...state.selectedDevices, deviceId]
    }
  }),
  selectAllDevices: (deviceIds) => set({ selectedDevices: deviceIds }),
  deselectAllDevices: () => set({ selectedDevices: [] }),

  // 根据设备列表初始化全选
  initSelectedDevices: (devices) => set((state) => {
    if (state.selectedDevices.length === 0 && devices?.length > 0) {
      return { selectedDevices: devices.map(d => d.id) }
    }
    return state
  }),
}))

export default useMonitorStore
