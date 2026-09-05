import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

createApp(App).mount('#app')

document.addEventListener('click', (event) => {
  const button = event.target.closest('button, .chat-fab')
  if (!button || button.disabled || button.classList.contains('no-ripple')) return

  button.classList.add('btn-ripple')
  const rect = button.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const wave = document.createElement('span')
  wave.className = 'ripple-wave'
  wave.style.width = `${size}px`
  wave.style.height = `${size}px`
  wave.style.left = `${event.clientX - rect.left - size / 2}px`
  wave.style.top = `${event.clientY - rect.top - size / 2}px`
  button.appendChild(wave)
  window.setTimeout(() => wave.remove(), 560)
})
