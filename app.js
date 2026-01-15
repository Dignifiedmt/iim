// app.js - COMPLETE FIXED FRONTEND FOR INTIZARUL IMAMUL MUNTAZAR
// VERSION: 4.2.0 - FIXED AND ENHANCED

const CONFIG = {
  API_URL: localStorage.getItem('iim_api_url') || 'https://script.google.com/macros/s/AKfycbweAMLu87vyBN-2mpW7nx5aPtsFJqObtAQm8opAaWRRycJW1tC8IqofToulRZc2JDkI/exec',
  MAX_PHOTO_SIZE: 2 * 1024 * 1024,
  SESSION_TIMEOUT: 30 * 60 * 1000,
  REQUEST_TIMEOUT: 30000
};

const ZONES = {
  'SOKOTO': ['Sokoto', 'Mafara', 'Yaure', 'Illela', 'Zuru', 'Yabo'],
  'KADUNA': ['Kaduna', 'Jaji', 'Mjos'],
  'ABUJA': ['Maraba', 'Lafia', 'Keffi/Doma', 'Minna', 'Suleja'],
  'ZARIA': ['Zaria', 'Danja', 'Dutsen Wai', 'Kudan', 'Soba'],
  'KANO': ['Kano', 'Kazaure', 'Potiskum', 'Gashuwa'],
  'BAUCHI': ['Bauchi', 'Gombe', 'Azare', 'Jos'],
  'MALUMFASHI': ['Malumfashi', 'Bakori', 'Katsina'],
  'NIGER': ['Niyame', 'Maradi'],
  'QUM': ['Qum']
};

const LEVELS = ['Bakiyatullah', 'Ansarullah', 'Ghalibun', 'Graduate'];

class App {
  static async init() {
    console.log('🚀 App initializing...');
    
    // Setup API URL
    await this.setupApiUrl();
    
    this.setupErrorHandling();
    this.validateSession();
    this.setupGlobalEvents();
    this.loadCurrentPage();
    
    console.log('✅ App initialized successfully');
  }

  static async setupApiUrl() {
    const savedUrl = localStorage.getItem('iim_api_url');
    
    if (savedUrl && savedUrl !== 'undefined') {
      CONFIG.API_URL = savedUrl;
      console.log('🌐 Using saved API URL:', savedUrl);
      return;
    }
    
    if (CONFIG.API_URL && !CONFIG.API_URL.includes('YOUR_NEW_GAS_WEB_APP_URL')) {
      localStorage.setItem('iim_api_url', CONFIG.API_URL);
      return;
    }
    
    await this.showApiConfigModal();
  }

  static async showApiConfigModal() {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'config-modal';
      
      const defaultUrl = 'https://script.google.com/macros/s/AKfycbweAMLu87vyBN-2mpW7nx5aPtsFJqObtAQm8opAaWRRycJW1tC8IqofToulRZc2JDkI/exec';
      
      modal.innerHTML = `
        <div class="config-modal-content">
          <h2><i class="fas fa-cogs"></i> Backend Configuration</h2>
          <p>Please enter your Google Apps Script Web App URL. This is required for the system to work.</p>
          
          <div class="form-group">
            <label>Backend URL:</label>
            <input type="text" id="apiUrlInput" value="${defaultUrl}" placeholder="https://script.google.com/macros/s/.../exec">
          </div>
          
          <div class="info-box">
            <strong>How to get this URL:</strong>
            <ol>
              <li>Deploy your Google Script as Web App</li>
              <li>Select "Execute as: Me" and "Who has access: Anyone"</li>
              <li>Copy the provided URL</li>
              <li>Paste it above</li>
            </ol>
          </div>
          
          <div class="config-modal-buttons">
            <button id="testConnectionBtn" class="config-modal-test">
              <i class="fas fa-plug"></i> Test Connection
            </button>
            <button id="saveUrlBtn" class="config-modal-save">
              <i class="fas fa-save"></i> Save & Continue
            </button>
          </div>
          
          <div id="testResult" style="display: none;"></div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      document.getElementById('testConnectionBtn').addEventListener('click', async () => {
        const url = document.getElementById('apiUrlInput').value.trim();
        if (!url) {
          this.error('Please enter a URL');
          return;
        }
        
        const resultDiv = document.getElementById('testResult');
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<div class="config-test-info"><i class="fas fa-sync fa-spin"></i> Testing connection...</div>';
        
        try {
          const response = await fetch(url, { method: 'GET' });
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              resultDiv.innerHTML = `
                <div class="config-test-success">
                  <i class="fas fa-check-circle"></i> Connection successful!
                  <div>System: ${data.system}, Version: ${data.version}</div>
                </div>
              `;
            } else {
              resultDiv.innerHTML = `
                <div class="config-test-error">
                  <i class="fas fa-exclamation-triangle"></i> Backend error: ${data.message}
                </div>
              `;
            }
          } else {
            resultDiv.innerHTML = `
              <div class="config-test-error">
                <i class="fas fa-times-circle"></i> HTTP ${response.status}: ${response.statusText}
              </div>
            `;
          }
        } catch (error) {
          resultDiv.innerHTML = `
            <div class="config-test-error">
              <i class="fas fa-unlink"></i> Connection failed: ${error.message}
            </div>
          `;
        }
      });
      
      document.getElementById('saveUrlBtn').addEventListener('click', () => {
        const url = document.getElementById('apiUrlInput').value.trim();
        if (!url) {
          this.error('Please enter a URL');
          return;
        }
        
        CONFIG.API_URL = url;
        localStorage.setItem('iim_api_url', url);
        modal.remove();
        resolve();
      });
    });
  }

  static setupErrorHandling() {
    window.addEventListener('error', (e) => {
      console.error('Global error:', e.error);
      this.error(`Application error: ${e.message}`);
    });

    window.addEventListener('unhandledrejection', (e) => {
      console.error('Unhandled promise rejection:', e.reason);
      this.error(`Operation failed: ${e.reason.message || e.reason}`);
    });

    window.addEventListener('offline', () => {
      this.error('You are offline. Some features may not work.');
    });
  }

  static validateSession() {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const loginTime = localStorage.getItem('loginTime');
    const page = location.pathname.split('/').pop();

    if (loggedIn && loginTime) {
      const sessionAge = Date.now() - new Date(loginTime).getTime();
      if (sessionAge > CONFIG.SESSION_TIMEOUT) {
        this.showSessionWarning();
        return;
      }
    }

    const role = localStorage.getItem('userRole');
    
    if (['dashboard.html', 'register.html'].includes(page) && !loggedIn) {
      location.href = 'login.html';
      return;
    }
    
    if (page === 'dashboard.html' && role !== 'admin') {
      location.href = 'login.html?role=admin';
      return;
    }
    
    if (page === 'register.html' && !['masul', 'admin'].includes(role)) {
      location.href = 'login.html?role=masul';
      return;
    }
  }

  static showSessionWarning() {
    const warning = document.createElement('div');
    warning.className = 'session-warning';
    warning.innerHTML = `
      <i class="fas fa-exclamation-triangle"></i>
      <span>Your session has expired. Please login again.</span>
      <button onclick="App.logout()" style="background:none;border:none;color:inherit;margin-left:auto;">OK</button>
    `;
    document.body.appendChild(warning);
    
    setTimeout(() => {
      warning.remove();
      App.logout();
    }, 5000);
  }

  static async api(action, data = {}) {
    console.log(`📡 API Request: ${action}`, data);
    
    if (!CONFIG.API_URL) {
      throw new Error('API URL not configured. Please set up backend URL.');
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);
    
    try {
      const requestData = {
        action,
        ...data,
        userRole: localStorage.getItem('userRole') || '',
        userBranch: localStorage.getItem('userBranch') || '',
        timestamp: Date.now(),
        clientIp: 'web_client'
      };
      
      const formData = new FormData();
      formData.append('data', JSON.stringify(requestData));
      
      const response = await fetch(CONFIG.API_URL, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      let jsonResponse;
      
      try {
        jsonResponse = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError, 'Response:', responseText);
        throw new Error('Invalid response from server');
      }
      
      if (!jsonResponse.success) {
        throw new Error(jsonResponse.message || 'Request failed');
      }
      
      return jsonResponse;
      
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('❌ API Call Failed:', error);
      
      let userMessage;
      if (error.name === 'AbortError') {
        userMessage = 'Request timeout. Please try again.';
      } else if (error.message.includes('Failed to fetch')) {
        userMessage = `Cannot connect to server. Please check your internet connection and API URL.`;
      } else {
        userMessage = error.message;
      }
      
      this.error(userMessage);
      throw error;
    }
  }

  static loading(show = true, msg = 'Loading...') {
    let loader = document.getElementById('globalLoader');
    
    if (!loader && show) {
      loader = document.createElement('div');
      loader.id = 'globalLoader';
      loader.innerHTML = `
        <div class="loading-spinner"></div>
        <p>${msg}</p>
      `;
      document.body.appendChild(loader);
    } else if (loader) {
      loader.style.display = show ? 'flex' : 'none';
      if (show && msg) {
        loader.querySelector('p').textContent = msg;
      }
    }
  }

  static error(msg) {
    console.error(`Error: ${msg}`);
    
    const existing = document.querySelector('.error-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.innerHTML = `
      <i class="fas fa-exclamation-circle"></i>
      <span>${msg}</span>
      <button onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 5000);
  }

  static success(msg) {
    console.log(`Success: ${msg}`);
    
    const existing = document.querySelector('.success-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.innerHTML = `
      <i class="fas fa-check-circle"></i>
      <span>${msg}</span>
      <button onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 3000);
  }

  static setupGlobalEvents() {
    // Password toggle
    document.addEventListener('click', (e) => {
      if (e.target.closest('.password-toggle')) {
        const btn = e.target.closest('.password-toggle');
        const input = btn.closest('.input-with-icon').querySelector('input');
        const icon = btn.querySelector('i');
        if (input.type === 'password') {
          input.type = 'text';
          icon.classList.remove('fa-eye');
          icon.classList.add('fa-eye-slash');
        } else {
          input.type = 'password';
          icon.classList.remove('fa-eye-slash');
          icon.classList.add('fa-eye');
        }
      }
    });
    
    // Form validation
    document.querySelectorAll('input[required]').forEach(input => {
      input.addEventListener('blur', () => {
        this.validateField(input);
      });
    });
  }

  static validateField(input) {
    if (!input.value.trim() && input.required) {
      input.classList.add('invalid');
      return false;
    }
    
    if (input.type === 'email' && input.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.value)) {
        input.classList.add('invalid');
        return false;
      }
    }
    
    if (input.type === 'tel' && input.value) {
      const phoneRegex = /^[0-9+\s\-\(\)]{10,15}$/;
      if (!phoneRegex.test(input.value)) {
        input.classList.add('invalid');
        return false;
      }
    }
    
    input.classList.remove('invalid');
    input.classList.add('valid');
    return true;
  }

  static loadCurrentPage() {
    const page = location.pathname.split('/').pop() || 'index.html';
    
    switch(page) {
      case 'login.html':
        this.setupLogin();
        break;
      case 'register.html':
        this.setupRegister();
        break;
      case 'dashboard.html':
        this.setupDashboard();
        break;
      case 'index.html':
        this.setupLanding();
        break;
    }
  }

  static async setupLanding() {
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    const totalBranches = Object.values(ZONES).flat().length;
    document.getElementById('totalBranches').textContent = totalBranches;
    document.getElementById('totalZones').textContent = Object.keys(ZONES).length;
    
    if (CONFIG.API_URL) {
      try {
        const response = await fetch(CONFIG.API_URL);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            document.getElementById('totalMembers').textContent = data.data?.totalMembers || 0;
            document.getElementById('totalMasul').textContent = data.data?.totalMasul || 0;
          }
        }
      } catch (error) {
        console.log('Using default stats');
      }
    }
  }

  static setupLogin() {
    const urlParams = new URLSearchParams(location.search);
    const roleParam = urlParams.get('role');
    
    if (roleParam === 'admin') {
      document.getElementById('adminBtn').click();
    } else if (roleParam === 'masul') {
      document.getElementById('masulBtn').click();
    }
    
    document.querySelectorAll('.role-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const role = btn.dataset.role;
        document.getElementById('loginTitle').textContent = 
          role === 'admin' ? 'Admin Login' : 'Branch Mas\'ul Login';
        
        document.getElementById('branchGroup').style.display = 
          role === 'masul' ? 'block' : 'none';
          
        if (role === 'masul') {
          this.populateBranches('branchSelect');
        }
      });
    });
    
    this.populateBranches('branchSelect');
    
    document.getElementById('loginForm').addEventListener('submit', async e => {
      e.preventDefault();
      
      const activeBtn = document.querySelector('.role-btn.active');
      if (!activeBtn) {
        this.error('Please select a role');
        return;
      }
      
      const role = activeBtn.dataset.role;
      const branch = document.getElementById('branchSelect').value;
      const code = document.getElementById('accessCode').value.trim();
      
      if (!code) {
        this.error('Please enter access code');
        return;
      }
      
      if (role === 'masul' && !branch) {
        this.error('Please select your branch');
        return;
      }
      
      this.loading(true, 'Authenticating...');
      
      try {
        const res = await this.api('login', { 
          role, 
          accessCode: code, 
          branch: role === 'masul' ? branch : '' 
        });
        
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', role);
        localStorage.setItem('userBranch', branch || '');
        localStorage.setItem('loginTime', new Date().toISOString());
        localStorage.setItem('userName', role === 'admin' ? 'Administrator' : `Mas'ul (${branch})`);
        
        this.success('Login successful! Redirecting...');
        
        setTimeout(() => {
          location.href = role === 'admin' ? 'dashboard.html' : 'register.html';
        }, 1500);
        
      } catch (err) {
        console.error('Login failed:', err);
      } finally {
        this.loading(false);
      }
    });
  }

  static populateBranches(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.innerHTML = '<option value="">Select Branch</option>';
    
    Object.entries(ZONES).forEach(([zone, branches]) => {
      const group = document.createElement('optgroup');
      group.label = `ZONE: ${zone}`;
      
      branches.forEach(branch => {
        const opt = document.createElement('option');
        opt.value = branch;
        opt.textContent = branch;
        group.appendChild(opt);
      });
      
      select.appendChild(group);
    });
  }

  static populateZones(selectId, branchId) {
    const zoneSel = document.getElementById(selectId);
    const branchSel = document.getElementById(branchId);
    
    if (!zoneSel || !branchSel) return;
    
    zoneSel.innerHTML = '<option value="">Select Zone</option>';
    branchSel.innerHTML = '<option value="">Select Branch</option>';
    
    Object.keys(ZONES).forEach(zone => {
      const opt = document.createElement('option');
      opt.value = zone;
      opt.textContent = zone;
      zoneSel.appendChild(opt);
    });
    
    zoneSel.addEventListener('change', () => {
      branchSel.innerHTML = '<option value="">Select Branch</option>';
      
      const selectedZone = zoneSel.value;
      if (selectedZone && ZONES[selectedZone]) {
        ZONES[selectedZone].forEach(branch => {
          const opt = document.createElement('option');
          opt.value = branch;
          opt.textContent = branch;
          branchSel.appendChild(opt);
        });
      }
    });
  }

  static populateYears(selectId) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    
    sel.innerHTML = '<option value="">Select Year</option>';
    const currentYear = new Date().getFullYear();
    
    for (let year = currentYear; year >= currentYear - 30; year--) {
      const opt = document.createElement('option');
      opt.value = year;
      opt.textContent = year;
      sel.appendChild(opt);
    }
  }

  static async compressPhoto(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }
      
      if (file.size > CONFIG.MAX_PHOTO_SIZE) {
        reject(new Error('Photo too large (maximum 2MB)'));
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          let { width, height } = img;
          
          const maxSize = 800;
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = Math.round(height * (maxSize / width));
              width = maxSize;
            } else {
              width = Math.round(width * (maxSize / height));
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          ctx.drawImage(img, 0, 0, width, height);
          
          try {
            const base64 = canvas.toDataURL('image/jpeg', 0.8);
            resolve(base64);
          } catch (error) {
            reject(new Error('Failed to compress image'));
          }
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        
        img.src = e.target.result;
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  static setupPhoto(uploadAreaId, inputId, previewId) {
    const area = document.getElementById(uploadAreaId);
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    if (!area || !input || !preview) return;
    
    area.addEventListener('click', () => input.click());
    
    ['dragover', 'dragenter'].forEach(event => {
      area.addEventListener(event, (e) => {
        e.preventDefault();
        area.classList.add('drag-over');
      });
    });
    
    ['dragleave', 'dragend', 'drop'].forEach(event => {
      area.addEventListener(event, (e) => {
        e.preventDefault();
        area.classList.remove('drag-over');
      });
    });
    
    area.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer.files.length > 0) {
        input.files = e.dataTransfer.files;
        input.dispatchEvent(new Event('change'));
      }
    });
    
    input.addEventListener('change', async () => {
      const file = input.files[0];
      
      if (!file) {
        preview.style.display = 'none';
        input.dataset.base64 = '';
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        this.error('Please select an image file (JPG, PNG)');
        input.value = '';
        preview.style.display = 'none';
        input.dataset.base64 = '';
        return;
      }
      
      try {
        this.loading(true, 'Processing image...');
        const base64 = await this.compressPhoto(file);
        preview.src = base64;
        preview.style.display = 'block';
        input.dataset.base64 = base64;
        console.log('Photo compressed successfully');
      } catch (error) {
        this.error(error.message);
        input.value = '';
        preview.style.display = 'none';
        input.dataset.base64 = '';
      } finally {
        this.loading(false);
      }
    });
  }

  static setupRegister() {
    console.log('Setting up registration page...');
    
    // Show current user info
    const userName = localStorage.getItem('userName') || 'User';
    const userBranch = localStorage.getItem('userBranch');
    document.getElementById('currentBranch').textContent = 
      userBranch ? `Branch: ${userBranch}` : `User: ${userName}`;
    
    // Admin can register Mas'ul
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'admin') {
      document.getElementById('masulToggleContainer').style.display = 'block';
    }
    
    // Initialize form elements
    this.populateZones('zone', 'branch');
    this.populateYears('recruitmentYear');
    this.setupPhoto('photoUpload', 'photoInput', 'photoPreview');
    
    // Set date limits
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
    const maxDate = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
    
    document.getElementById('birthDate')?.setAttribute('min', minDate.toISOString().split('T')[0]);
    document.getElementById('birthDate')?.setAttribute('max', maxDate.toISOString().split('T')[0]);
    document.getElementById('masulBirthDate')?.setAttribute('min', minDate.toISOString().split('T')[0]);
    document.getElementById('masulBirthDate')?.setAttribute('max', maxDate.toISOString().split('T')[0]);
    
    // Phone validation
    document.querySelectorAll('input[type="tel"]').forEach(input => {
      input.addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9+]/g, '');
      });
    });
    
    // Form tabs with improved navigation
    document.querySelectorAll('.form-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabId = tab.dataset.tab;
        
        document.querySelectorAll('.form-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(tabId + 'Tab').classList.add('active');
        
        // Update progress bar
        this.updateFormProgress(tabId);
      });
    });
    
    // Next/Previous buttons
    document.querySelectorAll('.next-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const currentTab = document.querySelector('.form-section.active');
        const currentTabId = currentTab.id.replace('Tab', '');
        const tabs = ['personal', 'contact', 'membership'];
        const currentIndex = tabs.indexOf(currentTabId);
        
        if (currentIndex < tabs.length - 1) {
          const nextTab = tabs[currentIndex + 1];
          document.querySelector(`.form-tab[data-tab="${nextTab}"]`).click();
        }
      });
    });
    
    document.querySelectorAll('.prev-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const currentTab = document.querySelector('.form-section.active');
        const currentTabId = currentTab.id.replace('Tab', '');
        const tabs = ['personal', 'contact', 'membership'];
        const currentIndex = tabs.indexOf(currentTabId);
        
        if (currentIndex > 0) {
          const prevTab = tabs[currentIndex - 1];
          document.querySelector(`.form-tab[data-tab="${prevTab}"]`).click();
        }
      });
    });
    
    // Member registration form
    document.getElementById('memberRegistrationForm').addEventListener('submit', async e => {
      e.preventDefault();
      
      // Validate all required fields first
      const requiredFields = [
        'fullName', 'firstName', 'fatherName', 'birthDate', 'gender',
        'residentialAddress', 'phone1', 'memberLevel', 'zone', 'branch',
        'recruitmentYear'
      ];
      
      let isValid = true;
      requiredFields.forEach(field => {
        const element = document.getElementById(field);
        if (element && !element.value.trim()) {
          element.classList.add('invalid');
          isValid = false;
          this.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        }
      });
      
      if (!isValid) return;
      
      // Check photo
      const photoInput = document.getElementById('photoInput');
      if (!photoInput.dataset.base64) {
        this.error('Please upload a passport photograph');
        return;
      }
      
      // Validate date
      const birthDate = new Date(document.getElementById('birthDate').value);
      const today = new Date();
      const minAge = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
      const maxAge = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
      
      if (birthDate < minAge || birthDate > maxAge) {
        this.error('Age must be between 10 and 100 years');
        return;
      }
      
      this.loading(true, 'Registering member...');
      
      try {
        const formData = {
          fullName: document.getElementById('fullName').value,
          firstName: document.getElementById('firstName').value,
          fatherName: document.getElementById('fatherName').value,
          grandfatherName: document.getElementById('grandfatherName').value,
          birthDate: document.getElementById('birthDate').value,
          gender: document.getElementById('gender').value,
          residentialAddress: document.getElementById('residentialAddress').value,
          neighborhood: document.getElementById('neighborhood').value,
          localGovernment: document.getElementById('localGovernment').value,
          state: document.getElementById('state').value,
          phone1: document.getElementById('phone1').value,
          phone2: document.getElementById('phone2').value,
          parentsGuardians: document.getElementById('parentsGuardians').value,
          parentAddress: document.getElementById('parentAddress').value,
          parentNeighborhood: document.getElementById('parentNeighborhood').value,
          parentLGA: document.getElementById('parentLGA').value,
          parentState: document.getElementById('parentState').value,
          zone: document.getElementById('zone').value,
          branch: document.getElementById('branch').value,
          recruitmentYear: document.getElementById('recruitmentYear').value,
          memberLevel: document.getElementById('memberLevel').value,
          photoBase64: photoInput.dataset.base64
        };
        
        const res = await this.api('registerMember', formData);
        this.showIdCard(res.data);
        this.success('Member registered successfully!');
      } catch (err) {
        console.error('Registration error:', err);
      } finally {
        this.loading(false);
      }
    });
    
    // Mas'ul registration toggle
    document.getElementById('masulToggle').addEventListener('change', e => {
      const showMasulForm = e.target.checked;
      
      document.getElementById('formTitle').textContent = showMasulForm 
        ? 'Mas\'ul Registration' 
        : 'Member Registration (Muntazirun)';
      
      document.getElementById('memberFormSection').style.display = showMasulForm ? 'none' : 'block';
      document.getElementById('masulFormSection').style.display = showMasulForm ? 'block' : 'none';
      
      if (showMasulForm) {
        this.populateZones('masulZone', 'masulBranch');
        this.populateYears('masulRecruitmentYear');
        this.setupPhoto('masulPhotoUpload', 'masulPhotoInput', 'masulPhotoPreview');
      }
    });
    
    // Mas'ul registration form
    document.getElementById('masulRegistrationForm').addEventListener('submit', async e => {
      e.preventDefault();
      
      const requiredFields = [
        'masulFullName', 'masulFatherName', 'masulBirthDate', 'masulEmail', 'masulPhone1',
        'masulEducationLevel', 'masulResidentialAddress', 'masulZone', 'masulBranch',
        'masulRecruitmentYear'
      ];
      
      let isValid = true;
      requiredFields.forEach(field => {
        const element = document.getElementById(field);
        if (element && !element.value.trim()) {
          element.classList.add('invalid');
          isValid = false;
          this.error(`Please fill in ${field.replace('masul', '').replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        }
      });
      
      if (!isValid) return;
      
      if (!document.getElementById('masulDeclaration').checked) {
        this.error('Please accept the declaration');
        return;
      }
      
      const photoInput = document.getElementById('masulPhotoInput');
      if (!photoInput.dataset.base64) {
        this.error('Please upload a passport photograph');
        return;
      }
      
      this.loading(true, 'Registering Mas\'ul...');
      
      try {
        const formData = {
          fullName: document.getElementById('masulFullName').value,
          fatherName: document.getElementById('masulFatherName').value,
          birthDate: document.getElementById('masulBirthDate').value,
          email: document.getElementById('masulEmail').value,
          phone1: document.getElementById('masulPhone1').value,
          phone2: document.getElementById('masulPhone2').value,
          educationLevel: document.getElementById('masulEducationLevel').value,
          courseStudying: document.getElementById('masulCourseStudying').value,
          residentialAddress: document.getElementById('masulResidentialAddress').value,
          zone: document.getElementById('masulZone').value,
          branch: document.getElementById('masulBranch').value,
          recruitmentYear: document.getElementById('masulRecruitmentYear').value,
          declaration: true,
          photoBase64: photoInput.dataset.base64
        };
        
        const res = await this.api('registerMasul', formData);
        this.showIdCard(res.data);
        this.success('Mas\'ul registered successfully!');
      } catch (err) {
        console.error('Masul registration error:', err);
      } finally {
        this.loading(false);
      }
    });
    
    // Cancel Mas'ul form
    document.getElementById('cancelMasulForm').addEventListener('click', () => {
      document.getElementById('masulToggle').checked = false;
      document.getElementById('masulToggle').dispatchEvent(new Event('change'));
    });
  }

  static updateFormProgress(currentTab) {
    const progressBar = document.getElementById('formProgress');
    if (!progressBar) return;
    
    const tabs = ['personal', 'contact', 'membership'];
    const currentIndex = tabs.indexOf(currentTab);
    const progress = ((currentIndex + 1) / tabs.length) * 100;
    
    progressBar.style.width = `${progress}%`;
    progressBar.textContent = `${Math.round(progress)}%`;
  }

  static showIdCard(data) {
    const formContainer = document.getElementById('formContainer');
    const successMessage = document.getElementById('successMessage');
    
    if (formContainer) formContainer.style.display = 'none';
    if (successMessage) successMessage.style.display = 'block';
    
    // Populate ID card
    const elements = {
      'printFullName': data.fullName,
      'printGlobalId': data.globalId,
      'printRecruitmentId': data.recruitmentId,
      'printBranch': data.branch,
      'printLevel': data.level || data.memberLevel || 'N/A',
      'printDate': new Date().toLocaleDateString('en-NG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };
    
    Object.entries(elements).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    });
    
    // Photo
    if (data.photoUrl) {
      const photoEl = document.getElementById('printPhoto');
      if (photoEl) {
        photoEl.src = data.photoUrl;
        photoEl.style.display = 'block';
        document.getElementById('photoPlaceholder').style.display = 'none';
      }
    }
    
    // Register another button
    const registerAnotherBtn = document.getElementById('registerAnother');
    if (registerAnotherBtn) {
      registerAnotherBtn.onclick = () => {
        successMessage.style.display = 'none';
        formContainer.style.display = 'block';
        document.getElementById('memberRegistrationForm').reset();
        document.getElementById('masulRegistrationForm').reset();
        document.getElementById('photoPreview').style.display = 'none';
        document.getElementById('masulPhotoPreview').style.display = 'none';
        document.getElementById('photoInput').dataset.base64 = '';
        document.getElementById('masulPhotoInput').dataset.base64 = '';
        document.querySelector('.form-tab[data-tab="personal"]').click();
      };
    }
  }

  static setupDashboard() {
    console.log('Setting up dashboard...');
    
    // Sidebar toggle
    document.getElementById('menuToggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('collapsed');
      document.querySelector('.main-content').classList.toggle('sidebar-collapsed');
    });
    
    // Menu navigation
    document.querySelectorAll('.menu-item').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        
        const section = item.dataset.section;
        if (!section) return;
        
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
        
        item.classList.add('active');
        document.getElementById(section + 'Section').classList.add('active');
        document.getElementById('pageTitle').textContent = item.textContent.trim();
        
        const methodName = `load${section.charAt(0).toUpperCase() + section.slice(1)}`;
        if (this[methodName] && typeof this[methodName] === 'function') {
          this[methodName]();
        }
        
        // Close sidebar on mobile after selection
        if (window.innerWidth < 992) {
          document.getElementById('sidebar').classList.remove('collapsed');
          document.querySelector('.main-content').classList.remove('sidebar-collapsed');
        }
      });
    });
    
    // Initialize filters
    this.populateZones('zoneFilter', 'branchFilter');
    
    // Filter events
    document.getElementById('zoneFilter').addEventListener('change', () => {
      const zone = document.getElementById('zoneFilter').value;
      const branchSel = document.getElementById('branchFilter');
      
      branchSel.innerHTML = '<option value="">All Branches</option>';
      
      if (zone && ZONES[zone]) {
        ZONES[zone].forEach(branch => {
          const opt = document.createElement('option');
          opt.value = branch;
          opt.textContent = branch;
          branchSel.appendChild(opt);
        });
      }
    });
    
    document.getElementById('applyFilters').addEventListener('click', () => this.loadMembers());
    document.getElementById('memberSearch').addEventListener('keyup', (e) => {
      if (e.key === 'Enter') this.loadMembers();
    });
    
    // Settings form
    document.getElementById('settingsForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const adminCode = document.getElementById('adminAccessCode').value;
      const masulCode = document.getElementById('masulAccessCode').value;
      
      if (!adminCode && !masulCode) {
        this.error('Please enter at least one access code');
        return;
      }
      
      this.loading(true, 'Updating settings...');
      
      try {
        await this.api('updateSettings', {
          adminAccessCode: adminCode,
          masulAccessCode: masulCode
        });
        this.success('Settings updated successfully');
      } catch (error) {
        console.error('Settings update failed:', error);
      } finally {
        this.loading(false);
      }
    });
    
    // Export buttons
    document.querySelectorAll('[data-export]').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.export;
        this.exportData(type);
      });
    });
    
    // Load initial data
    this.loadOverview();
  }

  static async loadOverview() {
    this.loading(true, 'Loading dashboard...');
    
    try {
      const res = await this.api('getStatistics');
      const stats = res.data;
      
      // Update stats grid
      const statsGrid = document.getElementById('statsGrid');
      if (statsGrid) {
        statsGrid.innerHTML = `
          <div class="stat-card">
            <span class="stat-number">${stats.totalMembers || 0}</span>
            <span class="stat-label">Total Members</span>
          </div>
          <div class="stat-card">
            <span class="stat-number">${stats.totalMasul || 0}</span>
            <span class="stat-label">Mas'ul Leaders</span>
          </div>
          <div class="stat-card">
            <span class="stat-number">${stats.brothers || 0}</span>
            <span class="stat-label">Brothers</span>
          </div>
          <div class="stat-card">
            <span class="stat-number">${stats.sisters || 0}</span>
            <span class="stat-label">Sisters</span>
          </div>
          <div class="stat-card">
            <span class="stat-number">${stats.recentMembers || 0}</span>
            <span class="stat-label">Recent (30 days)</span>
          </div>
          <div class="stat-card">
            <span class="stat-number">${stats.totalBranches || 0}</span>
            <span class="stat-label">Active Branches</span>
          </div>
        `;
      }
      
      document.getElementById('membersCount').textContent = stats.totalMembers || 0;
      document.getElementById('masulCount').textContent = stats.totalMasul || 0;
      
      this.createZoneChart(stats.membersPerBranch || {});
      this.createLevelChart(stats.membersPerLevel || {});
      
      await this.loadRecentActivity();
      
    } catch (error) {
      console.error('Failed to load overview:', error);
      this.error('Failed to load dashboard data');
    } finally {
      this.loading(false);
    }
  }

  static createZoneChart(membersPerBranch) {
    const ctx = document.getElementById('zoneChart');
    if (!ctx) return;
    
    if (ctx.chart) {
      ctx.chart.destroy();
    }
    
    const labels = Object.keys(membersPerBranch);
    const data = Object.values(membersPerBranch);
    
    ctx.chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            '#228B22', '#32CD32', '#E67E22', '#2C3E50', '#17A2B8',
            '#6F42C1', '#20C997', '#FD7E14', '#DC3545'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Members Distribution by Branch'
          }
        }
      }
    });
  }

  static createLevelChart(membersPerLevel) {
    const ctx = document.getElementById('levelChart');
    if (!ctx) return;
    
    if (ctx.chart) {
      ctx.chart.destroy();
    }
    
    const labels = Object.keys(membersPerLevel);
    const data = Object.values(membersPerLevel);
    
    ctx.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Members',
          data: data,
          backgroundColor: '#228B22'
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Members'
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Members Distribution by Level'
          }
        }
      }
    });
  }

  static async loadRecentActivity() {
    try {
      const res = await this.api('getRecentActivity');
      const activity = res.data || [];
      
      const activityList = document.getElementById('recentActivity');
      if (activityList) {
        if (activity.length === 0) {
          activityList.innerHTML = '<p class="text-muted">No recent activity</p>';
          return;
        }
        
        activityList.innerHTML = activity.map(item => `
          <div class="activity-item">
            <div class="activity-time">${new Date(item.timestamp).toLocaleString()}</div>
            <div class="activity-desc">
              <strong>${item.action}</strong>: ${item.description}
              ${item.userBranch ? `<span class="activity-branch">(${item.userBranch})</span>` : ''}
            </div>
            <div class="activity-role">${item.userRole || 'System'}</div>
          </div>
        `).join('');
      }
    } catch (error) {
      console.error('Failed to load activity:', error);
    }
  }

  static async loadMembers() {
    this.loading(true, 'Loading members...');
    
    try {
      const filters = {
        zone: document.getElementById('zoneFilter').value,
        branch: document.getElementById('branchFilter').value,
        level: document.getElementById('levelFilter').value,
        gender: document.getElementById('genderFilter').value,
        search: document.getElementById('memberSearch').value
      };
      
      const res = await this.api('getMembers', filters);
      const members = res.data || [];
      
      const tbody = document.getElementById('membersTableBody');
      if (tbody) {
        if (members.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="10" class="text-center empty-state">
                <i class="fas fa-users-slash fa-3x"></i>
                <p>No members found matching your criteria</p>
              </td>
            </tr>
          `;
        } else {
          tbody.innerHTML = members.map(member => `
            <tr>
              <td><input type="checkbox" class="selectMember" data-id="${member.id}"></td>
              <td>
                ${member.photoUrl ? 
                  `<img src="${member.photoUrl}" class="table-photo" alt="Photo">` : 
                  `<div class="photo-placeholder">IIM</div>`
                }
              </td>
              <td><code>${member.id}</code></td>
              <td><code>${member.recruitmentId}</code></td>
              <td><strong>${member.fullName}</strong></td>
              <td><span class="badge ${member.gender === 'Brother' ? 'badge-primary' : 'badge-pink'}">${member.gender}</span></td>
              <td>${member.phone}</td>
              <td>${member.branch}</td>
              <td><span class="badge badge-level-${member.level?.toLowerCase()}">${member.level}</span></td>
              <td>
                <div class="action-buttons">
                  <button class="btn-icon btn-view" onclick="App.viewMember('${member.id}')" title="View Details">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="btn-icon btn-promote" onclick="App.promoteMember('${member.id}')" title="Promote">
                    <i class="fas fa-arrow-up"></i>
                  </button>
                  <button class="btn-icon btn-transfer" onclick="App.transferMember('${member.id}')" title="Transfer">
                    <i class="fas fa-exchange-alt"></i>
                  </button>
                </div>
              </td>
            </tr>
          `).join('');
        }
      }
      
      // Select all checkbox
      const selectAll = document.getElementById('selectAllMembers');
      if (selectAll) {
        selectAll.checked = false;
        selectAll.onchange = (e) => {
          const checkboxes = document.querySelectorAll('.selectMember');
          checkboxes.forEach(cb => cb.checked = e.target.checked);
        };
      }
      
    } catch (error) {
      console.error('Failed to load members:', error);
      this.error('Failed to load members');
    } finally {
      this.loading(false);
    }
  }

  static async viewMember(id) {
    this.loading(true, 'Loading member details...');
    
    try {
      const res = await this.api('getMemberDetails', { memberId: id });
      const data = res.data;
      
      const modal = this.createMemberModal(data);
      document.body.appendChild(modal);
      
    } catch (error) {
      console.error('Failed to load member details:', error);
      this.error('Failed to load member details');
    } finally {
      this.loading(false);
    }
  }

  static createMemberModal(data) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-user"></i> Member Details</h3>
          <button class="modal-close">×</button>
        </div>
        
        <div class="modal-body">
          ${this.createMemberDetailsHTML(data)}
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Close</button>
          <button class="btn btn-primary" onclick="window.print()">
            <i class="fas fa-print"></i> Print Profile
          </button>
        </div>
      </div>
    `;
    
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    return modal;
  }

  static createMemberDetailsHTML(data) {
    return `
      <div class="member-profile">
        <div class="member-photo">
          <img src="${data.Photo_URL || 'https://via.placeholder.com/200/228B22/FFFFFF?text=IIM'}" alt="Photo">
        </div>
        <div class="member-info">
          <h4>${data.Full_Name || 'N/A'}</h4>
          <div class="info-grid">
            <div><strong>Global ID:</strong> <code>${data.Global_ID}</code></div>
            <div><strong>Recruitment ID:</strong> <code>${data.Recruitment_ID}</code></div>
            <div><strong>Type:</strong> ${data.Type}</div>
            <div><strong>Gender:</strong> ${data.Gender}</div>
            <div><strong>Branch:</strong> ${data.Branch}</div>
            <div><strong>Zone:</strong> ${data.Zone}</div>
            <div><strong>Level:</strong> ${data.Member_Level}</div>
            <div><strong>Status:</strong> ${data.Status}</div>
          </div>
        </div>
      </div>
      
      <div class="contact-section">
        <h5>Contact Information</h5>
        <div class="info-grid">
          <div><strong>Phone 1:</strong> ${data.Phone_1 || 'N/A'}</div>
          <div><strong>Phone 2:</strong> ${data.Phone_2 || 'N/A'}</div>
          <div><strong>Email:</strong> ${data.Email || 'N/A'}</div>
          <div><strong>Address:</strong> ${data.Residential_Address || 'N/A'}</div>
        </div>
      </div>
      
      ${data.Type === 'Member' ? `
        <div class="personal-section">
          <h5>Personal Information</h5>
          <div class="info-grid">
            <div><strong>Father's Name:</strong> ${data.Father_Name || 'N/A'}</div>
            <div><strong>Birth Date:</strong> ${data.Birth_Date || 'N/A'}</div>
            <div><strong>Local Government:</strong> ${data.Local_Government || 'N/A'}</div>
            <div><strong>State:</strong> ${data.State || 'N/A'}</div>
            <div><strong>Parents/Guardians:</strong> ${data.Parents_Guardians || 'N/A'}</div>
            <div><strong>Registration Date:</strong> ${new Date(data.Registration_Date).toLocaleDateString()}</div>
          </div>
        </div>
      ` : ''}
    `;
  }

  static async promoteMember(id) {
    const newLevel = prompt(`Enter new level for member ${id}:\n\nAvailable levels: ${LEVELS.join(', ')}`);
    
    if (!newLevel || !LEVELS.includes(newLevel)) {
      if (newLevel) this.error('Invalid level. Please select from: ' + LEVELS.join(', '));
      return;
    }
    
    const notes = prompt('Enter promotion notes (optional):');
    
    if (confirm(`Promote member to ${newLevel}?`)) {
      this.loading(true, 'Promoting member...');
      
      try {
        await this.api('promoteMember', { 
          memberId: id, 
          newLevel: newLevel,
          notes: notes || ''
        });
        
        this.success('Member promoted successfully!');
        this.loadMembers();
      } catch (error) {
        console.error('Promotion failed:', error);
      } finally {
        this.loading(false);
      }
    }
  }

  static async transferMember(id) {
    const allBranches = Object.values(ZONES).flat();
    
    let branchList = '';
    allBranches.forEach((branch, index) => {
      branchList += `${index + 1}. ${branch}\n`;
    });
    
    const newBranch = prompt(`Enter new branch for member ${id}:\n\nAvailable branches:\n${branchList}`);
    
    if (!newBranch || !allBranches.includes(newBranch)) {
      if (newBranch) this.error('Invalid branch. Please select from the list.');
      return;
    }
    
    const notes = prompt('Enter transfer notes (optional):');
    
    if (confirm(`Transfer member to ${newBranch}?`)) {
      this.loading(true, 'Transferring member...');
      
      try {
        await this.api('transferMember', { 
          memberId: id, 
          newBranch: newBranch,
          notes: notes || ''
        });
        
        this.success('Member transferred successfully!');
        this.loadMembers();
      } catch (error) {
        console.error('Transfer failed:', error);
      } finally {
        this.loading(false);
      }
    }
  }

  static async exportData(type) {
    if (!confirm(`Export ${type} data as CSV?`)) return;
    
    this.loading(true, 'Exporting data...');
    
    try {
      const res = await this.api('exportData', { type: type });
      const data = res.data;
      
      if (data && data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
        this.success(`Export completed! File: ${data.fileName}`);
      } else {
        throw new Error('No download URL received');
      }
    } catch (error) {
      console.error('Export failed:', error);
      this.error('Export failed: ' + (error.message || 'Unknown error'));
    } finally {
      this.loading(false);
    }
  }

  static async backupSystem() {
    if (!confirm('Create system backup? This may take a moment.')) return;
    
    this.loading(true, 'Creating backup...');
    
    try {
      const res = await this.api('backupSystem');
      const data = res.data;
      
      if (data && data.backupUrl) {
        window.open(data.backupUrl, '_blank');
        this.success('Backup created successfully!');
      } else {
        throw new Error('No backup URL received');
      }
    } catch (error) {
      console.error('Backup failed:', error);
      this.error('Backup failed: ' + (error.message || 'Unknown error'));
    } finally {
      this.loading(false);
    }
  }

  static logout() {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.clear();
      this.success('Logged out successfully');
      setTimeout(() => {
        location.href = 'index.html';
      }, 1000);
    }
  }

  static switchSection(section) {
    const item = document.querySelector(`.menu-item[data-section="${section}"]`);
    if (item) {
      item.click();
    }
  }
}

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing App...');
    App.init();
  });
} else {
  console.log('DOM already loaded, initializing App...');
  App.init();
}

// Make App available globally
window.App = App;
console.log('✅ App.js loaded successfully');          <td>
                ${m.photoUrl || m.Photo_URL ? 
                  `<img src="${m.photoUrl || m.Photo_URL}" class="table-photo" alt="Photo">` : 
                  `<div class="photo-placeholder">${(m.fullName || m.Full_Name || 'M').charAt(0)}</div>`
                }
              </td>
              <td><code>${m.id || m.Global_ID || 'N/A'}</code></td>
              <td><code>${m.recruitmentId || m.Recruitment_ID || 'N/A'}</code></td>
              <td><strong>${m.fullName || m.Full_Name || 'N/A'}</strong></td>
              <td>${m.email || m.Email || 'N/A'}</td>
              <td>${m.phone || m.Phone_1 || 'N/A'}</td>
              <td>${m.branch || m.Branch || 'N/A'}</td>
              <td>${m.recruitmentYear || m.Recruitment_Year || 'N/A'}</td>
              <td>
                <div class="action-buttons">
                  <button class="btn-icon btn-view" onclick="App.viewMember('${m.id || m.Global_ID}')">
                    <i class="fas fa-eye"></i>
                  </button>
                </div>
              </td>
            </tr>
          `).join('');
        }
      }
    } catch (error) {
      console.error('Failed to load Mas\'ul:', error);
      this.error('Failed to load Mas\'ul');
    } finally {
      this.loading(false);
    }
  }

  static async viewMember(id) {
    this.loading(true, 'Loading member details...');
    
    try {
      const res = await this.api('getMemberDetails', { memberId: id });
      const data = res.data;
      
      const modal = this.createMemberModal(data);
      document.body.appendChild(modal);
      
    } catch (error) {
      console.error('Failed to load member details:', error);
      this.error('Failed to load member details');
    } finally {
      this.loading(false);
    }
  }

  static createMemberModal(data) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      padding: 20px;
    `;
    
    modal.innerHTML = `
      <div class="modal-content" style="
        background: white;
        border-radius: 10px;
        width: 100%;
        max-width: 700px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      ">
        <div class="modal-header" style="
          padding: 20px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #228B22;
          color: white;
          border-radius: 10px 10px 0 0;
        ">
          <h3 style="margin: 0;">
            <i class="fas fa-user"></i> Member Details
          </h3>
          <button class="modal-close" style="
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: white;
          ">×</button>
        </div>
        
        <div class="modal-body" style="padding: 20px;">
          <!-- Member details will be populated here -->
        </div>
        
        <div class="modal-footer" style="
          padding: 20px;
          border-top: 1px solid #eee;
          text-align: right;
        ">
          <button class="btn btn-secondary" style="
            padding: 10px 20px;
            margin-right: 10px;
            background: #6c757d;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: 500;
          " onclick="this.closest('.modal').remove()">
            Close
          </button>
          <button class="btn btn-primary" style="
            padding: 10px 20px;
            background: #228B22;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: 500;
          " onclick="window.print()">
            <i class="fas fa-print"></i> Print Profile
          </button>
        </div>
      </div>
    `;
    
    const modalBody = modal.querySelector('.modal-body');
    modalBody.innerHTML = this.createMemberDetailsHTML(data);
    
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    return modal;
  }

  static createMemberDetailsHTML(data) {
    return `
      <div style="display: flex; gap: 30px; margin-bottom: 30px; flex-wrap: wrap;">
        <div>
          <img src="${data.Photo_URL || 'https://via.placeholder.com/200/228B22/FFFFFF?text=IIM'}" 
               style="width: 200px; height: 200px; object-fit: cover; border-radius: 10px; border: 3px solid #228B22;">
        </div>
        <div style="flex: 1; min-width: 300px;">
          <h4 style="color: #228B22; margin-top: 0; margin-bottom: 20px;">${data.Full_Name || 'N/A'}</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div><strong>Global ID:</strong> <code>${data.Global_ID}</code></div>
            <div><strong>Recruitment ID:</strong> <code>${data.Recruitment_ID}</code></div>
            <div><strong>Type:</strong> ${data.Type}</div>
            <div><strong>Gender:</strong> ${data.Gender}</div>
            <div><strong>Branch:</strong> ${data.Branch}</div>
            <div><strong>Zone:</strong> ${data.Zone}</div>
            <div><strong>Level:</strong> ${data.Member_Level}</div>
            <div><strong>Status:</strong> ${data.Status}</div>
          </div>
        </div>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h5 style="margin-top: 0; color: #666; margin-bottom: 15px;">Contact Information</h5>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div><strong>Phone 1:</strong> ${data.Phone_1 || 'N/A'}</div>
          <div><strong>Phone 2:</strong> ${data.Phone_2 || 'N/A'}</div>
          <div><strong>Email:</strong> ${data.Email || 'N/A'}</div>
          <div><strong>Address:</strong> ${data.Residential_Address || 'N/A'}</div>
        </div>
      </div>
      
      ${data.Type === 'Member' ? `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h5 style="margin-top: 0; color: #666; margin-bottom: 15px;">Personal Information</h5>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div><strong>Father's Name:</strong> ${data.Father_Name || 'N/A'}</div>
            <div><strong>Birth Date:</strong> ${data.Birth_Date || 'N/A'}</div>
            <div><strong>Local Government:</strong> ${data.Local_Government || 'N/A'}</div>
            <div><strong>State:</strong> ${data.State || 'N/A'}</div>
            <div><strong>Parents/Guardians:</strong> ${data.Parents_Guardians || 'N/A'}</div>
            <div><strong>Registration Date:</strong> ${new Date(data.Registration_Date).toLocaleDateString()}</div>
          </div>
        </div>
      ` : ''}
    `;
  }

  static async promoteMember(id) {
    const newLevel = prompt(`Enter new level for member ${id}:\n\nAvailable levels: ${LEVELS.join(', ')}`);
    
    if (!newLevel || !LEVELS.includes(newLevel)) {
      if (newLevel) this.error('Invalid level. Please select from: ' + LEVELS.join(', '));
      return;
    }
    
    const notes = prompt('Enter promotion notes (optional):');
    
    if (confirm(`Promote member to ${newLevel}?`)) {
      this.loading(true, 'Promoting member...');
      
      try {
        await this.api('promoteMember', { 
          memberId: id, 
          newLevel: newLevel,
          notes: notes || ''
        });
        
        this.success('Member promoted successfully!');
        this.loadMembers();
      } catch (error) {
        console.error('Promotion failed:', error);
      } finally {
        this.loading(false);
      }
    }
  }

  static async transferMember(id) {
    const allBranches = Object.values(ZONES).flat();
    
    let branchList = '';
    allBranches.forEach((branch, index) => {
      branchList += `${index + 1}. ${branch}\n`;
    });
    
    const newBranch = prompt(`Enter new branch for member ${id}:\n\nAvailable branches:\n${branchList}`);
    
    if (!newBranch || !allBranches.includes(newBranch)) {
      if (newBranch) this.error('Invalid branch. Please select from the list.');
      return;
    }
    
    const notes = prompt('Enter transfer notes (optional):');
    
    if (confirm(`Transfer member to ${newBranch}?`)) {
      this.loading(true, 'Transferring member...');
      
      try {
        await this.api('transferMember', { 
          memberId: id, 
          newBranch: newBranch,
          notes: notes || ''
        });
        
        this.success('Member transferred successfully!');
        this.loadMembers();
      } catch (error) {
        console.error('Transfer failed:', error);
      } finally {
        this.loading(false);
      }
    }
  }

  static async exportData(type) {
    if (!confirm(`Export ${type} data as CSV?`)) return;
    
    this.loading(true, 'Exporting data...');
    
    try {
      const res = await this.api('exportData', { type: type });
      const data = res.data;
      
      if (data && data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
        this.success(`Export completed! File: ${data.fileName}`);
      } else {
        throw new Error('No download URL received');
      }
    } catch (error) {
      console.error('Export failed:', error);
      this.error('Export failed: ' + (error.message || 'Unknown error'));
    } finally {
      this.loading(false);
    }
  }

  static async backupSystem() {
    if (!confirm('Create system backup? This may take a moment.')) return;
    
    this.loading(true, 'Creating backup...');
    
    try {
      const res = await this.api('backupSystem');
      const data = res.data;
      
      if (data && data.backupUrl) {
        window.open(data.backupUrl, '_blank');
        this.success('Backup created successfully!');
      } else {
        throw new Error('No backup URL received');
      }
    } catch (error) {
      console.error('Backup failed:', error);
      this.error('Backup failed: ' + (error.message || 'Unknown error'));
    } finally {
      this.loading(false);
    }
  }

  static logout() {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.clear();
      this.success('Logged out successfully');
      setTimeout(() => {
        location.href = 'index.html';
      }, 1000);
    }
  }

  static switchSection(section) {
    const item = document.querySelector(`.menu-item[data-section="${section}"]`);
    if (item) {
      item.click();
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing App...');
  App.init();
});

// Make App available globally
window.App = App;
console.log('App.js loaded successfully');