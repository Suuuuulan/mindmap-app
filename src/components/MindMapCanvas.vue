<template>
  <div
    ref="canvasRef"
    class="mind-map-canvas"
    :style="canvasBackgroundStyle"
    @mousedown="onCanvasMouseDown"
    @mousemove="onCanvasMouseMove"
    @mouseup="onCanvasMouseUp"
    @mouseleave="onCanvasMouseUp"
    @wheel="onWheel"
  >
    <!-- 画布内容 -->
    <div
      class="canvas-content"
      :style="canvasTransform"
    >
      <!-- 连接线 -->
      <svg class="connections-layer" width="4000" height="4000" viewBox="-2000 -2000 4000 4000" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#999" />
          </marker>
        </defs>
        <path
          v-for="(path, index) in connectionPaths"
          :key="index"
          :d="path.path"
          class="connection-line"
          fill="none"
          stroke="#999"
          stroke-width="1.5"
          :marker-end="path.showArrow ? 'url(#arrowhead)' : ''"
        />
      </svg>

      <!-- 节点层 -->
      <div class="nodes-layer">
        <MindMapNodeComponent
          v-for="node in visibleNodes"
          :key="node.id"
          :node="node"
          :is-selected="selectedNode?.id === node.id"
          :is-editing="editingNode?.id === node.id"
          @select="onNodeSelect"
          @edit="onNodeEdit"
          @update-text="onNodeUpdateText"
          @drag-start="onNodeDragStart"
          @toggle-collapse="onNodeToggleCollapse"
          @stop-editing="onNodeStopEditing"
        />
      </div>
    </div>

    <!-- 画布控制 -->
    <div class="canvas-controls no-export">
      <button class="control-btn" @click="onZoomIn" title="放大">+</button>
      <span class="zoom-level">{{ Math.round(canvas.scale * 100) }}%</span>
      <button class="control-btn" @click="onZoomOut" title="缩小">−</button>
      <button class="control-btn" @click="onCenter" title="居中">⌖</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import type { MindMapNode, CanvasState, CanvasConfig } from '@/types';
import MindMapNodeComponent from './MindMapNode.vue';

interface Props {
  root: MindMapNode;
  selectedNode: MindMapNode | null;
  editingNode: MindMapNode | null;
  canvas: CanvasState;
  canvasConfig: CanvasConfig;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  selectNode: [node: MindMapNode | null];
  editNode: [node: MindMapNode];
  updateNodeText: [node: MindMapNode, text: string];
  moveNode: [node: MindMapNode, x: number, y: number];
  toggleCollapse: [node: MindMapNode];
  stopEditing: [];
  zoomCanvas: [delta: number, centerX?: number, centerY?: number];
  panCanvas: [dx: number, dy: number];
  centerCanvas: [];
}>();

const canvasRef = ref<HTMLElement | null>(null);

// 拖拽状态
const isDragging = ref(false);
const isPanning = ref(false);
const dragNode = ref<MindMapNode | null>(null);
const dragStart = reactive({ x: 0, y: 0, nodeX: 0, nodeY: 0 });

// 可见节点（过滤掉折叠的子节点）
const visibleNodes = computed(() => {
  const nodes: MindMapNode[] = [];
  
  const traverse = (node: MindMapNode) => {
    nodes.push(node);
    if (!node.collapsed) {
      node.children.forEach(traverse);
    }
  };
  
  traverse(props.root);
  return nodes;
});

// 连接线路径
const connectionPaths = computed(() => {
  const paths: { path: string; showArrow: boolean }[] = [];
  
  const traverse = (node: MindMapNode) => {
    if (node.collapsed) return;
    
    for (const child of node.children) {
      // 贝塞尔曲线连接
      const startX = node.x + node.width / 2;
      const startY = node.y;
      const endX = child.x - child.width / 2;
      const endY = child.y;
      const midX = (startX + endX) / 2;
      
      // 计算箭头终点（留出足够空间避免被节点遮挡）
      const arrowGap = 8; // 箭头与节点的间隙
      const endXWithGap = endX - arrowGap;
      const endYWithGap = endY;
      
      const path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endXWithGap} ${endYWithGap}`;
      paths.push({ path, showArrow: true });
      
      traverse(child);
    }
  };
  
  traverse(props.root);
  return paths;
});

// 画布变换样式
const canvasTransform = computed(() => ({
  transform: `translate(${props.canvas.translateX}px, ${props.canvas.translateY}px) scale(${props.canvas.scale})`,
  transformOrigin: '0 0',
}));

// 画布背景样式
const canvasBackgroundStyle = computed(() => ({
  backgroundColor: props.canvasConfig.backgroundColor,
  backgroundImage: 'radial-gradient(circle, #ddd 1px, transparent 1px)',
  backgroundSize: '20px 20px',
}));

// 节点事件处理
const onNodeSelect = (node: MindMapNode) => {
  emit('selectNode', node);
};

const onNodeEdit = (node: MindMapNode) => {
  emit('editNode', node);
};

const onNodeUpdateText = (node: MindMapNode, text: string) => {
  emit('updateNodeText', node, text);
};

const onNodeToggleCollapse = (node: MindMapNode) => {
  emit('toggleCollapse', node);
};

const onNodeStopEditing = () => {
  emit('stopEditing');
};

// 拖拽处理
const onNodeDragStart = (node: MindMapNode, clientX: number, clientY: number) => {
  isDragging.value = true;
  dragNode.value = node;
  dragStart.x = clientX;
  dragStart.y = clientY;
  dragStart.nodeX = node.x;
  dragStart.nodeY = node.y;
  emit('selectNode', node);
};

// 画布鼠标事件
const onCanvasMouseDown = (e: MouseEvent) => {
  // 如果点击的是画布空白处，开始平移
  if (e.target === canvasRef.value) {
    isPanning.value = true;
    dragStart.x = e.clientX;
    dragStart.y = e.clientY;
    emit('selectNode', null);
  }
};

const onCanvasMouseMove = (e: MouseEvent) => {
  if (isDragging.value && dragNode.value) {
    const dx = (e.clientX - dragStart.x) / props.canvas.scale;
    const dy = (e.clientY - dragStart.y) / props.canvas.scale;
    emit('moveNode', dragNode.value, dragStart.nodeX + dx, dragStart.nodeY + dy);
  } else if (isPanning.value) {
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    emit('panCanvas', dx, dy);
    dragStart.x = e.clientX;
    dragStart.y = e.clientY;
  }
};

const onCanvasMouseUp = () => {
  isDragging.value = false;
  isPanning.value = false;
  dragNode.value = null;
};

// 滚轮缩放
const onWheel = (e: WheelEvent) => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  const rect = canvasRef.value?.getBoundingClientRect();
  if (rect) {
    const centerX = e.clientX - rect.left;
    const centerY = e.clientY - rect.top;
    emit('zoomCanvas', delta, centerX, centerY);
  }
};

// 控制按钮
const onZoomIn = () => {
  emit('zoomCanvas', 0.2);
};

const onZoomOut = () => {
  emit('zoomCanvas', -0.2);
};

const onCenter = () => {
  emit('centerCanvas');
};
</script>

<style scoped lang="scss">
.mind-map-canvas {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

.canvas-content {
  position: absolute;
  width: 0;
  height: 0;
  will-change: transform;
}

.connections-layer {
  position: absolute;
  top: -2000px;
  left: -2000px;
  width: 4000px;
  height: 4000px;
  pointer-events: none;
  overflow: visible;
  z-index: 0;
}

.connection-line {
  transition: d 0.3s ease;
}

.nodes-layer {
  position: absolute;
  top: 0;
  left: 0;
}

.canvas-controls {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  padding: 8px 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 100;
}

.control-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #d9d9d9;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    border-color: #1890ff;
    color: #1890ff;
  }
}

.zoom-level {
  min-width: 50px;
  text-align: center;
  font-size: 14px;
  color: #666;
}
</style>
