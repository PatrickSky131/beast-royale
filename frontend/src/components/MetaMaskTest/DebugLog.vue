<template>
  <div class="test-section">
    <div class="log-header">
      <h3>📝 调试日志</h3>
      <div class="log-buttons">
        <button @click="clearAllResults" class="clear-btn">清除结果</button>
        <button @click="clearLog" class="clear-btn">清空日志</button>
      </div>
    </div>
    <div ref="logContainer" class="log-container"></div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'DebugLog',
  emits: ['clear-all-results'],
  setup(props, { emit }) {
    const logContainer = ref(null)
    
    function clearLog() {
      if (logContainer.value) {
        logContainer.value.innerHTML = ''
      }
    }
    
    function clearAllResults() {
      emit('clear-all-results')
    }
    
    function log(message, type = 'info') {
      if (logContainer.value) {
        const timestamp = new Date().toLocaleTimeString()
        const logEntry = document.createElement('div')
        logEntry.innerHTML = `<span class="timestamp">[${timestamp}]</span> <span class="${type}">${message}</span>`
        logContainer.value.appendChild(logEntry)
        logContainer.value.scrollTop = logContainer.value.scrollHeight
      }
      console.log(`[${type.toUpperCase()}] ${message}`)
    }
    
    return {
      logContainer,
      clearLog,
      clearAllResults,
      log
    }
  }
}
</script>

<style scoped>
.test-section {
  margin-bottom: 40px;
}

.test-section h3 {
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: #333;
  font-weight: 600;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 10px;
}

/* 日志区域 */
.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 10px;
}

.log-buttons {
  display: flex;
  gap: 10px;
}

.clear-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s ease;
  white-space: nowrap;
  /* 触摸设备优化 */
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  user-select: none;
}

.clear-btn:hover {
  background: #5a6268;
}

.log-container {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 20px;
  height: 300px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  line-height: 1.6;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.log-container div {
  margin-bottom: 8px;
  padding: 4px 0;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.log-container .timestamp {
  color: #6c757d;
  font-weight: bold;
}

.log-container .info {
  color: #17a2b8;
}

.log-container .success {
  color: #28a745;
}

.log-container .warning {
  color: #ffc107;
}

.log-container .error {
  color: #dc3545;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .test-section h3 {
    font-size: 1.2rem;
    margin-bottom: 12px;
  }
  
  .log-header {
    margin-bottom: 8px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .log-header h3 {
    font-size: 1.2rem;
    margin: 0;
  }
  
  .log-buttons {
    width: 100%;
    justify-content: space-between;
  }
  
  .clear-btn {
    padding: 8px 12px;
    font-size: 0.8rem;
    flex: 1;
    margin: 0 2px;
  }
  
  .log-container {
    padding: 12px;
    height: 200px;
    font-size: 0.75rem;
    border-radius: 6px;
  }
}

@media (max-width: 480px) {
  .log-header {
    margin-bottom: 6px;
  }
  
  .log-header h3 {
    font-size: 1.1rem;
  }
  
  .clear-btn {
    padding: 6px 8px;
    font-size: 0.75rem;
  }
  
  .log-container {
    padding: 10px;
    height: 180px;
    font-size: 0.7rem;
  }
}

@media (max-width: 360px) {
  .log-container {
    height: 150px;
    font-size: 0.65rem;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .clear-btn {
    min-height: 44px;
    padding: 12px 16px;
  }
  
  .clear-btn:active {
    transform: scale(0.98);
  }
  
  /* 优化日志区域的滚动 */
  .log-container {
    -webkit-overflow-scrolling: touch;
  }
}
</style> 