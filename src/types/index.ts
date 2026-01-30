// 思维导图节点类型
export interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: NodeStyle;
  children: MindMapNode[];
  parent?: MindMapNode | null;
  collapsed?: boolean;
  level: number;
}

// 节点样式
export interface NodeStyle {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  fontSize: number;
  fontWeight: string;
  fontFamily: string;
  padding: number;
}

// 默认节点样式
export const defaultNodeStyle: NodeStyle = {
  backgroundColor: '#ffffff',
  textColor: '#333333',
  borderColor: '#1890ff',
  borderWidth: 2,
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 'normal',
  fontFamily: 'Arial, sans-serif',
  padding: 12,
};

// 根节点样式
export const rootNodeStyle: NodeStyle = {
  ...defaultNodeStyle,
  backgroundColor: '#1890ff',
  textColor: '#ffffff',
  borderColor: '#096dd9',
  fontSize: 16,
  fontWeight: 'bold',
  padding: 16,
};

// 画布状态
export interface CanvasState {
  scale: number;
  translateX: number;
  translateY: number;
}

// 画布配置
export interface CanvasConfig {
  backgroundColor: string;
  levelWidth: number; // 节点水平间距
  nodeHeight: number; // 节点垂直间距
}

// 导出数据格式
export interface ExportData {
  version: string;
  nodes: MindMapNode;
  canvas: CanvasState;
  canvasConfig: CanvasConfig;
}

// 编辑模式
export type EditMode = 'select' | 'edit' | 'drag';

// 方向枚举
export type Direction = 'up' | 'down' | 'left' | 'right';

// 连接线路径点
export interface PathPoint {
  x: number;
  y: number;
}
