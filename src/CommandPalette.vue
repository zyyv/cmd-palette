<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch, defineModel } from 'vue'

interface CommandItem {
  id: string
  title: string
  description?: string
  icon?: string
  action: () => void | Promise<void>
  category?: string
}

const props = defineProps<{
  commands: CommandItem[]
}>()

const visible = defineModel<boolean>()

const groupedCommands = computed(() => {
  const groups: Record<string, CommandItem[]> = {}
  props.commands.forEach(command => {
    const category = command.category || 'Other'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(command)
  })
  return groups
})

const flattenedCommands = computed(() => {
  const result: CommandItem[] = []
  const groups = groupedCommands.value

  Object.keys(groups).forEach((category) => {
    if (groups[category]) {
      result.push(...groups[category])
    }
  })

  return result
})

const searchQuery = ref('')
const selectedIndex = ref(0)
const inputRef = useTemplateRef<HTMLInputElement>('inputRef')
const commandListRef = useTemplateRef<HTMLDivElement>('commandListRef')
const isKeyboardNavigation = ref(false)

// 关闭面板的函数
function closePanel() {
  visible.value = false
  searchQuery.value = ''
  selectedIndex.value = 0
  isKeyboardNavigation.value = false
}

function openPanel() {
  visible.value = true  
  selectedIndex.value = 0
  searchQuery.value = ''
  isKeyboardNavigation.value = false
  nextTick(() => {
    inputRef.value?.focus()
  })
}

function executeCommand(command: CommandItem) {
  command.action()
}

function scrollToSelectedCommand() {
  if (!commandListRef.value)
    return

  nextTick(() => {
    const selectedElement = commandListRef.value?.querySelector(`[data-command-index="${selectedIndex.value}"]`)
    if (selectedElement) {
      selectedElement.scrollIntoView({
        behavior: 'auto', // 改为 auto 以获得更快的响应
        block: 'nearest',
        inline: 'nearest',
      })
    }
  })
}

function handleMouseEnter(command: CommandItem) {
  // 如果正在进行键盘导航，忽略鼠标事件
  if (isKeyboardNavigation.value)
    return

  selectedIndex.value = flattenedCommands.value.indexOf(command)
}

function handleKeydown(event: KeyboardEvent) {
  if (!visible.value)
    return

  switch (event.key) {
    case 'Escape':
      event.preventDefault()
      closePanel()
      break
    case 'ArrowDown':
      event.preventDefault()
      isKeyboardNavigation.value = true
      selectedIndex.value = Math.min(selectedIndex.value + 1, flattenedCommands.value.length - 1)
      scrollToSelectedCommand()
      // 短暂延迟后重置键盘导航标志
      setTimeout(() => {
        isKeyboardNavigation.value = false
      }, 100)
      break
    case 'ArrowUp':
      event.preventDefault()
      isKeyboardNavigation.value = true
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
      scrollToSelectedCommand()
      // 短暂延迟后重置键盘导航标志
      setTimeout(() => {
        isKeyboardNavigation.value = false
      }, 100)
      break
    case 'Enter':
      event.preventDefault()
      if (flattenedCommands.value[selectedIndex.value]) {
        executeCommand(flattenedCommands.value[selectedIndex.value]!)
      }
      break
  }
}

function handleGlobalKeydown(event: KeyboardEvent) {
  // Cmd+K (Mac) 或 Ctrl+K (Windows/Linux)
  if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
    event.preventDefault()
    if (visible.value) {
      closePanel()
    }
    else {
      openPanel()
    }
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
})

// 当搜索查询改变时重置选中索引
watch(searchQuery, () => {
  selectedIndex.value = 0
})

// 暴露打开命令面板的方法
defineExpose({
  openPanel,
  closePanel,
})
</script>

<template>
  <!-- 遮罩层 -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition-enter-active"
      enter-from-class="transition-enter-from"
      enter-to-class="transition-enter-to"
      leave-active-class="transition-leave-active"
      leave-from-class="transition-leave-from"
      leave-to-class="transition-leave-to"
    >
      <div
        v-if="visible"
        class="overlay"
        @click="closePanel"
      />
    </Transition>

    <!-- 命令面板 -->
    <Transition
      enter-active-class="modal-enter-active"
      enter-from-class="modal-enter-from"
      enter-to-class="modal-enter-to"
      leave-active-class="modal-leave-active"
      leave-from-class="modal-leave-from"
      leave-to-class="modal-leave-to"
    >
      <div
        v-if="visible"
        class="command-panel"
        @keydown="handleKeydown"
      >
        <div class="panel-main">
          <!-- 搜索输入框 -->
          <div class="search-area">
            <div class="search-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><!-- Icon from Huge Icons by Hugeicons - undefined --><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.5 17.5L22 22m-2-11a9 9 0 1 0-18 0a9 9 0 0 0 18 0" color="currentColor"/></svg>
            </div>
            <input
              ref="inputRef"
              v-model="searchQuery"
              type="text"
              placeholder="Search commands..."
              class="search-input"
            >
            <kbd class="search-kbd">
              ESC
            </kbd>
          </div>

          <!-- 命令列表 -->
          <div ref="commandListRef" class="command-list">
            <div v-if="commands.length === 0" class="no-commands">
              No matching commands found
            </div>

            <div v-else>
              <div
                v-for="(categoryCommands, category) in groupedCommands"
                :key="category"
                class="category-container"
              >
                <!-- 类别标题 -->
                <div class="category-title">
                  {{ category }}
                </div>

                <!-- 类别下的命令 -->
                <div
                  v-for="command in categoryCommands"
                  :key="command.id"
                  :data-command-index="flattenedCommands.indexOf(command)"
                  class="command-item"
                  :class="{ 
                    selected: selectedIndex === flattenedCommands.indexOf(command)
                  }"
                  @click="executeCommand(command)"
                  @mouseenter="handleMouseEnter(command)"
                >
                  <!-- 图标 -->
                  <div
                    v-if="command.icon"
                    class="command-icon"
                    :class="[
                      command.icon,
                      { selected: selectedIndex === flattenedCommands.indexOf(command) }
                    ]"
                  />

                  <!-- 命令信息 -->
                  <div class="command-info">
                    <div class="command-title">
                      {{ command.title }}
                    </div>
                    <div
                      v-if="command.description"
                      class="command-description"
                    >
                      {{ command.description }}
                    </div>
                  </div>

                  <!-- 选中指示器 -->
                  <div
                    v-if="selectedIndex === flattenedCommands.indexOf(command)"
                    class="selection-indicator i-hugeicons-arrow-right-02"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- 底部提示 -->
          <div class="footer-hints">
            <div class="hints-container">
              <div class="hints-group">
                <span class="hint-item">
                  <kbd class="hint-kbd">↑↓</kbd>
                  Navigate
                </span>
                <span class="hint-item">
                  <kbd class="hint-kbd">⏎</kbd>
                  Execute
                </span>
              </div>
              <span class="hint-item">
                <kbd class="hint-kbd">
                  ⌘+K
                </kbd>
                Toggle
              </span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.command-panel {
  /* 颜色变量 */

    /*
  --color-100: #e7e7e7;
  --color-200: #d1d1d1;
  --color-300: #b0b0b0;
  --color-400: #888888;
  --color-500: #6d6d6d;
  --color-600: #5d5d5d;
  --color-700: #4f4f4f;
  --color-800: #454545;
  --color-900: #3c3c3c;
 */

  --cp-gray-100: #e7e7e7;
  --cp-gray-200: #d1d1d1;
  --cp-gray-300: #b0b0b0;
  --cp-gray-400: #888888;
  --cp-gray-500: #6d6d6d;
  --cp-gray-600: #5d5d5d;
  --cp-gray-700: #4f4f4f;
  --cp-gray-800: #454545;
  --cp-gray-900: #3c3c3c;
  --cp-white: #ffffff;
  --cp-black-50: rgba(0, 0, 0, 0.5);
  --cp-black-25: rgba(0, 0, 0, 0.25);
  --cp-white-light: #f9fafb;
  
  /* 主题颜色 */
  --cp-bg-primary: var(--cp-white);
  --cp-bg-secondary: var(--cp-gray-100);
  --cp-bg-overlay: var(--cp-black-50);
  --cp-border-primary: var(--cp-gray-200);
  --cp-border-secondary: var(--cp-gray-100);
  --cp-text-primary: var(--cp-gray-900);
  --cp-text-secondary: var(--cp-gray-400);
  --cp-text-muted: var(--cp-gray-500);
  --cp-text-disabled: var(--cp-gray-600);
}

@media (prefers-color-scheme: dark) {
  .command-panel {
    --cp-bg-primary: var(--cp-gray-800);
    --cp-bg-secondary: var(--cp-gray-800);
    --cp-border-primary: var(--cp-gray-700);
    --cp-border-secondary: var(--cp-gray-700);
    --cp-text-primary: var(--cp-white-light);
    --cp-text-secondary: var(--cp-gray-400);
    --cp-text-muted: var(--cp-gray-400);
    --cp-text-disabled: var(--cp-gray-300);
  }
}

/* 过渡动画类 */
.transition-enter-active {
  transition: all 0.2s ease-out;
}

.transition-enter-from {
  opacity: 0;
}

.transition-enter-to {
  opacity: 1;
}

.transition-leave-active {
  transition: all 0.15s ease-in;
}

.transition-leave-from {
  opacity: 1;
}

.transition-leave-to {
  opacity: 0;
}

.modal-enter-active {
  transition: all 0.2s ease-out;
}

.modal-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(1rem);
}

.modal-enter-to {
  opacity: 1;
  transform: scale(1) translateY(0);
}

.modal-leave-active {
  transition: all 0.15s ease-in;
}

.modal-leave-from {
  opacity: 1;
  transform: scale(1) translateY(0);
}

.modal-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(1rem);
}

/* 遮罩层 */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background-color: var(--cp-bg-overlay);
  backdrop-filter: blur(4px);
}

/* 命令面板容器 */
.command-panel {
  position: fixed;
  left: 50%;
  top: 25%;
  z-index: 50;
  width: 100%;
  max-width: 32rem;
  transform: translateX(-50%) translateY(-25%);
}

/* 面板主体 */
.panel-main {
  margin: 0 1rem;
  overflow: hidden;
  border-radius: 0.75rem;
  border: 1px solid var(--cp-border-primary);
  background-color: var(--cp-bg-primary);
  box-shadow: 0 25px 50px -12px var(--cp-black-25);
}

/* 搜索区域 */
.search-area {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--cp-border-primary);
  padding: 0.75rem 1rem;
}

.search-icon {
  margin-right: 0.75rem;
  height: 1.25rem;
  width: 1.25rem;
  color: var(--cp-text-secondary);
}

.search-input {
  flex: 1;
  background-color: transparent;
  color: var(--cp-text-primary);
  outline: none;
  border: 0;
  font-size: 0.9375rem;
}

.search-input::placeholder {
  color: var(--cp-text-muted);
}

.search-kbd {
  display: none;
  border-radius: 0.25rem;
  background-color: var(--cp-bg-secondary);
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  color: var(--cp-text-disabled);
}

@media (min-width: 640px) {
  .search-kbd {
    display: block;
  }
}

/* 命令列表 */
.command-list {
  max-height: 24rem;
  overflow-y: auto;
}

.no-commands {
  padding: 2rem 1rem;
  text-align: center;
  opacity: 0.72;
}

/* 类别容器 */
.category-container {
  border-bottom: 1px solid var(--cp-border-secondary);
}

.category-container:last-child {
  border-bottom: 0;
}

/* 类别标题 */
.category-title {
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  opacity: 0.72;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* 命令项 */
.command-item {
  display: flex;
  cursor: pointer;
  align-items: center;
  padding: 0.75rem 1rem;
  transition: background-color 0.15s ease-in-out;
  color: var(--cp-text-primary);
}

.command-item.selected {
  background-color: var(--cp-bg-secondary);
}

/* 命令图标 */
.command-icon {
  margin-right: 0.75rem;
  height: 1.25rem;
  width: 1.25rem;
  opacity: 0.64;
}

.command-icon.selected {
  color: var(--cp-text-primary);
  opacity: 1;
}

/* 命令信息 */
.command-info {
  flex: 1;
  min-width: 0;
}

.command-title {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--cp-text-primary);
  font-size: 0.875rem;
}

.command-description {
  font-size: 0.75rem;
  opacity: 0.72;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 选中指示器 */
.selection-indicator {
  height: 1rem;
  width: 1rem;
  color: var(--cp-text-primary);
}

/* 底部提示 */
.footer-hints {
  border-top: 1px solid var(--cp-border-primary);
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  opacity: 0.72;
}

.hints-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hints-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.hint-item {
  display: flex;
  align-items: center;
}

.hint-kbd {
  margin-right: 0.25rem;
  border-radius: 0.25rem;
  background-color: var(--cp-bg-secondary);
  padding: 0.125rem 0.375rem;
}
</style>
