import React, { useState } from "react";
import ReactCompareImage from "react-compare-image";
import { FaDownload } from "react-icons/fa6";

const App = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [originalPreview, setOriginalPreview] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const [gamma, setGamma] = useState(1.2);
  const [clipLimit, setClipLimit] = useState(1.5);
  const [denoiseStrength, setDenoiseStrength] = useState(0);

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setSelectedFile(file);
      setOriginalPreview(URL.createObjectURL(file));
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
      const response = await fetch("http://localhost:8000/process-image/", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      setProcessedImage(data.image_base64);
    } catch (error) {
      console.error(error);
      alert("Backend belum berjalan!");
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-800">
            Smart Hybrid Image Enhancer
          </h1>

          <p className="text-slate-500 mt-2">
            Enhance old, blurry, and dull images using OpenCV + FastAPI
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-[350px] space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <h2 className="text-xl font-semibold text-slate-700 mb-4">
                Upload Image
              </h2>

              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-sm"
              />

              {originalPreview && (
                <div className="mt-5">
                  <p className="text-sm text-slate-500 mb-2">Preview</p>

                  <img
                    src={originalPreview}
                    alt="preview"
                    className="w-24 h-24 object-cover rounded-xl border"
                  />
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <h2 className="text-xl font-semibold text-slate-700 mb-6">
                Adjustments
              </h2>

              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <label className="font-medium text-slate-600">
                    Noise Reduction
                  </label>

                  <span className="text-slate-500">{denoiseStrength}</span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={denoiseStrength}
                  onChange={(e) => setDenoiseStrength(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <label className="font-medium text-slate-600">Gamma</label>

                  <span className="text-slate-500">{gamma}</span>
                </div>

                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={gamma}
                  onChange={(e) => setGamma(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <label className="font-medium text-slate-600">
                    CLAHE Sharpness
                  </label>

                  <span className="text-slate-500">{clipLimit}</span>
                </div>

                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={clipLimit}
                  onChange={(e) => setClipLimit(e.target.value)}
                  className="w-full"
                />
              </div>

              <button
                onClick={processImage}
                disabled={loading || !selectedFile}
                className={`w-full py-3 rounded-xl font-semibold transition-all duration-300
                ${
                  loading || !selectedFile
                    ? "bg-slate-300 cursor-not-allowed"
                    : "bg-emerald-500 hover:bg-emerald-600 text-white"
                }`}
              >
                {loading ? "Processing..." : "Apply Enhancement"}
              </button>
            </div>
          </div>

          <div className="flex-1">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-2xl font-bold text-slate-700">
                  Result Preview
                </h2>

                {processedImage && (
                  <div className="flex gap-3 items-center">
                    <span className="text-sm bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                      Enhanced
                    </span>
                    <button
                      onClick={downloadImage}
                      className="ml-4 bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 px-4 rounded-lg transition-colors duration-300"
                    >
                      <FaDownload />
                    </button>
                  </div>
                )}
              </div>

              <div className="relative rounded-2xl overflow-hidden bg-slate-100 min-h-[500px] flex items-center justify-center">
                {loading && (
                  <div className="absolute z-10 bg-white/80 backdrop-blur-sm px-5 py-3 rounded-full shadow">
                    <p className="font-semibold text-slate-700">
                      Processing Image...
                    </p>
                  </div>
                )}

                {!originalPreview && (
                  <div className="text-center text-slate-400">
                    <p className="text-lg">Upload image first</p>
                  </div>
                )}

                {originalPreview && !processedImage && !loading && (
                  <img
                    src={originalPreview}
                    alt="original"
                    className="w-full h-auto object-contain"
                  />
                )}

                {originalPreview && processedImage && !loading && (
                  <ReactCompareImage
                    leftImage={originalPreview}
                    rightImage={processedImage}
                    leftImageLabel="Before"
                    rightImageLabel="After"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
