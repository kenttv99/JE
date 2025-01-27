'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface FileUpload {
  id: string;
  name: string;
  date: string;
  status: 'pending' | 'processed' | 'error';
  type: 'report' | 'strategy' | 'statement';
}

export default function TraderPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<'report' | 'strategy' | 'statement'>('report');

  useEffect(() => {
    if (status !== "loading") {
      setLoading(false);
    }
  }, [status]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const newUpload: FileUpload = {
      id: Math.random().toString(36).substr(2, 9),
      name: selectedFile.name,
      date: new Date().toISOString(),
      status: 'pending',
      type: uploadType
    };

    setFileUploads(prev => [newUpload, ...prev]);
    setSelectedFile(null);
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center py-8 px-6 bg-white shadow-lg rounded-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to view the trader page</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="bg-blue-500 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Trader Dashboard</h1>
          </div>

          {/* Upload Section */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Upload Documents</h2>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Type
                </label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value as any)}
                >
                  <option value="report">Trading Report</option>
                  <option value="strategy">Strategy Document</option>
                  <option value="statement">Account Statement</option>
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select File
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
              </div>
              <button
                onClick={handleUpload}
                disabled={!selectedFile}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 
                          disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Upload
              </button>
            </div>
          </div>

          {/* Recent Uploads */}
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Uploads</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fileUploads.map((upload) => (
                    <tr key={upload.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {upload.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {upload.type.charAt(0).toUpperCase() + upload.type.slice(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(upload.date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${upload.status === 'processed' ? 'bg-green-100 text-green-800' : 
                          upload.status === 'error' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                          {upload.status.charAt(0).toUpperCase() + upload.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {fileUploads.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                        No uploads yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}