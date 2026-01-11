/**
 * Enhanced Frontend Script
 * UX improvements: better search, debouncing, keyboard shortcuts, animations
 */
const BASE_URL = window.location.origin;
const API_PREFIX = '/api/v1';
let isRequestInProgress = false;
let apiData = null;
let currentTheme = 'dark';
let allApiElements = [];
let totalEndpoints = 0;
let totalCategories = 0;

// DOM Elements
const themeToggleBtn = document.getElementById('themeToggle');
const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
const body = document.body;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadLinkBio();
  loadApiData();
  setupKeyboardShortcuts();
  setupSearchDebounce();
  setupKeyboardNavigation();
});

/**
 * Theme Management
 */
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  currentTheme = savedTheme;
  
  if (savedTheme === 'light') {
    body.classList.add('light-mode');
    themeToggleDarkIcon.classList.add('hidden');
    themeToggleLightIcon.classList.remove('hidden');
  } else {
    body.classList.remove('light-mode');
    themeToggleDarkIcon.classList.remove('hidden');
    themeToggleLightIcon.classList.add('hidden');
  }
  
  updateSocialBadges();
}

function toggleTheme() {
  if (body.classList.contains('light-mode')) {
    body.classList.remove('light-mode');
    themeToggleDarkIcon.classList.remove('hidden');
    themeToggleLightIcon.classList.add('hidden');
    currentTheme = 'dark';
  } else {
    body.classList.add('light-mode');
    themeToggleDarkIcon.classList.add('hidden');
    themeToggleLightIcon.classList.remove('hidden');
    currentTheme = 'light';
  }
  
  localStorage.setItem('theme', currentTheme);
  updateSocialBadges();
  if (apiData) loadApis();
}

themeToggleBtn.addEventListener('click', toggleTheme);

function updateSocialBadges() {
  const isLightMode = body.classList.contains('light-mode');
  const socialBadges = document.querySelectorAll('.social-badge > div');
  
  socialBadges.forEach(badge => {
    badge.className = 'px-4 py-2 rounded-lg text-sm transition-colors';
    if (isLightMode) {
      badge.classList.add('bg-gray-100', 'text-gray-800', 'hover:bg-gray-200');
    } else {
      badge.classList.add('bg-gray-800', 'text-gray-300', 'hover:bg-gray-700');
    }
  });
}

/**
 * Toast Notifications
 */
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  const toastIcon = document.getElementById('toastIcon');
  
  toastMessage.textContent = message;
  toast.className = 'toast show ' + type;
  
  if (type === 'error') {
    toastIcon.innerHTML = '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>';
  } else {
    toastIcon.innerHTML = '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>';
  }
  
  setTimeout(() => toast.classList.remove('show'), 3000);
}

/**
 * Copy to Clipboard
 */
function copyText(text, type = 'Text') {
  navigator.clipboard.writeText(text).then(() => {
    showToast(`${type} copied to clipboard!`);
  }).catch(() => {
    showToast('Failed to copy', 'error');
  });
}

/**
 * Toggle Category
 */
function toggleCategory(index) {
  const content = document.getElementById(`cat-${index}`);
  const icon = document.getElementById(`cat-icon-${index}`);
  content.classList.toggle('hidden');
  icon.style.transform = content.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
}

/**
 * Toggle Endpoint
 */
function toggleEndpoint(catIdx, epIdx) {
  const content = document.getElementById(`ep-${catIdx}-${epIdx}`);
  const icon = document.getElementById(`ep-icon-${catIdx}-${epIdx}`);
  content.classList.toggle('hidden');
  icon.style.transform = content.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
}

/**
 * Media Preview Helper
 */
function createMediaPreview(url, contentType) {
  const type = getContentType(url, contentType);
  let previewHtml = '';
  
  switch(type) {
    case 'image':
      previewHtml = `<div class="media-preview"><img src="${url}" class="media-image" alt="Response Image" loading="lazy"></div>`;
      break;
    case 'video':
      previewHtml = `<div class="media-preview"><video controls class="media-iframe"><source src="${url}" type="${contentType || 'video/mp4'}">Your browser does not support the video tag.</video></div>`;
      break;
    case 'audio':
      previewHtml = `<div class="media-preview"><audio controls class="w-full"><source src="${url}" type="${contentType || 'audio/mpeg'}">Your browser does not support the audio tag.</audio></div>`;
      break;
    case 'pdf':
      previewHtml = `<div class="media-preview"><iframe src="${url}" class="media-iframe" frameborder="0"></iframe></div>`;
      break;
    default:
      previewHtml = `<div class="media-preview"><iframe src="${url}" class="media-iframe" frameborder="0"></iframe></div>`;
  }
  
  return previewHtml;
}

function getContentType(url, contentType) {
  if (contentType) {
    if (contentType.includes('image/')) return 'image';
    if (contentType.includes('video/')) return 'video';
    if (contentType.includes('audio/')) return 'audio';
    if (contentType.includes('application/pdf')) return 'pdf';
  }
  
  if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || 
      url.includes('.gif') || url.includes('.webp') || url.includes('.svg')) {
    return 'image';
  }
  if (url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg') || 
      url.includes('.mov') || url.includes('.avi')) {
    return 'video';
  }
  if (url.includes('.mp3') || url.includes('.wav') || url.includes('.ogg') || 
      url.includes('.m4a')) {
    return 'audio';
  }
  if (url.includes('.pdf')) return 'pdf';
  
  return 'unknown';
}

function isMediaFile(url) {
  const mediaExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico',
    '.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv',
    '.mp3', '.wav', '.ogg', '.m4a', '.flac',
    '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx'
  ];
  
  return mediaExtensions.some(ext => 
    url.toLowerCase().includes(ext) || 
    url.toLowerCase().startsWith('data:image/') ||
    url.toLowerCase().startsWith('data:video/') ||
    url.toLowerCase().startsWith('data:audio/')
  );
}

/**
 * Execute API Request
 */
async function executeRequest(e, catIdx, epIdx, method, path) {
  e.preventDefault();
  
  if (isRequestInProgress) {
    showToast('Please wait for current request', 'error');
    return;
  }

  const form = document.getElementById(`form-${catIdx}-${epIdx}`);
  const responseDiv = document.getElementById(`response-${catIdx}-${epIdx}`);
  const responseContent = document.getElementById(`response-content-${catIdx}-${epIdx}`);
  const curlSection = document.getElementById(`curl-section-${catIdx}-${epIdx}`);
  const curlCommand = document.getElementById(`curl-command-${catIdx}-${epIdx}`);
  const executeBtn = form.querySelector('button[type="submit"]');
  
  // Create spinner
  let spinner = executeBtn.querySelector('.local-spinner');
  if (!spinner) {
    spinner = document.createElement('span');
    spinner.className = 'local-spinner ml-2';
    executeBtn.appendChild(spinner);
  }
  
  isRequestInProgress = true;
  executeBtn.disabled = true;
  executeBtn.classList.add('opacity-70', 'cursor-not-allowed');
  spinner.classList.add('active');
  
  // Build URL with params
  const formData = new FormData(form);
  const params = new URLSearchParams();
  for (const [key, value] of formData.entries()) {
    if (value) params.append(key, value);
  }

  const fullPath = `${BASE_URL}${API_PREFIX}${path.split(API_PREFIX)[1].split('?')[0]}?${params.toString()}`;
  responseDiv.classList.remove('hidden');
  responseContent.innerHTML = '<div class="spinner mx-auto"></div>';
  
  const curlText = `curl -X ${method} "${fullPath}"`;
  curlCommand.textContent = curlText;
  curlSection.classList.remove('hidden');

  // Request with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(fullPath, { 
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const contentType = response.headers.get("content-type");
    
    if (contentType?.includes("application/json")) {
      const data = await response.json();
      responseContent.innerHTML = `<pre class="code-font text-sm overflow-auto whitespace-pre-wrap break-all">${JSON.stringify(data, null, 2)}</pre>`;
    } else if (contentType?.startsWith("image/")) {
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      responseContent.innerHTML = createMediaPreview(imageUrl, contentType);
    } else if (contentType?.startsWith("video/")) {
      const blob = await response.blob();
      const videoUrl = URL.createObjectURL(blob);
      responseContent.innerHTML = createMediaPreview(videoUrl, contentType);
    } else if (contentType?.startsWith("audio/")) {
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      responseContent.innerHTML = createMediaPreview(audioUrl, contentType);
    } else if (contentType?.includes("application/pdf")) {
      const blob = await response.blob();
      const pdfUrl = URL.createObjectURL(blob);
      responseContent.innerHTML = createMediaPreview(pdfUrl, contentType);
    } else {
      const text = await response.text();
      
      if (isMediaFile(text)) {
        responseContent.innerHTML = createMediaPreview(text, contentType);
      } else {
        responseContent.innerHTML = `<pre class="code-font text-sm overflow-auto whitespace-pre-wrap break-all">${text}</pre>`;
      }
    }
    
    showToast('Request completed successfully!');
    
  } catch (error) {
    clearTimeout(timeoutId);
    const errorMsg = error.name === 'AbortError' ? 'Request timeout (30s)' : error.message;
    responseContent.innerHTML = `<pre class="text-red-400 code-font text-sm">Error: ${errorMsg}</pre>`;
    showToast('Request failed!', 'error');
    
  } finally {
    isRequestInProgress = false;
    executeBtn.disabled = false;
    executeBtn.classList.remove('opacity-70', 'cursor-not-allowed');
    spinner.classList.remove('active');
  }
}

/**
 * Clear Response
 */
function clearResponse(catIdx, epIdx) {
  const responseDiv = document.getElementById(`response-${catIdx}-${epIdx}`);
  const curlSection = document.getElementById(`curl-section-${catIdx}-${epIdx}`);
  responseDiv.classList.add('hidden');
  curlSection.classList.add('hidden');
}

/**
 * Load API Data from listapi.json
 */
async function loadApiData() {
  try {
    const response = await fetch('listapi.json');
    if (!response.ok) throw new Error('Failed to load listapi.json');
    apiData = await response.json();
    
    loadApis();
  } catch (err) {
    console.error('Error loading API data:', err);
    const apiList = document.getElementById('apiList');
    apiList.innerHTML = `
      <div class="text-center p-8 bg-red-500/10 border border-red-500/30 rounded-xl">
        <div class="text-5xl mb-4">⚠️</div>
        <h3 class="font-bold text-lg mb-2">Failed to load API data</h3>
        <p class="text-sm text-text-secondary">Please check if listapi.json exists on the server</p>
      </div>
    `;
  }
}

/**
 * Load and Render APIs
 */
function loadApis() {
  const apiList = document.getElementById('apiList');
  if (!apiData || !apiData.categories) {
    apiList.innerHTML = '<p class="text-center">No API data loaded.</p>';
    return;
  }
  
  const isLightMode = body.classList.contains('light-mode');
  
  // Calculate totals
  totalEndpoints = 0;
  totalCategories = apiData.categories.length;
  
  apiData.categories.forEach(category => {
    totalEndpoints += category.items.length;
  });
  
  // Update stats
  document.getElementById('totalEndpoints').textContent = totalEndpoints;
  document.getElementById('totalCategories').textContent = totalCategories;
  
  let html = '';
  
  apiData.categories.forEach((category, catIdx) => {
    html += `
    <div class="category-group fade-in" data-category="${category.name.toLowerCase()}">
      <div class="endpoint-card card-hover">
        <button onclick="toggleCategory(${catIdx})" class="w-full px-5 py-4 flex items-center justify-between hover:bg-bg-tertiary/50 transition-colors">
          <div class="flex items-center gap-4">
            <span class="text-2xl">📁</span>
            <div class="text-left">
              <h3 class="font-bold text-lg gradient-text">${category.name}</h3>
              <p class="text-xs text-text-tertiary">${category.items.length} endpoints</p>
            </div>
          </div>
          <svg id="cat-icon-${catIdx}" class="w-5 h-5 text-text-tertiary transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        
        <div id="cat-${catIdx}" class="hidden bg-bg-tertiary/30 border-t border-border-color">`;
    
    category.items.forEach((item, epIdx) => {
      const method = 'GET';
      const pathParts = item.path.split('?');
      const path = pathParts[0];
      const endpointPath = path.replace('/api/v1', API_PREFIX);
      const queryParams = new URLSearchParams(pathParts[1] || '');

      let statusClass = 'status-ready';
      if (item.status === 'update') statusClass = 'status-update';
      if (item.status === 'error') statusClass = 'status-error';

      html += `
      <div class="api-item border-t border-border-color" 
          data-method="${method}"
          data-path="${endpointPath}"
          data-alias="${item.name.toLowerCase()}"
          data-description="${item.desc.toLowerCase()}"
          data-category="${category.name.toLowerCase()}">
        <button onclick="toggleEndpoint(${catIdx}, ${epIdx})" class="w-full px-5 py-4 flex items-center justify-between hover:bg-bg-tertiary/50 transition-colors">
          <div class="flex items-center gap-4 flex-1 min-w-0">
            <span class="method-badge">${method}</span>
            <div class="text-left flex-1 min-w-0">
              <p class="code-font font-semibold text-sm truncate text-text-primary">${endpointPath}</p>
              <div class="flex items-center gap-2 mt-1">
                <p class="text-xs text-text-secondary truncate">${item.name}</p>
                <span class="status-badge ${statusClass}">${item.status || 'ready'}</span>
              </div>
            </div>
          </div>
          <svg id="ep-icon-${catIdx}-${epIdx}" class="w-5 h-5 text-text-tertiary transition-transform duration-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        
        <div id="ep-${catIdx}-${epIdx}" class="hidden bg-bg-secondary px-5 py-4 border-t border-border-color">
          <p class="text-sm text-text-secondary mb-4">${item.desc}</p>
          
          <!-- Endpoint Info -->
          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-semibold text-sm text-text-primary">🔗 Endpoint</h4>
              <div class="flex gap-2">
                <button onclick="copyText('${endpointPath}', 'Path')" class="px-3 py-1.5 bg-bg-tertiary hover:bg-border-color rounded-lg text-xs transition-colors">
                  Copy Path
                </button>
                <button onclick="copyText('${BASE_URL}${endpointPath}', 'URL')" class="px-3 py-1.5 bg-accent-blue/20 hover:bg-accent-blue/30 text-accent-blue rounded-lg text-xs transition-colors">
                  Copy Full URL
                </button>
              </div>
            </div>
            <div class="code-font text-xs bg-bg-tertiary px-4 py-3 rounded-lg border border-border-color text-text-primary break-all">${endpointPath}</div>
          </div>`;

      if (item.status === 'ready') {
        html += `
          <!-- Try It Out Section -->
          <div>
            <h4 class="font-semibold text-sm text-text-primary mb-3">⚡ Try it out</h4>
            <form id="form-${catIdx}-${epIdx}" onsubmit="executeRequest(event, ${catIdx}, ${epIdx}, '${method}', '${endpointPath}')">
              <div class="space-y-3 mb-4">`;
        
        if (item.params) {
          Object.keys(item.params).forEach(paramName => {
            const isRequired = !queryParams.has(paramName) || queryParams.get(paramName) === '';
            html += `
              <div>
                <label class="block text-sm font-medium text-text-secondary mb-2">
                  ${paramName} ${isRequired ? '<span class="text-red-400">*</span>' : ''}
                </label>
                <input 
                  type="text" 
                  name="${paramName}" 
                  class="search-input w-full px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 code-font text-sm" 
                  placeholder="${item.params[paramName]}" 
                  ${isRequired ? 'required' : ''}
                >
              </div>`;
          });
        }
        
        html += `
              </div>
              <div class="flex gap-3 flex-wrap">
                <button type="submit" class="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-semibold text-sm transition-all flex items-center justify-center">
                  Execute Request
                  <span class="local-spinner ml-2"></span>
                </button>
                <button type="button" onclick="clearResponse(${catIdx}, ${epIdx})" class="px-6 py-2.5 bg-bg-tertiary hover:bg-border-color border border-border-color rounded-lg font-semibold text-sm transition-colors">
                  Clear
                </button>
              </div>
            </form>
          </div>
          
          <!-- cURL Section -->
          <div id="curl-section-${catIdx}-${epIdx}" class="hidden mt-4">
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-semibold text-sm text-text-primary">📟 cURL Command</h4>
              <button onclick="copyText(document.getElementById('curl-command-${catIdx}-${epIdx}').textContent, 'cURL')" class="px-3 py-1.5 bg-bg-tertiary hover:bg-border-color rounded-lg text-xs transition-colors">
                Copy cURL
              </button>
            </div>
            <div class="code-font text-xs bg-bg-tertiary px-4 py-3 rounded-lg border border-border-color text-text-primary break-all" id="curl-command-${catIdx}-${epIdx}">curl -X ${method} "${BASE_URL}${endpointPath}"</div>
          </div>
          
          <!-- Response Section -->
          <div id="response-${catIdx}-${epIdx}" class="hidden mt-4">
            <h4 class="font-semibold text-sm text-text-primary mb-2">📄 Response</h4>
            <div class="bg-bg-tertiary px-4 py-3 rounded-lg border border-border-color max-h-80 overflow-auto" id="response-content-${catIdx}-${epIdx}"></div>
          </div>`;
      } else {
        html += `<div class="px-4 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm text-yellow-400">⚠️ This endpoint is not available for testing</div>`;
      }

      html += `
        </div>
      </div>`;
    });
    
    html += `</div></div></div>`;
  });
  
  apiList.innerHTML = html;
  allApiElements = Array.from(document.querySelectorAll('.api-item'));
}

/**
 * Search Functionality
 */
function performSearch() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
  const noResults = document.getElementById('noResults');

  if (searchTerm === '') {
    document.querySelectorAll('.category-group').forEach(cat => {
      cat.classList.remove('hidden');
      cat.querySelectorAll('.api-item').forEach(item => {
        item.classList.remove('hidden');
      });
    });
    noResults.classList.add('hidden');
    return;
  }

  let hasVisibleItems = false;

  document.querySelectorAll('.category-group').forEach(category => {
    let categoryHasVisibleItems = false;
    
    category.querySelectorAll('.api-item').forEach(item => {
      const path = item.dataset.path.toLowerCase();
      const alias = item.dataset.alias;
      const desc = item.dataset.description;
      const categoryName = item.dataset.category;

      const matches = 
        path.includes(searchTerm) || 
        alias.includes(searchTerm) || 
        desc.includes(searchTerm) ||
        categoryName.includes(searchTerm);

      if (matches) {
        item.classList.remove('hidden');
        categoryHasVisibleItems = true;
        hasVisibleItems = true;
      } else {
        item.classList.add('hidden');
      }
    });

    if (categoryHasVisibleItems) {
      category.classList.remove('hidden');
    } else {
      category.classList.add('hidden');
    }
  });

  if (hasVisibleItems) {
    noResults.classList.add('hidden');
  } else {
    noResults.classList.remove('hidden');
  }
}

/**
 * Debounced Search
 */
function setupSearchDebounce() {
  let searchTimeout;
  document.getElementById('searchInput').addEventListener('input', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(performSearch, 300);
  });
}

/**
 * Keyboard Shortcuts
 */
function setupKeyboardShortcuts() {
  // Ctrl+K or Cmd+K to focus search
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.getElementById('searchInput');
      searchInput.focus();
      searchInput.select();
    }
  });
}

/**
 * Keyboard Navigation
 */
function setupKeyboardNavigation() {
  document.addEventListener('keydown', (e) => {
    // Only handle if not in input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    if (e.key === 'Escape') {
      // Clear search if active
      const searchInput = document.getElementById('searchInput');
      if (searchInput.value) {
        searchInput.value = '';
        performSearch();
      }
    }
  });
}

/**
 * Load Link Bio
 */
async function loadLinkBio() {
  try {
    const response = await fetch('linkbio.json');
    if (!response.ok) throw new Error('Failed to load linkbio.json');
    const socialData = await response.json();
    
    if (!socialData.link_bio || !Array.isArray(socialData.link_bio)) {
      throw new Error('Invalid linkbio.json format');
    }
    
    document.getElementById('socialLoading').classList.add('hidden');
    document.getElementById('socialError').classList.add('hidden');
    
    const socialContainer = document.getElementById('socialContainer');
    const isLightMode = body.classList.contains('light-mode');
    
    socialData.link_bio.forEach(social => {
      const socialElement = document.createElement('a');
      socialElement.href = social.url;
      socialElement.target = '_blank';
      socialElement.rel = 'noopener noreferrer';
      socialElement.className = 'social-badge';
      
      const innerDiv = document.createElement('div');
      innerDiv.className = 'px-5 py-2.5 rounded-lg text-sm transition-all duration-300 hover:scale-105';
      
      if (isLightMode) {
        innerDiv.classList.add('bg-gray-100', 'text-gray-800', 'hover:bg-gray-200');
      } else {
        innerDiv.classList.add('bg-gray-800', 'text-gray-300', 'hover:bg-gray-700');
      }
      
      innerDiv.textContent = social.name;
      socialElement.appendChild(innerDiv);
      socialContainer.appendChild(socialElement);
    });
    
  } catch (error) {
    console.error('Error loading link bio:', error);
    document.getElementById('socialLoading').classList.add('hidden');
    document.getElementById('socialError').classList.remove('hidden');
  }
}
