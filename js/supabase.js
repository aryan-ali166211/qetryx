// Initialize Supabase
const supabaseUrl = 'https://usxvmlejkeqxveiogmrr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzeHZtbGVqa2VxeHZlaW9nbXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NDA0MTQsImV4cCI6MjA2MDExNjQxNH0.byWwKr2wLMi4BKJ_cGrHcky0ZLNzsBF3hmuHUsLZftk';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Function to fetch all mods
async function fetchMods(page = 1, itemsPerPage = 9, searchTerm = '', gameFilter = 'all') {
    try {
        let query = supabase
            .from('mods')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        // Apply search filter if term exists
        if (searchTerm) {
            query = query.ilike('title', `%${searchTerm}%`);
        }

        // Apply game filter if not 'all'
        if (gameFilter !== 'all') {
            query = query.eq('game', gameFilter);
        }

        // Apply pagination
        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) throw error;

        return {
            mods: data,
            totalCount: count
        };
    } catch (error) {
        console.error('Error fetching mods:', error);
        return {
            mods: [],
            totalCount: 0
        };
    }
}

// Function to fetch featured mods
async function fetchFeaturedMods() {
    try {
        const { data, error } = await supabase
            .from('mods')
            .select('*')
            .eq('featured', true)
            .limit(3);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching featured mods:', error);
        return [];
    }
}

// Function to upload a new mod
async function uploadMod(modData) {
    try {
        // First upload the thumbnail
        const thumbnailPath = `thumbnails/${Date.now()}_${modData.thumbnail.name}`;
        const { error: thumbnailError } = await supabase
            .storage
            .from('mod-thumbnails')
            .upload(thumbnailPath, modData.thumbnail);

        if (thumbnailError) throw thumbnailError;

        // Then upload the mod file
        const filePath = `mods/${Date.now()}_${modData.file.name}`;
        const { error: fileError } = await supabase
            .storage
            .from('mod-files')
            .upload(filePath, modData.file);

        if (fileError) throw fileError;

        // Get public URLs
        const thumbnailUrl = supabase
            .storage
            .from('mod-thumbnails')
            .getPublicUrl(thumbnailPath).data.publicUrl;

        const fileUrl = supabase
            .storage
            .from('mod-files')
            .getPublicUrl(filePath).data.publicUrl;

        // Insert mod data into database
        const { data, error } = await supabase
            .from('mods')
            .insert([{
                title: modData.title,
                description: modData.description,
                game: modData.game,
                category: modData.category,
                thumbnail_url: thumbnailUrl,
                file_url: fileUrl,
                downloads: 0,
                featured: false
            }])
            .select();

        if (error) throw error;

        return data[0];
    } catch (error) {
        console.error('Error uploading mod:', error);
        throw error;
    }
}

// Function to increment download count
async function incrementDownloadCount(modId) {
    try {
        const { data, error } = await supabase
            .from('mods')
            .select('downloads')
            .eq('id', modId)
            .single();

        if (error) throw error;

        const newCount = data.downloads + 1;

        const { error: updateError } = await supabase
            .from('mods')
            .update({ downloads: newCount })
            .eq('id', modId);

        if (updateError) throw updateError;

        return newCount;
    } catch (error) {
        console.error('Error incrementing download count:', error);
        throw error;
    }
}

// Function to get site stats
async function getSiteStats() {
    try {
        // Get total mods
        const { count: totalMods } = await supabase
            .from('mods')
            .select('*', { count: 'exact', head: true });

        // Get total downloads
        const { data: downloadsData } = await supabase
            .from('mods')
            .select('downloads');

        const totalDownloads = downloadsData.reduce((sum, mod) => sum + mod.downloads, 0);

        // Get active users (this is a placeholder - you'd need to implement user tracking)
        const activeUsers = 0; // Replace with actual implementation

        return {
            totalMods,
            totalDownloads,
            activeUsers
        };
    } catch (error) {
        console.error('Error getting site stats:', error);
        return {
            totalMods: 0,
            totalDownloads: 0,
            activeUsers: 0
        };
    }
}

export { 
    supabase, 
    fetchMods, 
    fetchFeaturedMods, 
    uploadMod, 
    incrementDownloadCount, 
    getSiteStats 
};