document.addEventListener('DOMContentLoaded', function () {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    function toggleMobileMenu() {
        const isHidden = mobileMenu.classList.toggle('hidden');
        mobileMenuButton.setAttribute('aria-expanded', !isHidden);
        document.body.style.overflow = isHidden ? '' : 'hidden';
    }

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', toggleMobileMenu);
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', toggleMobileMenu);
        });
    }

    // Initialize mod loading
    if (document.getElementById('mods-container')) {
        loadMods().catch(handleLoadError);
    }

    // Initialize news loading for news.html
    if (document.getElementById('news-container')) {
        loadNews().catch(error => {
            console.error('Error loading news:', error);
        });
    }

    // Initialize all forms with their specific handlers
    document.querySelectorAll('form').forEach(form => {
        if (form.id === 'news-upload-form') {
            form.addEventListener('submit', (e) => handleNewsUpload(e, form));
        } else if (form.id === 'mod-upload-form') {
            form.addEventListener('submit', (e) => handleModUpload(e, form));
        } else if (form.id === 'mod-request-form') {
            form.addEventListener('submit', (e) => handleModRequest(e, form));
        } else if (form.id === 'contact-form') {
            form.addEventListener('submit', (e) => handleContactForm(e, form));
        }
    });
});

// ✅ Load Mods
async function loadMods() {
    const container = document.getElementById('mods-container');
    container.innerHTML = '<p class="text-white">Loading mods...</p>';

    const { data, error } = await fetchModsFromSupabase();

    if (error) {
        console.error('Form error:', error?.message || error || 'Unknown error');
        return alert('❌ Failed to load mods: ' + (error?.message || error || 'Unknown error'));
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
                        `).join('')}
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

// ✅ Load News
async function loadNews() {
    const container = document.getElementById('news-container');
    container.innerHTML = '<p class="text-white">Loading news...</p>';

    const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        container.innerHTML = '<p class="text-red-500">Error loading news.</p>';
        throw error;
    }

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-yellow-400">No news yet. Stay tuned!</p>';
        return;
    }

    renderNews(data, container);
}

// ✅ Render News
function renderNews(newsList, container) {
    container.innerHTML = newsList.map(news => `
        <div class="bg-gray-800 rounded-lg p-4 border border-gray-700 shadow-md hover:border-cyan-500 transition-all">
            <h3 class="text-xl text-cyan-400 font-bold mb-1">${news.title}</h3>
            <p class="text-gray-300 text-sm mb-2">${news.description}</p>
            <p class="text-xs text-gray-500">Posted on: ${new Date(news.created_at).toLocaleString()}</p>
        </div>
    `).join('');
}

// ✅ Form Handler for News Upload
async function handleNewsUpload(e, form) {
    e.preventDefault();  // Prevent the default form submission

    const formData = new FormData(form);

    try {
        // Ensure we are sending the correct data fields
        const title = formData.get('title');
        const description = formData.get('description');

        if (!title || !description) {
            throw new Error('Title and description are required.');
        }

        // Insert data into Supabase
        const { data, error } = await supabase
            .from('news')
            .insert([{
                title: title,
                description: description,
            }]);

        if (error) {
            throw new Error(error.message || 'Error inserting news into the database');
        }

        // Show a success toast
        showToast('News uploaded successfully!', 'success');

        // After successful upload, reload the news content dynamically
        loadNews(); // Reload news section to show the newly uploaded news

    } catch (error) {
        console.error('Error while uploading news:', error);
        showToast(error.message || 'An unknown error occurred while uploading news', 'error');
    }
}

// ✅ UI Helpers
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-md shadow-lg z-50 animate-fade-in ${type === 'success' ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'}`;
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

// Error handling for mod loading
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
