// Mobile menu toggle with enhanced accessibility
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu functionality
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    function toggleMobileMenu() {
        const isHidden = mobileMenu.classList.toggle('hidden');
        mobileMenuButton.setAttribute('aria-expanded', !isHidden);
        document.body.style.overflow = isHidden ? '' : 'hidden';
    }

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', toggleMobileMenu);
        
        // Close menu when clicking on links
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', toggleMobileMenu);
        });
    }

    // Initialize mod loading
    if (document.getElementById('mods-container')) {
        loadMods().catch(handleLoadError);
    }

    // Initialize all forms
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', handleFormSubmit);
    });
});

// Supabase-powered mod loading
async function loadMods() {
    const container = document.getElementById('mods-container');
    container.innerHTML = '<p class="text-white">Loading mods...</p>';
  
    const { data, error } = await fetchModsFromSupabase();
  
    if (error) {
      container.innerHTML = `<p class="text-red-500">Error loading mods: ${error.message}</p>`;
      return;
    }
  
    if (!data || data.length === 0) {
      container.innerHTML = '<p class="text-yellow-500">No mods found yet. Upload one!</p>';
      return;
    }
  
    renderMods(data, container);
  }
  

function renderMods(mods, container) {
    container.innerHTML = mods.map(mod => `
        <div class="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-purple-500 transition-all">
            <div class="h-48 bg-gray-700 overflow-hidden relative">
                <img src="${mod.image_url || 'assets/images/default-mod-thumbnail.png'}" 
                     alt="${mod.title}" 
                     class="w-full h-full object-cover"
                     loading="lazy">
                ${mod.tags?.length ? `
                    <div class="absolute top-2 left-2 flex gap-1">
                        ${mod.tags.slice(0, 3).map(tag => `
                            <span class="px-2 py-1 bg-gray-900/80 text-blue-300 text-xs rounded-full backdrop-blur-sm">
                                ${tag}
                            </span>
                        `).join('') }
                    </div>
                ` : ''}
            </div>
            <div class="p-4">
                <h3 class="text-xl font-bold text-blue-300 mb-2 truncate">${mod.title}</h3>
                <p class="text-gray-400 text-sm mb-3 line-clamp-2">${mod.description}</p>
                <div class="flex justify-between items-center">
                    <span class="text-sm text-purple-400 truncate">${mod.game}</span>
                    <a href="${mod.file_url}" 
                       class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm"
                       download>
                        Download
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

// Unified form handler for all Supabase submissions
async function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitButton = form.querySelector('[type="submit"]');
    const originalText = submitButton.textContent;

    try {
        // Set loading state
        submitButton.disabled = true;
        submitButton.innerHTML = `
            <span class="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
            Processing...
        `;

        let result;
        
        if (form.id === 'upload-mod-form') {
            result = await handleModUpload(form);
        } 
        else if (form.id === 'request-mod-form') {
            result = await handleModRequest(form);
        }
        else if (form.id === 'contact-form') {
            result = await handleContactForm(form);
        }

        showToast(result.message, 'success');
        form.reset();
    } catch (error) {
        showToast(error.message, 'error');
        console.error('Form error:', error);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
}

// Specific form handlers
async function handleModUpload(form) {
    const formData = new FormData(form);
    
    // 1. Upload the mod file
    const modFile = formData.get('mod_file');
    const modFilePath = `mods/${Date.now()}_${modFile.name}`;
    
    const { error: uploadError } = await supabase.storage
        .from('mod-files')
        .upload(modFilePath, modFile);
    
    if (uploadError) throw new Error('File upload failed: ' + uploadError.message);

    // 2. Upload the image if provided
    let imageUrl = null;
    const imageFile = formData.get('mod_image');
    
    if (imageFile) {
        const imagePath = `images/${Date.now()}_${imageFile.name}`;
        const { error: imageError } = await supabase.storage
            .from('mod-images')
            .upload(imagePath, imageFile);
        
        if (!imageError) {
            const { data: { publicUrl } } = supabase.storage
                .from('mod-images')
                .getPublicUrl(imagePath);
            imageUrl = publicUrl;
        }
    }

    // 3. Get mod file URL
    const { data: { publicUrl: modFileUrl } } = supabase.storage
        .from('mod-files')
        .getPublicUrl(modFilePath);

    // 4. Create database record
    const { error: dbError } = await supabase
        .from('mods')
        .insert([{
            title: formData.get('title'),
            description: formData.get('description'),
            game: formData.get('game'),
            tags: formData.get('tags').split(',').map(t => t.trim()),
            image_url: imageUrl,
            file_url: modFileUrl
        }]);


    if (dbError) throw new Error('Database error: ' + dbError.message);

    return { message: 'Mod uploaded successfully!' };
}

async function handleModRequest(form) {
    const formData = new FormData(form);
    
    const { error } = await supabase
        .from('requests')
        .insert([{
            game_name: formData.get('game_name'),
            idea: formData.get('idea'),
            description: formData.get('description'),
            contact: formData.get('contact') || null
        }]);


    if (error) throw new Error('Request submission failed: ' + error.message);

    return { message: 'Mod request submitted!' };
}

async function handleContactForm(form) {
    const formData = new FormData(form);
    
    const { error } = await supabase
        .from('contacts')
        .insert([{
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message')
        }]);


    if (error) throw new Error('Message sending failed: ' + error.message);

    return { message: 'Message sent successfully!' };
}

// UI Helpers
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-md shadow-lg z-50 animate-fade-in ${
        type === 'success' ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'
    }`;
    toast.innerHTML = `
        <div class="flex items-center">
            ${type === 'success' ? ` 
                <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
            ` : `
                <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            `}
            ${message}
        </div>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('animate-fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

function handleLoadError(error) {
    const container = document.getElementById('mods-container');
    if (container) {
        container.innerHTML = `
            <div class="col-span-full text-center py-10">
                <p class="text-red-400 font-semibold">Error loading mods:</p>
                <p class="text-gray-400">${error.message}</p>
            </div>
        `;
    }
    console.error('Mod loading error:', error);
}    