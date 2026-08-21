document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.cosmetic-card');
  const clearButton = document.getElementById('clearCustomBg');
  const assetList = document.getElementById('customAssetList');

  function setActiveCard(theme) {
    buttons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.theme === theme);
    });
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem('typing-theme', theme);
    } catch (e) {}
  }

  function saveCustomBackground(backgroundPath) {
    try {
      if (backgroundPath) {
        localStorage.setItem('typing-custom-bg', backgroundPath);
      } else {
        localStorage.removeItem('typing-custom-bg');
      }
    } catch (e) {}
  }

  const savedTheme = localStorage.getItem('typing-theme') || 'cream';
  setActiveCard(savedTheme);

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const theme = button.dataset.theme;
      setActiveCard(theme);
      saveTheme(theme);
    });
  });

  const customAssets = Array.isArray(window.customBackgroundAssets) ? window.customBackgroundAssets : [];
  if (assetList) {
    if (!customAssets.length) {
      assetList.innerHTML = '<div class="custom-asset-empty">No custom assets yet. Add images to assets/backgrounds and register them in assets/backgrounds.js.</div>';
    } else {
      assetList.innerHTML = customAssets.map((asset) => {
        const safeName = asset && asset.name ? asset.name : 'Custom asset';
        const safeFile = asset && asset.file ? asset.file : '';
        const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(safeFile);
        const previewStyle = isVideo ? 'background: linear-gradient(135deg, rgba(214, 149, 90, 0.55), rgba(94, 63, 156, 0.7));' : `background-image: url("${safeFile}");`;
        return `
          <button class="custom-asset-card" type="button" data-asset-file="${safeFile}">
            <span class="custom-asset-preview" style="${previewStyle}"></span>
            <span class="custom-asset-name">${safeName}</span>
          </button>
        `;
      }).join('');

      assetList.querySelectorAll('.custom-asset-card').forEach((card) => {
        card.addEventListener('click', () => {
          const chosen = card.dataset.assetFile || '';
          saveCustomBackground(chosen);
          assetList.querySelectorAll('.custom-asset-card').forEach((item) => {
            item.classList.toggle('is-selected', item === card);
          });
        });
      });
    }
  }

  if (clearButton) {
    clearButton.addEventListener('click', () => {
      saveCustomBackground('');
      if (assetList) {
        assetList.querySelectorAll('.custom-asset-card').forEach((item) => item.classList.remove('is-selected'));
      }
    });
  }
});
