import React, { useState } from 'react';

const UploadProofSection = ({ isAuthenticated }) => {
  const [proofs, setProofs] = useState([
    { name: 'task-proof1.png', url: '/uploads/task-proof1.png', type: 'image' },
    { name: 'final-report.pdf', url: '/uploads/final-report.pdf', type: 'pdf' },
  ]);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file || !isAuthenticated) return;

    setUploading(true);

    const fileType = file.type.includes('image') ? 'image' : file.type.includes('pdf') ? 'pdf' : 'other';
    const newProof = {
      name: file.name,
      url: URL.createObjectURL(file),
      type: fileType,
    };

    setTimeout(() => {
      setProofs((prev) => [newProof, ...prev]);
      setPreview(newProof);
      setUploading(false);
    }, 1500); // simulate upload delay
  };

  const handleDelete = (index) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this proof?');
    if (confirmDelete) {
      setProofs((prev) => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="bg-[#181818] rounded-2xl shadow p-6 w-full max-w-4xl mx-auto mt-10">
      <h3 className="text-xl text-[#f8f7ec] dark:text-[#f8f7ec]  font-semibold mb-4">Upload Task Proof</h3>

      {!isAuthenticated ? (
        <p className="text-red-600 font-medium">You must be logged in to upload proof.</p>
      ) : (
        <>
          <input
            type="file"
            accept="image/*,.pdf,.zip"
            onChange={handleFileChange}
            disabled={uploading}
            className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-4"
          />

          {uploading && <p className="text-blue-500 animate-pulse">Uploading...</p>}

          {preview && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700">Preview:</h4>
              <div className="mt-2">
                {preview.type === 'image' ? (
                  <img src={preview.url} alt={preview.name} className="w-40 rounded-md border" />
                ) : (
                  <p className="text-gray-600">{preview.name}</p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <hr className="my-4" />

      <h4 className="text-md font-semibold text-[#f8f7ec] dark:text-[#f8f7ec]  mb-2">Previously Uploaded Proofs</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {proofs.map((proof, index) => (
          <div key={index} className="p-3 border-none rounded-md bg-[#272727] relative">
            {proof.type === 'image' ? (
              <img src={proof.url} alt={proof.name} className="w-full rounded-md" />
            ) : (
              <p className="text-[#f8f7ec] dark:text-[#f8f7ec] text-sm">{proof.name}</p>
            )}
            <button
              onClick={() => handleDelete(index)}
              className="absolute top-1 right-1 text-xs text-red-500 hover:underline"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UploadProofSection;
