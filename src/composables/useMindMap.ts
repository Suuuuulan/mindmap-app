import { ref, computed, reactive } from 'vue';
import type { MindMapNode, NodeStyle, CanvasState, CanvasConfig, Direction } from '@/types';
import { defaultNodeStyle, rootNodeStyle } from '@/types';

// 生成唯一ID
const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// 创建新节点
const createNode = (
  text: string = '新建节点',
  parent: MindMapNode | null = null,
  x: number = 0,
  y: number = 0,
  level: number = 0
): MindMapNode => ({
  id: generateId(),
  text,
  x,
  y,
  width: 0,
  height: 0,
  style: level === 0 ? { ...rootNodeStyle } : { ...defaultNodeStyle },
  children: [],
  parent,
  collapsed: false,
  level,
});

export function useMindMap() {
  // 根节点
  const root = ref<MindMapNode>(createNode('思维导图', null, 0, 0, 0));
  
  // 选中的节点
  const selectedNode = ref<MindMapNode | null>(null);
  
  // 正在编辑的节点
  const editingNode = ref<MindMapNode | null>(null);
  
  // 画布状态
  const canvas = reactive<CanvasState>({
    scale: 1,
    translateX: 0,
    translateY: 0,
  });

  // 画布配置
  const canvasConfig = reactive<CanvasConfig>({
    backgroundColor: '#f5f5f5',
    levelWidth: 200, // 默认水平间距200
    nodeHeight: 60,  // 默认垂直间距60
  });
  
  // 拖拽状态
  const isDragging = ref(false);
  const dragNode = ref<MindMapNode | null>(null);
  
  // 所有节点列表（用于遍历）
  const allNodes = computed(() => {
    const nodes: MindMapNode[] = [];
    const traverse = (node: MindMapNode) => {
      nodes.push(node);
      node.children.forEach(traverse);
    };
    traverse(root.value);
    return nodes;
  });

  // 选中节点
  const selectNode = (node: MindMapNode | null) => {
    selectedNode.value = node;
    if (node) {
      editingNode.value = null;
    }
  };

  // 开始编辑节点
  const startEditing = (node: MindMapNode) => {
    selectedNode.value = node;
    editingNode.value = node;
  };

  // 停止编辑
  const stopEditing = () => {
    editingNode.value = null;
  };

  // 添加子节点
  const addChild = (parent: MindMapNode, text: string = '新建节点') => {
    const child = createNode(
      text,
      parent,
      parent.x + 200,
      parent.y + parent.children.length * 60,
      parent.level + 1
    );
    parent.children.push(child);
    return child;
  };

  // 添加兄弟节点
  const addSibling = (node: MindMapNode, text: string = '新建节点') => {
    if (!node.parent) return null; // 根节点不能添加兄弟
    const index = node.parent.children.indexOf(node);
    const sibling = createNode(
      text,
      node.parent,
      node.x,
      node.y + 60,
      node.level
    );
    node.parent.children.splice(index + 1, 0, sibling);
    return sibling;
  };

  // 删除节点
  const deleteNode = (node: MindMapNode) => {
    if (!node.parent) return false; // 不能删除根节点
    const index = node.parent.children.indexOf(node);
    if (index > -1) {
      node.parent.children.splice(index, 1);
      if (selectedNode.value === node) {
        selectedNode.value = node.parent;
      }
      return true;
    }
    return false;
  };

  // 更新节点文本
  const updateNodeText = (node: MindMapNode, text: string) => {
    node.text = text;
  };

  // 更新节点样式
  const updateNodeStyle = (node: MindMapNode, style: Partial<NodeStyle>) => {
    Object.assign(node.style, style);
  };

  // 计算节点尺寸（基于文本内容）
  const calculateNodeSize = (node: MindMapNode) => {
    const padding = node.style.padding;
    const fontSize = node.style.fontSize;
    const charWidth = fontSize * 0.6;
    const textWidth = node.text.length * charWidth;
    node.width = Math.max(100, textWidth + padding * 2);
    node.height = fontSize + padding * 2;
  };

  // 自动布局（水平树形布局）
  const autoLayout = () => {
    const layoutNode = (node: MindMapNode, startY: number): number => {
      calculateNodeSize(node);
      
      if (node.children.length === 0) {
        node.y = startY;
        return startY + canvasConfig.nodeHeight;
      }
      
      let currentY = startY;
      const childYs: number[] = [];

      for (const child of node.children) {
        if (!child.collapsed) {
          const endY = layoutNode(child, currentY);
          childYs.push(child.y as number);
          currentY = endY;
        }
      }

      if (childYs.length > 0) {
        const first = childYs[0];
        const last = childYs[childYs.length - 1];
        node.y = (first! + last!) / 2;
      } else {
        node.y = startY;
      }
      
      node.x = node.level * canvasConfig.levelWidth;
      
      return currentY;
    };
    
    layoutNode(root.value, 0);
    
    // 居中整个树
    const nodes = allNodes.value;
    const minY = Math.min(...nodes.map(n => n.y));
    const maxY = Math.max(...nodes.map(n => n.y));
    const offsetY = -(minY + maxY) / 2;
    
    nodes.forEach(node => {
      node.y += offsetY;
    });
  };

  // 移动节点（拖拽）
  const moveNode = (node: MindMapNode, x: number, y: number) => {
    const dx = x - node.x;
    const dy = y - node.y;
    
    const moveRecursive = (n: MindMapNode) => {
      n.x += dx;
      n.y += dy;
      n.children.forEach(moveRecursive);
    };
    
    moveRecursive(node);
  };

  // 切换折叠状态
  const toggleCollapse = (node: MindMapNode) => {
    if (node.children.length > 0) {
      node.collapsed = !node.collapsed;
    }
  };

  // 缩放画布
  const zoomCanvas = (delta: number, centerX?: number, centerY?: number) => {
    const oldScale = canvas.scale;
    const newScale = Math.max(0.1, Math.min(3, canvas.scale + delta));
    
    if (centerX !== undefined && centerY !== undefined) {
      canvas.translateX = centerX - (centerX - canvas.translateX) * (newScale / oldScale);
      canvas.translateY = centerY - (centerY - canvas.translateY) * (newScale / oldScale);
    }
    
    canvas.scale = newScale;
  };

  // 平移画布
  const panCanvas = (dx: number, dy: number) => {
    canvas.translateX += dx;
    canvas.translateY += dy;
  };

  // 定位到中心（根节点垂直居中，水平靠左）
  const centerCanvas = (containerWidth?: number, containerHeight?: number) => {
    canvas.scale = 1;
    
    if (containerWidth && containerHeight) {
      // 计算根节点尺寸
      calculateNodeSize(root.value);
      const rootHeight = root.value.height;
      
      // 水平靠左：留一定边距
      const leftMargin = 50;
      canvas.translateX = leftMargin;
      
      // 垂直居中
      canvas.translateY = containerHeight / 2 - rootHeight / 2;
    } else {
      canvas.translateX = 0;
      canvas.translateY = 0;
    }
  };

  // 查找相邻节点
  const findNearestNode = (fromNode: MindMapNode, direction: Direction): MindMapNode | null => {
    const all = allNodes.value;
    const threshold = 50;
    
    let nearest: MindMapNode | null = null;
    let minDistance = Infinity;
    
    for (const node of all) {
      if (node === fromNode) continue;
      
      let isInDirection = false;
      let distance = Infinity;
      
      switch (direction) {
        case 'up':
          isInDirection = node.y < fromNode.y && Math.abs(node.x - fromNode.x) < threshold;
          distance = fromNode.y - node.y;
          break;
        case 'down':
          isInDirection = node.y > fromNode.y && Math.abs(node.x - fromNode.x) < threshold;
          distance = node.y - fromNode.y;
          break;
        case 'left':
          isInDirection = node.x < fromNode.x && Math.abs(node.y - fromNode.y) < threshold;
          distance = fromNode.x - node.x;
          break;
        case 'right':
          isInDirection = node.x > fromNode.x && Math.abs(node.y - fromNode.y) < threshold;
          distance = node.x - fromNode.x;
          break;
      }
      
      if (isInDirection && distance < minDistance) {
        minDistance = distance;
        nearest = node;
      }
    }
    
    return nearest;
  };

  // 导入数据（重建 parent 引用）
  const importData = (data: any) => {
    if (data.nodes) {
      const rebuildParent = (node: MindMapNode, parent: MindMapNode | null) => {
        node.parent = parent;
        node.children.forEach(child => rebuildParent(child, node));
      };
      rebuildParent(data.nodes, null);
      root.value = data.nodes;
    }
    if (data.canvas) {
      Object.assign(canvas, data.canvas);
    }
    if (data.canvasConfig) {
      Object.assign(canvasConfig, data.canvasConfig);
    }
    selectedNode.value = null;
    editingNode.value = null;
  };

  // 导出数据（移除 parent 引用以避免循环引用）
  const exportData = () => {
    const cleanNode = (node: MindMapNode): any => ({
      id: node.id,
      text: node.text,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      style: { ...node.style },
      children: node.children.map(cleanNode),
      collapsed: node.collapsed,
      level: node.level,
    });

    return {
      version: '1.0',
      nodes: cleanNode(root.value),
      canvas: { ...canvas },
      canvasConfig: { ...canvasConfig },
    };
  };

  // 更新画布配置
  const updateCanvasConfig = (config: Partial<CanvasConfig>) => {
    Object.assign(canvasConfig, config);
    autoLayout();
  };

  // 新建文件
  const newFile = () => {
    root.value = createNode('思维导图', null, 0, 0, 0);
    selectedNode.value = null;
    editingNode.value = null;
    canvas.scale = 1;
    canvas.translateX = 0;
    canvas.translateY = 0;
    autoLayout();
  };

  // 初始化
  autoLayout();

  return {
    root,
    selectedNode,
    editingNode,
    canvas,
    canvasConfig,
    isDragging,
    dragNode,
    allNodes,
    selectNode,
    startEditing,
    stopEditing,
    addChild,
    addSibling,
    deleteNode,
    updateNodeText,
    updateNodeStyle,
    autoLayout,
    moveNode,
    toggleCollapse,
    zoomCanvas,
    panCanvas,
    centerCanvas,
    findNearestNode,
    importData,
    updateCanvasConfig,
    exportData,
    newFile,
    calculateNodeSize,
  };
}
