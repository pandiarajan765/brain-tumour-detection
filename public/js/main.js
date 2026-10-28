document.addEventListener('DOMContentLoaded', () => {
  // 1. Auto dismiss alert banners
  document.querySelectorAll('.alert').forEach(a => {
    setTimeout(() => {
      try {
        new bootstrap.Alert(a).close();
      } catch (e) {}
    }, 5000);
  });

  // 2. Active Navbar Link Highlighting
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });

  // 3. Theme Management
  const getStoredTheme = () => localStorage.getItem('theme');
  const setStoredTheme = theme => localStorage.setItem('theme', theme);

  const getPreferredTheme = () => {
    const storedTheme = getStoredTheme();
    if (storedTheme) {
      return storedTheme;
    }
    // Default to 'dark' for all browsers to ensure identical medical UI presentation
    return 'dark';
  };

  const setTheme = theme => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    updateThemeToggleUI(theme);
  };

  const updateThemeToggleUI = theme => {
    const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
    toggleBtns.forEach(btn => {
      const icon = btn.querySelector('#themeToggleIcon') || btn.querySelector('.fa-moon, .fa-sun');
      const text = btn.querySelector('#themeToggleText') || btn.querySelector('.theme-text');
      
      if (theme === 'dark') {
        if (icon) {
          icon.className = 'fas fa-sun me-1 text-warning';
        }
        if (text) {
          text.textContent = 'Light';
        }
        btn.setAttribute('aria-label', 'Switch to light mode');
        btn.setAttribute('title', 'Switch to Light Mode');
      } else {
        if (icon) {
          icon.className = 'fas fa-moon me-1';
        }
        if (text) {
          text.textContent = 'Dark';
        }
        btn.setAttribute('aria-label', 'Switch to dark mode');
        btn.setAttribute('title', 'Switch to Dark Mode');
      }
    });
  };

  // Initialize theme UI state
  const currentTheme = getPreferredTheme();
  setTheme(currentTheme);

  // Toggle theme click listener
  document.addEventListener('click', e => {
    const btn = e.target.closest('.theme-toggle-btn');
    if (btn) {
      const activeTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
      const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
      setStoredTheme(newTheme);
      setTheme(newTheme);
    }
  });

  // 4. Password Show/Hide Toggle Listener
  document.addEventListener('click', e => {
    const toggleBtn = e.target.closest('.toggle-password-btn');
    if (toggleBtn) {
      const input = toggleBtn.parentElement.querySelector('input');
      const icon = toggleBtn.querySelector('i');
      if (input && icon) {
        if (input.type === 'password') {
          input.type = 'text';
          icon.className = 'fas fa-eye-slash';
        } else {
          input.type = 'password';
          icon.className = 'fas fa-eye';
        }
      }
    }
  });

  // 5. Enhanced File Upload Drag-and-Drop & Preview
  const dropZone = document.getElementById('dropZone');
  const mriInput = document.getElementById('mriInput');
  const previewContainer = document.getElementById('previewContainer');
  const preview = document.getElementById('preview');
  const removePreviewBtn = document.getElementById('removePreviewBtn');
  const fileMetaInfo = document.getElementById('fileMetaInfo');

  if (dropZone && mriInput) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, e => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, e => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
      }, false);
    });

    const handleFile = file => {
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = e => {
          if (preview) {
            preview.src = e.target.result;
          }
          if (previewContainer) {
            previewContainer.style.display = 'block';
          }
          if (fileMetaInfo) {
            const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
            fileMetaInfo.innerHTML = `<span class="badge bg-teal-subtle text-teal me-2"><i class="fas fa-file-image me-1"></i>${file.name}</span> <span class="badge bg-secondary-subtle text-secondary">${sizeInMB} MB</span>`;
          }
        };
        reader.readAsDataURL(file);
      }
    };

    dropZone.addEventListener('drop', e => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files.length > 0) {
        mriInput.files = files;
        handleFile(files[0]);
      }
    });

    mriInput.addEventListener('change', e => {
      if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
      }
    });

    if (removePreviewBtn) {
      removePreviewBtn.addEventListener('click', () => {
        mriInput.value = '';
        if (preview) preview.src = '#';
        if (previewContainer) previewContainer.style.display = 'none';
        if (fileMetaInfo) fileMetaInfo.innerHTML = '';
      });
    }
  }
});