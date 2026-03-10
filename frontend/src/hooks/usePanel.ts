import { ref } from 'vue'

export function usePanel() {
  const leftPanelVisible = ref(true)
  const rightPanelVisible = ref(true)

  const toggleLeftPanel = () => {
    leftPanelVisible.value = !leftPanelVisible.value
  }

  const toggleRightPanel = () => {
    rightPanelVisible.value = !rightPanelVisible.value
  }

  return {
    leftPanelVisible,
    rightPanelVisible,
    toggleLeftPanel,
    toggleRightPanel
  }
}
