// Supabase configuration
const SUPABASE_URL = 'https://ogwufpqcthruhgpqseff.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nd3VmcHFjdGhydWhncHFzZWZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MTEzMDksImV4cCI6MjA2MDI4NzMwOX0.OrY_gSIIHmkylk76Jo6-89GIzRvTDhLHKzdPo6lgbSo';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Function to fetch mods from Supabase
async function fetchModsFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('mods')
      .select('*')
      .order('upload_date', { ascending: false });

    // Log the fetched data for debugging
    console.log('Mods fetched:', data);

    if (error) {
      throw error;
    }
    return { data, error };
  } catch (error) {
    console.error('Error fetching mods:', error);
    return { error };
  }
}

// Function to upload a mod to Supabase
async function uploadModToSupabase(form) {
  const formData = new FormData(form);
  const title = formData.get('title');
  const description = formData.get('description');
  const game = formData.get('game');
  const tags = formData.get('tags').split(',').map(tag => tag.trim());
  const modFile = formData.get('mod_file');
  const imageFile = formData.get('mod_image');

  try {
    // Upload mod file
    const modFileName = `mods/${Date.now()}_${modFile.name}`;
    const { data: modFileData, error: modFileError } = await supabase
      .storage
      .from('mod-files')
      .upload(modFileName, modFile);

    if (modFileError) throw modFileError;

    // Get mod file URL
    const { data: modFileUrl } = supabase
      .storage
      .from('mod-files')
      .getPublicUrl(modFileData.path);

    // Upload image file
    let imageUrl = null;
    if (imageFile) {
      const imageFileName = `images/${Date.now()}_${imageFile.name}`;
      const { data: imageFileData, error: imageFileError } = await supabase
        .storage
        .from('mod-images')
        .upload(imageFileName, imageFile);

      if (imageFileError) throw imageFileError;

      // Get image URL
      const { data: imageUrlData } = supabase
        .storage
        .from('mod-images')
        .getPublicUrl(imageFileData.path);

      imageUrl = imageUrlData.publicUrl;
    }

    // Insert mod data into database
    const { data: modData, error: modInsertError } = await supabase
      .from('mods')
      .insert([{
        title,
        description,
        game,
        tags,
        image_url: imageUrl,
        file_url: modFileUrl.publicUrl
      }]);

    if (modInsertError) throw modInsertError;

    return { success: true, data: modData };
  } catch (error) {
    console.error('Error uploading mod:', error);
    return { error };
  }
}

// Function to submit a mod request
async function submitModRequest(formData) {
  const gameName = formData.get('game_name');
  const idea = formData.get('idea');
  const description = formData.get('description');
  const contact = formData.get('contact') || null;

  try {
    const { data, error } = await supabase
      .from('requests')
      .insert([{
        game_name: gameName,
        idea,
        description,
        contact
      }]);

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error submitting mod request:', error);
    return { error };
  }
}

// Function to submit with SubmitCo (mock implementation)
async function submitWithSubmitCo(formData) {
  // In a real implementation, this would use SubmitCo's API
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ success: true, message: 'Form submitted successfully' });
    }, 1500);
  });
}

// Use the functions directly in your app without exporting (since this isn't a module)
