import { 
    fetchMods, 
    fetchFeaturedMods, 
    uploadMod, 
    incrementDownloadCount, 
    getSiteStats 
} from './supabase.js';

// DOM Elements
const modGrid = document.getElementById('allMods');
const featuredModsGrid = document.getElementById('featuredMods');
const uploadForm = document.getElementById('uploadForm');
const modSearch = document.getElementById('modSearch');
const gameFilter = document.getElementById('gameFilter');
const pagination = document.getElementById('pagination');
const faqItems = document.querySelectorAll('.faq-item');
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

// Current page for pagination
let currentPage = 1;
const itemsPerPage = 9;

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Load appropriate content based on page
    if (modGrid) {
        loadMods();
    }

    if (featuredModsGrid) {
        loadFeaturedMods();
    }

    if (uploadForm) {
        setupUploadForm();
    }

    if (faqItems.length > 0) {
        setupFAQ();
    }

    if (hamburger) {
        setupMobileMenu();
    }

    // Load site stats if on homepage
    if (document.querySelector('.stats')) {
        loadSiteStats();
    }

    // Setup event listeners for search and filter
    if (modSearch && gameFilter) {
        modSearch.addEventListener('input', () => {
            currentPage = 1;
            loadMods();
        });

        gameFilter.addEventListener('change', () => {
            currentPage = 1;
            loadMods();
        });
    }
});

// Load all mods with pagination
async function loadMods() {
    try {
        modGrid.innerHTML = '<div class="loading-spinner"></div>';
        
        const searchTerm = modSearch ? modSearch.value : '';
        const filterValue = gameFilter ? gameFilter.value : 'all';
        
        const { mods, totalCount } = await fetchMods(
            currentPage, 
            itemsPerPage, 
            searchTerm, 
            filterValue
        );

        if (mods.length === 0) {
            modGrid.innerHTML = '<p class="no-mods">No mods found. Try a different search or filter.</p>';
            pagination.innerHTML = '';
            return;
        }

        modGrid.innerHTML = '';
        mods.forEach(mod => {
            modGrid.appendChild(createModCard(mod));
        });

        setupPagination(totalCount);
    } catch (error) {
        console.error('Error loading mods:', error);
        modGrid.innerHTML = '<p class="error-message">Failed to load mods. Please try again later.</p>';
    }
}

// Load featured mods
async function loadFeaturedMods() {
    try {
        featuredModsGrid.innerHTML = '<div class="loading-spinner"></div>';
        
        const mods = await fetchFeaturedMods();

        if (mods.length === 0) {
            featuredModsGrid.innerHTML = '<p class="no-mods">No featured mods at this time.</p>';
            return;
        }

        featuredModsGrid.innerHTML = '';
        mods.forEach(mod => {
            featuredModsGrid.appendChild(createModCard(mod));
        });
    } catch (error) {
        console.error('Error loading featured mods:', error);
        featuredModsGrid.innerHTML = '<p class="error-message">Failed to load featured mods.</p>';
    }
}

// Create mod card element
function createModCard(mod) {
    const card = document.createElement('div');
    card.className = 'mod-card fade-in';
    
    card.innerHTML = `
        <img src="${mod.thumbnail_url}" alt="${mod.title}" class="mod-card-img">
        <div class="mod-card-content">
            <h3 class="mod-card-title">${mod.title}</h3>
            <span class="mod-card-game">${mod.game}</span>
            <p class="mod-card-desc">${mod.description}</p>
            <div class="mod-card-footer">
                <button class="mod-card-download" data-mod-id="${mod.id}">Download</button>
                <div class="mod-card-stats">
                    <div class="mod-card-stat">
                        <i class="fas fa-download"></i>
                        <span>${mod.downloads}</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add download event listener
    const downloadBtn = card.querySelector('.mod-card-download');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', async () => {
            try {
                // Increment download count
                await incrementDownloadCount(mod.id);
                
                // Create a temporary link to download the file
                const link = document.createElement('a');
                link.href = mod.file_url;
                link.download = mod.title.replace(/\s+/g, '_') + '.zip';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Update the download count display
                const downloadsElement = card.querySelector('.mod-card-stat span');
                if (downloadsElement) {
                    downloadsElement.textContent = parseInt(downloadsElement.textContent) + 1;
                }
            } catch (error) {
                console.error('Error downloading mod:', error);
                alert('Failed to download mod. Please try again.');
            }
        });
    }

    return card;
}

// Setup upload form
function setupUploadForm() {
    const thumbnailPreview = document.getElementById('thumbnailPreview');
    const thumbnailInput = document.getElementById('modThumbnail');
    
    // Preview thumbnail
    thumbnailInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                thumbnailPreview.innerHTML = `<img src="${event.target.result}" alt="Thumbnail Preview">`;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Handle form submission
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const uploadStatus = document.getElementById('uploadStatus');
        uploadStatus.textContent = 'Uploading...';
        uploadStatus.className = 'status-message';
        
        try {
            const formData = {
                title: document.getElementById('modName').value,
                description: document.getElementById('modDescription').value,
                game: document.getElementById('modGame').value,
                category: document.getElementById('modCategory').value,
                file: document.getElementById('modFile').files[0],
                thumbnail: document.getElementById('modThumbnail').files[0]
            };
            
            const newMod = await uploadMod(formData);
            
            uploadStatus.textContent = 'Mod uploaded successfully!';
            uploadStatus.className = 'status-message success';
            
            // Reset form
            uploadForm.reset();
            thumbnailPreview.innerHTML = '';
            
            // Redirect to mods page after 2 seconds
            setTimeout(() => {
                window.location.href = 'mods.html';
            }, 2000);
        } catch (error) {
            console.error('Upload error:', error);
            uploadStatus.textContent = 'Failed to upload mod. Please try again.';
            uploadStatus.className = 'status-message error';
        }
    });
}

// Setup pagination
function setupPagination(totalCount) {
    if (!pagination) return;
    
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" 
                onclick="changePage(${currentPage - 1})" 
                ${currentPage === 1 ? 'disabled' : ''}>
            &lt;
        </button>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `
            <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                    onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }
    
    // Next button
    paginationHTML += `
        <button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" 
                onclick="changePage(${currentPage + 1})" 
                ${currentPage === totalPages ? 'disabled' : ''}>
            &gt;
        </button>
    `;
    
    pagination.innerHTML = paginationHTML;
}

// Change page function (added to window for onclick)
window.changePage = function(page) {
    if (page < 1 || page > Math.ceil(totalCount / itemsPerPage)) return;
    currentPage = page;
    loadMods();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Setup FAQ accordion
function setupFAQ() {
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            item.classList.toggle('active');
        });
    });
}

// Setup mobile menu
function setupMobileMenu() {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        hamburger.classList.toggle('active');
    });
}

// Load site stats
async function loadSiteStats() {
    try {
        const stats = await getSiteStats();
        
        document.getElementById('totalMods').textContent = stats.totalMods;
        document.getElementById('totalDownloads').textContent = stats.totalDownloads;
        document.getElementById('activeUsers').textContent = stats.activeUsers;
    } catch (error) {
        console.error('Error loading site stats:', error);
    }
}