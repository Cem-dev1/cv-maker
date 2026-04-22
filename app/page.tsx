"use client";
import React, { useState } from 'react';
import { Plus, Trash2, Download, Settings, FileText } from 'lucide-react';

export default function CVGenerator() {
  const [activeTab, setActiveTab] = useState<'content' | 'design'>('content');
  const [cvData, setCvData] = useState({
    personal: { name: '', email: '', phone: '' },
    sections: [{ id: 1, title: 'Deneyim', items: [''] }]
  });

  return (
    <main className="flex h-screen bg-gray-100 overflow-hidden">
      {/* SOL PANEL: MENU */}
      <div className="w-1/3 bg-white border-r flex flex-col">
        <div className="flex border-b">
          <button 
            onClick={() => setActiveTab('content')}
            className={`flex-1 p-4 flex items-center justify-center gap-2 ${activeTab === 'content' ? 'border-b-2 border-blue-600 bg-blue-50' : ''}`}
          >
            <FileText size={18} /> İçerik
          </button>
          <button 
            onClick={() => setActiveTab('design')}
            className={`flex-1 p-4 flex items-center justify-center gap-2 ${activeTab === 'design' ? 'border-b-2 border-blue-600 bg-blue-50' : ''}`}
          >
            <Settings size={18} /> Tasarım
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'content' ? (
            <div className="space-y-6">
              <section>
                <h3 className="font-bold mb-3">Kişisel Bilgiler</h3>
                <input 
                  type="text" 
                  placeholder="Ad Soyad" 
                  className="w-full p-2 border rounded mb-2"
                  onChange={(e) => setCvData({...cvData, personal: {...cvData.personal, name: e.target.value}})}
                />
              </section>
              
              <button className="w-full py-2 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-2">
                <Plus size={16} /> Yeni Başlık Ekle
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-bold">Renk Teması</h3>
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 cursor-pointer" />
                <div className="w-8 h-8 rounded-full bg-red-600 cursor-pointer" />
                <div className="w-8 h-8 rounded-full bg-emerald-600 cursor-pointer" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SAĞ PANEL: ÖNİZLEME (KAĞIT) */}
      <div className="w-2/3 p-10 overflow-y-auto flex flex-col items-center">
        <div className="mb-4 flex justify-end w-[210mm]">
          <button className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition">
            <Download size={18} /> PDF İndir
          </button>
        </div>
        
        {/* A4 Kağıt Simülasyonu */}
        <div className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-12 transition-all">
          <h1 className="text-4xl font-bold uppercase tracking-widest text-gray-800">
            {cvData.personal.name || "Ad Soyad"}
          </h1>
          <div className="flex gap-4 text-sm text-gray-500 mt-2 border-b pb-4">
            <span>{cvData.personal.email || "eposta@adres.com"}</span>
            <span>{cvData.personal.phone || "05xx xxx xx xx"}</span>
          </div>
          
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-blue-600 border-b-2 border-blue-600 inline-block mb-4">Deneyim</h2>
            <p className="text-gray-400 italic text-sm">Henüz bir içerik eklenmedi.</p>
          </div>
        </div>
      </div>
    </main>
  );
}