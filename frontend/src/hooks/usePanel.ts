import { ref } from 'vue'

// 左侧面板类型
export type LeftPanelType = 'none' | 'satellite-list' | 'filter'

// 右侧面板类型
export type RightPanelType = 'none' | 'orbit' | 'transit' | 'detail'

export function usePanel() {
  // 左侧当前激活的面板
  const activeLeftPanel = ref<LeftPanelType>('none')

  // 右侧当前激活的面板
  const activeRightPanel = ref<RightPanelType>('none')

  // 切换左侧面板
  const toggleLeftPanel = (panel: LeftPanelType) => {
    if (activeLeftPanel.value === panel) {
      // 如果已经激活，则关闭
      activeLeftPanel.value = 'none'
    } else {
      activeLeftPanel.value = panel
    }
  }

  // 切换右侧面板
  const toggleRightPanel = (panel: RightPanelType) => {
    if (activeRightPanel.value === panel) {
      // 如果已经激活，则关闭
      activeRightPanel.value = 'none'
    } else {
      activeRightPanel.value = panel
    }
  }

  // 关闭所有面板
  const closeAllPanels = () => {
    activeLeftPanel.value = 'none'
    activeRightPanel.value = 'none'
  }

  // 显示卫星详情（选择卫星后调用）
  const showSatelliteDetail = () => {
    activeRightPanel.value = 'detail'
  }

  // 兼容旧代码的 getter
  const leftPanelVisible = ref(true)
  const rightPanelVisible = ref(true)

  return {
    activeLeftPanel,
    activeRightPanel,
    toggleLeftPanel,
    toggleRightPanel,
    closeAllPanels,
    showSatelliteDetail,
    // 兼容旧代码
    leftPanelVisible,
    rightPanelVisible
  }
}