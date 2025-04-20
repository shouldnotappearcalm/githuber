/*
 * @Author: 卓文理
 * @Email: 531840344@qq.com
 * @Date: 2018-01-17 15:44:45
 */

// 安全地初始化应用
(function() {
  // 全局变量用于通信
  window.GITHUBER_INITIALIZED = false;
  
  // 立即注册消息监听器，不等待DOM加载
  if (chrome && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
      if (request.action === 'refreshTrending' || request.action === 'checkDataLoaded') {
        if (window.app && window.app.$store) {
          if (request.action === 'refreshTrending') {
            const query = window.app.$store.getters['github/lastQuery'] || {};
            window.app.$store.dispatch('github/fetchTrending', query);
          } else if (request.action === 'checkDataLoaded') {
            const trendings = window.app.$store.getters['github/trendings'] || [];
            if (!trendings.length) {
              const query = window.app.$store.getters['github/lastQuery'] || {};
              window.app.$store.dispatch('github/fetchTrending', query);
            }
          }
          
          sendResponse({ status: 'success', initialized: true });
        } else {
          sendResponse({ status: 'waiting', initialized: false });
        }
      } else {
        sendResponse({ status: 'unknown_action' });
      }
      
      return true; // 保持通道开放，支持异步响应
    });
  }
  
  // DOM加载完成后运行初始化代码
  document.addEventListener('DOMContentLoaded', function() {
    // 设置一个计时器来检查app是否可用
    let checkCount = 0;
    const maxChecks = 50; // 增加最大检查次数
    
    function checkAppReady() {
      if (window.app && window.app.$store) {
        window.GITHUBER_INITIALIZED = true;
        setupAdditionalListeners();
        notifyBackgroundScriptReady();
      } else if (checkCount < maxChecks) {
        checkCount++;
        setTimeout(checkAppReady, 200); // 减少间隔时间以加快检查频率
      } else {
        tryAlternativeInit();
      }
    }

    // 如果正常方法失败，尝试其他初始化方法
    function tryAlternativeInit() {
      setupAdditionalListeners();
      notifyBackgroundScriptReady();
    }
    
    // 设置其他监听器
    function setupAdditionalListeners() {
      // 添加可见性变化的监听器
      document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible' && chrome && chrome.runtime) {
          chrome.runtime.sendMessage({
            action: 'tabBecameVisible'
          });
        }
      });
    }
    
    // 通知后台脚本页面已准备好
    function notifyBackgroundScriptReady() {
      if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          action: 'newTabLoaded',
          initialized: window.GITHUBER_INITIALIZED
        });
      }
    }
    
    // 延迟启动，确保Vue有足够时间初始化
    setTimeout(checkAppReady, 500);
  });
})(); 