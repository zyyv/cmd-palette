# cmd-palette

Interative command palette

## Features

- 🚀 **Vue 3** - Latest Vue.js framework
- 📦 **TypeScript** - Type-safe development
- 🔧 **Plugin Support** - Can be used as Vue plugin or individual components
- 🎨 **Customizable** - Easy to extend and customize
- 📱 **Modern Build** - Built with tsdown for optimal bundle size
- 🏟️ **Playground** - Integrated development playground

## Installation

```bash
npm install cmd-palette
# or
pnpm add cmd-palette
# or
yarn add cmd-palette
```

## Usage

### As a Plugin

```ts
import MyComponentLibrary from 'cmd-palette'
import { createApp } from 'vue'

const app = createApp()
app.use(MyComponentLibrary)
```

### Import Individual Components

```vue
<script setup lang="ts">
import { MyButton } from 'cmd-palette'
</script>

<template>
  <MyButton type="primary" />
</template>
```

## Components

### MyButton

A customizable button component.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| type | `'primary'` | `undefined` | Button type |

#### Example

```vue
<template>
  <MyButton type="primary" />
</template>
```

## Development

```bash
# Install dependencies
pnpm install

# Start development with watch mode
pnpm dev

# Run playground for testing
pnpm play

# Build for production
pnpm build

# Type checking
pnpm typecheck

# Lint code
pnpm lint
```

## License

MIT © [Chris](https://github.com/zyyv)
