"use client";
import React, { useState, useRef, useEffect } from 'react';
import * as htmlToImage from 'html-to-image';
import { toJpeg } from 'html-to-image';
// @ts-ignore
import { jsPDF } from 'jspdf';
import {
  Plus, Trash2, FileText, Layout, Camera, Mail, Phone,
  ZoomIn, ZoomOut, GraduationCap,
  Briefcase, Code, Download, RotateCcw, Star, Globe,
  PanelLeftClose, PanelLeftOpen  // Menü için
} from 'lucide-react';
// --- TYPES ---
type LayoutType = 'modern' | 'timeline' | 'terminal' | 'sidebar-right' | 'classic' | 'two-column' | 'ats' | 'bauhaus';
type SpacingType = 'tight' | 'medium' | 'loose';
type FontType = 'sans' | 'serif' | 'mono';

export type CVData = {
  personal: { name: string; title: string; email: string; phone: string; address: string; about: string; image: string | null; portfolio: string };
  skills: { id: number; name: string; level: number; showLevel: boolean }[];
  languages: { id: number; name: string; level: string }[];
  experience: { id: number; company: string; role: string; year: string; desc: string }[];
  education: { id: number; school: string; degree: string; year: string }[];
  projects: { id: number; name: string; tech: string; desc: string; link: string }[];
};

const SPACING_CONFIG = {
  tight:  { sectionGap: 20, itemGap: 10, padding: 36, titleSize: '13px', descSize: '11px',  lineHeight: '1.5', iconSize: 14 },
  medium: { sectionGap: 32, itemGap: 16, padding: 52, titleSize: '14px', descSize: '12px', lineHeight: '1.55', iconSize: 16 },
  loose:  { sectionGap: 48, itemGap: 26, padding: 68, titleSize: '15px', descSize: '13px', lineHeight: '1.6', iconSize: 18 },
} as const;

const FONT_FAMILIES: Record<FontType, string> = {
  sans:  "'Helvetica Neue', Helvetica, Arial, sans-serif",
  serif: "Georgia, 'Times New Roman', Times, serif",
  mono:  "'Courier New', Courier, 'Lucida Console', monospace",
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function CVGenerator() {
  const [activeTab, setActiveTab] = useState<'content' | 'design'>('content');
  const [currentLayout, setCurrentLayout] = useState<LayoutType>('modern');
  const [themeColor, setThemeColor] = useState('#1e3a8a');
  const [showPhoto, setShowPhoto] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(0.72);
  const [isExporting, setIsExporting] = useState(false);
  const [spacing, setSpacing] = useState<SpacingType>('medium');
  const [fontType, setFontType] = useState<FontType>('sans');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const cvRef = useRef<HTMLDivElement>(null);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [cvData, setCvData] = useState<CVData>({
    personal: { name: '', title: '', email: '', phone: '', address: '', about: '', image: null, portfolio: '' },
    skills: [],
    languages: [],
    experience: [],
    education: [],
    projects: [],
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCvData({ ...cvData, personal: { ...cvData.personal, image: reader.result as string } });
      reader.readAsDataURL(file);
    }
  };

  const addListItem = (type: keyof CVData) => {
    const templates: any = {
      experience: { id: Date.now(), company: '', role: '', year: '', desc: '' },
      education: { id: Date.now(), school: '', degree: '', year: '' },
      skills: { id: Date.now(), name: '', level: 3, showLevel: true },
      languages: { id: Date.now(), name: '', level: 'İyi' },
      projects: { id: Date.now(), name: '', tech: '', desc: '', link: '' },
    };
    setCvData(prev => ({ ...prev, [type]: [...(prev[type] as any[]), templates[type]] }));
  };

  const updateItem = (type: keyof CVData, id: number, field: string, value: any) => {
    const newList = (cvData[type] as any[]).map(item => item.id === id ? { ...item, [field]: value } : item);
    setCvData({ ...cvData, [type]: newList });
  };

  const removeListItem = (type: keyof CVData, id: number) => {
    setCvData({ ...cvData, [type]: (cvData[type] as any[]).filter((item: any) => item.id !== id) });
  };

  const exportPDF = async () => {
    const element = document.getElementById('cv-export-root');
    if (!element) return;
    setIsExporting(true);

    const originalTransform = element.style.transform;
    const originalWidth = element.style.width;
    
    element.style.transform = 'none';
    element.style.width = '794px';
    
    await new Promise(r => setTimeout(r, 200));

    try {
      const dataUrl = await toJpeg(element, {
        quality: 1.0,
        pixelRatio: 3,
        backgroundColor: '#ffffff',
        cacheBust: true,
        skipFonts: true,
      });

      const pdf = new jsPDF({ 
        orientation: 'portrait', 
        unit: 'mm', 
        format: 'a4',
        compress: true 
      });
      
      pdf.addImage(dataUrl, 'JPEG', 0, 0, 210, 297);
      pdf.save(`CV_${cvData.personal.name || 'dosya'}.pdf`);
    } catch (err) {
      console.error('PDF export hatası:', err);
    } finally {
      element.style.transform = originalTransform;
      element.style.width = originalWidth;
      setIsExporting(false);
    }
  };

  const layoutProps: LayoutProps = { data: cvData, color: themeColor, photo: showPhoto, spacing, font: FONT_FAMILIES[fontType] };

  const layouts: Record<LayoutType, React.ReactElement> = {
    modern: <ModernLayout {...layoutProps} />,
    timeline: <TimelineLayout {...layoutProps} />,
    terminal: <TerminalLayout {...layoutProps} />,
    'sidebar-right': <SidebarRightLayout {...layoutProps} />,
    classic: <ClassicLayout {...layoutProps} />,
    'two-column': <TwoColumnLayout {...layoutProps} />,
    ats: <ATSLayout {...layoutProps} />,
    bauhaus: <BauhausLayout {...layoutProps} />,
  };

  const TEMPLATE_LABELS: Record<LayoutType, string> = {
    modern: 'Modern', timeline: 'Timeline', terminal: 'Terminal',
    'sidebar-right': 'Sidebar', classic: 'Classic', 'two-column': 'Two-Col',
    ats: 'ATS', bauhaus: 'Bauhaus',
  };

  // Mobil toggle menü butonu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <main className="flex flex-col md:flex-row h-screen bg-[#080808] overflow-hidden text-slate-200">
      
      {/* Mobil Üst Bar */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-30 bg-[#111] border-b border-white/5 p-4 flex justify-between items-center">
          <h1 className="text-lg font-bold text-white">CV Maker</h1>
          <button 
            onClick={toggleMobileMenu}
            className="p-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      )}

      {/* LEFT PANEL - Mobilde drawer olarak */}
      <div className={`
        ${isMobile ? 'fixed inset-0 z-20 transition-transform duration-300 ease-in-out' : 'w-[480px] shrink-0 relative'}
        ${isMobile && !isMobileMenuOpen ? '-translate-x-full' : 'translate-x-0'}
        bg-[#111] border-r border-white/5 flex flex-col overflow-hidden
        ${isMobile ? 'w-full' : 'm-3 rounded-[2rem]'}
      `}>
        {/* Mobilde kapatma butonu */}
        {isMobile && isMobileMenuOpen && (
          <div className="flex justify-between items-center p-4 border-b border-white/5">
            <h2 className="text-lg font-bold text-white">Menü</h2>
            <button onClick={toggleMobileMenu} className="p-2 rounded-xl bg-white/5">
              <X size={20} />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex p-3 gap-2 bg-[#080808]/60 border-b border-white/5">
          {(['content', 'design'] as const).map(tab => (
            <button key={tab} onClick={() => {
              setActiveTab(tab);
              if (isMobile) setIsMobileMenuOpen(false);
            }}
              className={`flex-1 p-3.5 flex items-center justify-center gap-2 font-black text-sm transition-all duration-300 rounded-xl
                ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-500 hover:bg-white/5'}`}>
              {tab === 'content' ? <><FileText size={16} /> İÇERİK</> : <><Layout size={16} /> TASARIM</>}
            </button>
          ))}
        </div>

        {/* Scrollable area */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-6 md:space-y-8 scrollbar-thin scrollbar-thumb-white/10">
          {activeTab === 'content' ? (
            <>
              {/* Personal */}
              <Card label="Kişisel Bilgiler">
                <div className="flex gap-4">
                  <label className="w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-2xl bg-[#080808] border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer overflow-hidden hover:border-blue-500 transition-all">
                    {cvData.personal.image
                      ? <img src={cvData.personal.image} className="w-full h-full object-cover" />
                      : <Camera size={20} className="text-slate-600" />}
                    <input type="file" className="hidden" onChange={handleImageChange} />
                  </label>
                  <div className="flex-1 space-y-2">
                    <Inp placeholder="Ad Soyad" value={cvData.personal.name} onChange={v => setCvData({...cvData, personal:{...cvData.personal, name: v}})} />
                    <Inp placeholder="Ünvan" value={cvData.personal.title} onChange={v => setCvData({...cvData, personal:{...cvData.personal, title: v}})} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <Inp placeholder="E-posta" value={cvData.personal.email} onChange={v => setCvData({...cvData, personal:{...cvData.personal, email: v}})} />
                  <Inp placeholder="Telefon" value={cvData.personal.phone} onChange={v => setCvData({...cvData, personal:{...cvData.personal, phone: v}})} />
                </div>
                <Inp placeholder="Adres" value={cvData.personal.address} onChange={v => setCvData({...cvData, personal:{...cvData.personal, address: v}})} />
                <Inp placeholder="Portfolio / Web Sitesi" value={cvData.personal.portfolio} onChange={v => setCvData({...cvData, personal:{...cvData.personal, portfolio: v}})} />
                <textarea placeholder="Hakkımda / Özet"
                  className="w-full p-3 bg-[#080808] border border-white/10 rounded-xl text-sm text-white outline-none resize-none focus:border-blue-500 h-24 transition-colors"
                  value={cvData.personal.about}
                  onChange={e => setCvData({...cvData, personal:{...cvData.personal, about: e.target.value}})} />
              </Card>

              <SectionInput label="Yetenekler" type="skills" data={cvData.skills} onAdd={() => addListItem('skills')} onUpdate={updateItem} onRemove={removeListItem}
                fields={[{key:'name', p:'Yetenek Adı'}]} isSkills />
              <SectionInput label="Diller" type="languages" data={cvData.languages} onAdd={() => addListItem('languages')} onUpdate={updateItem} onRemove={removeListItem}
                fields={[{key:'name', p:'Dil (ör. İngilizce)'}, {key:'level', p:'Seviye (ör. C1 / İleri)'}]} />
              <SectionInput label="İş Deneyimi" type="experience" data={cvData.experience} onAdd={() => addListItem('experience')} onUpdate={updateItem} onRemove={removeListItem}
                fields={[{key:'company', p:'Şirket'}, {key:'role', p:'Pozisyon'}, {key:'year', p:'Dönem (ör. 2022-2024)'}, {key:'desc', p:'Açıklama', area:true}]} />
              <SectionInput label="Eğitim" type="education" data={cvData.education} onAdd={() => addListItem('education')} onUpdate={updateItem} onRemove={removeListItem}
                fields={[{key:'school', p:'Okul / Üniversite'}, {key:'degree', p:'Bölüm / Derece'}, {key:'year', p:'Dönem'}]} />
              <SectionInput label="Projeler" type="projects" data={cvData.projects} onAdd={() => addListItem('projects')} onUpdate={updateItem} onRemove={removeListItem}
                fields={[{key:'name', p:'Proje Adı'}, {key:'tech', p:'Teknolojiler'}, {key:'desc', p:'Açıklama', area:true}, {key:'link', p:'Link (opsiyonel)'}]} />
            </>
          ) : (
            <div className="space-y-6 md:space-y-8">
              <Card label="Şablon Seçimi">
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  {(Object.keys(TEMPLATE_LABELS) as LayoutType[]).map(id => (
                    <button key={id} onClick={() => setCurrentLayout(id)}
                      className={`relative group p-2 rounded-2xl border-2 transition-all duration-300 overflow-hidden
                        ${currentLayout === id ? 'border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/10' : 'border-white/5 bg-white/5 hover:border-white/10'}`}>
                      <div className="mb-2"><TemplateThumbnail type={id} color={themeColor} selected={currentLayout === id} /></div>
                      <div className={`text-[9px] font-black uppercase tracking-widest transition-colors
                        ${currentLayout === id ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                        {TEMPLATE_LABELS[id]}
                      </div>
                    </button>
                  ))}
                </div>
              </Card>

              <div className="flex items-center justify-between bg-white/5 rounded-2xl px-4 md:px-5 py-4 border border-white/5">
                <div>
                  <p className="text-sm font-bold text-white">Fotoğraf</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">CV üzerinde göster/gizle</p>
                </div>
                <button onClick={() => setShowPhoto(!showPhoto)}
                  className={`w-12 h-6 rounded-full transition-all duration-500 relative p-1 ${showPhoto ? 'bg-blue-600' : 'bg-slate-700'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 ${showPhoto ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <Card label="Tema Rengi">
                <div className="flex flex-wrap gap-2 md:gap-3 px-1">
                  {['#1e3a8a','#0f766e','#9f1239','#581c87','#0a0a0a','#1d4ed8','#065f46','#7c2d12','#1e1b4b'].map(c => (
                    <button key={c} onClick={() => setThemeColor(c)}
                      className={`w-8 h-8 md:w-9 md:h-9 rounded-full border-4 transition-all ${themeColor === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      style={{backgroundColor: c}} />
                  ))}
                </div>
                <div className="flex items-center gap-3 px-1 pt-1">
                  <span className="text-xs text-slate-500 font-bold">Özel:</span>
                  <input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)}
                    className="w-8 h-8 md:w-9 md:h-9 rounded-full cursor-pointer border-0 bg-transparent" />
                </div>
              </Card>

              <Card label="Yazı Tipi">
                <div className="grid grid-cols-3 gap-2">
                  {([['sans','Sans'],['serif','Serif'],['mono','Mono']] as [FontType, string][]).map(([f, label]) => (
                    <button key={f} onClick={() => setFontType(f)}
                      className={`py-2 md:py-3 text-xs font-bold rounded-xl transition-all border
                        ${fontType === f ? 'bg-blue-600 text-white border-blue-500' : 'border-white/5 text-slate-400 hover:text-white bg-white/5'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </Card>

              <Card label="İçerik Yoğunluğu">
                <div className="grid grid-cols-3 gap-2">
                  {([['tight','Sıkı'],['medium','Orta'],['loose','Geniş']] as [SpacingType, string][]).map(([s, label]) => (
                    <button key={s} onClick={() => setSpacing(s)}
                      className={`py-2 md:py-3 text-xs font-bold rounded-xl transition-all border
                        ${spacing === s ? 'bg-blue-600 text-white border-blue-500' : 'border-white/5 text-slate-400 hover:text-white bg-white/5'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Export button */}
        <div className="p-4 md:p-5 bg-[#080808] border-t border-white/5">
          <button onClick={exportPDF} disabled={isExporting}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-black py-3 md:py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-blue-900/30 text-sm md:text-base">
            {isExporting ? <RotateCcw className="animate-spin" size={18} /> : <Download size={18} />}
            {isExporting ? 'İŞLENİYOR...' : 'PDF İNDİR'}
          </button>
        </div>
      </div>

      {/* Mobil overlay - menü açıkken arka planı kapatmak için */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-15"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* RIGHT PANEL (preview) */}
      <div className="flex-1 overflow-hidden bg-[#050505] relative flex flex-col items-center">
        {/* Zoom controls - mobilde daha küçük */}
        <div className="absolute top-2 md:top-6 z-50 flex items-center gap-1 md:gap-2 bg-[#111]/90 backdrop-blur-xl border border-white/10 p-1.5 md:p-2.5 rounded-xl md:rounded-2xl shadow-2xl">
          <button onClick={() => setZoomLevel(z => Math.max(0.3, z - 0.05))} className="p-1.5 md:p-2 hover:bg-white/5 rounded-lg md:rounded-xl text-slate-400 hover:text-white transition-colors"><ZoomOut size={14} /></button>
          <div className="px-2 md:px-3 text-[9px] md:text-[11px] font-black text-blue-400 min-w-[36px] text-center">%{Math.round(zoomLevel * 100)}</div>
          <button onClick={() => setZoomLevel(z => Math.min(1.6, z + 0.05))} className="p-1.5 md:p-2 hover:bg-white/5 rounded-lg md:rounded-xl text-slate-400 hover:text-white transition-colors"><ZoomIn size={14} /></button>
          <div className="w-px h-3 md:h-4 bg-white/10 mx-0.5 md:mx-1" />
          <button onClick={() => setZoomLevel(0.72)} className="p-1.5 md:p-2 hover:bg-white/5 rounded-lg md:rounded-xl text-slate-400 hover:text-white transition-colors"><RotateCcw size={14} /></button>
        </div>

        {/* Scrollable preview */}
        <div className="flex-1 w-full overflow-auto pt-14 md:pt-24 pb-16 flex justify-center">
          <div style={{ transformOrigin: 'top center', transform: `scale(${zoomLevel})` }}>
            <div ref={cvRef} id="cv-export-root" style={{ width: '794px' }}>
              {layouts[currentLayout]}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
// ── SHARED SMALL COMPONENTS ──
const Inp = ({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) => (
  <input type="text" placeholder={placeholder}
    className="w-full p-3 bg-[#080808] border border-white/10 rounded-xl text-sm text-white outline-none focus:border-blue-500 transition-colors"
    value={value} onChange={e => onChange(e.target.value)} />
);

const Card = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-4 bg-white/[0.04] p-5 rounded-2xl border border-white/5">
    <h3 className="text-[10px] font-black text-blue-500/80 uppercase tracking-[3px]">{label}</h3>
    {children}
  </div>
);

const SectionInput = ({ label, type, data, onAdd, onUpdate, onRemove, fields, isSkills }: any) => (
  <div className="space-y-3">
    <div className="flex justify-between items-center pb-1 border-b border-white/5">
      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</h3>
      <button onClick={onAdd} className="text-blue-500 hover:scale-110 transition-transform bg-blue-500/10 rounded-lg p-1"><Plus size={16}/></button>
    </div>
    {data.map((item: any) => (
      <div key={item.id} className="p-4 bg-white/[0.04] rounded-2xl border border-white/5 relative space-y-2.5 group">
        {fields.map((f: any) => f.area
          ? <textarea key={f.key} className="w-full p-2.5 text-xs bg-[#080808] text-white border border-white/10 rounded-xl h-20 outline-none resize-none focus:border-blue-500 transition-colors" placeholder={f.p} value={item[f.key]} onChange={e => onUpdate(type, item.id, f.key, e.target.value)} />
          : <input key={f.key} className="w-full p-2.5 text-xs bg-[#080808] text-white border border-white/10 rounded-xl outline-none focus:border-blue-500 transition-colors" placeholder={f.p} value={item[f.key]} onChange={e => onUpdate(type, item.id, f.key, e.target.value)} />
        )}
        {isSkills && (
          <div className="flex items-center gap-3 pt-1">
            <span className="text-[10px] font-bold text-slate-500 shrink-0">Seviye {item.level}/5</span>
            <input type="range" min="1" max="5" value={item.level} className="flex-1 accent-blue-500" onChange={e => onUpdate(type, item.id, 'level', parseInt(e.target.value))} />
          </div>
        )}
        <button onClick={() => onRemove(type, item.id)} className="absolute -top-2 -right-2 bg-red-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"><Trash2 size={12}/></button>
      </div>
    ))}
  </div>
);

// ── LAYOUT PROPS TYPE ──
interface LayoutProps {
  data: CVData;
  color: string;
  photo: boolean;
  spacing: SpacingType;
  font: string;
}

// ── SAFE SHARED RENDERERS ──
const ContactLine = ({ icon, text }: { icon: React.ReactNode; text: string }) =>
  text ? (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
      <span style={{ marginRight: '8px' }}>{icon}</span>
      <span style={{ fontSize: '11px', fontWeight: '600', color: '#334155' }}>{text}</span>
    </div>
  ) : null;

const SkillBar = ({ level, color, bg = 'rgba(255,255,255,0.2)' }: { level: number; color: string; bg?: string }) => (
  <div style={{ height: '6px', width: '100%', backgroundColor: bg, borderRadius: '10px', overflow: 'hidden', position: 'relative' as const }}>
    <div style={{ height: '100%', width: `${(level/5)*100}%`, backgroundColor: color, borderRadius: '10px', position: 'absolute' as const, left: 0, top: 0 }} />
  </div>
);

const SkillDots = ({ level, color }: { level: number; color: string }) => (
  <div style={{ display: 'flex', gap: '4px' }}>
    {[1,2,3,4,5].map(i => (
      <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: i <= level ? color : '#e2e8f0' }} />
    ))}
  </div>
);

// Alternatif: boxShadow ile border taklidi
// SectionHeader - gap yerine margin kullan
const SectionHeader = ({ title, color, font, icon }: { title: string; color: string; font: string; icon?: React.ReactNode }) => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    marginBottom: '18px', 
    borderBottom: `2px solid ${color}`,
    paddingBottom: '8px',
  }}>
    {icon && <span style={{ marginRight: '8px', color, lineHeight: 1 }}>{icon}</span>}
    <h3 style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#111', fontFamily: font, margin: 0 }}>
      {title}
    </h3>
  </div>
);

// ─────────────────────────────────────────────
// 1. MODERN LAYOUT
// ─────────────────────────────────────────────
const ModernLayout = ({ data, color, photo, spacing, font }: LayoutProps) => {
  const s = SPACING_CONFIG[spacing];
  return (
    <div style={{ width: '794px', minHeight: '1123px', display: 'flex', backgroundColor: '#fff', fontFamily: font }}>
      <div style={{ width: '270px', backgroundColor: color, padding: `${s.padding}px 28px`, color: 'white', boxSizing: 'border-box' }}>
        {photo && data.personal.image ? (
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <img src={data.personal.image} style={{ width: '130px', height: '130px', borderRadius: '50%', objectFit: 'cover', border: '6px solid rgba(255,255,255,0.15)' }} />
          </div>
        ) : null}
        <div style={{ marginBottom: `${s.sectionGap}px`, borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '20px' }}>
          <div style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.5)', marginBottom: '14px' }}>İletişim</div>
          <ContactLine icon={<Mail size={10}/>} text={data.personal.email} />
          <ContactLine icon={<Phone size={10}/>} text={data.personal.phone} />
          <ContactLine icon={<Globe size={10}/>} text={data.personal.portfolio} />
        </div>
        {data.skills.length > 0 && (
          <div style={{ marginBottom: `${s.sectionGap}px` }}>
            <div style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.5)', marginBottom: '14px' }}>Yetenekler</div>
            {data.skills.map(sk => (
              <div key={sk.id} style={{ marginBottom: `${s.itemGap}px` }}>
                <div style={{ fontSize: '10px', fontWeight: '800', marginBottom: '5px', textTransform: 'uppercase' }}>{sk.name}</div>
                <SkillBar level={sk.level} color='#fff' bg='rgba(255,255,255,0.2)' />
              </div>
            ))}
          </div>
        )}
        {data.languages.length > 0 && (
          <div style={{ marginBottom: `${s.sectionGap}px` }}>
            <div style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.5)', marginBottom: '14px' }}>Diller</div>
            {data.languages.map(lg => (
              <div key={lg.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '10px', fontWeight: '700' }}>
                <span>{lg.name}</span>
                <span style={{ opacity: 0.6 }}>{lg.level}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ flex: 1, padding: `${s.padding}px ${s.padding}px`, boxSizing: 'border-box' }}>
        <div style={{ marginBottom: '36px' }}>
          <h1 style={{ fontSize: '42px', fontWeight: '900', color: '#0a0a0a', textTransform: 'uppercase', margin: '0 0 6px 0', lineHeight: '1', letterSpacing: '-0.01em' }}>
            {data.personal.name || 'AD SOYAD'}
          </h1>
          <p style={{ fontSize: '14px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', margin: '0 0 16px 0', letterSpacing: '0.2em' }}>
            {data.personal.title || 'UNVAN'}
          </p>
          {data.personal.about && (
            <p style={{ fontSize: '10.5px', color: '#475569', lineHeight: '1.6', borderLeft: `3px solid ${color}`, paddingLeft: '12px' }}>
              {data.personal.about}
            </p>
          )}
        </div>
        <MainContent data={data} color={color} font={font} spacing={spacing} hideSidebar />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// 2. TIMELINE LAYOUT
// ─────────────────────────────────────────────
const TimelineLayout = ({ data, color, photo, spacing, font }: LayoutProps) => {
  const s = SPACING_CONFIG[spacing];
  return (
    <div style={{ width: '794px', minHeight: '1123px', backgroundColor: '#fff', padding: `${s.padding}px`, boxSizing: 'border-box', fontFamily: font }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: `${s.sectionGap + 10}px`, paddingBottom: '24px', borderBottom: `2px solid ${color}` }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '44px', fontWeight: '900', color: '#0a0a0a', margin: '0 0 6px 0', lineHeight: '1', letterSpacing: '-0.02em' }}>
            {data.personal.name || 'AD SOYAD'}
          </h1>
          <p style={{ fontSize: '14px', fontWeight: '700', color: color, textTransform: 'uppercase', letterSpacing: '0.2em', margin: 0 }}>
            {data.personal.title}
          </p>
          <div style={{ marginTop: '14px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {data.personal.email    && <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>{data.personal.email}</span>}
            {data.personal.phone    && <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>{data.personal.phone}</span>}
            {data.personal.portfolio && <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700' }}>{data.personal.portfolio}</span>}
          </div>
        </div>
        {photo && data.personal.image ? (
          <img src={data.personal.image} style={{ width: '110px', height: '110px', borderRadius: '1rem', objectFit: 'cover', border: `4px solid ${color}`, flexShrink: 0, marginLeft: '24px' }} />
        ) : null}
      </header>

      {data.personal.about && (
        <p style={{ fontSize: '11px', color: '#475569', lineHeight: '1.6', marginBottom: `${s.sectionGap}px`, maxWidth: '680px' }}>
          {data.personal.about}
        </p>
      )}

      <div style={{ display: 'flex', gap: '50px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          {data.experience.length > 0 && (
            <section style={{ marginBottom: `${s.sectionGap}px` }}>
              <SectionHeader title="İş Deneyimi" color={color} font={font} icon={<Briefcase size={13}/>} />
              <div style={{ position: 'relative', paddingLeft: '28px' }}>
                <div style={{ position: 'absolute', left: '6px', top: '4px', bottom: '4px', width: '1.5px', backgroundColor: '#e2e8f0' }} />
                {data.experience.map(exp => (
                  <div key={exp.id} style={{ position: 'relative', marginBottom: `${s.itemGap + 6}px` }}>
                    <div style={{ position: 'absolute', left: '-25px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color, border: '2px solid #fff', boxShadow: `0 0 0 2px ${color}` }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '3px' }}>
                      <h4 style={{ fontWeight: '900', fontSize: s.titleSize, color: '#111', textTransform: 'uppercase', margin: 0 }}>{exp.role}</h4>
                      <span style={{ fontSize: '9px', fontWeight: '800', color: '#94a3b8', backgroundColor: '#f8fafc', padding: '2px 8px', borderRadius: '99px', whiteSpace: 'nowrap', marginLeft: '8px' }}>{exp.year}</span>
                    </div>
                    <p style={{ fontSize: '11px', fontWeight: '700', color: color, margin: '0 0 5px 0' }}>{exp.company}</p>
                    <p style={{ fontSize: s.descSize, color: '#334155', lineHeight: s.lineHeight, margin: 0 }}>{exp.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
          {data.projects.length > 0 && (
            <section style={{ marginBottom: `${s.sectionGap}px` }}>
              <SectionHeader title="Projeler" color={color} font={font} icon={<Code size={13}/>} />
              {data.projects.map(p => (
                <div key={p.id} style={{ marginBottom: `${s.itemGap}px`, padding: '12px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <h4 style={{ fontWeight: '900', fontSize: s.titleSize, color: '#111', margin: 0, textTransform: 'uppercase' }}>{p.name}</h4>
                    <span style={{ fontSize: '9px', fontWeight: '800', color: color }}>{p.tech}</span>
                  </div>
                  <p style={{ fontSize: s.descSize, color: '#334155', lineHeight: s.lineHeight, margin: 0 }}>{p.desc}</p>
                </div>
              ))}
            </section>
          )}
        </div>
        <div style={{ width: '220px' }}>
          {data.education.length > 0 && (
            <section style={{ marginBottom: `${s.sectionGap}px` }}>
              <SectionHeader title="Eğitim" color={color} font={font} icon={<GraduationCap size={13}/>} />
              {data.education.map(edu => (
                <div key={edu.id} style={{ marginBottom: `${s.itemGap}px` }}>
                  <h4 style={{ fontWeight: '900', fontSize: s.titleSize, color: '#111', margin: '0 0 2px 0' }}>{edu.school}</h4>
                  <p style={{ fontSize: '10px', color: color, fontWeight: '700', margin: '0 0 2px 0' }}>{edu.degree}</p>
                  <p style={{ fontSize: '9px', color: '#94a3b8', margin: 0 }}>{edu.year}</p>
                </div>
              ))}
            </section>
          )}
          {data.skills.length > 0 && (
            <section style={{ marginBottom: `${s.sectionGap}px` }}>
              <SectionHeader title="Yetenekler" color={color} font={font} icon={<Star size={13}/>} />
              {data.skills.map(sk => (
                <div key={sk.id} style={{ marginBottom: `${s.itemGap - 4}px` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '800', marginBottom: '5px' }}>
                    <span>{sk.name}</span><span style={{ color: '#94a3b8' }}>{sk.level}/5</span>
                  </div>
                  <SkillBar level={sk.level} color={color} bg='#e2e8f0' />
                </div>
              ))}
            </section>
          )}
          {data.languages.length > 0 && (
            <section>
              <SectionHeader title="Diller" color={color} font={font} />
              {data.languages.map(lg => (
                <div key={lg.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '10px', fontWeight: '700' }}>
                  <span style={{ color: '#111' }}>{lg.name}</span>
                  <span style={{ color: color, fontWeight: '900' }}>{lg.level}</span>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// 3. TERMINAL LAYOUT
// ─────────────────────────────────────────────
const TerminalLayout = ({ data, color, spacing, font }: LayoutProps) => {
  const s = SPACING_CONFIG[spacing];
  const monoFont = "'Courier New', Courier, monospace";
  return (
    <div style={{ width: '794px', minHeight: '1123px', backgroundColor: '#0d1117', padding: `${s.padding}px`, boxSizing: 'border-box', color: '#c9d1d9', fontFamily: monoFont }}>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {['#ff5f56','#ffbd2e','#27c93f'].map(c => <div key={c} style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: c }} />)}
      </div>
      <div style={{ marginBottom: `${s.sectionGap}px`, borderBottom: '1px solid #21262d', paddingBottom: '12px' }}>
        <span style={{ color: '#58a6ff' }}>{(data.personal.name||'user').toLowerCase().replace(/\s/g,'_')}</span>
        <span style={{ color: '#8b949e' }}>@cv-terminal</span>
        <span style={{ color: '#8b949e' }}>:~$ </span>
        <span style={{ color: '#c9d1d9' }}>./show_cv.sh</span>
      </div>
      <div style={{ marginBottom: `${s.sectionGap}px`, padding: '20px', border: '1px solid #21262d', borderRadius: '6px', backgroundColor: '#161b22' }}>
        <div style={{ color: '#7ee787', fontSize: '22px', fontWeight: 'bold', marginBottom: '4px' }}>// {data.personal.name || 'AD SOYAD'}</div>
        <div style={{ color: '#8b949e', fontSize: '14px', marginBottom: '14px' }}>{"/* "}{data.personal.title}{"  */"}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
          {data.personal.email    && <div><span style={{ color: '#f78166' }}>email</span><span style={{ color: '#8b949e' }}>: </span><span style={{ color: '#a5d6ff' }}>"{data.personal.email}"</span></div>}
          {data.personal.phone    && <div><span style={{ color: '#f78166' }}>phone</span><span style={{ color: '#8b949e' }}>: </span><span style={{ color: '#a5d6ff' }}>"{data.personal.phone}"</span></div>}
          {data.personal.portfolio && <div><span style={{ color: '#f78166' }}>links</span><span style={{ color: '#8b949e' }}>: </span><span style={{ color: '#a5d6ff' }}>"{data.personal.portfolio}"</span></div>}
        </div>
      </div>
      {data.personal.about && (
        <div style={{ marginBottom: `${s.sectionGap}px`, fontSize: '10.5px', color: '#8b949e', lineHeight: '1.6', borderLeft: '2px solid #388bfd', paddingLeft: '12px' }}>
          {'//'} {data.personal.about}
        </div>
      )}
      {data.experience.length > 0 && (
        <div style={{ marginBottom: `${s.sectionGap}px` }}>
          <div style={{ color: '#d2a8ff', fontSize: '13px', fontWeight: 'bold', marginBottom: '14px' }}>{'>'} work_experience()</div>
          {data.experience.map(exp => (
            <div key={exp.id} style={{ marginBottom: `${s.itemGap + 4}px`, paddingLeft: '16px', borderLeft: '1px solid #21262d' }}>
              <div style={{ color: '#7ee787', fontWeight: 'bold', fontSize: s.titleSize }}>
                [{exp.year}] {exp.company} <span style={{ color: '#8b949e' }}>::</span> {exp.role}
              </div>
              {exp.desc && <div style={{ color: '#8b949e', marginTop: '5px', fontSize: s.descSize, lineHeight: s.lineHeight }}>{'// '}{exp.desc}</div>}
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', marginBottom: `${s.sectionGap}px` }}>
        {data.projects.length > 0 && (
          <div style={{ flex: 1, minWidth: '250px' }}>
            <div style={{ color: '#d2a8ff', fontSize: '13px', fontWeight: 'bold', marginBottom: '12px' }}>{'>'} projects()</div>
            {data.projects.map(p => (
              <div key={p.id} style={{ marginBottom: `${s.itemGap}px`, padding: '10px', border: '1px solid #21262d', borderRadius: '4px' }}>
                <div style={{ color: '#ffa657', fontWeight: 'bold', fontSize: '11px', marginBottom: '3px' }}>{p.name}</div>
                <div style={{ color: '#388bfd', fontSize: '9px', marginBottom: '4px' }}>[{p.tech}]</div>
                <div style={{ color: '#8b949e', fontSize: s.descSize, lineHeight: s.lineHeight }}>{p.desc}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{ flex: 1, minWidth: '200px' }}>
          {data.education.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ color: '#d2a8ff', fontSize: '13px', fontWeight: 'bold', marginBottom: '12px' }}>{'>'} education()</div>
              {data.education.map(edu => (
                <div key={edu.id} style={{ marginBottom: `${s.itemGap - 4}px` }}>
                  <div style={{ color: '#c9d1d9', fontWeight: 'bold', fontSize: '11px' }}>{edu.school}</div>
                  <div style={{ color: '#58a6ff', fontSize: '10px' }}>{edu.degree} // {edu.year}</div>
                </div>
              ))}
            </div>
          )}
          {data.skills.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ color: '#d2a8ff', fontSize: '13px', fontWeight: 'bold', marginBottom: '12px' }}>{'>'} skills()</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {data.skills.map(sk => (
                  <span key={sk.id} style={{ backgroundColor: '#161b22', color: '#58a6ff', padding: '3px 8px', borderRadius: '2px', fontSize: '10px', border: '1px solid #21262d' }}>
                    {sk.name}@{sk.level}
                  </span>
                ))}
              </div>
            </div>
          )}
          {data.languages.length > 0 && (
            <div>
              <div style={{ color: '#d2a8ff', fontSize: '13px', fontWeight: 'bold', marginBottom: '12px' }}>{'>'} languages()</div>
              {data.languages.map(lg => (
                <div key={lg.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '5px' }}>
                  <span style={{ color: '#c9d1d9' }}>{lg.name}</span>
                  <span style={{ color: '#7ee787' }}>{lg.level}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ color: '#3d444d', fontSize: '10px', marginTop: 'auto' }}>// EOF — {new Date().getFullYear()}</div>
    </div>
  );
};

// ─────────────────────────────────────────────
// 4. SIDEBAR-RIGHT LAYOUT
// ─────────────────────────────────────────────
const SidebarRightLayout = ({ data, color, photo, spacing, font }: LayoutProps) => {
  const s = SPACING_CONFIG[spacing];
  return (
    <div style={{ width: '794px', minHeight: '1123px', display: 'flex', flexDirection: 'row-reverse', backgroundColor: '#fff', fontFamily: font }}>
      <div style={{ width: '250px', backgroundColor: color, padding: `${s.padding}px 24px`, color: 'white', boxSizing: 'border-box' }}>
        {photo && data.personal.image ? (
          <div style={{ marginBottom: '28px' }}>
            <img src={data.personal.image} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: '1rem', border: '4px solid rgba(255,255,255,0.15)' }} />
          </div>
        ) : null}
        <div style={{ marginBottom: `${s.sectionGap}px`, paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
          <div style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>İletişim</div>
          <ContactLine icon={<Mail size={10}/>} text={data.personal.email} />
          <ContactLine icon={<Phone size={10}/>} text={data.personal.phone} />
          <ContactLine icon={<Globe size={10}/>} text={data.personal.portfolio} />
        </div>
        {data.skills.length > 0 && (
          <div style={{ marginBottom: `${s.sectionGap}px` }}>
            <div style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>Yetenekler</div>
            {data.skills.map(sk => (
              <div key={sk.id} style={{ marginBottom: `${s.itemGap}px` }}>
                <div style={{ fontSize: '10px', fontWeight: '800', marginBottom: '5px', textTransform: 'uppercase' }}>{sk.name}</div>
                <SkillBar level={sk.level} color='#fff' bg='rgba(255,255,255,0.2)' />
              </div>
            ))}
          </div>
        )}
        {data.languages.length > 0 && (
          <div>
            <div style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>Diller</div>
            {data.languages.map(lg => (
              <div key={lg.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '10px', fontWeight: '700' }}>
                <span>{lg.name}</span><span style={{ opacity: 0.6 }}>{lg.level}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ flex: 1, padding: `${s.padding}px`, boxSizing: 'border-box' }}>
        <div style={{ marginBottom: '36px' }}>
          <h1 style={{ fontSize: '44px', fontWeight: '900', color: '#111', textTransform: 'uppercase', margin: '0 0 6px 0', lineHeight: '1', letterSpacing: '-0.01em' }}>
            {data.personal.name || 'AD SOYAD'}
          </h1>
          <div style={{ display: 'inline-block', backgroundColor: `${color}15`, padding: '6px 14px', borderRadius: '8px', marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: '800', color: color, textTransform: 'uppercase', margin: 0, letterSpacing: '0.1em' }}>
              {data.personal.title || 'UNVAN'}
            </p>
          </div>
          {data.personal.about && (
            <p style={{ fontSize: '10.5px', color: '#475569', lineHeight: '1.6', margin: 0 }}>{data.personal.about}</p>
          )}
        </div>
        <MainContent data={data} color={color} font={font} spacing={spacing} hideSidebar />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// 5. CLASSIC LAYOUT
// ─────────────────────────────────────────────
const ClassicLayout = ({ data, color, photo, spacing, font }: LayoutProps) => {
  const s = SPACING_CONFIG[spacing];
  return (
    <div style={{ width: '794px', minHeight: '1123px', backgroundColor: '#fff', padding: `${s.padding}px 64px`, boxSizing: 'border-box', fontFamily: font }}>
      <header style={{ textAlign: 'center', marginBottom: '36px', paddingBottom: '24px', borderBottom: `2px solid ${color}` }}>
        {photo && data.personal.image ? (
          <img src={data.personal.image} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', marginBottom: '16px', filter: 'grayscale(20%)', display: 'block', margin: '0 auto 16px auto' }} />
        ) : null}
        <h1 style={{ fontSize: '36px', fontWeight: '900', textTransform: 'uppercase', margin: '0 0 6px 0', letterSpacing: '0.1em', color: '#0a0a0a' }}>
          {data.personal.name || 'AD SOYAD'}
        </h1>
        <p style={{ fontSize: '13px', fontWeight: '700', color: color, textTransform: 'uppercase', letterSpacing: '0.3em', margin: '0 0 14px 0' }}>
          {data.personal.title}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
          {data.personal.email    && <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>{data.personal.email}</span>}
          {data.personal.phone    && <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>{data.personal.phone}</span>}
          {data.personal.portfolio && <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>{data.personal.portfolio}</span>}
        </div>
      </header>
      {data.personal.about && (
        <div style={{ marginBottom: `${s.sectionGap}px`, padding: '16px 20px', backgroundColor: '#f8fafc', borderRadius: '8px', border: `1px solid #f1f5f9` }}>
          <p style={{ fontSize: '10.5px', color: '#475569', lineHeight: '1.7', margin: 0, textAlign: 'justify' }}>{data.personal.about}</p>
        </div>
      )}
      <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
        <div style={{ flex: 2, minWidth: '250px' }}>
          <MainContent data={data} color={color} font={font} spacing={spacing} hideSidebar />
        </div>
        <div style={{ flex: 1, minWidth: '180px' }}>
          {data.skills.length > 0 && (
            <section style={{ marginBottom: `${s.sectionGap}px` }}>
              <SectionHeader title="Yetenekler" color={color} font={font} />
              {data.skills.map(sk => (
                <div key={sk.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: `${s.itemGap - 4}px` }}>
                  <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}>{sk.name}</span>
                  <SkillDots level={sk.level} color={color} />
                </div>
              ))}
            </section>
          )}
          {data.languages.length > 0 && (
            <section style={{ marginBottom: `${s.sectionGap}px` }}>
              <SectionHeader title="Diller" color={color} font={font} />
              {data.languages.map(lg => (
                <div key={lg.id} style={{ marginBottom: '8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#111' }}>{lg.name}</span>
                  <span style={{ fontSize: '9px', color: color, fontWeight: '700', marginLeft: '8px' }}>{lg.level}</span>
                </div>
              ))}
            </section>
          )}
          {data.education.length > 0 && (
            <section>
              <SectionHeader title="Eğitim" color={color} font={font} />
              {data.education.map(edu => (
                <div key={edu.id} style={{ marginBottom: `${s.itemGap}px` }}>
                  <h4 style={{ fontWeight: '900', fontSize: '11px', color: '#111', margin: '0 0 2px 0' }}>{edu.school}</h4>
                  <p style={{ fontSize: '10px', color: color, fontWeight: '700', margin: '0 0 2px 0' }}>{edu.degree}</p>
                  <p style={{ fontSize: '9px', color: '#94a3b8', margin: 0 }}>{edu.year}</p>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// 6. TWO-COLUMN LAYOUT
// ─────────────────────────────────────────────
const TwoColumnLayout = ({ data, color, photo, spacing, font }: LayoutProps) => {
  const s = SPACING_CONFIG[spacing];
  return (
    <div style={{ width: '794px', minHeight: '1123px', backgroundColor: '#fff', fontFamily: font, display: 'flex', flexDirection: 'column' }}>
      <header style={{ backgroundColor: color, padding: `${s.padding * 0.8}px ${s.padding}px`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '46px', fontWeight: '900', color: '#fff', margin: 0, lineHeight: '1', textTransform: 'uppercase' }}>
            {data.personal.name || 'AD SOYAD'}
          </h1>
          <p style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.75)', margin: '8px 0 0 0', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            {data.personal.title}
          </p>
        </div>
        {photo && data.personal.image ? (
          <img src={data.personal.image} style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '1.5rem', border: '5px solid rgba(255,255,255,0.2)', flexShrink: 0, marginLeft: '24px' }} />
        ) : null}
      </header>
      <div style={{ display: 'flex', flex: 1, flexWrap: 'wrap' }}>
        <div style={{ flex: 2, padding: `${s.padding}px ${s.padding * 0.9}px ${s.padding}px ${s.padding}px`, borderRight: '1px solid #f1f5f9', minWidth: '250px' }}>
          {data.personal.about && (
            <p style={{ fontSize: '10.5px', color: '#475569', lineHeight: '1.7', marginBottom: `${s.sectionGap}px`, borderLeft: `3px solid ${color}`, paddingLeft: '12px' }}>
              {data.personal.about}
            </p>
          )}
          <MainContent data={data} color={color} font={font} spacing={spacing} hideSidebar />
        </div>
        <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: `${s.padding}px 22px`, minWidth: '180px' }}>
          <section style={{ marginBottom: `${s.sectionGap}px` }}>
            <SectionHeader title="İletişim" color={color} font={font} />
            <div style={{ fontSize: '10px', color: '#475569', lineHeight: '1.8' }}>
              {data.personal.email    && <div style={{ marginBottom: '5px', wordBreak: 'break-all' }}>{data.personal.email}</div>}
              {data.personal.phone    && <div style={{ marginBottom: '5px' }}>{data.personal.phone}</div>}
              {data.personal.portfolio && <div style={{ marginBottom: '5px', wordBreak: 'break-all' }}>{data.personal.portfolio}</div>}
            </div>
          </section>
          {data.skills.length > 0 && (
            <section style={{ marginBottom: `${s.sectionGap}px` }}>
              <SectionHeader title="Yetenekler" color={color} font={font} />
              {data.skills.map(sk => (
                <div key={sk.id} style={{ marginBottom: `${s.itemGap - 2}px` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '800', marginBottom: '5px' }}>
                    <span style={{ textTransform: 'uppercase' }}>{sk.name}</span>
                    <span style={{ color: '#94a3b8' }}>{sk.level}/5</span>
                  </div>
                  <SkillBar level={sk.level} color={color} bg='#e2e8f0' />
                </div>
              ))}
            </section>
          )}
          {data.languages.length > 0 && (
            <section style={{ marginBottom: `${s.sectionGap}px` }}>
              <SectionHeader title="Diller" color={color} font={font} />
              {data.languages.map(lg => (
                <div key={lg.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700', marginBottom: '7px' }}>
                  <span style={{ color: '#111' }}>{lg.name}</span>
                  <span style={{ color: color }}>{lg.level}</span>
                </div>
              ))}
            </section>
          )}
          {data.education.length > 0 && (
            <section>
              <SectionHeader title="Eğitim" color={color} font={font} />
              {data.education.map(edu => (
                <div key={edu.id} style={{ marginBottom: `${s.itemGap}px` }}>
                  <h4 style={{ fontWeight: '900', fontSize: '11px', color: '#111', margin: '0 0 2px 0' }}>{edu.school}</h4>
                  <p style={{ fontSize: '9.5px', color: color, fontWeight: '700', margin: '0 0 2px 0' }}>{edu.degree}</p>
                  <p style={{ fontSize: '9px', color: '#94a3b8', margin: 0 }}>{edu.year}</p>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// 7. ATS LAYOUT (clean, single-column)
// ─────────────────────────────────────────────
const ATSLayout = ({ data, color, spacing, font }: LayoutProps) => {
  const s = SPACING_CONFIG[spacing];
  const dividerStyle = { borderTop: `1.5px solid ${color}`, margin: `${s.sectionGap * 0.5}px 0 ${s.sectionGap * 0.7}px 0` };
  const h3Style = { fontSize: '13px', fontWeight: '900', textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: '#000', margin: '0 0 14px 0', fontFamily: font };
  return (
    <div style={{ width: '794px', minHeight: '1123px', backgroundColor: '#fff', padding: `${s.padding}px ${s.padding + 20}px`, boxSizing: 'border-box', fontFamily: font, color: '#111' }}>
      <header style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', textTransform: 'uppercase', margin: '0 0 4px 0', letterSpacing: '0.05em' }}>
          {data.personal.name || 'AD SOYAD'}
        </h1>
        {data.personal.title && (
          <p style={{ fontSize: '14px', fontWeight: '700', color: color, margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {data.personal.title}
          </p>
        )}
        <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', fontSize: '10.5px', color: '#333', fontWeight: '600' }}>
          {data.personal.email    && <span>{data.personal.email}</span>}
          {data.personal.phone    && <span>{data.personal.phone}</span>}
          {data.personal.portfolio && <span>{data.personal.portfolio}</span>}
          {data.personal.address  && <span>{data.personal.address}</span>}
        </div>
      </header>
      <div style={dividerStyle} />
      {data.personal.about && (
        <>
          <h3 style={h3Style}>Özet</h3>
          <p style={{ fontSize: '10.5px', lineHeight: '1.65', color: '#333', margin: '0 0 4px 0' }}>{data.personal.about}</p>
          <div style={dividerStyle} />
        </>
      )}
      {data.experience.length > 0 && (
        <>
          <h3 style={h3Style}>İş Deneyimi</h3>
          {data.experience.map(exp => (
            <div key={exp.id} style={{ marginBottom: `${s.itemGap + 4}px` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong style={{ fontSize: s.titleSize, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{exp.role}</strong>
                <span style={{ fontSize: '10px', color: '#555', fontWeight: '700' }}>{exp.year}</span>
              </div>
              <p style={{ fontSize: '11px', fontWeight: '700', color: color, margin: '2px 0 5px 0' }}>{exp.company}</p>
              {exp.desc && (
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  {exp.desc.split('\n').filter(Boolean).map((line, i) => (
                    <li key={i} style={{ fontSize: s.descSize, color: '#333', lineHeight: s.lineHeight, marginBottom: '3px' }}>{line}</li>
                  ))}
                  {!exp.desc.includes('\n') && (
                    <li style={{ fontSize: s.descSize, color: '#333', lineHeight: s.lineHeight }}>{exp.desc}</li>
                  )}
                </ul>
              )}
            </div>
          ))}
          <div style={dividerStyle} />
        </>
      )}
      {data.education.length > 0 && (
        <>
          <h3 style={h3Style}>Eğitim</h3>
          {data.education.map(edu => (
            <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: `${s.itemGap}px` }}>
              <div>
                <strong style={{ fontSize: s.titleSize, textTransform: 'uppercase' }}>{edu.school}</strong>
                <p style={{ fontSize: '10.5px', color: '#555', margin: '2px 0 0 0' }}>{edu.degree}</p>
              </div>
              <span style={{ fontSize: '10px', color: '#555', fontWeight: '700', whiteSpace: 'nowrap' }}>{edu.year}</span>
            </div>
          ))}
          <div style={dividerStyle} />
        </>
      )}
      {data.skills.length > 0 && (
        <>
          <h3 style={h3Style}>Yetenekler</h3>
          <p style={{ fontSize: '10.5px', color: '#333', lineHeight: '1.6', margin: '0 0 4px 0' }}>
            {data.skills.map(sk => sk.name).join(' • ')}
          </p>
          <div style={dividerStyle} />
        </>
      )}
      {data.languages.length > 0 && (
        <>
          <h3 style={h3Style}>Diller</h3>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '10.5px', color: '#333' }}>
            {data.languages.map(lg => (
              <span key={lg.id}><strong>{lg.name}</strong>{lg.level ? ` — ${lg.level}` : ''}</span>
            ))}
          </div>
          <div style={dividerStyle} />
        </>
      )}
      {data.projects.length > 0 && (
        <>
          <h3 style={h3Style}>Projeler</h3>
          {data.projects.map(p => (
            <div key={p.id} style={{ marginBottom: `${s.itemGap}px` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong style={{ fontSize: s.titleSize, textTransform: 'uppercase' }}>{p.name}</strong>
                {p.tech && <span style={{ fontSize: '10px', color: color, fontWeight: '700' }}>{p.tech}</span>}
              </div>
              {p.desc && <p style={{ fontSize: s.descSize, color: '#333', lineHeight: s.lineHeight, margin: '3px 0 0 0' }}>{p.desc}</p>}
            </div>
          ))}
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// 8. BAUHAUS LAYOUT (geometric, bold, artistic)
// ─────────────────────────────────────────────
const BauhausLayout = ({ data, color, photo, spacing, font }: LayoutProps) => {
  const s = SPACING_CONFIG[spacing];
  return (
    <div style={{ width: '794px', minHeight: '1123px', backgroundColor: '#fafaf8', fontFamily: font, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '300px', backgroundColor: color, opacity: 0.08, borderRadius: '0 0 0 300px' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '200px', height: '200px', backgroundColor: color, opacity: 0.06, borderRadius: '0 200px 0 0' }} />
      <header style={{ display: 'flex', padding: `${s.padding}px`, paddingBottom: 0, position: 'relative', alignItems: 'center', flexWrap: 'wrap' }}>
        {(photo && data.personal.image) ? (
          <div style={{ width: '180px', height: '180px', borderRadius: '50%', backgroundColor: color, position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '40px' }}>
            <img src={data.personal.image} style={{ width: '160px', height: '160px', borderRadius: '50%', objectFit: 'cover' }} />
          </div>
        ) : null}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, minWidth: '200px' }}>
          <h1 style={{ fontSize: '52px', fontWeight: '900', color: '#0a0a0a', margin: '0 0 4px 0', lineHeight: '0.9', textTransform: 'uppercase', letterSpacing: '-0.03em' }}>
            {(data.personal.name || 'AD SOYAD').split(' ')[0]}
          </h1>
          <h1 style={{ fontSize: '52px', fontWeight: '900', color: color, margin: '0 0 12px 0', lineHeight: '0.9', textTransform: 'uppercase', letterSpacing: '-0.03em' }}>
            {(data.personal.name || 'AD SOYAD').split(' ').slice(1).join(' ')}
          </h1>
          <div style={{ width: '60px', height: '4px', backgroundColor: color, marginBottom: '12px', borderRadius: '2px' }} />
          <p style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.2em', margin: '0 0 14px 0' }}>
            {data.personal.title}
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {data.personal.email    && <span style={{ fontSize: '9.5px', color: '#555', fontWeight: '700', backgroundColor: '#fff', padding: '4px 10px', borderRadius: '99px', border: '1px solid #e2e8f0' }}>{data.personal.email}</span>}
            {data.personal.phone    && <span style={{ fontSize: '9.5px', color: '#555', fontWeight: '700', backgroundColor: '#fff', padding: '4px 10px', borderRadius: '99px', border: '1px solid #e2e8f0' }}>{data.personal.phone}</span>}
            {data.personal.portfolio && <span style={{ fontSize: '9.5px', color: '#555', fontWeight: '700', backgroundColor: '#fff', padding: '4px 10px', borderRadius: '99px', border: '1px solid #e2e8f0' }}>{data.personal.portfolio}</span>}
          </div>
        </div>
      </header>
      <div style={{ height: '4px', backgroundColor: color, margin: `${s.sectionGap * 0.6}px ${s.padding}px` }} />
      <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', padding: `0 ${s.padding}px ${s.padding}px` }}>
        <div style={{ flex: 2, minWidth: '250px' }}>
          {data.personal.about && (
            <div style={{ marginBottom: `${s.sectionGap}px`, padding: '16px 20px', backgroundColor: '#fff', borderRadius: '12px', borderLeft: `4px solid ${color}`, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: '10.5px', color: '#475569', lineHeight: '1.7', margin: 0 }}>{data.personal.about}</p>
            </div>
          )}
          {data.experience.length > 0 && (
            <section style={{ marginBottom: `${s.sectionGap}px` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div style={{ width: '24px', height: '24px', backgroundColor: color, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Briefcase size={12} color='#fff' />
                </div>
                <h3 style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#111', margin: 0 }}>Deneyim</h3>
              </div>
              {data.experience.map((exp, idx) => (
                <div key={exp.id} style={{ marginBottom: `${s.itemGap + 4}px`, padding: '14px', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', borderTop: idx === 0 ? `2px solid ${color}` : '2px solid transparent' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <h4 style={{ fontWeight: '900', fontSize: s.titleSize, textTransform: 'uppercase', color: '#111', margin: 0 }}>{exp.role}</h4>
                    <span style={{ fontSize: '9px', color: color, fontWeight: '900', backgroundColor: `${color}12`, padding: '2px 8px', borderRadius: '99px' }}>{exp.year}</span>
                  </div>
                  <p style={{ fontSize: '10.5px', fontWeight: '700', color: color, margin: '0 0 6px 0' }}>{exp.company}</p>
                  {exp.desc && <p style={{ fontSize: s.descSize, color: '#475569', lineHeight: s.lineHeight, margin: 0 }}>{exp.desc}</p>}
                </div>
              ))}
            </section>
          )}
          {data.projects.length > 0 && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div style={{ width: '24px', height: '24px', backgroundColor: color, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Code size={12} color='#fff' />
                </div>
                <h3 style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#111', margin: 0 }}>Projeler</h3>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {data.projects.map(p => (
                  <div key={p.id} style={{ flex: '1 1 200px', padding: '12px', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                    <h4 style={{ fontWeight: '900', fontSize: '11px', textTransform: 'uppercase', color: '#111', margin: '0 0 3px 0' }}>{p.name}</h4>
                    <p style={{ fontSize: '9px', fontWeight: '800', color: color, margin: '0 0 5px 0', textTransform: 'uppercase' }}>{p.tech}</p>
                    <p style={{ fontSize: s.descSize, color: '#475569', lineHeight: s.lineHeight, margin: 0 }}>{p.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
        <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: `${s.sectionGap}px` }}>
          {data.education.length > 0 && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GraduationCap size={10} color='#fff' />
                </div>
                <h3 style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#111', margin: 0 }}>Eğitim</h3>
              </div>
              {data.education.map(edu => (
                <div key={edu.id} style={{ marginBottom: `${s.itemGap}px`, paddingLeft: '10px', borderLeft: `2px solid ${color}30` }}>
                  <h4 style={{ fontWeight: '900', fontSize: '11px', color: '#111', margin: '0 0 2px 0' }}>{edu.school}</h4>
                  <p style={{ fontSize: '9.5px', color: color, fontWeight: '700', margin: '0 0 1px 0' }}>{edu.degree}</p>
                  <p style={{ fontSize: '9px', color: '#94a3b8', margin: 0 }}>{edu.year}</p>
                </div>
              ))}
            </section>
          )}
          {data.skills.length > 0 && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Star size={10} color='#fff' />
                </div>
                <h3 style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#111', margin: 0 }}>Yetenekler</h3>
              </div>
              {data.skills.map(sk => (
                <div key={sk.id} style={{ marginBottom: `${s.itemGap - 2}px` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '800', marginBottom: '4px' }}>
                    <span style={{ textTransform: 'uppercase' }}>{sk.name}</span>
                    <span style={{ color: '#94a3b8', fontSize: '9px' }}>{sk.level}/5</span>
                  </div>
                  <SkillBar level={sk.level} color={color} bg='#e2e8f0' />
                </div>
              ))}
            </section>
          )}
          {data.languages.length > 0 && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Globe size={10} color='#fff' />
                </div>
                <h3 style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#111', margin: 0 }}>Diller</h3>
              </div>
              {data.languages.map(lg => (
                <div key={lg.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#111' }}>{lg.name}</span>
                  <span style={{ fontSize: '9.5px', fontWeight: '700', color: color }}>{lg.level}</span>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

// ── SHARED MAIN CONTENT ──
const MainContent = ({ data, color, font, spacing, hideSidebar = false }: {
  data: CVData; color: string; font: string; spacing: SpacingType; hideSidebar?: boolean;
}) => {
  const s = SPACING_CONFIG[spacing];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${s.sectionGap}px` }}>
      {data.experience.length > 0 && (
        <section>
          <SectionHeader title="İş Deneyimi" color={color} font={font} icon={<Briefcase size={13}/>} />
          {data.experience.map(exp => (
            <div key={exp.id} style={{ marginBottom: `${s.itemGap + 4}px` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '3px' }}>
                <h4 style={{ fontWeight: '900', fontSize: s.titleSize, color: '#111', textTransform: 'uppercase', margin: 0 }}>{exp.role}</h4>
                <span style={{ fontSize: '9px', fontWeight: '800', color: '#94a3b8', backgroundColor: '#f8fafc', padding: '2px 8px', borderRadius: '99px', whiteSpace: 'nowrap', marginLeft: '8px' }}>{exp.year}</span>
              </div>
              <p style={{ fontSize: '11px', fontWeight: '700', color: color, margin: '0 0 5px 0' }}>{exp.company}</p>
              {exp.desc && <p style={{ fontSize: s.descSize, color: '#475569', lineHeight: s.lineHeight, margin: 0 }}>{exp.desc}</p>}
            </div>
          ))}
        </section>
      )}
      {data.projects.length > 0 && (
        <section>
          <SectionHeader title="Projeler" color={color} font={font} icon={<Code size={13}/>} />
          {data.projects.map(p => (
            <div key={p.id} style={{ marginBottom: `${s.itemGap}px`, padding: '12px', borderRadius: '10px', border: '1px solid #f1f5f9', backgroundColor: '#fafbfc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', flexWrap: 'wrap' }}>
                <h4 style={{ fontWeight: '900', fontSize: s.titleSize, color: '#111', margin: 0, textTransform: 'uppercase' }}>{p.name}</h4>
                <span style={{ fontSize: '9px', fontWeight: '800', color: color, whiteSpace: 'nowrap', marginLeft: '8px' }}>{p.tech}</span>
              </div>
              {p.desc && <p style={{ fontSize: s.descSize, color: '#475569', lineHeight: s.lineHeight, margin: 0 }}>{p.desc}</p>}
            </div>
          ))}
        </section>
      )}
      {!hideSidebar && data.education.length > 0 && (
        <section>
          <SectionHeader title="Eğitim" color={color} font={font} icon={<GraduationCap size={13}/>} />
          {data.education.map(edu => (
            <div key={edu.id} style={{ marginBottom: `${s.itemGap}px` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
                <h4 style={{ fontWeight: '900', fontSize: s.titleSize, color: '#111', margin: 0, textTransform: 'uppercase' }}>{edu.school}</h4>
                <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '700' }}>{edu.year}</span>
              </div>
              <p style={{ fontSize: '10.5px', color: color, fontWeight: '700', margin: '2px 0 0 0' }}>{edu.degree}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};

// ── TEMPLATE THUMBNAILS ──
const TemplateThumbnail = ({ type, color, selected }: { type: string; color: string; selected: boolean }) => {
  const check = selected && (
    <div style={{ position:'absolute', top:'6px', right:'6px', width:'16px', height:'16px', borderRadius:'50%', backgroundColor: color, display:'flex', alignItems:'center', justifyContent:'center', zIndex:10 }}>
      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    </div>
  );

  return (
    <div className={`w-full h-20 bg-white rounded-xl overflow-hidden relative border transition-all ${selected ? 'border-transparent shadow-inner' : 'border-slate-100'}`}>
      {check}
      {type === 'modern' && (
        <div className="flex h-full">
          <div className="w-1/3 h-full" style={{backgroundColor:color}}>
            <div className="w-5 h-5 rounded-full bg-white/30 mx-auto mt-2"/>
            <div className="space-y-1 px-2 mt-2"><div className="w-full h-[1px] bg-white/20"/><div className="w-3/4 h-[1px] bg-white/20"/></div>
          </div>
          <div className="flex-1 p-2 space-y-1.5">
            <div className="w-3/4 h-2 bg-slate-100 rounded"/>
            <div className="w-full h-[1px] bg-slate-50"/><div className="w-full h-[1px] bg-slate-50"/>
          </div>
        </div>
      )}
      {type === 'timeline' && (
        <div className="relative p-2 h-full">
          <div className="absolute left-1/2 top-2 bottom-2 w-[1px] bg-slate-800 -translate-x-1/2"/>
          {[1,2,3].map(i=>(
            <div key={i} className="flex justify-center mb-2 relative">
              <div className="w-2 h-2 rounded-full z-10" style={{backgroundColor:color}}/>
            </div>
          ))}
        </div>
      )}
      {type === 'terminal' && (
        <div className="h-full bg-[#0d1117] p-2">
          <div className="flex gap-1 mb-1.5">
            {['#ff5f56','#ffbd2e','#27c93f'].map(c=><div key={c} style={{width:'5px',height:'5px',borderRadius:'50%',backgroundColor:c}}/>)}
          </div>
          <div className="w-1/2 h-[1px]" style={{backgroundColor:color}}/>
          <div className="mt-1 w-full h-[1px] bg-slate-700"/><div className="mt-1 w-2/3 h-[1px] bg-slate-700"/>
        </div>
      )}
      {type === 'sidebar-right' && (
        <div className="flex flex-row-reverse h-full">
          <div className="w-1/3 h-full" style={{backgroundColor:color}}>
            <div className="w-full aspect-square bg-white/10"/>
          </div>
          <div className="flex-1 p-2 space-y-1">
            <div className="w-3/4 h-2 bg-slate-100 rounded ml-auto"/>
            <div className="w-full h-[1px] bg-slate-50"/>
          </div>
        </div>
      )}
      {type === 'classic' && (
        <div className="h-full p-2 flex flex-col items-center">
          <div className="w-1/2 h-2 bg-slate-100 mb-1"/>
          <div className="w-full h-[1.5px] mb-2" style={{backgroundColor:color}}/>
          <div className="grid grid-cols-3 gap-1 w-full">
            <div className="col-span-2 space-y-1"><div className="w-full h-[1px] bg-slate-100"/><div className="w-full h-[1px] bg-slate-100"/></div>
            <div className="space-y-1"><div className="w-full h-[1px] bg-slate-50"/></div>
          </div>
        </div>
      )}
      {type === 'two-column' && (
        <div className="h-full flex flex-col">
          <div className="h-8 flex items-center px-2" style={{backgroundColor:color}}>
            <div className="w-12 h-1.5 bg-white/40 rounded"/>
          </div>
          <div className="flex-1 grid grid-cols-3 gap-1 p-2">
            <div className="col-span-2 space-y-1"><div className="w-full h-[1px] bg-slate-100"/><div className="w-full h-[1px] bg-slate-100"/></div>
            <div className="space-y-1"><div className="w-full h-3 bg-slate-50 rounded"/></div>
          </div>
        </div>
      )}
      {type === 'ats' && (
        <div className="h-full p-2 space-y-1.5 bg-white">
          <div className="w-2/3 h-2.5 rounded" style={{backgroundColor:`${color}30`}}/>
          <div className="w-full h-[1.5px]" style={{backgroundColor:color}}/>
          <div className="space-y-1">
            <div className="w-full h-[1px] bg-slate-100"/>
            <div className="w-full h-[1px] bg-slate-100"/>
            <div className="w-3/4 h-[1px] bg-slate-100"/>
          </div>
          <div className="w-full h-[1.5px] bg-slate-100"/>
          <div className="space-y-1"><div className="w-full h-[1px] bg-slate-100"/></div>
        </div>
      )}
      {type === 'bauhaus' && (
        <div className="h-full relative overflow-hidden bg-[#fafaf8]">
          <div className="absolute top-0 right-0 w-10 h-10 rounded-bl-full opacity-20" style={{backgroundColor:color}}/>
          <div className="p-2">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-8 h-8 rounded-full" style={{backgroundColor:color}}/>
              <div className="space-y-1"><div className="w-10 h-1.5 bg-slate-200 rounded"/><div className="w-6 h-1 rounded" style={{backgroundColor:`${color}60`}}/></div>
            </div>
            <div className="w-full h-[2px] mb-1.5" style={{backgroundColor:color}}/>
            <div className="space-y-1"><div className="w-full h-[1px] bg-slate-100"/><div className="w-full h-[1px] bg-slate-100"/></div>
          </div>
        </div>
      )}
    </div>
  );
};