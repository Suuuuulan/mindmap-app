import { onMounted, onUnmounted, ref, watch, type Ref } from 'vue';
import type { MindMapNode } from '@/types';

export interface KeyboardOptions {
  selectedNode: Ref<MindMapNode | null>;
  editingNode: Ref<MindMapNode | null>;
  onAddChild: (node: MindMapNode) => void;
  onAddSibling: (node: MindMapNode) => void;
  onDeleteNode: (node: MindMapNode) => void;
  onEditNode: (node: MindMapNode) => void;
  onNavigate: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onStopEditing: () => void;
}

export function useKeyboard(options: KeyboardOptions) {
  const handleKeyDown = (e: KeyboardEvent) => {
    const currentEditing = options.editingNode.value;
    const currentSelected = options.selectedNode.value;
    const { onAddChild, onAddSibling, onDeleteNode, onEditNode, onNavigate, onStopEditing } = options;
    
    // 如果正在编辑，只处理退出编辑的快捷键
    if (currentEditing) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onStopEditing();
      }
      return;
    }

    // 如果没有选中节点，不处理其他快捷键
    if (!currentSelected) return;

    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        onAddChild(currentSelected);
        break;
        
      case 'Enter':
        e.preventDefault();
        onAddSibling(currentSelected);
        break;
        
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        onDeleteNode(currentSelected);
        break;
        
      case ' ':
      case 'Spacebar':
        e.preventDefault();
        onEditNode(currentSelected);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        onNavigate('up');
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        onNavigate('down');
        break;
        
      case 'ArrowLeft':
        e.preventDefault();
        onNavigate('left');
        break;
        
      case 'ArrowRight':
        e.preventDefault();
        onNavigate('right');
        break;
    }
  };

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });

  return {
    handleKeyDown,
  };
}
