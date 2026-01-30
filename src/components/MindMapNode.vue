<template>
  <div
    class="mind-map-node"
    :class="{
      'is-selected': isSelected,
      'is-editing': isEditing,
      'is-root': node.level === 0,
    }"
    :style="nodeStyles"
    @mousedown.stop="onMouseDown"
    @dblclick.stop="onDoubleClick"
    @click.stop="onClick"
  >
    <!-- 折叠按钮 -->
    <div
      v-if="node.children.length > 0"
      class="collapse-btn"
      :class="{ 'is-collapsed': node.collapsed }"
      @mousedown.stop="onToggleCollapse"
    >
      {{ node.collapsed ? '+' : '−' }}
    </div>

    <!-- 节点内容 -->
    <div class="node-content">
      <input
        v-if="isEditing"
        ref="inputRef"
        v-model="editText"
        class="node-input"
        @blur="onBlur"
        @keydown.enter="onEnter"
        @keydown.escape="onCancel"
      />
      <span v-else class="node-text">{{ node.text }}</span>
    </div>

    <!-- 调整大小手柄 -->
    <div v-if="isSelected" class="resize-handle"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import type { MindMapNode } from '@/types';

interface Props {
  node: MindMapNode;
  isSelected: boolean;
  isEditing: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  select: [node: MindMapNode];
  edit: [node: MindMapNode];
  updateText: [node: MindMapNode, text: string];
  dragStart: [node: MindMapNode, x: number, y: number];
  toggleCollapse: [node: MindMapNode];
  stopEditing: [];
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const editText = ref('');

// 节点样式
const nodeStyles = computed(() => ({
  left: `${props.node.x}px`,
  top: `${props.node.y}px`,
  minWidth: `${props.node.width}px`,
  minHeight: `${props.node.height}px`,
  backgroundColor: props.node.style.backgroundColor,
  color: props.node.style.textColor,
  border: `${props.node.style.borderWidth}px solid ${props.node.style.borderColor}`,
  borderRadius: `${props.node.style.borderRadius}px`,
  fontSize: `${props.node.style.fontSize}px`,
  fontWeight: props.node.style.fontWeight,
  fontFamily: props.node.style.fontFamily,
  padding: `${props.node.style.padding}px`,
  transform: 'translate(-50%, -50%)',
}));

// 监听编辑状态
watch(
  () => props.isEditing,
  (isEditing) => {
    if (isEditing) {
      editText.value = props.node.text;
      nextTick(() => {
        inputRef.value?.focus();
        inputRef.value?.select();
      });
    }
  },
  { immediate: true }
);

const onClick = () => {
  emit('select', props.node);
};

const onDoubleClick = () => {
  emit('edit', props.node);
};

const onMouseDown = (e: MouseEvent) => {
  emit('dragStart', props.node, e.clientX, e.clientY);
};

const onToggleCollapse = () => {
  emit('toggleCollapse', props.node);
};

const onBlur = () => {
  saveEdit();
};

const onEnter = () => {
  saveEdit();
};

const onCancel = () => {
  editText.value = props.node.text;
  emit('stopEditing');
};

const saveEdit = () => {
  if (editText.value.trim()) {
    emit('updateText', props.node, editText.value.trim());
  }
  emit('stopEditing');
};
</script>

<style scoped lang="scss">
.mind-map-node {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  transition: box-shadow 0.2s ease;
  box-sizing: border-box;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &.is-selected {
    box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.3), 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &.is-editing {
    cursor: text;
  }

  &.is-root {
    font-size: 1.1em;
  }
}

.node-content {
  width: 100%;
  text-align: center;
}

.node-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.node-input {
  width: 100%;
  min-width: 120px;
  border: 2px solid #1890ff;
  outline: none;
  background: white;
  text-align: center;
  font: inherit;
  color: #333;
  padding: 4px 8px;
  margin: 0;
  border-radius: 4px;
  box-sizing: border-box;
}

.collapse-btn {
  position: absolute;
  right: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #1890ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: #1890ff;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #1890ff;
    color: #fff;
  }

  &.is-collapsed {
    right: auto;
    left: -12px;
  }
}

.resize-handle {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 8px;
  height: 8px;
  background: #1890ff;
  border-radius: 50%;
  cursor: se-resize;
}
</style>
