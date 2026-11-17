(() => {
  'use strict';
  const photos = window.GALLERY_PHOTOS;
  const $ = id => document.getElementById(id);
  const grid = $('photo-grid');
  const lightbox = $('lightbox');
  const shareDialog = $('share-dialog');
  const downloadDialog = $('download-dialog');
  const storageKey = 'paris-love-story:favorites:v1';
  let favorites;
  try { favorites = new Set(JSON.parse(localStorage.getItem(storageKey) || '[]')); }
  catch { favorites = new Set(); }
  let onlyFavorites = false;
  let currentIndex = 0;
  let viewerPhotos = photos;
  let lastFocused = null;
  let toastTimeout;
  let downloadController;
  const cards = new Map();

  function icon(name) {
    return `<svg aria-hidden="true"><use href="#icon-${name}"/></svg>`;
  }
  function downloadName(photo, index = photos.indexOf(photo)) {
    return `${String(index + 1).padStart(3, '0')}-${photo.filename.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9 _-]/g, '')}.jpg`;
  }
  function notify(message) {
    clearTimeout(toastTimeout);
    $('toast').textContent = message;
    $('toast').hidden = false;
    toastTimeout = setTimeout(() => { $('toast').hidden = true; }, 3000);
  }

  for (const [index, photo] of photos.entries()) {
    const card = document.createElement('article');
    card.className = 'photo-card';
    card.dataset.id = photo.id;
    const open = document.createElement('button');
    open.className = 'photo-open';
    open.type = 'button';
    open.setAttribute('aria-label', `Open photograph ${index + 1}: ${photo.filename}`);
    const img = document.createElement('img');
    img.src = photo.thumbnail;
    img.alt = `Paris Love Story — ${photo.filename}`;
    img.width = photo.width;
    img.height = photo.height;
    img.loading = 'lazy';
    img.decoding = 'async';
    open.append(img);
    open.addEventListener('click', () => openViewer(photo));
    const actions = document.createElement('div');
    actions.className = 'photo-actions';
    const download = document.createElement('a');
    download.className = 'icon-button';
    download.href = photo.src;
    download.download = downloadName(photo, index);
    download.setAttribute('aria-label', `Download photograph ${index + 1}`);
    download.innerHTML = icon('download');
    const favorite = document.createElement('button');
    favorite.className = 'icon-button favorite';
    favorite.type = 'button';
    favorite.dataset.id = photo.id;
    favorite.setAttribute('aria-label', `Favorite photograph ${index + 1}`);
    favorite.innerHTML = icon('heart');
    favorite.addEventListener('click', () => toggleFavorite(photo));
    actions.append(download, favorite);
    card.append(open, actions);
    cards.set(photo.id, card);
    grid.append(card);
  }

  function visiblePhotos() { return onlyFavorites ? photos.filter(p => favorites.has(p.id)) : photos; }
  function layout() {
    const selected = visiblePhotos();
    const width = grid.clientWidth;
    const gap = 3;
    const columns = 3;
    const columnWidth = (width - gap * columns) / columns;
    const heights = Array(columns).fill(gap / 2);
    const selectedIds = new Set(selected.map(p => p.id));
    for (const photo of photos) cards.get(photo.id).hidden = !selectedIds.has(photo.id);
    for (const photo of selected) {
      const column = heights.indexOf(Math.min(...heights));
      const height = columnWidth * photo.height / photo.width;
      const card = cards.get(photo.id);
      Object.assign(card.style, {
        width: `${columnWidth}px`, height: `${height}px`,
        left: `${gap / 2 + column * (columnWidth + gap)}px`, top: `${heights[column]}px`,
      });
      heights[column] += height + gap;
    }
    grid.style.height = `${selected.length ? Math.max(...heights) - gap / 2 : 0}px`;
    $('empty-state').hidden = selected.length !== 0;
  }
  new ResizeObserver(layout).observe(grid);

  function updateFavorites() {
    for (const photo of photos) {
      const liked = favorites.has(photo.id);
      const card = cards.get(photo.id);
      card.classList.toggle('is-favorite', liked);
      card.querySelector('.favorite').setAttribute('aria-pressed', String(liked));
    }
    $('favorites-count').textContent = favorites.size;
    $('favorites-count').hidden = !favorites.size;
    $('favorites-filter').setAttribute('aria-pressed', String(onlyFavorites));
    $('filter-status').hidden = !onlyFavorites;
    $('filter-summary').textContent = `${favorites.size} favorite${favorites.size === 1 ? '' : 's'}`;
    $('download-total').textContent = `${photos.length} photos`;
    $('download-favorites').textContent = `${favorites.size} photo${favorites.size === 1 ? '' : 's'}`;
    if (lightbox.open) {
      const liked = favorites.has(viewerPhotos[currentIndex].id);
      $('lightbox-favorite').setAttribute('aria-pressed', String(liked));
      $('lightbox-favorite').setAttribute('aria-label', liked ? 'Remove from favorites' : 'Add to favorites');
    }
  }
  function toggleFavorite(photo) {
    const liked = !favorites.has(photo.id);
    if (liked) favorites.add(photo.id); else favorites.delete(photo.id);
    try { localStorage.setItem(storageKey, JSON.stringify([...favorites])); }
    catch { notify('Favorites will be kept for this visit.'); }
    updateFavorites();
    if (onlyFavorites) layout();
  }
  function setFilter(value) {
    onlyFavorites = value;
    updateFavorites();
    layout();
    $('gallery').scrollIntoView({behavior:'smooth'});
  }
  $('favorites-filter').addEventListener('click', () => setFilter(!onlyFavorites));
  $('show-all').addEventListener('click', () => setFilter(false));
  window.addEventListener('storage', event => {
    if (event.key !== storageKey) return;
    try { favorites = new Set(JSON.parse(event.newValue || '[]')); }
    catch { favorites = new Set(); }
    updateFavorites(); layout();
  });

  function showPhoto() {
    const photo = viewerPhotos[currentIndex];
    const image = $('lightbox-image');
    image.src = photo.src;
    image.alt = `Paris Love Story — ${photo.filename}`;
    $('photo-position').textContent = `${currentIndex + 1} / ${viewerPhotos.length}`;
    $('photo-caption').textContent = photo.filename;
    $('lightbox-download').href = photo.src;
    $('lightbox-download').download = downloadName(photo);
    updateFavorites();
    const next = viewerPhotos[(currentIndex + 1) % viewerPhotos.length];
    new Image().src = next.src;
  }
  function openViewer(photo) {
    viewerPhotos = visiblePhotos();
    currentIndex = viewerPhotos.findIndex(p => p.id === photo.id);
    if (currentIndex < 0) { viewerPhotos = photos; currentIndex = photos.indexOf(photo); }
    lastFocused = document.activeElement;
    if (!lightbox.open) lightbox.showModal();
    showPhoto();
  }
  function stepPhoto(direction) {
    currentIndex = (currentIndex + direction + viewerPhotos.length) % viewerPhotos.length;
    showPhoto();
  }
  $('previous-photo').addEventListener('click', () => stepPhoto(-1));
  $('next-photo').addEventListener('click', () => stepPhoto(1));
  $('lightbox-close').addEventListener('click', () => lightbox.close());
  $('lightbox-favorite').addEventListener('click', () => toggleFavorite(viewerPhotos[currentIndex]));
  lightbox.addEventListener('keydown', event => {
    if (shareDialog.open) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); stepPhoto(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); stepPhoto(1); }
  });
  lightbox.addEventListener('close', () => {
    if (lastFocused?.isConnected && !lastFocused.closest('[hidden]')) lastFocused.focus({preventScroll:true});
    else $('favorites-filter').focus({preventScroll:true});
  });
  let touchStart;
  $('lightbox-image-wrap').addEventListener('touchstart', event => { touchStart = event.changedTouches[0].clientX; }, {passive:true});
  $('lightbox-image-wrap').addEventListener('touchend', event => {
    const distance = event.changedTouches[0].clientX - touchStart;
    if (Math.abs(distance) > 55) stepPhoto(distance < 0 ? 1 : -1);
  }, {passive:true});

  function openShare(photo) {
    const url = new URL(location.href);
    url.hash = photo ? `photo=${photo.id}` : '';
    $('share-url').value = url.href;
    $('native-share').hidden = !navigator.share;
    shareDialog.showModal();
  }
  $('share-gallery').addEventListener('click', () => openShare());
  $('lightbox-share').addEventListener('click', () => openShare(viewerPhotos[currentIndex]));
  $('copy-link').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText($('share-url').value);
      $('copy-link').textContent = 'Copied!';
      setTimeout(() => { $('copy-link').textContent = 'Copy link'; }, 2200);
    } catch {
      $('share-url').select();
      notify('Select and copy the gallery link.');
    }
  });
  $('native-share').addEventListener('click', async () => {
    try { await navigator.share({title:document.title, url:$('share-url').value}); }
    catch (error) { if (error.name !== 'AbortError') notify('Use Copy link to share this gallery.'); }
  });
  document.querySelectorAll('[data-close]').forEach(button => {
    button.addEventListener('click', () => $(button.dataset.close).close());
  });
  [shareDialog, downloadDialog].forEach(dialog => {
    dialog.addEventListener('click', event => {
      const r = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) dialog.close();
    });
  });

  $('download-gallery').addEventListener('click', () => {
    updateFavorites();
    $('download-progress').hidden = true;
    $('start-download').disabled = false;
    $('start-download').textContent = 'Download photographs';
    downloadDialog.showModal();
  });
  downloadDialog.addEventListener('close', () => downloadController?.abort());

  // A standard, uncompressed ZIP writer. JPEG files are already compressed.
  // Keeping this small utility local avoids a third-party runtime dependency.
  const crcTable = Uint32Array.from({length:256}, (_, n) => {
    for (let k = 0; k < 8; k++) n = (n & 1) ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
    return n >>> 0;
  });
  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }
  function createZip(files) {
    const chunks = [], directory = [];
    let offset = 0, directorySize = 0;
    for (const file of files) {
      const name = new TextEncoder().encode(file.name);
      const crc = crc32(file.bytes);
      const header = new Uint8Array(30 + name.length), h = new DataView(header.buffer);
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true);
      h.setUint16(6, 0x800, true); h.setUint16(12, 0x5d4f, true);
      h.setUint32(14, crc, true); h.setUint32(18, file.bytes.length, true);
      h.setUint32(22, file.bytes.length, true); h.setUint16(26, name.length, true);
      header.set(name, 30);
      chunks.push(header, file.bytes);
      const central = new Uint8Array(46 + name.length), c = new DataView(central.buffer);
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true);
      c.setUint16(8, 0x800, true); c.setUint16(14, 0x5d4f, true);
      c.setUint32(16, crc, true); c.setUint32(20, file.bytes.length, true);
      c.setUint32(24, file.bytes.length, true); c.setUint16(28, name.length, true);
      c.setUint32(42, offset, true); central.set(name, 46);
      directory.push(central); directorySize += central.length;
      offset += header.length + file.bytes.length;
    }
    const end = new Uint8Array(22), e = new DataView(end.buffer);
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true);
    e.setUint16(10, files.length, true); e.setUint32(12, directorySize, true); e.setUint32(16, offset, true);
    return new Blob([...chunks, ...directory, end], {type:'application/zip'});
  }
  $('start-download').addEventListener('click', async () => {
    const selection = document.querySelector('input[name="download-selection"]:checked').value;
    const selected = selection === 'favorites' ? photos.filter(p => favorites.has(p.id)) : photos;
    if (!selected.length) { $('download-progress').hidden = false; $('download-status').textContent = 'Add some favorites first, or choose all photographs.'; return; }
    downloadController = new AbortController();
    $('start-download').disabled = true;
    $('start-download').textContent = 'Preparing download…';
    $('download-progress').hidden = false;
    $('zip-progress').value = 0;
    const files = new Array(selected.length);
    let next = 0, finished = 0;
    try {
      await Promise.all(Array.from({length:Math.min(6, selected.length)}, async () => {
        while (next < selected.length) {
          const index = next++;
          const photo = selected[index];
          const response = await fetch(photo.src, {signal:downloadController.signal});
          if (!response.ok) throw new Error('Unable to load a photograph. Please try again.');
          files[index] = {name:downloadName(photo), bytes:new Uint8Array(await response.arrayBuffer())};
          finished++;
          $('zip-progress').value = finished / selected.length * 95;
          $('download-status').textContent = `Preparing ${finished} of ${selected.length} photographs…`;
        }
      }));
      downloadController.signal.throwIfAborted();
      $('download-status').textContent = 'Creating your ZIP…';
      // Let the progress indicator paint before computing checksums.
      await new Promise(resolve => setTimeout(resolve, 30));
      downloadController.signal.throwIfAborted();
      const url = URL.createObjectURL(createZip(files));
      const link = document.createElement('a');
      link.href = url;
      link.download = selection === 'favorites' ? 'Paris-Love-Story-Favorites.zip' : 'Paris-Love-Story.zip';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      $('zip-progress').value = 100;
      $('download-status').textContent = 'Your download is ready. Enjoy these moments.';
      $('start-download').textContent = 'Download again';
    } catch (error) {
      if (error.name !== 'AbortError') $('download-status').textContent = 'The download could not finish. Please try again.';
      $('start-download').textContent = 'Try again';
    } finally {
      downloadController?.abort();
      downloadController = null;
      $('start-download').disabled = false;
    }
  });

  $('back-to-top').addEventListener('click', () => window.scrollTo({top:0,behavior:'smooth'}));
  window.addEventListener('scroll', () => { $('back-to-top').hidden = window.scrollY < window.innerHeight * 1.5; }, {passive:true});
  updateFavorites();
  layout();
  const linkedPhoto = photos.find(photo => location.hash === `#photo=${photo.id}`);
  if (linkedPhoto) openViewer(linkedPhoto);
})();
