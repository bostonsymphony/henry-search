<script setup>
import { onMounted, useTemplateRef, watch } from 'vue'

/**
 * PAccordion is a vue component for the <details> element. It uses the native <details> element
 * state to determine whether it's open or closed, and merely handles updating CSS properties
 * to allow the element to use transitions between dynamic closed and [open] heights.
 * 
 * @param {number} duration - Duration of the animation in milliseconds.
 *                            Default: computed transition-duration of the details element.
 * @param {string} summary - selector for the summary element.
 *                           Default: 'summary:first-of-type'
 */

const props = defineProps({
  duration: { type: Number },
  summary: { type: String, default: 'summary:first-of-type' },
  startOpen: { type: Boolean, default: true},
  openText: { type: String, default: null},
  closedText: { type: String, default: null},
  name: { type: String, default: null}
})
const details = useTemplateRef('details')
const summaryText = null

onMounted(() => {
  details.value.style.setProperty('--accordion-height-closed', 'auto')
  if (props.startOpen) {
    details.value.open = true
  }
})

const handleToggle = event => {
  const el = event.currentTarget
  const duration = props.duration || parseFloat(getComputedStyle(el).transitionDuration) * 1000 || 0
  const summary = el.querySelector(props.summary)

  if (!summary) {
    return
  }

  const summaryHeight = summary?.clientHeight
  
  if (!summary.contains(event.target)) {
    return
  }

  event.preventDefault()

  if (el.open) {
    el.classList.add('-closing')
    el.style.setProperty('--accordion-height-closed', `${summaryHeight}px`)

    setTimeout(() => {
      el.open = false
      el.classList.remove('-closing')
      el.style.setProperty('--accordion-height-closed', 'auto')
    }, duration)

  } else {
    el.style.transitionDuration = '0s'
    el.style.setProperty('--accordion-height-closed', `${summaryHeight}px`)

    requestAnimationFrame(() => {
      el.style.transitionDuration = ''
      el.open = true
    })
  }
  if (props.openText && props.closedText) {
    let replacementText = ""
    if (details.value.open) {
      replacementText = props.closedText
    } else {
      replacementText = props.openText
    }
    if (summary.children) {
      summary.children[0].innerHTML = replacementText
    } else {
      summary.innerHTML = replacementText
    }
  }
}
</script>

<template>
  <details ref="details" class="accordion" :name="props.name" @click="handleToggle">
    <slot />
  </details>
</template>
