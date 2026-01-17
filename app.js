// app.js - COMPLETE FRONTEND APPLICATION FOR INTIZARUL IMAMUL MUNTAZAR
// VERSION: 5.0.0 - COMPLETE REWRITE WITH STATE MANAGEMENT

/**
 * 🚀 APPLICATION CONFIGURATION
 */
const AppConfig = {
    // API Configuration
    API_URL: localStorage.getItem('iim_api_url') || 'https://script.google.com/macros/s/AKfycbweAMLu87vyBN-2mpW7nx5aPtsFJqObtAQm8opAaWRRycJW1tC8IqofToulRZc2JDkI/exec',
    
    // System Settings
    SYSTEM_NAME: 'Intizarul Imamul Muntazar',
    VERSION: '5.0.0',
    
    // Validation Rules
    MIN_AGE: 8, // Minimum age requirement
    MAX_AGE: 100, // Maximum age
    MAX_PHOTO_SIZE: 2 * 1024 * 1024, // 2MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
    
    // Session Management
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    REQUEST_TIMEOUT: 30000, // 30 seconds
    
    // UI Settings
    ITEMS_PER_PAGE: 20,
    DEBOUNCE_DELAY: 300,
    
    // Default Access Codes
    DEFAULT_ACCESS_CODES: {
        admin: 'Muntazirun',
        masul: 'Muntazir'
    }
};

/**
 * 📊 APPLICATION STATE MANAGEMENT
 */
const AppState = {
    // User Session
    user: {
        isLoggedIn: false,
        role: null,
        branch: null,
        name: null,
        loginTime: null
    },
    
    // Registration Form State
    registration: {
        currentStep: 1,
        totalSteps: 4,
        formData: {},
        photoBase64: null,
        isMasulMode: false
    },
    
    // Dashboard State
    dashboard: {
        currentSection: 'overview',
        filters: {},
        pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0
        },
        charts: {},
        searchQuery: ''
    },
    
    // API Cache
    cache: {
        members: [],
        masul: [],
        statistics: null,
        zones: null,
        lastUpdated: null
    },
    
    // UI State
    ui: {
        isLoading: false,
        toastQueue: [],
        modals: {}
    }
};

/**
 * 🌐 ZONES AND BRANCHES DATA
 */
const ZonesData = {
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

/**
 * 🎓 MEMBER LEVELS
 */
const MemberLevels = [
    { value: 'Bakiyatullah', label: 'Bakiyatullah', order: 1 },
    { value: 'Ansarullah', label: 'Ansarullah', order: 2 },
    { value: 'Ghalibun', label: 'Ghalibun', order: 3 },
    { value: 'Graduate', label: 'Graduate', order: 4 }
];

/**
 * 🚀 APPLICATION CLASS
 */
class Application {
    /**
     * ========================
     * INITIALIZATION
     * ========================
     */
    
    static async init() {
        console.log('🚀 Application initializing...');
        
        try {
            // Load user session
            this.loadUserSession();
            
            // Initialize based on current page
            const page = window.location.pathname.split('/').pop();
            
            switch(page) {
                case 'login.html':
                    await this.initLoginPage();
                    break;
                case 'register.html':
                    await this.initRegistrationPage();
                    break;
                case 'dashboard.html':
                    await this.initDashboard();
                    break;
                case 'index.html':
                    await this.initLandingPage();
                    break;
                default:
                    await this.initLandingPage();
            }
            
            // Setup global event listeners
            this.setupGlobalEvents();
            
            console.log('✅ Application initialized successfully');
        } catch (error) {
            console.error('❌ Application initialization failed:', error);
            this.showError('Failed to initialize application');
        }
    }
    
    /**
     * ========================
     * USER SESSION MANAGEMENT
     * ========================
     */
    
    static loadUserSession() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const loginTime = localStorage.getItem('loginTime');
        
        if (isLoggedIn && loginTime) {
            const sessionAge = Date.now() - new Date(loginTime).getTime();
            
            if (sessionAge > AppConfig.SESSION_TIMEOUT) {
                this.logout();
                return;
            }
            
            AppState.user = {
                isLoggedIn: true,
                role: localStorage.getItem('userRole'),
                branch: localStorage.getItem('userBranch'),
                name: localStorage.getItem('userName'),
                loginTime: new Date(loginTime)
            };
        }
    }
    
    static saveUserSession(userData) {
        AppState.user = {
            isLoggedIn: true,
            role: userData.role,
            branch: userData.branch || null,
            name: userData.name || (userData.role === 'admin' ? 'Administrator' : `Mas'ul (${userData.branch})`),
            loginTime: new Date()
        };
        
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', userData.role);
        localStorage.setItem('userBranch', userData.branch || '');
        localStorage.setItem('userName', AppState.user.name);
        localStorage.setItem('loginTime', AppState.user.loginTime.toISOString());
        
        this.showSuccess('Login successful!');
    }
    
    static logout() {
        if (confirm('Are you sure you want to logout?')) {
            // Clear all state
            AppState.user = {
                isLoggedIn: false,
                role: null,
                branch: null,
                name: null,
                loginTime: null
            };
            
            // Clear localStorage
            localStorage.clear();
            
            // Redirect to login
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
            
            this.showSuccess('Logged out successfully');
        }
    }
    
    static validateSession() {
        const page = window.location.pathname.split('/').pop();
        
        // Protected pages require login
        const protectedPages = ['dashboard.html', 'register.html'];
        
        if (protectedPages.includes(page) && !AppState.user.isLoggedIn) {
            window.location.href = 'login.html';
            return false;
        }
        
        // Role-based access control
        if (page === 'dashboard.html' && AppState.user.role !== 'admin') {
            window.location.href = 'login.html?role=admin';
            return false;
        }
        
        if (page === 'register.html' && !['masul', 'admin'].includes(AppState.user.role)) {
            window.location.href = 'login.html?role=masul';
            return false;
        }
        
        return true;
    }
    
    /**
     * ========================
     * API COMMUNICATION
     * ========================
     */
    
    static async apiRequest(action, data = {}) {
        // Show loading indicator
        this.showLoading(true);
        
        // Create request payload
        const payload = {
            action,
            ...data,
            userRole: AppState.user.role || '',
            userBranch: AppState.user.branch || '',
            timestamp: new Date().toISOString()
        };
        
        // Create form data
        const formData = new FormData();
        formData.append('data', JSON.stringify(payload));
        
        try {
            // Set timeout controller
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), AppConfig.REQUEST_TIMEOUT);
            
            // Make request
            const response = await fetch(AppConfig.API_URL, {
                method: 'POST',
                body: formData,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Parse response
            const responseText = await response.text();
            let result;
            
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                throw new Error('Invalid JSON response from server');
            }
            
            if (!result.success) {
                throw new Error(result.message || 'Request failed');
            }
            
            // Cache successful responses
            if (['getStatistics', 'getMembers', 'getAllZonesBranches'].includes(action)) {
                this.cacheResponse(action, result.data);
            }
            
            return result;
            
        } catch (error) {
            console.error(`❌ API Request failed (${action}):`, error);
            
            let userMessage;
            if (error.name === 'AbortError') {
                userMessage = 'Request timeout. Please try again.';
            } else if (error.message.includes('Failed to fetch')) {
                userMessage = 'Cannot connect to server. Please check your internet connection.';
            } else {
                userMessage = error.message;
            }
            
            this.showError(userMessage);
            throw error;
            
        } finally {
            this.showLoading(false);
        }
    }
    
    static cacheResponse(action, data) {
        const now = Date.now();
        
        switch(action) {
            case 'getStatistics':
                AppState.cache.statistics = data;
                AppState.cache.lastUpdated = now;
                break;
            case 'getMembers':
                AppState.cache.members = data;
                AppState.cache.lastUpdated = now;
                break;
            case 'getAllZonesBranches':
                AppState.cache.zones = data;
                AppState.cache.lastUpdated = now;
                break;
        }
    }
    
    static isCacheValid(key) {
        if (!AppState.cache.lastUpdated) return false;
        
        const cacheAge = Date.now() - AppState.cache.lastUpdated;
        const cacheTimeout = 5 * 60 * 1000; // 5 minutes
        
        return cacheAge < cacheTimeout && AppState.cache[key];
    }
    
    /**
     * ========================
     * LOGIN PAGE
     * ========================
     */
    
    static async initLoginPage() {
        console.log('🔐 Initializing login page...');
        
        // Check backend status
        await this.checkBackendStatus();
        
        // Setup role selector
        this.setupRoleSelector();
        
        // Populate branches
        this.populateBranches();
        
        // Setup form submission
        this.setupLoginForm();
        
        // Setup password toggle
        this.setupPasswordToggle();
        
        // Auto-focus access code
        setTimeout(() => {
            const accessCodeInput = document.getElementById('accessCode');
            if (accessCodeInput) accessCodeInput.focus();
        }, 100);
    }
    
    static async checkBackendStatus() {
        const backendInfo = document.getElementById('backendInfo');
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        
        if (!backendInfo || !statusDot || !statusText) return;
        
        try {
            const response = await fetch(AppConfig.API_URL);
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.success) {
                    statusDot.className = 'status-dot online';
                    statusText.textContent = `Connected to ${data.system} v${data.version}`;
                    backendInfo.style.display = 'flex';
                } else {
                    statusDot.className = 'status-dot offline';
                    statusText.textContent = 'Backend error';
                    backendInfo.style.display = 'flex';
                }
            } else {
                statusDot.className = 'status-dot offline';
                statusText.textContent = `HTTP ${response.status}`;
                backendInfo.style.display = 'flex';
            }
        } catch (error) {
            statusDot.className = 'status-dot offline';
            statusText.textContent = 'Cannot connect';
            backendInfo.style.display = 'flex';
        }
    }
    
    static setupRoleSelector() {
        const adminBtn = document.getElementById('adminBtn');
        const masulBtn = document.getElementById('masulBtn');
        const branchGroup = document.getElementById('branchGroup');
        
        if (!adminBtn || !masulBtn) return;
        
        const setActiveRole = (role) => {
            // Update button states
            adminBtn.classList.toggle('active', role === 'admin');
            masulBtn.classList.toggle('active', role === 'masul');
            
            // Show/hide branch selection
            if (branchGroup) {
                branchGroup.style.display = role === 'masul' ? 'block' : 'none';
            }
            
            // Update form title
            const loginTitle = document.querySelector('.login-title');
            if (loginTitle) {
                loginTitle.textContent = role === 'admin' 
                    ? 'Admin Login' 
                    : 'Branch Mas\'ul Login';
            }
        };
        
        // Set initial role from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const roleParam = urlParams.get('role');
        
        if (roleParam === 'admin') {
            setActiveRole('admin');
        } else if (roleParam === 'masul') {
            setActiveRole('masul');
        }
        
        // Add click handlers
        adminBtn.addEventListener('click', () => setActiveRole('admin'));
        masulBtn.addEventListener('click', () => setActiveRole('masul'));
    }
    
    static populateBranches() {
        const branchSelect = document.getElementById('branchSelect');
        if (!branchSelect) return;
        
        branchSelect.innerHTML = '<option value="">-- Select Branch --</option>';
        
        // Add zones and branches
        Object.entries(ZonesData).forEach(([zone, branches]) => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = `Zone: ${zone}`;
            
            branches.forEach(branch => {
                const option = document.createElement('option');
                option.value = branch;
                option.textContent = branch;
                optgroup.appendChild(option);
            });
            
            branchSelect.appendChild(optgroup);
        });
    }
    
    static setupLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (!loginForm) return;
        
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get active role
            const activeRole = document.querySelector('.role-option.active');
            if (!activeRole) {
                this.showError('Please select a role');
                return;
            }
            
            const role = activeRole.dataset.role;
            const branch = role === 'masul' ? document.getElementById('branchSelect').value : '';
            const accessCode = document.getElementById('accessCode').value.trim();
            
            // Validate inputs
            let isValid = true;
            
            if (!accessCode) {
                this.showFieldError('accessCode', 'Access code is required');
                isValid = false;
            } else {
                this.clearFieldError('accessCode');
            }
            
            if (role === 'masul' && !branch) {
                this.showFieldError('branchSelect', 'Please select your branch');
                isValid = false;
            } else {
                this.clearFieldError('branchSelect');
            }
            
            if (!isValid) return;
            
            // Disable login button
            const loginBtn = document.getElementById('loginBtn');
            const originalText = loginBtn.innerHTML;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
            loginBtn.disabled = true;
            
            try {
                // Make API request
                const result = await this.apiRequest('login', {
                    role,
                    accessCode,
                    branch: role === 'masul' ? branch : ''
                });
                
                // Save user session
                this.saveUserSession({
                    role,
                    branch: result.data?.branch || '',
                    name: result.data?.role === 'admin' ? 'Administrator' : `Mas'ul (${branch})`
                });
                
                // Redirect based on role
                setTimeout(() => {
                    window.location.href = role === 'admin' ? 'dashboard.html' : 'register.html';
                }, 1500);
                
            } catch (error) {
                // Reset button
                loginBtn.innerHTML = originalText;
                loginBtn.disabled = false;
            }
        });
    }
    
    static setupPasswordToggle() {
        const toggleBtn = document.getElementById('togglePassword');
        const passwordInput = document.getElementById('accessCode');
        
        if (!toggleBtn || !passwordInput) return;
        
        toggleBtn.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            
            const icon = toggleBtn.querySelector('i');
            icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
        });
    }
    
    /**
     * ========================
     * REGISTRATION PAGE
     * ========================
     */
    
    static async initRegistrationPage() {
        console.log('📝 Initializing registration page...');
        
        // Validate session
        if (!this.validateSession()) return;
        
        // Update user info display
        this.updateUserInfo();
        
        // Setup role toggle (admin only)
        this.setupMasulToggle();
        
        // Initialize form steps
        this.initFormSteps();
        
        // Populate dynamic fields
        this.populateRegistrationFields();
        
        // Setup photo upload
        this.setupPhotoUpload();
        
        // Setup form validation
        this.setupFormValidation();
        
        // Setup form submission
        this.setupRegistrationSubmission();
    }
    
    static updateUserInfo() {
        const currentBranch = document.getElementById('currentBranch');
        const currentRole = document.getElementById('currentRole');
        
        if (currentBranch) {
            currentBranch.textContent = AppState.user.branch 
                ? `Branch: ${AppState.user.branch}` 
                : 'System Admin';
        }
        
        if (currentRole) {
            currentRole.textContent = AppState.user.role === 'admin' 
                ? 'Administrator' 
                : 'Branch Mas\'ul';
        }
    }
    
    static setupMasulToggle() {
        const toggleContainer = document.getElementById('roleToggleContainer');
        const masulToggle = document.getElementById('masulToggle');
        const formTitle = document.getElementById('formTitle');
        
        if (!toggleContainer || !masulToggle || !formTitle) return;
        
        // Only show toggle for admin users
        if (AppState.user.role === 'admin') {
            toggleContainer.style.display = 'block';
            
            masulToggle.addEventListener('change', (e) => {
                const isMasulMode = e.target.checked;
                AppState.registration.isMasulMode = isMasulMode;
                
                // Update form title
                formTitle.textContent = isMasulMode 
                    ? 'Mas\'ul Registration' 
                    : 'Member Registration (Muntazirun)';
                
                // Show/hide forms
                const memberForm = document.getElementById('step1');
                const masulForm = document.getElementById('masulForm');
                
                if (memberForm) memberForm.style.display = isMasulMode ? 'none' : 'block';
                if (masulForm) masulForm.style.display = isMasulMode ? 'block' : 'none';
                
                // Reset form state
                if (isMasulMode) {
                    this.initMasulForm();
                } else {
                    this.resetFormSteps();
                }
            });
        }
    }
    
    static initFormSteps() {
        // Setup progress bar
        this.updateProgressBar();
        
        // Setup step indicators
        const steps = document.querySelectorAll('.step');
        steps.forEach(step => {
            step.addEventListener('click', () => {
                const stepNumber = parseInt(step.dataset.step);
                if (stepNumber <= AppState.registration.currentStep) {
                    this.goToStep(stepNumber);
                }
            });
        });
    }
    
    static updateProgressBar() {
        const progressBar = document.getElementById('progressBar');
        if (!progressBar) return;
        
        const progress = (AppState.registration.currentStep / AppState.registration.totalSteps) * 100;
        progressBar.style.width = `${progress}%`;
        
        // Update active step
        document.querySelectorAll('.step').forEach(step => {
            const stepNumber = parseInt(step.dataset.step);
            
            step.classList.remove('active', 'completed');
            
            if (stepNumber === AppState.registration.currentStep) {
                step.classList.add('active');
            } else if (stepNumber < AppState.registration.currentStep) {
                step.classList.add('completed');
            }
        });
    }
    
    static goToStep(stepNumber) {
        // Validate current step before moving
        if (!this.validateCurrentStep()) return;
        
        // Update current step
        AppState.registration.currentStep = stepNumber;
        
        // Hide all steps
        document.querySelectorAll('.form-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show current step
        const currentStep = document.getElementById(`step${stepNumber}`);
        if (currentStep) {
            currentStep.classList.add('active');
        }
        
        // Update progress bar
        this.updateProgressBar();
        
        // Update navigation buttons
        this.updateNavigationButtons();
    }
    
    static nextStep() {
        if (AppState.registration.currentStep < AppState.registration.totalSteps) {
            this.goToStep(AppState.registration.currentStep + 1);
        }
    }
    
    static previousStep() {
        if (AppState.registration.currentStep > 1) {
            this.goToStep(AppState.registration.currentStep - 1);
        }
    }
    
    static validateCurrentStep() {
        const currentStep = AppState.registration.currentStep;
        let isValid = true;
        
        switch(currentStep) {
            case 1: // Personal Info
                isValid = this.validatePersonalInfo();
                break;
            case 2: // Contact Details
                isValid = this.validateContactDetails();
                break;
            case 3: // Membership Details
                isValid = this.validateMembershipDetails();
                break;
        }
        
        if (!isValid) {
            this.showError('Please fill in all required fields correctly');
        }
        
        return isValid;
    }
    
    static validatePersonalInfo() {
        const requiredFields = ['fullName', 'firstName', 'fatherName', 'birthDate', 'gender'];
        let isValid = true;
        
        requiredFields.forEach(field => {
            const element = document.getElementById(field);
            if (element && element.required && !element.value.trim()) {
                this.showFieldError(field, 'This field is required');
                isValid = false;
            } else {
                this.clearFieldError(field);
            }
        });
        
        // Validate age (minimum 8 years)
        const birthDateInput = document.getElementById('birthDate');
        if (birthDateInput && birthDateInput.value) {
            const birthDate = new Date(birthDateInput.value);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            
            if (age < AppConfig.MIN_AGE) {
                this.showFieldError('birthDate', `Age must be at least ${AppConfig.MIN_AGE} years`);
                isValid = false;
            } else if (age > AppConfig.MAX_AGE) {
                this.showFieldError('birthDate', `Age must be less than ${AppConfig.MAX_AGE} years`);
                isValid = false;
            }
        }
        
        return isValid;
    }
    
    static validateContactDetails() {
        const requiredFields = ['residentialAddress', 'phone1'];
        let isValid = true;
        
        requiredFields.forEach(field => {
            const element = document.getElementById(field);
            if (element && element.required && !element.value.trim()) {
                this.showFieldError(field, 'This field is required');
                isValid = false;
            } else {
                this.clearFieldError(field);
            }
        });
        
        // Validate phone number format
        const phoneInput = document.getElementById('phone1');
        if (phoneInput && phoneInput.value) {
            const phoneRegex = /^[0-9+\s\-\(\)]{10,15}$/;
            if (!phoneRegex.test(phoneInput.value)) {
                this.showFieldError('phone1', 'Please enter a valid phone number');
                isValid = false;
            }
        }
        
        return isValid;
    }
    
    static validateMembershipDetails() {
        const requiredFields = ['zone', 'branch', 'recruitmentYear', 'memberLevel'];
        let isValid = true;
        
        requiredFields.forEach(field => {
            const element = document.getElementById(field);
            if (element && element.required && !element.value.trim()) {
                this.showFieldError(field, 'This field is required');
                isValid = false;
            } else {
                this.clearFieldError(field);
            }
        });
        
        // Validate photo
        const photoInput = document.getElementById('photoInput');
        if (photoInput && photoInput.required && !photoInput.dataset.base64) {
            this.showError('Please upload a passport photograph');
            isValid = false;
        }
        
        return isValid;
    }
    
    static populateRegistrationFields() {
        // Populate zones and branches
        this.populateZonesBranches();
        
        // Populate years (last 30 years)
        this.populateYears();
        
        // Set date limits for birth date
        this.setDateLimits();
        
        // Setup phone validation
        this.setupPhoneValidation();
    }
    
    static populateZonesBranches() {
        const zoneSelect = document.getElementById('zone');
        const branchSelect = document.getElementById('branch');
        
        if (!zoneSelect || !branchSelect) return;
        
        // Clear existing options
        zoneSelect.innerHTML = '<option value="">Select Zone</option>';
        branchSelect.innerHTML = '<option value="">Select Branch</option>';
        
        // Add zones
        Object.keys(ZonesData).forEach(zone => {
            const option = document.createElement('option');
            option.value = zone;
            option.textContent = zone;
            zoneSelect.appendChild(option);
        });
        
        // Zone change handler
        zoneSelect.addEventListener('change', () => {
            const selectedZone = zoneSelect.value;
            branchSelect.innerHTML = '<option value="">Select Branch</option>';
            
            if (selectedZone && ZonesData[selectedZone]) {
                ZonesData[selectedZone].forEach(branch => {
                    const option = document.createElement('option');
                    option.value = branch;
                    option.textContent = branch;
                    branchSelect.appendChild(option);
                });
            }
        });
    }
    
    static populateYears() {
        const yearSelects = document.querySelectorAll('select[id$="Year"]');
        
        yearSelects.forEach(select => {
            const currentYear = new Date().getFullYear();
            select.innerHTML = '<option value="">Select Year</option>';
            
            for (let year = currentYear; year >= currentYear - 30; year--) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                select.appendChild(option);
            }
        });
    }
    
    static setDateLimits() {
        const birthDateInputs = document.querySelectorAll('input[type="date"]');
        const today = new Date();
        
        birthDateInputs.forEach(input => {
            const maxDate = new Date(today.getFullYear() - AppConfig.MIN_AGE, today.getMonth(), today.getDate());
            const minDate = new Date(today.getFullYear() - AppConfig.MAX_AGE, today.getMonth(), today.getDate());
            
            input.max = maxDate.toISOString().split('T')[0];
            input.min = minDate.toISOString().split('T')[0];
        });
    }
    
    static setupPhoneValidation() {
        const phoneInputs = document.querySelectorAll('input[type="tel"]');
        
        phoneInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9+]/g, '');
            });
        });
    }
    
    static setupPhotoUpload() {
        const uploadArea = document.getElementById('photoUploadArea');
        const photoInput = document.getElementById('photoInput');
        const photoPreview = document.getElementById('photoPreview');
        
        if (!uploadArea || !photoInput || !photoPreview) return;
        
        // Click to upload
        uploadArea.addEventListener('click', () => photoInput.click());
        
        // Drag and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.add('drag-over');
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.remove('drag-over');
            }, false);
        });
        
        uploadArea.addEventListener('drop', handleDrop, false);
        
        function handleDrop(e) {
            const dt = e.dataTransfer;
            const file = dt.files[0];
            
            if (file && file.type.startsWith('image/')) {
                photoInput.files = dt.files;
                photoInput.dispatchEvent(new Event('change'));
            }
        }
        
        // File selection
        photoInput.addEventListener('change', async () => {
            const file = photoInput.files[0];
            
            if (!file) {
                photoPreview.style.display = 'none';
                photoInput.dataset.base64 = '';
                return;
            }
            
            // Validate file type
            if (!AppConfig.ALLOWED_IMAGE_TYPES.includes(file.type)) {
                this.showError('Please upload only JPG or PNG images');
                photoInput.value = '';
                return;
            }
            
            // Validate file size
            if (file.size > AppConfig.MAX_PHOTO_SIZE) {
                this.showError(`Image too large. Maximum size is ${AppConfig.MAX_PHOTO_SIZE / (1024 * 1024)}MB`);
                photoInput.value = '';
                return;
            }
            
            try {
                this.showLoading(true, 'Processing image...');
                
                // Compress and convert to base64
                const base64 = await this.compressImage(file);
                
                // Update preview
                photoPreview.src = base64;
                photoPreview.classList.add('show');
                
                // Store base64 data
                photoInput.dataset.base64 = base64;
                
                // Mark as valid
                photoInput.classList.remove('error');
                photoInput.classList.add('success');
                
                this.showSuccess('Photo uploaded successfully');
                
            } catch (error) {
                this.showError('Failed to process image: ' + error.message);
                photoInput.value = '';
                photoPreview.style.display = 'none';
                photoInput.dataset.base64 = '';
            } finally {
                this.showLoading(false);
            }
        });
    }
    
    static async compressImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Calculate new dimensions (max 800px)
                    let { width, height } = img;
                    const maxSize = 800;
                    
                    if (width > maxSize || height > maxSize) {
                        if (width > height) {
                            height = Math.round((height * maxSize) / width);
                            width = maxSize;
                        } else {
                            width = Math.round((width * maxSize) / height);
                            height = maxSize;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Draw and compress
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    try {
                        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
                        resolve(compressedBase64);
                    } catch (error) {
                        reject(new Error('Image compression failed'));
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
    
    static setupFormValidation() {
        // Real-time validation for required fields
        document.querySelectorAll('[required]').forEach(field => {
            field.addEventListener('blur', () => {
                if (!field.value.trim()) {
                    this.showFieldError(field.id, 'This field is required');
                } else {
                    this.clearFieldError(field.id);
                    
                    // Additional validation for specific fields
                    if (field.type === 'tel') {
                        const phoneRegex = /^[0-9+\s\-\(\)]{10,15}$/;
                        if (!phoneRegex.test(field.value)) {
                            this.showFieldError(field.id, 'Please enter a valid phone number');
                        }
                    }
                }
            });
        });
    }
    
    static setupRegistrationSubmission() {
        const submitBtn = document.querySelector('button[onclick*="submitRegistration"]');
        if (!submitBtn) return;
        
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.submitRegistration();
        });
    }
    
    static async submitRegistration() {
        // Validate all steps
        if (!this.validateCurrentStep()) return;
        
        // Gather form data
        const formData = this.gatherFormData();
        
        // Determine API endpoint
        const endpoint = AppState.registration.isMasulMode ? 'registerMasul' : 'registerMember';
        
        // Show loading
        this.showLoading(true, 'Registering...');
        
        try {
            // Make API request
            const result = await this.apiRequest(endpoint, formData);
            
            if (result.success) {
                // Show success state
                this.showRegistrationSuccess(result.data);
            } else {
                throw new Error(result.message || 'Registration failed');
            }
            
        } catch (error) {
            console.error('Registration failed:', error);
            this.showError('Registration failed: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }
    
    static gatherFormData() {
        const formData = {};
        
        // Get all form fields
        const fields = document.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            if (field.id && !field.id.includes('toggle')) {
                const key = field.id.replace('masul', '');
                formData[key] = field.value;
            }
        });
        
        // Add photo base64
        const photoInput = document.getElementById('photoInput');
        if (photoInput && photoInput.dataset.base64) {
            formData.photoBase64 = photoInput.dataset.base64;
        }
        
        // Add user info
        formData.userRole = AppState.user.role;
        formData.userBranch = AppState.user.branch;
        
        return formData;
    }
    
    static showRegistrationSuccess(data) {
        // Hide form
        const formContainer = document.querySelector('.form-container');
        if (formContainer) formContainer.style.display = 'none';
        
        // Show success state
        const successState = document.querySelector('.success-state');
        if (successState) successState.classList.add('active');
        
        // Update success details
        this.updateSuccessDetails(data);
        
        // Go to step 4
        this.goToStep(4);
    }
    
    static updateSuccessDetails(data) {
        const elements = {
            'successName': data.fullName,
            'successGlobalId': data.globalId,
            'successRecruitmentId': data.recruitmentId,
            'successBranch': data.branch,
            'successLevel': data.level || data.memberLevel || 'N/A',
            'successDate': new Date().toLocaleDateString('en-NG', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
        
        // Update photo
        const successPhoto = document.getElementById('successPhoto');
        if (successPhoto && data.photoUrl) {
            successPhoto.src = data.photoUrl;
            successPhoto.style.display = 'block';
        }
    }
    
    static resetForm() {
        // Reset form state
        AppState.registration.currentStep = 1;
        AppState.registration.photoBase64 = null;
        
        // Reset form fields
        const forms = document.querySelectorAll('form');
        forms.forEach(form => form.reset());
        
        // Clear photo preview
        const photoPreview = document.getElementById('photoPreview');
        if (photoPreview) {
            photoPreview.style.display = 'none';
            photoPreview.classList.remove('show');
        }
        
        // Clear photo input
        const photoInput = document.getElementById('photoInput');
        if (photoInput) {
            photoInput.dataset.base64 = '';
            photoInput.value = '';
        }
        
        // Hide success state
        const successState = document.querySelector('.success-state');
        if (successState) successState.classList.remove('active');
        
        // Show form container
        const formContainer = document.querySelector('.form-container');
        if (formContainer) formContainer.style.display = 'block';
        
        // Go to step 1
        this.goToStep(1);
    }
    
    /**
     * ========================
     * DASHBOARD
     * ========================
     */
    
    static async initDashboard() {
        console.log('📊 Initializing dashboard...');
        
        // Validate session
        if (!this.validateSession()) return;
        
        // Setup UI
        this.setupDashboardUI();
        
        // Load initial data
        await this.loadDashboardData();
        
        // Setup event listeners
        this.setupDashboardEvents();
    }
    
    static setupDashboardUI() {
        // Update user info in sidebar
        this.updateDashboardUserInfo();
        
        // Setup sidebar toggle
        this.setupSidebarToggle();
        
        // Setup menu navigation
        this.setupMenuNavigation();
        
        // Setup search functionality
        this.setupSearch();
        
        // Setup filters
        this.setupFilters();
    }
    
    static updateDashboardUserInfo() {
        const userName = document.getElementById('sidebarUserName');
        const userRole = document.getElementById('sidebarUserRole');
        
        if (userName) userName.textContent = AppState.user.name;
        if (userRole) userRole.textContent = AppState.user.role === 'admin' ? 'System Admin' : 'Branch Mas\'ul';
    }
    
    static setupSidebarToggle() {
        const menuToggle = document.querySelector('.menu-toggle');
        const sidebar = document.getElementById('sidebar');
        
        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
            });
        }
    }
    
    static setupMenuNavigation() {
        const menuItems = document.querySelectorAll('.menu-item');
        
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                const section = item.dataset.section;
                if (!section) return;
                
                // Update active item
                menuItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                // Update page title
                const pageTitle = document.getElementById('pageTitle');
                if (pageTitle) {
                    pageTitle.textContent = item.textContent.trim();
                }
                
                // Switch section
                this.switchSection(section);
            });
        });
    }
    
    static switchSection(section) {
        // Update state
        AppState.dashboard.currentSection = section;
        
        // Hide all sections
        document.querySelectorAll('.dashboard-section').forEach(sec => {
            sec.classList.remove('active');
        });
        
        // Show active section
        const activeSection = document.getElementById(`${section}Section`);
        if (activeSection) {
            activeSection.classList.add('active');
        }
        
        // Load section data
        this.loadSectionData(section);
    }
    
    static async loadSectionData(section) {
        switch(section) {
            case 'overview':
                await this.loadOverview();
                break;
            case 'members':
                await this.loadMembers();
                break;
            case 'masul':
                await this.loadMasul();
                break;
            case 'branches':
                await this.loadBranches();
                break;
            case 'promotions':
                await this.loadPromotions();
                break;
            case 'transfers':
                await this.loadTransfers();
                break;
            case 'reports':
                await this.loadReports();
                break;
            case 'logs':
                await this.loadLogs();
                break;
            case 'settings':
                await this.loadSettings();
                break;
        }
    }
    
    static setupSearch() {
        const searchInput = document.getElementById('globalSearch');
        if (!searchInput) return;
        
        let searchTimeout;
        
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            
            searchTimeout = setTimeout(() => {
                const query = e.target.value.trim();
                AppState.dashboard.searchQuery = query;
                
                // Apply search to current section
                this.applySearch(query);
            }, AppConfig.DEBOUNCE_DELAY);
        });
    }
    
    static applySearch(query) {
        const currentSection = AppState.dashboard.currentSection;
        
        switch(currentSection) {
            case 'members':
                this.filterMembersTable(query);
                break;
            case 'masul':
                this.filterMasulTable(query);
                break;
            case 'branches':
                this.filterBranchesTable(query);
                break;
            case 'logs':
                this.filterLogsTable(query);
                break;
        }
    }
    
    static setupFilters() {
        // Setup zone and branch filters
        this.populateFilterZones();
        
        // Setup filter apply events
        const applyButtons = document.querySelectorAll('[onclick*="loadMembers"], [onclick*="loadMasul"], [onclick*="loadLogs"]');
        applyButtons.forEach(button => {
            const originalOnClick = button.getAttribute('onclick');
            button.removeAttribute('onclick');
            
            button.addEventListener('click', () => {
                // Update filters from current section
                this.updateCurrentFilters();
                
                // Call original function
                if (originalOnClick.includes('loadMembers')) {
                    this.loadMembers();
                } else if (originalOnClick.includes('loadMasul')) {
                    this.loadMasul();
                } else if (originalOnClick.includes('loadLogs')) {
                    this.loadLogs();
                }
            });
        });
    }
    
    static populateFilterZones() {
        const zoneFilters = document.querySelectorAll('select[id$="ZoneFilter"]');
        
        zoneFilters.forEach(filter => {
            filter.innerHTML = '<option value="">All Zones</option>';
            
            Object.keys(ZonesData).forEach(zone => {
                const option = document.createElement('option');
                option.value = zone;
                option.textContent = zone;
                filter.appendChild(option);
            });
            
            // Update branches when zone changes
            filter.addEventListener('change', () => {
                const zone = filter.value;
                const branchFilterId = filter.id.replace('Zone', 'Branch');
                const branchFilter = document.getElementById(branchFilterId);
                
                if (branchFilter) {
                    branchFilter.innerHTML = '<option value="">All Branches</option>';
                    
                    if (zone && ZonesData[zone]) {
                        ZonesData[zone].forEach(branch => {
                            const option = document.createElement('option');
                            option.value = branch;
                            option.textContent = branch;
                            branchFilter.appendChild(option);
                        });
                    }
                }
            });
        });
    }
    
    static updateCurrentFilters() {
        const section = AppState.dashboard.currentSection;
        
        switch(section) {
            case 'members':
                AppState.dashboard.filters = {
                    zone: document.getElementById('zoneFilter')?.value || '',
                    branch: document.getElementById('branchFilter')?.value || '',
                    level: document.getElementById('levelFilter')?.value || '',
                    gender: document.getElementById('genderFilter')?.value || '',
                    status: document.getElementById('statusFilter')?.value || ''
                };
                break;
            case 'masul':
                AppState.dashboard.filters = {
                    zone: document.getElementById('masulZoneFilter')?.value || '',
                    branch: document.getElementById('masulBranchFilter')?.value || ''
                };
                break;
            case 'logs':
                AppState.dashboard.filters = {
                    dateFrom: document.getElementById('logDateFrom')?.value || '',
                    dateTo: document.getElementById('logDateTo')?.value || '',
                    actionType: document.getElementById('logActionType')?.value || '',
                    userRole: document.getElementById('logUserRole')?.value || ''
                };
                break;
        }
    }
    
    static async loadDashboardData() {
        try {
            // Load statistics
            await this.loadStatistics();
            
            // Load initial section data
            await this.loadSectionData(AppState.dashboard.currentSection);
            
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.showError('Failed to load dashboard data');
        }
    }
    
    static async loadStatistics() {
        try {
            const result = await this.apiRequest('getStatistics');
            
            if (result.success) {
                AppState.cache.statistics = result.data;
                this.updateStatsDisplay(result.data);
            }
        } catch (error) {
            console.error('Failed to load statistics:', error);
        }
    }
    
    static updateStatsDisplay(stats) {
        // Update stat cards
        const statsGrid = document.getElementById('statsGrid');
        if (statsGrid) {
            statsGrid.innerHTML = `
                <div class="stat-card">
                    <div class="stat-icon members">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-number">${stats.totalMembers || 0}</span>
                        <span class="stat-label">Total Members</span>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon masul">
                        <i class="fas fa-user-shield"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-number">${stats.totalMasul || 0}</span>
                        <span class="stat-label">Mas'ul Leaders</span>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #17a2b8, #138496);">
                        <i class="fas fa-male"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-number">${stats.brothers || 0}</span>
                        <span class="stat-label">Brothers</span>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #e83e8c, #c2185b);">
                        <i class="fas fa-female"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-number">${stats.sisters || 0}</span>
                        <span class="stat-label">Sisters</span>
                    </div>
                </div>
            `;
        }
        
        // Update menu badges
        const membersBadge = document.getElementById('membersBadge');
        const masulBadge = document.getElementById('masulBadge');
        const branchesBadge = document.getElementById('branchesBadge');
        
        if (membersBadge) membersBadge.textContent = stats.totalMembers || 0;
        if (masulBadge) masulBadge.textContent = stats.totalMasul || 0;
        if (branchesBadge) branchesBadge.textContent = stats.totalBranches || 0;
        
        // Create charts
        this.createCharts(stats);
    }
    
    static createCharts(stats) {
        // Branch distribution chart
        this.createBranchChart(stats.membersPerBranch || {});
        
        // Level distribution chart
        this.createLevelChart(stats.membersPerLevel || {});
    }
    
    static createBranchChart(data) {
        const ctx = document.getElementById('branchChart');
        if (!ctx) return;
        
        // Destroy existing chart
        if (ctx.chartInstance) {
            ctx.chartInstance.destroy();
        }
        
        const labels = Object.keys(data);
        const values = Object.values(data);
        
        ctx.chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
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
                    title: {
                        display: true,
                        text: 'Members Distribution by Branch'
                    },
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }
    
    static createLevelChart(data) {
        const ctx = document.getElementById('levelChart');
        if (!ctx) return;
        
        // Destroy existing chart
        if (ctx.chartInstance) {
            ctx.chartInstance.destroy();
        }
        
        const labels = Object.keys(data);
        const values = Object.values(data);
        
        ctx.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Number of Members',
                    data: values,
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
    
    static async loadMembers() {
        try {
            const filters = AppState.dashboard.filters;
            const searchQuery = AppState.dashboard.searchQuery;
            
            // Build query parameters
            const queryParams = { ...filters };
            if (searchQuery) {
                queryParams.search = searchQuery;
            }
            
            // Make API request
            const result = await this.apiRequest('getMembers', queryParams);
            
            if (result.success) {
                AppState.cache.members = result.data || [];
                this.renderMembersTable(result.data || []);
            }
        } catch (error) {
            console.error('Failed to load members:', error);
            this.showError('Failed to load members');
        }
    }
    
    static renderMembersTable(members) {
        const tbody = document.getElementById('membersTableBody');
        if (!tbody) return;
        
        if (members.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="11" class="empty-state">
                        <i class="fas fa-users-slash"></i>
                        <p>No members found</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = members.map(member => `
            <tr>
                <td>
                    <input type="checkbox" class="member-checkbox" value="${member.id || member.globalId}">
                </td>
                <td>
                    ${member.photoUrl ? 
                        `<img src="${member.photoUrl}" class="member-photo" alt="${member.fullName}">` : 
                        `<div class="photo-placeholder">${(member.fullName || '').charAt(0) || 'M'}</div>`
                    }
                </td>
                <td><code>${member.id || member.globalId}</code></td>
                <td><code>${member.recruitmentId}</code></td>
                <td><strong>${member.fullName}</strong></td>
                <td>
                    <span class="badge ${member.gender === 'Brother' ? 'badge-primary' : 'badge-pink'}">
                        ${member.gender}
                    </span>
                </td>
                <td>${member.phone || member.phone1}</td>
                <td>${member.branch}</td>
                <td>
                    <span class="badge badge-level-${(member.level || '').toLowerCase()}">
                        ${member.level}
                    </span>
                </td>
                <td>
                    <span class="badge ${member.status === 'Active' ? 'badge-success' : 'badge-secondary'}">
                        ${member.status}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action view" onclick="App.viewMember('${member.id || member.globalId}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action promote" onclick="App.promoteMember('${member.id || member.globalId}')">
                            <i class="fas fa-arrow-up"></i>
                        </button>
                        <button class="btn-action transfer" onclick="App.transferMember('${member.id || member.globalId}')">
                            <i class="fas fa-exchange-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        // Setup select all checkbox
        this.setupSelectAllCheckbox();
    }
    
    static async loadMasul() {
        try {
            // For now, filter members with type='Masul'
            // In a real implementation, you'd have a separate API endpoint
            const allMembers = AppState.cache.members || [];
            const masul = allMembers.filter(m => m.type === 'Masul');
            
            this.renderMasulTable(masul);
        } catch (error) {
            console.error('Failed to load masul:', error);
            this.showError('Failed to load masul');
        }
    }
    
    static renderMasulTable(masul) {
        const tbody = document.getElementById('masulTableBody');
        if (!tbody) return;
        
        if (masul.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="empty-state">
                        <i class="fas fa-user-shield"></i>
                        <p>No Mas'ul leaders found</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = masul.map(m => `
            <tr>
                <td>
                    ${m.photoUrl ? 
                        `<img src="${m.photoUrl}" class="member-photo" alt="${m.fullName}">` : 
                        `<div class="photo-placeholder">M</div>`
                    }
                </td>
                <td><code>${m.id || m.globalId}</code></td>
                <td><code>${m.recruitmentId}</code></td>
                <td><strong>${m.fullName}</strong></td>
                <td>${m.email}</td>
                <td>${m.phone || m.phone1}</td>
                <td>${m.branch}</td>
                <td>${m.zone}</td>
                <td>${m.recruitmentYear}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action view" onclick="App.viewMember('${m.id || m.globalId}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    static async loadBranches() {
        try {
            // Calculate branch statistics
            const members = AppState.cache.members || [];
            const branches = {};
            
            members.forEach(member => {
                if (!member.branch) return;
                
                if (!branches[member.branch]) {
                    branches[member.branch] = {
                        members: 0,
                        brothers: 0,
                        sisters: 0,
                        masul: 0,
                        lastRegistration: null
                    };
                }
                
                branches[member.branch].members++;
                
                if (member.gender === 'Brother') {
                    branches[member.branch].brothers++;
                } else if (member.gender === 'Sister') {
                    branches[member.branch].sisters++;
                }
                
                if (member.type === 'Masul') {
                    branches[member.branch].masul++;
                }
                
                // Update last registration date
                const regDate = new Date(member.registrationDate || member.Registration_Date);
                if (!branches[member.branch].lastRegistration || regDate > branches[member.branch].lastRegistration) {
                    branches[member.branch].lastRegistration = regDate;
                }
            });
            
            this.renderBranchesTable(branches);
        } catch (error) {
            console.error('Failed to load branches:', error);
            this.showError('Failed to load branches');
        }
    }
    
    static renderBranchesTable(branches) {
        const tbody = document.getElementById('branchesTableBody');
        if (!tbody) return;
        
        const branchEntries = Object.entries(branches);
        
        if (branchEntries.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="empty-state">
                        <i class="fas fa-code-branch"></i>
                        <p>No branch data available</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = branchEntries.map(([branchName, stats]) => {
            // Find zone for this branch
            let zone = '';
            Object.entries(ZonesData).forEach(([zoneName, branchList]) => {
                if (branchList.includes(branchName)) {
                    zone = zoneName;
                }
            });
            
            return `
                <tr>
                    <td>${zone}</td>
                    <td><strong>${branchName}</strong></td>
                    <td>${stats.members}</td>
                    <td>${stats.brothers}</td>
                    <td>${stats.sisters}</td>
                    <td>${stats.masul}</td>
                    <td>${stats.lastRegistration ? stats.lastRegistration.toLocaleDateString() : 'N/A'}</td>
                    <td>
                        <span class="badge badge-success">
                            Active
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-action view" onclick="App.viewBranch('${branchName}')">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    static setupSelectAllCheckbox() {
        const selectAll = document.getElementById('selectAllMembers');
        if (!selectAll) return;
        
        selectAll.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.member-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = e.target.checked;
            });
        });
    }
    
    static filterMembersTable(query) {
        const rows = document.querySelectorAll('#membersTableBody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
        });
    }
    
    static filterMasulTable(query) {
        const rows = document.querySelectorAll('#masulTableBody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
        });
    }
    
    static filterBranchesTable(query) {
        const rows = document.querySelectorAll('#branchesTableBody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
        });
    }
    
    static filterLogsTable(query) {
        const rows = document.querySelectorAll('#logsTableBody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
        });
    }
    
    static async viewMember(memberId) {
        try {
            const result = await this.apiRequest('getMemberDetails', { memberId });
            
            if (result.success) {
                this.showMemberModal(result.data);
            }
        } catch (error) {
            console.error('Failed to load member details:', error);
            this.showError('Failed to load member details');
        }
    }
    
    static showMemberModal(memberData) {
        // Create modal HTML
        const modalHTML = `
            <div class="modal-header">
                <h3 class="modal-title">
                    <i class="fas fa-user"></i> Member Details
                </h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
            </div>
            
            <div class="modal-body">
                <div style="display: flex; gap: 2rem; margin-bottom: 2rem; flex-wrap: wrap;">
                    <div>
                        <img src="${memberData.Photo_URL || 'https://via.placeholder.com/200/228B22/FFFFFF?text=IIM'}" 
                             style="width: 200px; height: 200px; object-fit: cover; border-radius: 10px; border: 3px solid #228B22;">
                    </div>
                    <div style="flex: 1; min-width: 300px;">
                        <h4 style="color: #228B22; margin-bottom: 1rem;">${memberData.Full_Name}</h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div><strong>Global ID:</strong> <code>${memberData.Global_ID}</code></div>
                            <div><strong>Recruitment ID:</strong> <code>${memberData.Recruitment_ID}</code></div>
                            <div><strong>Type:</strong> ${memberData.Type}</div>
                            <div><strong>Gender:</strong> ${memberData.Gender}</div>
                            <div><strong>Branch:</strong> ${memberData.Branch}</div>
                            <div><strong>Zone:</strong> ${memberData.Zone}</div>
                            <div><strong>Level:</strong> ${memberData.Member_Level}</div>
                            <div><strong>Status:</strong> ${memberData.Status}</div>
                        </div>
                    </div>
                </div>
                
                <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin-bottom: 1.5rem;">
                    <h5 style="margin-top: 0; color: #495057; margin-bottom: 1rem;">
                        <i class="fas fa-address-card"></i> Contact Information
                    </h5>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div><strong>Phone 1:</strong> ${memberData.Phone_1 || 'N/A'}</div>
                        <div><strong>Phone 2:</strong> ${memberData.Phone_2 || 'N/A'}</div>
                        <div><strong>Email:</strong> ${memberData.Email || 'N/A'}</div>
                        <div><strong>Address:</strong> ${memberData.Residential_Address || 'N/A'}</div>
                    </div>
                </div>
                
                ${memberData.Type === 'Member' ? `
                    <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px;">
                        <h5 style="margin-top: 0; color: #495057; margin-bottom: 1rem;">
                            <i class="fas fa-user-circle"></i> Personal Information
                        </h5>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div><strong>Father's Name:</strong> ${memberData.Father_Name || 'N/A'}</div>
                            <div><strong>Birth Date:</strong> ${memberData.Birth_Date || 'N/A'}</div>
                            <div><strong>Local Government:</strong> ${memberData.Local_Government || 'N/A'}</div>
                            <div><strong>State:</strong> ${memberData.State || 'N/A'}</div>
                            <div><strong>Registration Date:</strong> ${new Date(memberData.Registration_Date).toLocaleDateString()}</div>
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                    Close
                </button>
                <button class="btn btn-primary" onclick="window.print()">
                    <i class="fas fa-print"></i> Print
                </button>
            </div>
        `;
        
        // Create and show modal
        this.showModal(modalHTML, 'modal-lg');
    }
    
    static async promoteMember(memberId) {
        const newLevel = prompt('Enter new level (Bakiyatullah, Ansarullah, Ghalibun, Graduate):');
        
        if (!newLevel || !['Bakiyatullah', 'Ansarullah', 'Ghalibun', 'Graduate'].includes(newLevel)) {
            this.showError('Invalid level. Please enter a valid level.');
            return;
        }
        
        const notes = prompt('Enter promotion notes (optional):');
        
        if (confirm(`Promote member to ${newLevel}?`)) {
            try {
                await this.apiRequest('promoteMember', {
                    memberId,
                    newLevel,
                    notes: notes || ''
                });
                
                this.showSuccess('Member promoted successfully!');
                await this.loadMembers(); // Refresh members list
            } catch (error) {
                console.error('Promotion failed:', error);
                this.showError('Promotion failed: ' + error.message);
            }
        }
    }
    
    static async transferMember(memberId) {
        const allBranches = Object.values(ZonesData).flat();
        const newBranch = prompt(`Enter new branch for member ${memberId}:\n\nAvailable branches: ${allBranches.join(', ')}`);
        
        if (!newBranch || !allBranches.includes(newBranch)) {
            this.showError('Invalid branch. Please select from the available branches.');
            return;
        }
        
        const notes = prompt('Enter transfer notes (optional):');
        
        if (confirm(`Transfer member to ${newBranch}?`)) {
            try {
                await this.apiRequest('transferMember', {
                    memberId,
                    newBranch,
                    notes: notes || ''
                });
                
                this.showSuccess('Member transferred successfully!');
                await this.loadMembers(); // Refresh members list
            } catch (error) {
                console.error('Transfer failed:', error);
                this.showError('Transfer failed: ' + error.message);
            }
        }
    }
    
    static showModal(content, size = '') {
        // Remove existing modal
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) existingModal.remove();
        
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay active';
        modalOverlay.innerHTML = `
            <div class="modal-content ${size}">
                ${content}
            </div>
        `;
        
        // Add to body
        document.body.appendChild(modalOverlay);
        
        // Close on background click
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.remove();
            }
        });
    }
    
    static async exportData(type) {
        if (!confirm(`Export ${type} data as CSV?`)) return;
        
        try {
            const result = await this.apiRequest('exportData', { type });
            
            if (result.success && result.data.downloadUrl) {
                window.open(result.data.downloadUrl, '_blank');
                this.showSuccess(`Exported ${type} data successfully!`);
            }
        } catch (error) {
            console.error('Export failed:', error);
            this.showError('Export failed: ' + error.message);
        }
    }
    
    static async backupSystem() {
        if (!confirm('Create system backup? This may take a moment.')) return;
        
        try {
            const result = await this.apiRequest('backupSystem');
            
            if (result.success && result.data.backupUrl) {
                window.open(result.data.backupUrl, '_blank');
                this.showSuccess('System backup created successfully!');
            }
        } catch (error) {
            console.error('Backup failed:', error);
            this.showError('Backup failed: ' + error.message);
        }
    }
    
    static async loadPromotions() {
        // Implementation for promotions
        console.log('Loading promotions...');
    }
    
    static async loadTransfers() {
        // Implementation for transfers
        console.log('Loading transfers...');
    }
    
    static async loadReports() {
        // Implementation for reports
        console.log('Loading reports...');
    }
    
    static async loadLogs() {
        try {
            const result = await this.apiRequest('getRecentActivity');
            
            if (result.success) {
                this.renderLogsTable(result.data || []);
            }
        } catch (error) {
            console.error('Failed to load logs:', error);
            this.showError('Failed to load logs');
        }
    }
    
    static renderLogsTable(logs) {
        const tbody = document.getElementById('logsTableBody');
        if (!tbody) return;
        
        if (logs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class="fas fa-history"></i>
                        <p>No activity logs found</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = logs.map(log => `
            <tr>
                <td>${new Date(log.timestamp).toLocaleString()}</td>
                <td><strong>${log.action}</strong></td>
                <td>${log.description}</td>
                <td>
                    <span class="badge ${log.userRole === 'admin' ? 'badge-primary' : 'badge-info'}">
                        ${log.userRole || 'System'}
                    </span>
                </td>
                <td>${log.userBranch || 'N/A'}</td>
                <td>${log.clientIp || 'N/A'}</td>
            </tr>
        `).join('');
    }
    
    static async loadSettings() {
        // Load current settings
        console.log('Loading settings...');
    }
    
    static async saveSettings() {
        const adminCode = document.getElementById('adminAccessCode')?.value;
        const masulCode = document.getElementById('masulAccessCode')?.value;
        
        if (!adminCode && !masulCode) {
            this.showError('Please enter at least one access code');
            return;
        }
        
        try {
            await this.apiRequest('updateSettings', {
                adminAccessCode: adminCode,
                masulAccessCode: masulCode
            });
            
            this.showSuccess('Settings updated successfully!');
        } catch (error) {
            console.error('Settings update failed:', error);
            this.showError('Failed to update settings');
        }
    }
    
    /**
     * ========================
     * LANDING PAGE
     * ========================
     */
    
    static async initLandingPage() {
        console.log('🏠 Initializing landing page...');
        
        // Update current year
        const yearElement = document.getElementById('currentYear');
        if (yearElement) {
            yearElement.textContent = new Date().getFullYear();
        }
        
        // Load statistics
        await this.loadLandingStatistics();
    }
    
    static async loadLandingStatistics() {
        try {
            const response = await fetch(AppConfig.API_URL);
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.success) {
                    // Update stats on landing page
                    const totalMembers = document.getElementById('totalMembers');
                    const totalMasul = document.getElementById('totalMasul');
                    const totalBranches = document.getElementById('totalBranches');
                    const totalZones = document.getElementById('totalZones');
                    
                    if (totalMembers) totalMembers.textContent = data.data?.totalMembers || 0;
                    if (totalMasul) totalMasul.textContent = data.data?.totalMasul || 0;
                    if (totalBranches) totalBranches.textContent = data.data?.totalBranches || Object.values(ZonesData).flat().length;
                    if (totalZones) totalZones.textContent = Object.keys(ZonesData).length;
                }
            }
        } catch (error) {
            console.log('Using default stats for landing page');
        }
    }
    
    /**
     * ========================
     * UTILITY FUNCTIONS
     * ========================
     */
    
    static showLoading(show, message = 'Loading...') {
        AppState.ui.isLoading = show;
        
        let loader = document.getElementById('globalLoader');
        
        if (show) {
            if (!loader) {
                loader = document.createElement('div');
                loader.id = 'globalLoader';
                loader.innerHTML = `
                    <div class="loading-spinner"></div>
                    <p>${message}</p>
                `;
                document.body.appendChild(loader);
            } else {
                loader.style.display = 'flex';
                loader.querySelector('p').textContent = message;
            }
        } else if (loader) {
            loader.style.display = 'none';
        }
    }
    
    static showToast(message, type = 'info', duration = 5000) {
        const toastContainer = document.getElementById('toastContainer') || (() => {
            const container = document.createElement('div');
            container.className = 'toast-container';
            container.id = 'toastContainer';
            document.body.appendChild(container);
            return container;
        })();
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        }[type];
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto remove after duration
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, duration);
        
        // Limit to 5 toasts
        const toasts = toastContainer.querySelectorAll('.toast');
        if (toasts.length > 5) {
            toasts[0].remove();
        }
    }
    
    static showSuccess(message) {
        this.showToast(message, 'success', 3000);
    }
    
    static showError(message) {
        this.showToast(message, 'error', 5000);
    }
    
    static showWarning(message) {
        this.showToast(message, 'warning', 4000);
    }
    
    static showInfo(message) {
        this.showToast(message, 'info', 4000);
    }
    
    static showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (!field) return;
        
        field.classList.add('error');
        
        const errorElement = field.nextElementSibling;
        if (errorElement && errorElement.classList.contains('error-message')) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }
    
    static clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        if (!field) return;
        
        field.classList.remove('error');
        
        const errorElement = field.nextElementSibling;
        if (errorElement && errorElement.classList.contains('error-message')) {
            errorElement.style.display = 'none';
        }
    }
    
    static showApiConfigModal() {
        const modalHTML = `
            <div class="modal-header">
                <h3 class="modal-title">
                    <i class="fas fa-cogs"></i> Backend Configuration
                </h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
            </div>
            
            <div class="modal-body">
                <p>Please enter your Google Apps Script Web App URL:</p>
                
                <div class="form-group">
                    <label>Backend URL:</label>
                    <input type="text" id="apiUrlInput" class="form-control" 
                           value="${AppConfig.API_URL}" 
                           placeholder="https://script.google.com/macros/s/.../exec">
                </div>
                
                <div class="help-text" style="margin: 1rem 0;">
                    <strong>How to get this URL:</strong>
                    <ol>
                        <li>Deploy your Google Script as Web App</li>
                        <li>Select "Execute as: Me" and "Who has access: Anyone"</li>
                        <li>Copy the provided URL</li>
                        <li>Paste it above</li>
                    </ol>
                </div>
                
                <div id="testResult" style="display: none; margin: 1rem 0;"></div>
            </div>
            
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                    Cancel
                </button>
                <button class="btn btn-primary" onclick="App.saveApiUrl()">
                    <i class="fas fa-save"></i> Save
                </button>
                <button class="btn btn-info" onclick="App.testApiConnection()">
                    <i class="fas fa-plug"></i> Test Connection
                </button>
            </div>
        `;
        
        this.showModal(modalHTML);
    }
    
    static async testApiConnection() {
        const urlInput = document.getElementById('apiUrlInput');
        const testResult = document.getElementById('testResult');
        
        if (!urlInput || !testResult) return;
        
        const url = urlInput.value.trim();
        if (!url) {
            this.showError('Please enter a URL');
            return;
        }
        
        testResult.style.display = 'block';
        testResult.innerHTML = `
            <div class="help-text" style="background: #fff3cd; border-color: #ffeaa7;">
                <i class="fas fa-sync fa-spin"></i> Testing connection...
            </div>
        `;
        
        try {
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.success) {
                    testResult.innerHTML = `
                        <div class="help-text" style="background: #d4edda; border-color: #c3e6cb;">
                            <i class="fas fa-check-circle"></i> Connection successful!
                            <div>System: ${data.system}, Version: ${data.version}</div>
                        </div>
                    `;
                } else {
                    testResult.innerHTML = `
                        <div class="help-text" style="background: #f8d7da; border-color: #f5c6cb;">
                            <i class="fas fa-exclamation-triangle"></i> Backend error: ${data.message}
                        </div>
                    `;
                }
            } else {
                testResult.innerHTML = `
                    <div class="help-text" style="background: #f8d7da; border-color: #f5c6cb;">
                        <i class="fas fa-times-circle"></i> HTTP ${response.status}: ${response.statusText}
                    </div>
                `;
            }
        } catch (error) {
            testResult.innerHTML = `
                <div class="help-text" style="background: #f8d7da; border-color: #f5c6cb;">
                    <i class="fas fa-unlink"></i> Connection failed: ${error.message}
                </div>
            `;
        }
    }
    
    static saveApiUrl() {
        const urlInput = document.getElementById('apiUrlInput');
        if (!urlInput) return;
        
        const url = urlInput.value.trim();
        if (!url) {
            this.showError('Please enter a URL');
            return;
        }
        
        AppConfig.API_URL = url;
        localStorage.setItem('iim_api_url', url);
        
        this.showSuccess('API URL saved successfully!');
        
        // Close modal
        const modal = document.querySelector('.modal-overlay');
        if (modal) modal.remove();
        
        // Reload page if on login page
        if (window.location.pathname.includes('login.html')) {
            window.location.reload();
        }
    }
    
    static setupGlobalEvents() {
        // Handle offline/online events
        window.addEventListener('offline', () => {
            this.showWarning('You are offline. Some features may not work.');
        });
        
        window.addEventListener('online', () => {
            this.showSuccess('Connection restored.');
        });
        
        // Handle page visibility
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.validateSession();
            }
        });
        
        // Prevent form submission on Enter in search fields
        document.addEventListener('keydown', (e) => {
            if (e.target.matches('input[type="search"], input[type="text"]') && e.key === 'Enter') {
                e.preventDefault();
            }
        });
    }
    
    static updateNavigationButtons() {
        const prevButtons = document.querySelectorAll('.prev-tab, .btn-secondary');
        const nextButtons = document.querySelectorAll('.next-tab, .btn-primary');
        
        // Update previous buttons
        prevButtons.forEach(btn => {
            if (AppState.registration.currentStep === 1) {
                btn.disabled = true;
            } else {
                btn.disabled = false;
            }
        });
        
        // Update next buttons
        nextButtons.forEach(btn => {
            if (AppState.registration.currentStep === AppState.registration.totalSteps) {
                btn.style.display = 'none';
            } else {
                btn.style.display = '';
            }
        });
    }
    
    static initMasulForm() {
        // Similar to member form but with different fields
        console.log('Initializing Mas\'ul form...');
    }
}

/**
 * 🚀 APPLICATION BOOTSTRAP
 */

// Make Application globally available
window.App = Application;

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📄 DOM loaded, initializing Application...');
        App.init();
    });
} else {
    console.log('📄 DOM already loaded, initializing Application...');
    App.init();
}

console.log('✅ app.js v5.0.0 loaded successfully');