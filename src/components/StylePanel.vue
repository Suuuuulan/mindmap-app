<template>
  <div class="style-panel" :class="{ 'is-visible': showPanel }">
    <div class="panel-header">
      <h3>{{ panelTitle }}</h3>
    </div>
    
    <!-- 节点样式设置 -->
    <div v-if="selectedNode" class="panel-content">
      <!-- 文本样式 -->
      <div class="section">
        <h4>文本样式</h4>
        <div class="form-row">
          <label>字体大小</label>
          <input
            type="range"
            min="10"
            max="32"
            :value="selectedNode.style.fontSize"
            @input="updateStyle('fontSize', +($event.target as HTMLInputElement).value)"
          />
          <span>{{ selectedNode.style.fontSize }}px</span>
        </div>
        
        <div class="form-row">
          <label>字体粗细</label>
          <select
            :value="selectedNode.style.fontWeight"
            @change="updateStyle('fontWeight', ($event.target as HTMLSelectElement).value)"
          >
            <option value="normal">正常</option>
            <option value="bold">粗体</option>
            <option value="lighter">细体</option>
          </select>
        </div>
      </div>

      <!-- 颜色设置 -->
      <div class="section">
        <h4>颜色设置</h4>
        <div class="color-row">
          <label>背景颜色</label>
          <input
            type="color"
            :value="selectedNode.style.backgroundColor"
            @input="updateStyle('backgroundColor', ($event.target as HTMLInputElement).value)"
          />
        </div>
        
        <div class="color-row">
          <label>文字颜色</label>
          <input
            type="color"
            :value="selectedNode.style.textColor"
            @input="updateStyle('textColor', ($event.target as HTMLInputElement).value)"
          />
        </div>
        
        <div class="color-row">
          <label>边框颜色</label>
          <input
            type="color"
            :value="selectedNode.style.borderColor"
            @input="updateStyle('borderColor', ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>

      <!-- 边框设置 -->
      <div class="section">
        <h4>边框设置</h4>
        <div class="form-row">
          <label>边框宽度</label>
          <input
            type="range"
            min="0"
            max="10"
            :value="selectedNode.style.borderWidth"
            @input="updateStyle('borderWidth', +($event.target as HTMLInputElement).value)"
          />
          <span>{{ selectedNode.style.borderWidth }}px</span>
        </div>
        
        <div class="form-row">
          <label>圆角大小</label>
          <input
            type="range"
            min="0"
            max="24"
            :value="selectedNode.style.borderRadius"
            @input="updateStyle('borderRadius', +($event.target as HTMLInputElement).value)"
          />
          <span>{{ selectedNode.style.borderRadius }}px</span>
        </div>
      </div>

      <!-- 预设样式 -->
      <div class="section">
        <h4>预设样式</h4>
        <div class="preset-styles">
          <div
            v-for="preset in presetStyles"
            :key="preset.name"
            class="preset-item"
            :style="getPresetStyle(preset)"
            @click="applyPreset(preset)"
          >
            {{ preset.name }}
          </div>
        </div>
      </div>
    </div>

    <!-- 画布设置 -->
    <div v-else class="panel-content">
      <!-- 画布背景 -->
      <div class="section">
        <h4>画布设置</h4>
        <div class="color-row">
          <label>背景颜色</label>
          <input
            type="color"
            :value="canvasConfig.backgroundColor"
            @input="updateCanvasConfig('backgroundColor', ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>

      <!-- 节点间距 -->
      <div class="section">
        <h4>节点间距</h4>
        <div class="form-row">
          <label>水平间距</label>
          <input
            type="range"
            min="100"
            max="400"
            step="10"
            :value="canvasConfig.levelWidth"
            @input="updateCanvasConfig('levelWidth', +($event.target as HTMLInputElement).value)"
          />
          <span>{{ canvasConfig.levelWidth }}px</span>
        </div>
        
        <div class="form-row">
          <label>垂直间距</label>
          <input
            type="range"
            min="40"
            max="120"
            step="5"
            :value="canvasConfig.nodeHeight"
            @input="updateCanvasConfig('nodeHeight', +($event.target as HTMLInputElement).value)"
          />
          <span>{{ canvasConfig.nodeHeight }}px</span>
        </div>
      </div>

      <!-- 提示信息 -->
      <div class="tip-section">
        <p class="tip-text">💡 点击画布空白处可调整画布设置</p>
        <p class="tip-text">💡 点击节点可调整节点样式</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { MindMapNode, NodeStyle, CanvasConfig } from '@/types';

interface Props {
  selectedNode: MindMapNode | null;
  canvasConfig: CanvasConfig;
  showPanel: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  updateStyle: [style: Partial<NodeStyle>];
  updateCanvasConfig: [config: Partial<CanvasConfig>];
}>();

const panelTitle = computed(() => {
  return props.selectedNode ? '节点样式' : '画布设置';
});

const presetStyles = [
  {
    name: '默认',
    backgroundColor: '#ffffff',
    textColor: '#333333',
    borderColor: '#1890ff',
  },
  {
    name: '重要',
    backgroundColor: '#fff2f0',
    textColor: '#cf1322',
    borderColor: '#ff4d4f',
  },
  {
    name: '警告',
    backgroundColor: '#fffbe6',
    textColor: '#d48806',
    borderColor: '#ffc53d',
  },
  {
    name: '成功',
    backgroundColor: '#f6ffed',
    textColor: '#389e0d',
    borderColor: '#73d13d',
  },
  {
    name: '信息',
    backgroundColor: '#e6f7ff',
    textColor: '#096dd9',
    borderColor: '#40a9ff',
  },
  {
    name: '深色',
    backgroundColor: '#262626',
    textColor: '#ffffff',
    borderColor: '#595959',
  },
];

const updateStyle = (key: keyof NodeStyle, value: any) => {
  emit('updateStyle', { [key]: value });
};

const updateCanvasConfig = (key: keyof CanvasConfig, value: any) => {
  emit('updateCanvasConfig', { [key]: value });
};

const getPresetStyle = (preset: typeof presetStyles[0]) => ({
  backgroundColor: preset.backgroundColor,
  color: preset.textColor,
  border: `2px solid ${preset.borderColor}`,
});

const applyPreset = (preset: typeof presetStyles[0]) => {
  emit('updateStyle', {
    backgroundColor: preset.backgroundColor,
    textColor: preset.textColor,
    borderColor: preset.borderColor,
  });
};
</script>

<style scoped lang="scss">
.style-panel {
  width: 280px;
  background: white;
  border-left: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (max-width: 768px) {
    position: fixed;
    right: 0;
    top: 50px;
    bottom: 0;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
    z-index: 200;

    &.is-visible {
      transform: translateX(0);
    }
  }
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.section {
  margin-bottom: 24px;

  h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    color: #666;
    font-weight: 500;
  }
}

.form-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;

  label {
    min-width: 70px;
    font-size: 13px;
    color: #333;
  }

  input[type="range"] {
    flex: 1;
  }

  span {
    min-width: 45px;
    font-size: 12px;
    color: #666;
    text-align: right;
  }

  select {
    flex: 1;
    padding: 6px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    font-size: 13px;
  }
}

.color-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;

  label {
    font-size: 13px;
    color: #333;
  }

  input[type="color"] {
    width: 60px;
    height: 32px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    cursor: pointer;
  }
}

.preset-styles {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.preset-item {
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
}

.tip-section {
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px dashed #e8e8e8;

  .tip-text {
    color: #999;
    font-size: 12px;
    margin: 8px 0;
    line-height: 1.5;
  }
}
</style>
