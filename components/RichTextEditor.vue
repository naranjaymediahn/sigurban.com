<template>
  <div class="rte">
    <div class="rte-toolbar">
      <button v-for="action in actions" :key="action.label" type="button" class="rte-btn" @mousedown.prevent="runAction(action)">
        {{ action.label }}
      </button>
    </div>
    <div
      ref="editorRef"
      class="rte-editor"
      contenteditable="true"
      :data-placeholder="placeholder"
      @input="emitValue"
      @blur="emitValue"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])
const editorRef = ref(null)

const actions = [
  { label: 'P', run: () => document.execCommand('formatBlock', false, 'p') },
  { label: 'H2', run: () => document.execCommand('formatBlock', false, 'h2') },
  { label: 'H3', run: () => document.execCommand('formatBlock', false, 'h3') },
  { label: 'B', run: () => document.execCommand('bold') },
  { label: 'I', run: () => document.execCommand('italic') },
  { label: 'UL', run: () => document.execCommand('insertUnorderedList') },
  { label: 'OL', run: () => document.execCommand('insertOrderedList') },
  {
    label: 'Link',
    run: () => {
      const url = window.prompt('URL del enlace')
      if (!url) return
      document.execCommand('createLink', false, url)
    },
  },
  { label: 'Quitar', run: () => document.execCommand('removeFormat') },
]

function setHtml(value = '') {
  if (!editorRef.value) return
  if (editorRef.value.innerHTML === value) return
  editorRef.value.innerHTML = value
}

function emitValue() {
  emit('update:modelValue', editorRef.value?.innerHTML || '')
}

function runAction(action) {
  editorRef.value?.focus()
  action.run()
  emitValue()
}

watch(() => props.modelValue, (value) => setHtml(value))

onMounted(() => {
  setHtml(props.modelValue)
})
</script>

<style scoped>
.rte {
  border: 1px solid #dcdfe6;
  border-radius: 12px;
  background: white;
  overflow: hidden;
}

.rte-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px;
  border-bottom: 1px solid #ebeef5;
  background: #f8fafc;
}

.rte-btn {
  border: 1px solid #d7deea;
  background: white;
  color: #1a3a5c;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.rte-btn:hover {
  border-color: #78af2b;
  color: #78af2b;
}

.rte-editor {
  min-height: 260px;
  padding: 16px;
  font-size: 14px;
  line-height: 1.7;
  color: #1f2937;
  outline: none;
}

.rte-editor:empty::before {
  content: attr(data-placeholder);
  color: #9ca3af;
}
</style>
