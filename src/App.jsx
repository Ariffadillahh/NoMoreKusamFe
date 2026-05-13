import React, { useState } from 'react';
// 1. Import library Compare Image
import ReactCompareImage from 'react-compare-image';

const App = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [originalPreview, setOriginalPreview] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // State untuk parameter (sama seperti sebelumnya)
  const [gamma, setGamma] = useState(1.2);
  const [clipLimit, setClipLimit] = useState(1.5);
  const [denoiseStrength, setDenoiseStrength] = useState(0);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Buat URL preview untuk gambar asli
      setOriginalPreview(URL.createObjectURL(file));
      // Reset hasil lama jika upload gambar baru
      setProcessedImage(null); 
    }
  };

  const processImage = async () => {
    if (!selectedFile) {
      alert("Pilih gambar terlebih dahulu!");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("gamma", gamma);
    formData.append("clipLimit", clipLimit);
    formData.append("denoiseStrength", denoiseStrength);

    try {
      // Pastikan URL ini sesuai backend FastAPI Anda
      const response = await fetch("http://localhost:8000/process-image/", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      // Backend mengembalikan base64 string
      setProcessedImage(data.image_base64); 
    } catch (error) {
      console.error("Error processing image:", error);
      alert("Gagal memproses gambar. Pastikan backend berjalan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1000px', margin: 'auto' }}>
      <h2 style={{ textAlign: 'center' }}>Smart Hybrid Image Enhancer</h2>
      
      {/* Bagian Input File & Kontrol */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        {/* Input File */}
        <div style={{ flex: '1 1 300px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h4>1. Upload Foto Kusam</h4>
          <input type="file" accept="image/*" onChange={handleFileChange} style={{ width: '100%' }} />
          {originalPreview && (
             <div style={{ marginTop: '10px' }}>
               <small>File terpilih:</small>
               {/* Preview kecil di samping input */}
               <img src={originalPreview} alt="Thumb" style={{ width: '50px', height: '50px', objectFit: 'cover', display: 'block', marginTop: '5px', borderRadius: '4px' }} />
             </div>
          )}
        </div>

        {/* Slider Kontrol */}
        <div style={{ flex: '2 1 500px', padding: '15px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
          <h4>2. Pengaturan (Adjustments)</h4>
          
          {/* Slider Noise */}
          <div style={{ marginBottom: '15px' }}>
            <label><strong>Noise Reduction:</strong> {denoiseStrength}</label>
            <input type="range" min="0" max="20" step="1" value={denoiseStrength} onChange={(e) => setDenoiseStrength(e.target.value)} style={{ width: '100%' }}/>
          </div>
          
          {/* Slider Gamma */}
          <div style={{ marginBottom: '15px' }}>
            <label><strong>Gamma (Brightness):</strong> {gamma}</label>
            <input type="range" min="0.1" max="3.0" step="0.1" value={gamma} onChange={(e) => setGamma(e.target.value)} style={{ width: '100%' }}/>
          </div>

          {/* Slider CLAHE */}
          <div style={{ marginBottom: '15px' }}>
            <label><strong>CLAHE (Sharpness):</strong> {clipLimit}</label>
            <input type="range" min="0.1" max="5.0" step="0.1" value={clipLimit} onChange={(e) => setClipLimit(e.target.value)} style={{ width: '100%' }}/>
          </div>

          <button 
            onClick={processImage} 
            disabled={loading || !selectedFile}
            style={{ 
              padding: '12px 24px', width: '100%', fontSize: '16px', fontWeight: 'bold',
              cursor: loading || !selectedFile ? 'not-allowed' : 'pointer', 
              backgroundColor: loading ? '#ccc' : '#28a745', color: 'white', border: 'none', borderRadius: '5px', transition: 'background-color 0.3s'
            }}
          >
            {loading ? "Sedang Memproses..." : "Terapkan Perubahan (Apply)"}
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* AREA VISUALISASI (BEFORE-AFTER SWIPE) */}
      {/* ----------------------------------------------------------- */}
      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <h3>Hasil Perbandingan (Geser Garis Tengah)</h3>
        
        <div style={{ 
          maxWidth: '800px', // Batasi lebar maksimal agar tidak terlalu besar di layar lebar
          margin: '0 auto', 
          border: '4px solid white', 
          borderRadius: '12px', 
          overflow: 'hidden', // Agar gambar tidak keluar dari border radius
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          position: 'relative', // Penting untuk library
          minHeight: '300px', // Tinggi minimal saat loading
          background: '#eee', // Warna background saat kosong
          display: 'flex', alignItems: 'center', justifyContent: 'center' // Centering loading text
        }}>
          
          {loading && (
             <div style={{ position: 'absolute', zIndex: 10, color: '#555', fontWeight: 'bold', background: 'rgba(255,255,255,0.8)', padding: '10px 20px', borderRadius: '20px' }}>
               Memproses Gambar... Mohon Tunggu
             </div>
          )}

          {!processedImage && originalPreview && (
            // Jika belum diproses, tampilkan gambar asli saja dulu penuh
            <img src={originalPreview} alt="Original Full" style={{ width: '100%', height: 'auto', display: 'block' }} />
          )}

          {!originalPreview && (
             <div style={{ color: '#888', padding: '50px' }}>Foto akan muncul di sini setelah diupload</div>
          )}

          {/* JIKA SUDAH ADA HASIL, GUNAKAN LIBRARY SWIPE */}
          {originalPreview && processedImage && !loading && (
            <ReactCompareImage 
              leftImage={originalPreview} // Gambar Before
              rightImage={processedImage} // Gambar After
              leftImageLabel="Before (Kusam)"
              rightImageLabel="After (Enhanced)"
              // Kustomisasi Garis & Tombol Geser (Optional)
              sliderLineColor="#fff"
              sliderLineWidth={3}
              handleSize={40} // Ukuran lingkaran tombol geser
              // Agar gambar responsif mengikuti container
              aspectRatio="taller" // opsional: 'taller' menjaga aspek rasio berdasarkan gambar yang lebih tinggi
            />
          )}
        </div>
      </div>

    </div>
  );
};

export default App;