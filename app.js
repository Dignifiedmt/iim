// app.js - COMPLETE FIXED FRONTEND FOR INTIZARUL IMAMUL MUNTAZAR

const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbweAMLu87vyBN-2mpW7nx5aPtsFJqObtAQm8opAaWRRycJW1tC8IqofToulRZc2JDkI/exec', // Will be set from localStorage or prompt
  MAX_PHOTO_SIZE: 2 * 1024 * 1024,
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  REQUEST_TIMEOUT: 30000 // 30 seconds
};

// ZONES configuration - Should match backend
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
    console.log('App initializing...');
    
    // First, ensure we have API URL
    await this.setupApiUrl();
    
    this.setupErrorHandling();
    this.validateSession();
    this.setupGlobalEvents();
    this.loadCurrentPage();
    
    console.log('App initialized successfully');
  }

  static async setupApiUrl() {
    // Check localStorage first
    const savedUrl = localStorage.getItem('iim_api_url');
    
    if (savedUrl) {
      CONFIG.API_URL = savedUrl;
      console.log('Using saved API URL:', savedUrl);
      return;
    }
    
    // Try to get from CONFIG (if developer set it)
    if (CONFIG.API_URL && !CONFIG.API_URL.includes('YOUR_NEW_GAS_WEB_APP_URL')) {
      localStorage.setItem('iim_api_url', CONFIG.API_URL);
      return;
    }
    
    // Show configuration modal
    await this.showApiConfigModal();
  }

  static async showApiConfigModal() {
    return new Promise((resolve) => {
      // Create modal
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 99999;
        backdrop-filter: blur(5px);
      `;
      
      // Default URL from tested.html
      const defaultUrl = 'https://script.google.com/macros/s/AKfycbweAMLu87vyBN-2mpW7nx5aPtsFJqObtAQm8opAaWRRycJW1tC8IqofToulRZc2JDkI/exec';
      
      modal.innerHTML = `
        <div style="
          background: white;
          padding: 30px;
          border-radius: 15px;
          max-width: 600px;
          width: 90%;
          box-shadow: 0 20px 50px rgba(0,0,0,0.3);
        ">
          <h2 style="color: #228B22; margin-bottom: 10px;">
            <i class="fas fa-cogs"></i> Backend Configuration
          </h2>
          <p style="margin-bottom: 20px; color: #666;">
            Please enter your Google Apps Script Web App URL. This is required for the system to work.
          </p>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">
              Backend URL:
            </label>
            <input type="text" id="apiUrlInput" 
                   value="${defaultUrl}"
                   style="
                     width: 100%;
                     padding: 12px;
                     border: 2px solid #ddd;
                     border-radius: 8px;
                     font-family: monospace;
                     font-size: 14px;
                   "
                   placeholder="https://script.google.com/macros/s/.../exec">
          </div>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <strong>How to get this URL:</strong>
            <ol style="margin: 10px 0 0 20px; font-size: 14px;">
              <li>Deploy your Google Script as Web App</li>
              <li>Select "Execute as: Me" and "Who has access: Anyone"</li>
              <li>Copy the provided URL</li>
              <li>Paste it above</li>
            </ol>
          </div>
          
          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button id="testConnectionBtn" style="
              padding: 12px 24px;
              background: #228B22;
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 600;
              display: flex;
              align-items: center;
              gap: 8px;
            ">
              <i class="fas fa-plug"></i> Test Connection
            </button>
            <button id="saveUrlBtn" style="
              padding: 12px 24px;
              background: #2c3e50;
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 600;
              display: flex;
              align-items: center;
              gap: 8px;
            ">
              <i class="fas fa-save"></i> Save & Continue
            </button>
          </div>
          
          <div id="testResult" style="margin-top: 20px; display: none;"></div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Test connection
      document.getElementById('testConnectionBtn').addEventListener('click', async () => {
        const url = document.getElementById('apiUrlInput').value.trim();
        if (!url) {
          this.error('Please enter a URL');
          return;
        }
        
        const resultDiv = document.getElementById('testResult');
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
          <div style="background: #fff3cd; padding: 10px; border-radius: 5px;">
            <i class="fas fa-sync fa-spin"></i> Testing connection...
          </div>
        `;
        
        try {
          const response = await fetch(url, { method: 'GET' });
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              resultDiv.innerHTML = `
                <div style="background: #d4edda; padding: 10px; border-radius: 5px; color: #155724;">
                  <i class="fas fa-check-circle"></i> Connection successful!
                  <div style="font-size: 12px; margin-top: 5px;">
                    System: ${data.system}, Version: ${data.version}
                  </div>
                </div>
              `;
            } else {
              resultDiv.innerHTML = `
                <div style="background: #f8d7da; padding: 10px; border-radius: 5px; color: #721c24;">
                  <i class="fas fa-exclamation-triangle"></i> Backend error: ${data.message}
                </div>
              `;
            }
          } else {
            resultDiv.innerHTML = `
              <div style="background: #f8d7da; padding: 10px; border-radius: 5px; color: #721c24;">
                <i class="fas fa-times-circle"></i> HTTP ${response.status}: ${response.statusText}
              </div>
            `;
          }
        } catch (error) {
          resultDiv.innerHTML = `
            <div style="background: #f8d7da; padding: 10px; border-radius: 5px; color: #721c24;">
              <i class="fas fa-unlink"></i> Connection failed: ${error.message}
            </div>
          `;
        }
      });
      
      // Save and continue
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
    // Global error handler
    window.addEventListener('error', (e) => {
      console.error('Global error:', e.error);
      this.error(`Application error: ${e.message}`);
    });

    // Unhandled promise rejection
    window.addEventListener('unhandledrejection', (e) => {
      console.error('Unhandled promise rejection:', e.reason);
      this.error(`Operation failed: ${e.reason.message || e.reason}`);
    });

    // Network status
    window.addEventListener('online', () => {
      this.success('Back online');
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
        console.log('Session expired, logging out');
        this.logout();
        return;
      }
    }

    // Redirect unauthorized access
    if (['dashboard.html', 'register.html'].includes(page) && !loggedIn) {
      location.href = 'login.html';
      return;
    }
    
    const role = localStorage.getItem('userRole');
    if (page === 'dashboard.html' && role !== 'admin') {
      location.href = 'login.html?role=admin';
      return;
    }
    
    if (page === 'register.html' && !['masul', 'admin'].includes(role)) {
      location.href = 'login.html?role=masul';
      return;
    }
  }

  // 🔥 FIXED: Form-data API function
  static async api(action, data = {}, options = {}) {
    console.log(`📡 API Request: ${action}`, data);
    
    // Check if we have API URL
    if (!CONFIG.API_URL) {
      throw new Error('API URL not configured. Please set up backend URL.');
    }
    
    // Create abort controller for timeout
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
      
      // 🔥 FIXED: Use FormData exactly like tested.html
      const formData = new FormData();
      formData.append('data', JSON.stringify(requestData));
      
      console.log('Form data prepared:', Object.fromEntries(formData));
      
      const response = await fetch(CONFIG.API_URL, {
        method: 'POST',
        body: formData,
        signal: controller.signal
        // 🔥 NO headers - FormData sets content-type automatically
      });
      
      clearTimeout(timeoutId);
      
      console.log(`📡 Response Status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      console.log(`📡 Raw Response (first 500 chars):`, responseText.substring(0, 500));
      
      let jsonResponse;
      try {
        jsonResponse = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError, 'Response:', responseText);
        throw new Error('Invalid response from server');
      }
      
      if (!jsonResponse.success) {
        console.error(`❌ API Error: ${jsonResponse.message}`);
        throw new Error(jsonResponse.message || 'Request failed');
      }
      
      console.log(`✅ API Success: ${action}`);
      return jsonResponse;
      
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('❌ API Call Failed:', error);
      
      let userMessage;
      if (error.name === 'AbortError') {
        userMessage = 'Request timeout. Please try again.';
      } else if (error.message.includes('Failed to fetch')) {
        userMessage = `Cannot connect to server. Please check:
1. Your internet connection
2. The API URL is correct: ${CONFIG.API_URL}
3. The Google Script is deployed as Web App`;
      } else if (error.message.includes('HTTP')) {
        userMessage = `Server error: ${error.message}`;
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
      loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        color: white;
        font-size: 18px;
        backdrop-filter: blur(5px);
      `;
      
      loader.innerHTML = `
        <div class="loading-spinner" style="
          width: 60px;
          height: 60px;
          border: 5px solid rgba(255,255,255,0.3);
          border-top: 5px solid #228B22;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        "></div>
        <p style="text-align: center; max-width: 300px;">${msg}</p>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;
      
      document.body.appendChild(loader);
    } else if (loader) {
      loader.style.display = show ? 'flex' : 'none';
    }
  }

  static error(msg) {
    console.error(`Error: ${msg}`);
    
    // Remove existing error
    const existing = document.querySelector('.error-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #dc3545;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 400px;
      animation: slideIn 0.3s ease;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    
    toast.innerHTML = `
      <i class="fas fa-exclamation-circle" style="font-size: 20px; flex-shrink: 0;"></i>
      <span>${msg}</span>
      <button onclick="this.parentElement.remove()" style="
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        margin-left: auto;
        padding: 0 5px;
      ">×</button>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }
    }, 5000);
    
    // Add animations if not exists
    if (!document.getElementById('toastAnimations')) {
      const style = document.createElement('style');
      style.id = 'toastAnimations';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  static success(msg) {
    console.log(`Success: ${msg}`);
    
    const existing = document.querySelector('.success-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 400px;
      animation: slideIn 0.3s ease;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    
    toast.innerHTML = `
      <i class="fas fa-check-circle" style="font-size: 20px; flex-shrink: 0;"></i>
      <span>${msg}</span>
      <button onclick="this.parentElement.remove()" style="
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        margin-left: auto;
        padding: 0 5px;
      ">×</button>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }
    }, 3000);
  }

  static setupGlobalEvents() {
    // Password toggle
    document.querySelectorAll('.password-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
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
      });
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
      input.style.borderColor = '#dc3545';
      return false;
    }
    
    if (input.type === 'email' && input.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.value)) {
        input.style.borderColor = '#dc3545';
        return false;
      }
    }
    
    if (input.type === 'tel' && input.value) {
      const phoneRegex = /^[0-9+\s\-\(\)]{10,15}$/;
      if (!phoneRegex.test(input.value)) {
        input.style.borderColor = '#dc3545';
        return false;
      }
    }
    
    input.style.borderColor = '';
    return true;
  }

  static loadCurrentPage() {
    const page = location.pathname.split('/').pop() || 'index.html';
    console.log(`Loading page: ${page}`);
    
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
    console.log('Setting up landing page...');
    
    // Update current year
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    // Update branch count from ZONES
    const totalBranches = Object.values(ZONES).flat().length;
    document.getElementById('totalBranches').textContent = totalBranches;
    document.getElementById('totalZones').textContent = Object.keys(ZONES).length;
    
    // Try to load live stats if API is available
    if (CONFIG.API_URL) {
      try {
        // 🔥 FIXED: Simple GET without query params
        const response = await fetch(CONFIG.API_URL);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            document.getElementById('totalMembers').textContent = data.data?.totalMembers || 0;
            document.getElementById('totalMasul').textContent = data.data?.totalMasul || 0;
            // Already set totalBranches above
          }
        }
      } catch (error) {
        console.log('Could not load live stats, using defaults');
      }
    }
  }

  static setupLogin() {
    console.log('Setting up login page...');
    
    // Remove default credentials from display (security)
    const accessNote = document.querySelector('.access-note');
    if (accessNote) {
      accessNote.innerHTML = `
        <strong>Access Codes:</strong><br>
        • Contact your administrator for access codes<br>
        <small>Default codes should be changed after first login</small>
      `;
    }
    
    const urlParams = new URLSearchParams(location.search);
    const roleParam = urlParams.get('role');
    
    if (roleParam === 'admin') {
      document.getElementById('adminBtn').click();
    } else if (roleParam === 'masul') {
      document.getElementById('masulBtn').click();
    }
    
    // Role selection
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
    
    // Login form
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
        // Error shown by api() function
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
          
          // Calculate new dimensions
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
          
          // Draw and compress
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
    area.addEventListener('dragover', (e) => {
      e.preventDefault();
      area.style.borderColor = '#228B22';
      area.style.backgroundColor = 'rgba(34, 139, 34, 0.1)';
    });
    
    area.addEventListener('dragleave', () => {
      area.style.borderColor = '';
      area.style.backgroundColor = '';
    });
    
    area.addEventListener('drop', (e) => {
      e.preventDefault();
      area.style.borderColor = '';
      area.style.backgroundColor = '';
      
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
    
    // Form tabs
    document.querySelectorAll('.form-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabId = tab.dataset.tab;
        
        document.querySelectorAll('.form-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(tabId + 'Tab').classList.add('active');
      });
    });
    
    // Member registration form
    document.getElementById('memberRegistrationForm').addEventListener('submit', async e => {
      e.preventDefault();
      
      // Collect form data
      const formData = {};
      const elements = e.target.elements;
      
      for (let element of elements) {
        if (element.name || element.id) {
          const key = element.name || element.id;
          if (element.type === 'checkbox') {
            formData[key] = element.checked;
          } else if (element.type === 'file') {
            formData[key] = element.dataset.base64 || '';
          } else {
            formData[key] = element.value.trim();
          }
        }
      }
      
      // Required fields validation
      const requiredFields = [
        'fullName', 'firstName', 'fatherName', 'birthDate', 'gender',
        'residentialAddress', 'phone1', 'memberLevel', 'zone', 'branch',
        'recruitmentYear'
      ];
      
      for (const field of requiredFields) {
        if (!formData[field]) {
          this.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
          return;
        }
      }
      
      if (!formData.photoBase64) {
        this.error('Please upload a passport photograph');
        return;
      }
      
      // Validate date
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      const minAge = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
      const maxAge = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
      
      if (birthDate < minAge || birthDate > maxAge) {
        this.error('Age must be between 10 and 100 years');
        return;
      }
      
      this.loading(true, 'Registering member...');
      
      try {
        const res = await this.api('registerMember', formData);
        console.log('Registration successful:', res);
        this.showIdCard(res.data);
        this.success('Member registered successfully!');
      } catch (err) {
        console.error('Registration error:', err);
        // Error shown by api()
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
      
      const formData = {};
      const elements = e.target.elements;
      
      for (let element of elements) {
        if (element.name || element.id) {
          const key = element.name || element.id;
          if (element.type === 'checkbox') {
            formData[key] = element.checked;
          } else if (element.type === 'file') {
            formData[key] = element.dataset.base64 || '';
          } else {
            formData[key] = element.value.trim();
          }
        }
      }
      
      // Required fields for Mas'ul
      const requiredFields = [
        'fullName', 'fatherName', 'birthDate', 'email', 'phone1',
        'educationLevel', 'residentialAddress', 'zone', 'branch',
        'recruitmentYear'
      ];
      
      for (const field of requiredFields) {
        if (!formData[field]) {
          this.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
          return;
        }
      }
      
      if (!formData.photoBase64) {
        this.error('Please upload a passport photograph');
        return;
      }
      
      if (!formData.declaration) {
        this.error('Please accept the declaration');
        return;
      }
      
      this.loading(true, 'Registering Mas\'ul...');
      
      try {
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
        document.getElementById('photoPreview').style.display = 'none';
        document.getElementById('photoInput').dataset.base64 = '';
      };
    }
  }

  static setupDashboard() {
    console.log('Setting up dashboard...');
    
    // Sidebar toggle
    document.getElementById('menuToggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('active');
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
        
        // Load section data
        const methodName = `load${section.charAt(0).toUpperCase() + section.slice(1)}`;
        if (this[methodName] && typeof this[methodName] === 'function') {
          this[methodName]();
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
      
      // Update counters
      document.getElementById('membersCount').textContent = stats.totalMembers || 0;
      document.getElementById('masulCount').textContent = stats.totalMasul || 0;
      
      // Create charts
      this.createZoneChart(stats.membersPerBranch || {});
      this.createLevelChart(stats.membersPerLevel || {});
      
      // Load recent activity
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
    
    // Destroy existing chart
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
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right',
          },
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
          backgroundColor: '#228B22',
          borderColor: '#1a6b1a',
          borderWidth: 1
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
          },
          x: {
            title: {
              display: true,
              text: 'Member Level'
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
              <td colspan="10" class="text-center">
                <p style="padding: 40px; color: #666;">No members found matching your criteria</p>
              </td>
            </tr>
          `;
        } else {
          tbody.innerHTML = members.map(member => `
            <tr>
              <td><input type="checkbox" class="selectMember" data-id="${member.id}"></td>
              <td>
                ${member.photoUrl ? 
                  `<img src="${member.photoUrl}" class="table-photo" alt="Photo" onerror="this.src='https://via.placeholder.com/50/228B22/FFFFFF?text=IIM'">` : 
                  `<div class="photo-placeholder">IIM</div>`
                }
              </td>
              <td><code>${member.id}</code></td>
              <td><code>${member.recruitmentId}</code></td>
              <td><strong>${member.fullName}</strong></td>
              <td><span class="badge ${member.gender === 'Brother' ? 'badge-primary' : 'badge-pink'}">${member.gender}</span></td>
              <td>${member.phone}</td>
              <td>${member.branch}</td>
              <td><span class="badge badge-level-${member.level.toLowerCase()}">${member.level}</span></td>
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
      
      // Create modal with member details
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
    
    // Populate modal body
    const modalBody = modal.querySelector('.modal-body');
    modalBody.innerHTML = this.createMemberDetailsHTML(data);
    
    // Close modal on X click
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    
    // Close modal on background click
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