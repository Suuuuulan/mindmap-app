<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <div class="logo">
        <span class="logo-icon">🧠</span>
        <span class="logo-text">MindMap</span>
      </div>
      
      <div class="toolbar-divider"></div>
      
      <div class="toolbar-group">
        <button class="tool-btn" @click="onNew" title="新建 (Ctrl+N)">
          <span class="icon">📄</span>
          <span class="text">新建</span>
        </button>
        <button class="tool-btn" @click="onImport" title="导入 JSON">
          <span class="icon">📥</span>
          <span class="text">导入</span>
        </button>
      </div>

      <div class="toolbar-divider"></div>
      
      <div class="toolbar-group">
        <button class="tool-btn" @click="onAddChild" :disabled="!selectedNode" title="添加子节点 (Tab)">
          <span class="icon">➕</span>
          <span class="text">子节点</span>
        </button>
        <button class="tool-btn" @click="onAddSibling" :disabled="!selectedNode || isRootSelected" title="添加同级节点 (Enter)">
          <span class="icon">↔️</span>
          <span class="text">同级节点</span>
        </button>
        <button class="tool-btn" @click="onDelete" :disabled="!selectedNode || isRootSelected" title="删除节点 (Delete)">
          <span class="icon">🗑️</span>
          <span class="text">删除</span>
        </button>
      </div>

      <div class="toolbar-divider"></div>
      
      <div class="toolbar-group">
        <button class="tool-btn" @click="onAutoLayout" title="自动布局">
          <span class="icon">🔄</span>
          <span class="text">自动布局</span>
        </button>
      </div>
    </div>

    <div class="toolbar-right">
      <div class="toolbar-group">
        <button class="tool-btn export-btn" @click.stop="toggleExportMenu" title="导出">
          <span class="icon">📤</span>
          <span class="text">导出</span>
          <span class="arrow">▼</span>
        </button>
        
        <div v-if="showExportMenu" class="export-menu" @click.stop>
          <div class="export-item" @click="onExport('json')">
            <span class="icon">📋</span>
            <span>导出 JSON</span>
          </div>
          <div class="export-item" @click="onExport('png')">
            <span class="icon">🖼️</span>
            <span>导出 PNG</span>
          </div>
          <div class="export-item" @click="onExport('pdf')">
            <span class="icon">📄</span>
            <span>导出 PDF</span>
          </div>
        </div>
      </div>
      
      <button class="tool-btn mobile-toggle" @click="onToggleStylePanel" title="样式面板">
        <span class="icon">🎨</span>
      </button>
    </div>

    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInput"
      type="file"
      accept=".json"
      style="display: none"
      @change="onFileSelected"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { MindMapNode } from '@/types';

interface Props {
  selectedNode: MindMapNode | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  new: [];
  import: [file: File];
  export: [type: 'json' | 'png' | 'pdf'];
  addChild: [];
  addSibling: [];
  delete: [];
  autoLayout: [];
  toggleStylePanel: [];
}>();

const showExportMenu = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const isRootSelected = computed(() => {
  return props.selectedNode?.level === 0;
});

const onNew = () => {
  emit('new');
};

const onImport = () => {
  fileInput.value?.click();
};

const onFileSelected = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    emit('import', file);
  }
  target.value = '';
};

const toggleExportMenu = () => {
  showExportMenu.value = !showExportMenu.value;
};

const closeExportMenu = () => {
  showExportMenu.value = false;
};

const onExport = (type: 'json' | 'png' | 'pdf') => {
  emit('export', type);
  showExportMenu.value = false;
};

const onAddChild = () => {
  emit('addChild');
};

const onAddSibling = () => {
  emit('addSibling');
};

const onDelete = () => {
  emit('delete');
};

const onAutoLayout = () => {
  emit('autoLayout');
};

const onToggleStylePanel = () => {
  emit('toggleStylePanel');
};

// 点击外部关闭菜单
const onDocumentClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest('.toolbar-group')) {
    showExportMenu.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', onDocumentClick);
});

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick);
});
</script>

<style scoped lang="scss">
.toolbar {
  height: 50px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  position: relative;
  z-index: 100;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
  color: #1890ff;
  margin-right: 8px;

  .logo-icon {
    font-size: 20px;
  }
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: #e8e8e8;
  margin: 0 4px;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 4px;
  position: relative;
}

.tool-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #333;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #f5f5f5;
    border-color: #d9d9d9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .icon {
    font-size: 14px;
  }

  .text {
    @media (max-width: 1024px) {
      display: none;
    }
  }
}

.export-btn {
  background: #1890ff;
  color: white;

  &:hover {
    background: #40a9ff;
  }

  .arrow {
    font-size: 10px;
    margin-left: 4px;
  }
}

.export-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 140px;
  overflow: hidden;
}

.export-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s ease;

  &:hover {
    background: #f5f5f5;
  }

  .icon {
    font-size: 14px;
  }
}

.mobile-toggle {
  display: none;

  @media (max-width: 768px) {
    display: flex;
  }
}
</style>
