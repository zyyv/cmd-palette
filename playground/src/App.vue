<script setup lang="ts">
import { ref } from 'vue'
import { CommandPalette } from '../../src'

const visible = ref(false)

const commands = [
  {
    id: 'new-file',
    title: 'New File',
    description: 'Create a new file',
    icon: 'i-hugeicons-file-add',
    category: 'File',
    action: () => {
      console.log('New file created')
      visible.value = false
    }
  },
  {
    id: 'open-file',
    title: 'Open File',
    description: 'Open an existing file',
    icon: 'i-hugeicons-folder-open',
    category: 'File',
    action: () => {
      console.log('File opened')
      visible.value = false
    }
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Open application settings',
    icon: 'i-hugeicons-settings-02',
    category: 'System',
    action: () => {
      console.log('Settings opened')
      visible.value = false
    }
  }
]

function toggleCommandPalette() {
  visible.value = !visible.value
}
</script>

<template>
  <div style="padding: 2rem;">
    <h1>Command Palette Demo</h1>
    <p>
      Press <kbd style="padding: 0.25rem 0.5rem; background: #f0f0f0; border-radius: 0.25rem;">Cmd+K</kbd> or click the button to open the command palette
    </p>

    <button
      @click="toggleCommandPalette"
      style="padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 0.25rem; cursor: pointer;"
    >
      Open Command Palette
    </button>

    <CommandPalette 
      :commands="commands"
      v-model="visible"
    />
  </div>
</template>
