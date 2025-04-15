document.getElementById('upload-mod-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const game = document.getElementById('game').value;
  const title = document.getElementById('title').value;
  const description = document.getElementById('description').value;
  const tags = document.getElementById('tags').value;
  const modFile = document.getElementById('mod_file').files[0];
  const modImage = document.getElementById('mod_image').files[0];

  let imageUrl = null;
  let fileUrl = null;

  // ✅ Upload Image if exists
  if (modImage) {
    const imgExt = modImage.name.split('.').pop();
    const imgFileName = `${Date.now()}_${modImage.name}`;
    
    const { data: imgData, error: imgError } = await supabase.storage
      .from('mod-images')
      .upload(imgFileName, modImage, {
        cacheControl: '3600',
        upsert: false
      });

    if (imgError) {
      console.error('❌ Image upload failed:', imgError.message);
      alert('❌ Image upload failed: ' + imgError.message);
      return;
    }

    const { data: imgUrlData } = supabase
      .storage
      .from('mod-images')
      .getPublicUrl(imgFileName);

    imageUrl = imgUrlData.publicUrl;
  }

  // ✅ Upload Mod File
  const fileExt = modFile.name.split('.').pop();
  const fileName = `${Date.now()}_${modFile.name}`;

  const { data: fileData, error: fileError } = await supabase.storage
    .from('mod-files')
    .upload(fileName, modFile, {
      cacheControl: '3600',
      upsert: false
    });

  if (fileError) {
    console.error('❌ Mod file upload failed:', fileError.message);
    alert('❌ Mod file upload failed: ' + fileError.message);
    return;
  }

  const { data: fileUrlData } = supabase
    .storage
    .from('mod-files')
    .getPublicUrl(fileName);

  fileUrl = fileUrlData.publicUrl;

  // ✅ Insert into DB
  const { error: dbError } = await supabase.from('mods').insert([{
    game,
    title,
    description,
    tags,
    file_url: fileUrl,
    image_url: imageUrl
  }]);

  if (dbError) {
    console.error('❌ DB Error:', dbError.message);
    alert('❌ Failed to save mod: ' + dbError.message);
    return;
  }

  alert('✅ Mod uploaded successfully!');
  document.getElementById('upload-mod-form').reset();

  // Redirect to mods.html after successful upload
  window.location.href = 'mods.html'; // This redirects the user to mods.html
});
