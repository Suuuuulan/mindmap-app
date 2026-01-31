<template>
  <div class="mind-map-app">
    <Toolbar
      :selected-node="selectedNode"
      @new="handleNew"
      @import="handleImport"
      @export="handleExport"
      @add-child="handleAddChild"
      @add-sibling="handleAddSibling"
      @delete="handleDelete"
      @auto-layout="handleAutoLayout"
      @toggle-style-panel="showStylePanel = !showStylePanel"
    />

    <div ref="mainContentRef" class="main-content">
      <MindMapCanvas
        :root="root"
        :selected-node="selectedNode"
        :editing-node="editingNode"
        :canvas="canvas"
        :canvas-config="canvasConfig"
        @select-node="selectNode"
        @edit-node="startEditing"
        @update-node-text="updateNodeText"
        @move-node="moveNode"
        @toggle-collapse="toggleCollapse"
        @stop-editing="stopEditing"
        @zoom-canvas="zoomCanvas"
        @pan-canvas="panCanvas"
        @center-canvas="centerCanvasWithContainer"
      />

      <StylePanel
        :selected-node="selectedNode"
        :canvas-config="canvasConfig"
        :show-panel="true"
        :class="{ 'panel-visible': showStylePanel }"
        @update-style="handleUpdateStyle"
        @update-canvas-config="handleUpdateCanvasConfig"
      />
    </div>

    <!-- 快捷键提示 -->
    <div class="shortcuts-hint">
      <div class="hint-item">
        <kbd>Tab</kbd>
        <span>添加子节点</span>
      </div>
      <div class="hint-item">
        <kbd>Enter</kbd>
        <span>添加同级节点</span>
      </div>
      <div class="hint-item">
        <kbd>Space</kbd>
        <span>编辑节点</span>
      </div>
      <div class="hint-item">
        <kbd>↑↓←→</kbd>
        <span>切换节点</span>
      </div>
      <div class="hint-item">
        <kbd>Delete</kbd>
        <span>删除节点</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue';
import Toolbar from './components/Toolbar.vue';
import MindMapCanvas from './components/MindMapCanvas.vue';
import StylePanel from './components/StylePanel.vue';
import { useMindMap } from './composables/useMindMap';
import { useKeyboard } from './composables/useKeyboard';
import { useExport } from './composables/useExport';
import type { MindMapNode, NodeStyle, CanvasConfig } from './types';

const mainContentRef = ref<HTMLElement | null>(null);
const showStylePanel = ref(false);

const {
  root,
  selectedNode,
  editingNode,
  canvas,
  canvasConfig,
  selectNode,
  startEditing,
  stopEditing,
  addChild,
  addSibling,
  deleteNode,
  updateNodeText,
  updateNodeStyle,
  moveNode,
  toggleCollapse,
  zoomCanvas,
  panCanvas,
  centerCanvas,
  autoLayout,
  findNearestNode,
  importData,
  exportData,
  newFile,
  updateCanvasConfig,
} = useMindMap();

const { exportToJSON, exportToPNG, importFromJSON } = useExport();

// 键盘事件处理
useKeyboard({
  selectedNode,
  editingNode,
  onAddChild: (node: MindMapNode) => {
    const child = addChild(node);
    if (child) {
      nextTick(() => {
        selectNode(child);
        startEditing(child);
      });
    }
  },
  onAddSibling: (node: MindMapNode) => {
    const sibling = addSibling(node);
    if (sibling) {
      nextTick(() => {
        selectNode(sibling);
        startEditing(sibling);
      });
    }
  },
  onDeleteNode: (node: MindMapNode) => {
    if (node.level > 0) {
      deleteNode(node);
    }
  },
  onEditNode: (node: MindMapNode) => {
    startEditing(node);
  },
  onNavigate: (direction) => {
    if (selectedNode.value) {
      const nearest = findNearestNode(selectedNode.value, direction);
      if (nearest) {
        selectNode(nearest);
      }
    } else if (root.value) {
      selectNode(root.value);
    }
  },
  onStopEditing: stopEditing,
});

// 获取画布容器尺寸并居中
const centerCanvasWithContainer = () => {
  nextTick(() => {
    const container = mainContentRef.value;
    if (container) {
      const rect = container.getBoundingClientRect();
      centerCanvas(rect.width, rect.height);
    } else {
      centerCanvas();
    }
  });
};

// 工具栏事件处理
const handleNew = () => {
  if (confirm('确定要新建文件吗？未保存的更改将丢失。')) {
    newFile();
    centerCanvasWithContainer();
  }
};

const handleImport = async (file: File) => {
  try {
    const data = await importFromJSON(file);
    if (data) {
      importData(data);
      autoLayout();
      centerCanvasWithContainer();
    }
  } catch (error) {
    alert('导入失败：无效的文件格式');
  }
};

const handleExport = async (type: 'json' | 'png') => {
  switch (type) {
    case 'json':
      exportToJSON(exportData());
      break;
    case 'png':
      await exportToPNG(root.value);
      break;
  }
};

const handleAddChild = () => {
  if (selectedNode.value) {
    const child = addChild(selectedNode.value);
    if (child) {
      nextTick(() => {
        selectNode(child);
        startEditing(child);
      });
    }
  }
};

const handleAddSibling = () => {
  if (selectedNode.value && selectedNode.value.level > 0) {
    const sibling = addSibling(selectedNode.value);
    if (sibling) {
      nextTick(() => {
        selectNode(sibling);
        startEditing(sibling);
      });
    }
  }
};

const handleDelete = () => {
  if (selectedNode.value && selectedNode.value.level > 0) {
    if (confirm('确定要删除该节点吗？')) {
      deleteNode(selectedNode.value);
    }
  }
};

const handleAutoLayout = () => {
  autoLayout();
  centerCanvasWithContainer();
};

const handleUpdateStyle = (style: Partial<NodeStyle>) => {
  if (selectedNode.value) {
    updateNodeStyle(selectedNode.value, style);
  }
};

const handleUpdateCanvasConfig = (config: Partial<CanvasConfig>) => {
  updateCanvasConfig(config);
};

// 页面加载完成后居中显示
onMounted(() => {
  centerCanvasWithContainer();
});
</script>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  overflow: hidden;
}

.mind-map-app {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

.shortcuts-hint {
  position: fixed;
  bottom: 20px;
  left: 20px;
  display: flex;
  gap: 16px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.75);
  border-radius: 8px;
  backdrop-filter: blur(4px);
  z-index: 100;

  @media (max-width: 768px) {
    display: none;
  }
}

.hint-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: white;
  font-size: 12px;

  kbd {
    padding: 2px 6px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    font-family: monospace;
    font-size: 11px;
  }
}

.panel-visible {
  @media (max-width: 768px) {
    transform: translateX(0) !important;
  }
}
</style>
