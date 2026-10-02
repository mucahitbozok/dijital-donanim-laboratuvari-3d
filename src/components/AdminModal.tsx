import React, { useState } from 'react';
import type { HardwareDataset, HardwareItem, Hotspot, QuizQuestion } from '../types/hardware';
import { storageService } from '../services/storage';
import { soundService } from '../services/sound';
import { defaultCategories } from '../data/defaultHardware';
import {
  X,
  Settings,
  Plus,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  Save,
  Edit,
  Eye,
  List,
  Tag,
  Cpu,
  Check
} from 'lucide-react';

interface Props {
  dataset: HardwareDataset;
  onUpdateDataset: (newDataset: HardwareDataset) => void;
  onClose: () => void;
}

export const AdminModal: React.FC<Props> = ({
  dataset,
  onUpdateDataset,
  onClose
}) => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'hardware' | 'categories'>('hardware');

  // Hardware State
  const [hardwareList, setHardwareList] = useState<HardwareItem[]>(dataset.hardware);
  const [selectedItem, setSelectedItem] = useState<HardwareItem>(hardwareList[0] || dataset.hardware[0]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Category Management State
  const [categories, setCategories] = useState<string[]>(() => {
    if (dataset.categories && dataset.categories.length > 0) {
      return dataset.categories;
    }
    const catSet = new Set<string>(defaultCategories);
    dataset.hardware.forEach(h => {
      if (h.category && h.category.trim()) {
        catSet.add(h.category.trim());
      }
    });
    return Array.from(catSet);
  });

  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ original: string; current: string } | null>(null);
  const [quickAddCatInput, setQuickAddCatInput] = useState('');
  const [showQuickAddCat, setShowQuickAddCat] = useState(false);
  const [assignModalCategory, setAssignModalCategory] = useState<string | null>(null);
  const [newHardwareNameInCat, setNewHardwareNameInCat] = useState('');

  // Toggle hardware assignment to category
  const handleToggleHardwareCategory = (hardwareId: string, targetCat: string) => {
    soundService.playClick();
    const fallbackCategory = categories.find(c => c !== targetCat) || 'Genel';
    setHardwareList(prev => prev.map(h => {
      if (h.id === hardwareId) {
        const nextCat = h.category === targetCat ? fallbackCategory : targetCat;
        return { ...h, category: nextCat };
      }
      return h;
    }));

    if (selectedItem.id === hardwareId) {
      setSelectedItem(prev => ({
        ...prev,
        category: prev.category === targetCat ? fallbackCategory : targetCat
      }));
    }
  };

  // Remove hardware from category directly from pill "x"
  const handleRemoveHardwareFromCategory = (hardwareId: string, currentCat: string) => {
    soundService.playClick();
    const fallbackCategory = categories.find(c => c !== currentCat) || 'Genel';
    setHardwareList(prev => prev.map(h => h.id === hardwareId ? { ...h, category: fallbackCategory } : h));
    if (selectedItem.id === hardwareId) {
      setSelectedItem(prev => ({ ...prev, category: fallbackCategory }));
    }
  };

  // Create a brand new hardware item directly under this category and navigate to it
  const handleCreateHardwareInCat = (targetCat: string) => {
    const rawName = newHardwareNameInCat.trim() || 'Yeni Donanım Parçası';
    soundService.playCorrect();
    const newId = `custom_${Date.now()}`;
    const newItem: HardwareItem = {
      id: newId,
      name: rawName,
      category: targetCat,
      shortDescription: 'Bu donanım bilgisayarın önemli bir parçasıdır.',
      function: 'Belirli görevleri yerine getirir.',
      location: 'Bilgisayar sistemi içerisinde yer alır.',
      importantInfo: 'Öğretmen tarafından eklenmiştir.',
      summary: `${rawName} bileşeni.`,
      hotspots: [],
      questions: [],
      missions: []
    };
    setHardwareList([newItem, ...hardwareList]);
    setSelectedItem(newItem);
    setNewHardwareNameInCat('');
    setAssignModalCategory(null);
    setActiveTab('hardware');
  };

  // Form states for selectedItem
  const updateField = (field: keyof HardwareItem, value: any) => {
    const updated = { ...selectedItem, [field]: value };
    setSelectedItem(updated);
    setHardwareList(prev => prev.map(item => item.id === updated.id ? updated : item));
  };

  // Add new hardware item
  const handleAddNewHardware = () => {
    soundService.playClick();
    const newId = `custom_${Date.now()}`;
    const initialCategory = categories[0] || 'Genel';
    const newItem: HardwareItem = {
      id: newId,
      name: 'Yeni Donanım Parçası',
      category: initialCategory,
      shortDescription: 'Bu donanım bilgisayarın önemli bir parçasıdır.',
      function: 'Belirli görevleri yerine getirir.',
      location: 'Bilgisayar kasası içinde veya dış bağlantı noktalarında yer alır.',
      importantInfo: 'Öğretmen tarafından eklenmiştir.',
      summary: 'Yeni eklenen donanım bileşeni.',
      hotspots: [],
      questions: [],
      missions: []
    };
    const updatedList = [newItem, ...hardwareList];
    setHardwareList(updatedList);
    setSelectedItem(newItem);
    setActiveTab('hardware');
  };

  // Delete hardware item with prominent confirmation
  const handleDeleteHardware = (id: string) => {
    if (hardwareList.length <= 1) {
      alert('En az bir donanım parçası bulunmalıdır. Tüm donanımlar silinemez.');
      return;
    }

    const itemToDelete = hardwareList.find(h => h.id === id);
    const itemName = itemToDelete ? itemToDelete.name : 'Bu donanım';

    if (confirm(`"${itemName}" adlı donanımı tamamen silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz.`)) {
      soundService.playClick();
      const updatedList = hardwareList.filter(h => h.id !== id);
      setHardwareList(updatedList);
      if (selectedItem.id === id) {
        setSelectedItem(updatedList[0]);
      }
    }
  };

  // Category Operations
  const handleAddCategory = (nameToAdd?: string): string | undefined => {
    const raw = (nameToAdd !== undefined ? nameToAdd : newCategoryInput).trim();
    if (!raw) {
      alert('Lütfen geçerli bir kategori adı yazın.');
      return;
    }
    if (categories.some(c => c.toLowerCase() === raw.toLowerCase())) {
      alert(`"${raw}" isimli kategori zaten mevcut.`);
      return;
    }
    soundService.playCorrect();
    const updated = [...categories, raw];
    setCategories(updated);
    setNewCategoryInput('');
    return raw;
  };

  const handleRenameCategory = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) {
      alert('Kategori adı boş bırakılamaz.');
      return;
    }
    if (trimmed.toLowerCase() === oldName.toLowerCase()) {
      setEditingCategory(null);
      return;
    }
    if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase() && c !== oldName)) {
      alert(`"${trimmed}" isimli bir kategori zaten mevcut.`);
      return;
    }

    soundService.playCorrect();
    // 1. Update categories list
    setCategories(prev => prev.map(c => c === oldName ? trimmed : c));
    // 2. Update all hardware items that had oldName
    setHardwareList(prev => prev.map(h => h.category === oldName ? { ...h, category: trimmed } : h));
    // 3. Update selected item if matched
    if (selectedItem.category === oldName) {
      setSelectedItem(prev => ({ ...prev, category: trimmed }));
    }
    setEditingCategory(null);
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (categories.length <= 1) {
      alert('En az bir kategori bulunmalıdır. Son kategoriyi silemezsiniz.');
      return;
    }

    const assignedHardware = hardwareList.filter(h => h.category === catToDelete);
    const fallbackCategory = categories.find(c => c !== catToDelete) || 'Genel';

    let confirmMsg = `"${catToDelete}" kategorisini silmek istediğinize emin misiniz?`;
    if (assignedHardware.length > 0) {
      const names = assignedHardware.map(h => h.name).join(', ');
      confirmMsg = `"${catToDelete}" kategorisinde ${assignedHardware.length} adet donanım bulunuyor:\n(${names})\n\nBu kategoriyi silerseniz, bu donanımlar otomatik olarak "${fallbackCategory}" kategorisine aktarılacaktır.\n\nDevam etmek istiyor musunuz?`;
    }

    if (confirm(confirmMsg)) {
      soundService.playClick();
      // Reassign affected hardware
      if (assignedHardware.length > 0) {
        setHardwareList(prev => prev.map(h => h.category === catToDelete ? { ...h, category: fallbackCategory } : h));
        if (selectedItem.category === catToDelete) {
          setSelectedItem(prev => ({ ...prev, category: fallbackCategory }));
        }
      }
      // Remove from categories
      setCategories(prev => prev.filter(c => c !== catToDelete));
    }
  };

  // Hotspot management
  const handleAddHotspot = () => {
    const newHs: Hotspot = {
      id: `hs_${Date.now()}`,
      label: 'Yeni Bölüm',
      info: 'Bu bölümün görev açıklaması.',
      position: [0, 0.3, 0]
    };
    updateField('hotspots', [...selectedItem.hotspots, newHs]);
  };

  const handleRemoveHotspot = (index: number) => {
    const updated = [...selectedItem.hotspots];
    updated.splice(index, 1);
    updateField('hotspots', updated);
  };

  const handleUpdateHotspot = (index: number, key: keyof Hotspot, val: any) => {
    const updated = [...selectedItem.hotspots];
    updated[index] = { ...updated[index], [key]: val };
    updateField('hotspots', updated);
  };

  // Question management
  const handleAddQuestion = () => {
    const newQ: QuizQuestion = {
      question: 'Yeni soru metnini buraya yazın?',
      options: ['A Seçeneği', 'B Seçeneği', 'C Seçeneği', 'D Seçeneği'],
      answer: 0,
      explanation: 'Doğru cevabın açıklaması.'
    };
    updateField('questions', [...selectedItem.questions, newQ]);
  };

  const handleRemoveQuestion = (index: number) => {
    const updated = [...selectedItem.questions];
    updated.splice(index, 1);
    updateField('questions', updated);
  };

  // Save changes to storage
  const handleSaveAll = () => {
    soundService.playCorrect();
    const updatedDataset: HardwareDataset = {
      ...dataset,
      categories,
      hardware: hardwareList
    };
    storageService.saveData(updatedDataset);
    onUpdateDataset(updatedDataset);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Export JSON
  const handleExport = () => {
    soundService.playClick();
    const currentDataset: HardwareDataset = { ...dataset, categories, hardware: hardwareList };
    storageService.exportData(currentDataset);
  };

  // Import JSON
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const imported = storageService.importData(text);
        setHardwareList(imported.hardware);
        setSelectedItem(imported.hardware[0]);
        if (imported.categories && imported.categories.length > 0) {
          setCategories(imported.categories);
        }
        onUpdateDataset(imported);
        soundService.playCorrect();
        alert('Veriler başarıyla içe aktarıldı!');
      } catch (err: any) {
        soundService.playIncorrect();
        alert('JSON dosyası içe aktarılırken hata: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Factory reset to default JSON
  const handleResetDefaults = () => {
    if (confirm('Tüm donanım ve kategori değişiklikleri sıfırlanacak ve orijinal fabrika ayarlarına dönülecek. Emin misiniz?')) {
      soundService.playClick();
      const reset = storageService.resetToDefault();
      setHardwareList(reset.hardware);
      setSelectedItem(reset.hardware[0]);
      setCategories(reset.categories || defaultCategories);
      onUpdateDataset(reset);
      alert('Varsayılan donanım ve kategori verileri geri yüklendi.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in select-none">
      <div className="w-full max-w-6xl h-[92vh] flex flex-col rounded-3xl bg-lab-900 border border-purple-500/40 shadow-2xl overflow-hidden text-left">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-lab-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                <span>Öğretmen Yönetim Paneli</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold">
                  Admin
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Donanımları, kategorileri, 3D modelleri, açıklamaları ve pekiştirme sorularını yönetin.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveAll}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg transition min-h-[44px]"
            >
              <Save className="w-4 h-4" />
              <span>{saveSuccess ? 'KAYDEDİLDİ!' : 'DEĞİŞİKLİKLERİ KAYDET'}</span>
            </button>

            <button
              onClick={() => {
                soundService.playClick();
                onClose();
              }}
              className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition min-h-[44px]"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tab Switcher & Action Toolbar */}
        <div className="px-6 py-2.5 bg-lab-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Main Tabs */}
          <div className="flex items-center gap-1.5 bg-lab-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                soundService.playClick();
                setActiveTab('hardware');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'hardware'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-4 h-4 text-sky-400" />
              <span>Donanımlar ({hardwareList.length})</span>
            </button>

            <button
              onClick={() => {
                soundService.playClick();
                setActiveTab('categories');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'categories'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tag className="w-4 h-4 text-purple-400" />
              <span>Kategori Yönetimi ({categories.length})</span>
            </button>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {activeTab === 'hardware' && (
              <>
                <button
                  onClick={handleAddNewHardware}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/40 font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Yeni Donanım Ekle</span>
                </button>

                <button
                  onClick={() => handleDeleteHardware(selectedItem.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 border border-rose-500/40 font-bold"
                  title="Seçili donanımı sil"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Seçili Donanımı Sil</span>
                </button>
              </>
            )}

            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-lab-800 text-slate-200 hover:bg-slate-700 border border-slate-700 font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON Olarak İndir</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-lab-800 text-slate-200 hover:bg-slate-700 border border-slate-700 font-semibold cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>JSON İçe Aktar</span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>

            <button
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Fabrika Ayarlarına Dön</span>
            </button>
          </div>
        </div>

        {/* Modal Body: Left sidebar (list) + Right Editor Form */}
        {activeTab === 'hardware' ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar: Hardware List */}
            <div className="w-72 bg-lab-950/60 border-r border-slate-800 overflow-y-auto custom-scrollbar p-3 space-y-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 flex items-center justify-between">
                <span>Mevcut Donanımlar ({hardwareList.length})</span>
              </div>
              {hardwareList.map((item) => {
                const isSelected = item.id === selectedItem.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      soundService.playClick();
                      setSelectedItem(item);
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition group ${
                      isSelected
                        ? 'bg-purple-600/30 border border-purple-500/60 text-white'
                        : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                    }`}
                  >
                    <div className="flex flex-col truncate pr-2">
                      <span className="font-bold text-sm truncate">{item.name}</span>
                      <span className="text-[11px] text-slate-400">{item.category}</span>
                    </div>

                    {/* Always visible and accessible delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteHardware(item.id);
                      }}
                      className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 p-2 rounded-lg transition flex-shrink-0"
                      title="Bu Donanımı Sil"
                    >
                      <Trash2 className="w-4 h-4 text-rose-400/80 group-hover:text-rose-400" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Right Editor Form */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {/* Basic Info */}
              <div className="p-5 rounded-2xl bg-lab-850 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                    <Edit className="w-4 h-4" />
                    <span>Temel Bilgiler: {selectedItem.name}</span>
                  </h3>

                  {/* Explicit & Prominent Delete Hardware Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteHardware(selectedItem.id)}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 font-bold text-xs transition shadow-sm"
                    title="Bu donanımı sistemden sil"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>Donanımı Sil</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      Donanım Adı:
                    </label>
                    <input
                      type="text"
                      value={selectedItem.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      className="w-full p-3 rounded-xl bg-lab-900 border border-slate-700 text-white font-semibold text-sm outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Category Dropdown + Quick Add Button */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-400">
                        Kategori:
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowQuickAddCat(!showQuickAddCat)}
                        className="text-[11px] font-bold text-purple-400 hover:text-purple-300 transition flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Yeni Kategori Ekle</span>
                      </button>
                    </div>

                    {showQuickAddCat && (
                      <div className="mb-2 p-2.5 rounded-xl bg-lab-900 border border-purple-500/50 flex items-center gap-2 animate-fade-in">
                        <input
                          type="text"
                          placeholder="Yeni kategori adı..."
                          value={quickAddCatInput}
                          onChange={(e) => setQuickAddCatInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const added = handleAddCategory(quickAddCatInput);
                              if (added) {
                                updateField('category', added);
                                setQuickAddCatInput('');
                                setShowQuickAddCat(false);
                              }
                            }
                          }}
                          className="flex-1 p-2 rounded-lg bg-lab-950 border border-slate-700 text-xs text-white outline-none focus:border-purple-400"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const added = handleAddCategory(quickAddCatInput);
                            if (added) {
                              updateField('category', added);
                              setQuickAddCatInput('');
                              setShowQuickAddCat(false);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-purple-600 text-white font-bold text-xs hover:bg-purple-500 transition"
                        >
                          Ekle & Ata
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowQuickAddCat(false)}
                          className="p-1.5 text-slate-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <select
                      value={selectedItem.category}
                      onChange={(e) => updateField('category', e.target.value)}
                      className="w-full p-3 rounded-xl bg-lab-900 border border-slate-700 text-white font-semibold text-sm outline-none focus:border-purple-500 cursor-pointer"
                    >
                      {!categories.includes(selectedItem.category) && (
                        <option value={selectedItem.category}>{selectedItem.category} (Özel)</option>
                      )}
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  1 Cümlede Özet (Öğrenci İçin En Önemli Cümle):
                </label>
                <input
                  type="text"
                  value={selectedItem.summary}
                  onChange={(e) => updateField('summary', e.target.value)}
                  className="w-full p-3 rounded-xl bg-lab-900 border border-slate-700 text-white font-semibold text-sm outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Görevi (Detaylı Açıklama):
                </label>
                <textarea
                  rows={2}
                  value={selectedItem.function}
                  onChange={(e) => updateField('function', e.target.value)}
                  className="w-full p-3 rounded-xl bg-lab-900 border border-slate-700 text-white font-semibold text-sm outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Nerede Bulunur?
                  </label>
                  <input
                    type="text"
                    value={selectedItem.location}
                    onChange={(e) => updateField('location', e.target.value)}
                    className="w-full p-3 rounded-xl bg-lab-900 border border-slate-700 text-white font-semibold text-sm outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    3D Model (.glb / .gltf dosya yolu, URL veya Doğrudan Yükleme):
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Örn: /models/ram.glb veya https://..."
                      value={selectedItem.model3d || ''}
                      onChange={(e) => updateField('model3d', e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-lab-900 border border-slate-700 text-white font-semibold text-xs outline-none focus:border-purple-500 font-mono"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/50 text-xs font-bold cursor-pointer transition min-h-[40px]">
                        <Upload className="w-4 h-4 text-purple-300" />
                        <span>📁 Bilgisayardan .glb Seç</span>
                        <input
                          type="file"
                          accept=".glb,.gltf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const blobUrl = URL.createObjectURL(file);
                              updateField('model3d', blobUrl);
                              soundService.playCorrect();
                            }
                          }}
                          className="hidden"
                        />
                      </label>

                      {selectedItem.model3d && (
                        <button
                          type="button"
                          onClick={() => {
                            soundService.playClick();
                            updateField('model3d', '');
                          }}
                          className="px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition min-h-[40px]"
                          title="Özel modeli kaldırıp varsayılan prosedürel 3D modele geri döner"
                        >
                          Varsayılan Modele Dön
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      💡 İpucu: Modellerinizi projenin <code className="text-purple-300 font-mono">public/models/</code> klasörüne atıp buraya <code className="text-purple-300 font-mono">/models/dosya_adi.glb</code> yazarak kalıcı olarak kullanabilirsiniz.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Önemli Bilgi / Not:
                </label>
                <input
                  type="text"
                  value={selectedItem.importantInfo || ''}
                  onChange={(e) => updateField('importantInfo', e.target.value)}
                  className="w-full p-3 rounded-xl bg-lab-900 border border-slate-700 text-white font-semibold text-sm outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Hotspots Section */}
            <div className="p-5 rounded-2xl bg-lab-850 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  3D Açıklama Noktaları (Hotspots) ({selectedItem.hotspots.length})
                </h3>
                <button
                  onClick={handleAddHotspot}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nokta Ekle</span>
                </button>
              </div>

              <div className="space-y-3">
                {selectedItem.hotspots.map((hs, index) => (
                  <div key={hs.id || index} className="p-3 rounded-xl bg-lab-900 border border-slate-800 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-1">
                      {index + 1}
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Nokta Başlığı (Örn: Çekirdek)"
                        value={hs.label}
                        onChange={(e) => handleUpdateHotspot(index, 'label', e.target.value)}
                        className="p-2 rounded-lg bg-lab-950 border border-slate-700 text-xs text-white font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Açıklaması"
                        value={hs.info}
                        onChange={(e) => handleUpdateHotspot(index, 'info', e.target.value)}
                        className="p-2 rounded-lg bg-lab-950 border border-slate-700 text-xs text-slate-200"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveHotspot(index)}
                      className="text-slate-500 hover:text-rose-400 p-1 mt-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Questions Section */}
            <div className="p-5 rounded-2xl bg-lab-850 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <List className="w-4 h-4" />
                  Pekiştirme Soruları ({selectedItem.questions.length})
                </h3>
                <button
                  onClick={handleAddQuestion}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Soru Ekle</span>
                </button>
              </div>

              <div className="space-y-4">
                {selectedItem.questions.map((q, qIndex) => (
                  <div key={qIndex} className="p-4 rounded-xl bg-lab-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400">Soru {qIndex + 1}</span>
                      <button
                        onClick={() => handleRemoveQuestion(qIndex)}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => {
                        const updated = [...selectedItem.questions];
                        updated[qIndex].question = e.target.value;
                        updateField('questions', updated);
                      }}
                      className="w-full p-2.5 rounded-lg bg-lab-950 border border-slate-700 text-sm text-white font-bold"
                      placeholder="Soru metni"
                    />

                    {/* Options */}
                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct_${qIndex}`}
                            checked={q.answer === optIndex}
                            onChange={() => {
                              const updated = [...selectedItem.questions];
                              updated[qIndex].answer = optIndex;
                              updateField('questions', updated);
                            }}
                            className="text-emerald-500"
                            title="Doğru cevap olarak işaretle"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const updated = [...selectedItem.questions];
                              updated[qIndex].options[optIndex] = e.target.value;
                              updateField('questions', updated);
                            }}
                            className="flex-1 p-2 rounded-lg bg-lab-950 border border-slate-700 text-xs text-slate-200"
                          />
                        </div>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={q.explanation}
                      onChange={(e) => {
                        const updated = [...selectedItem.questions];
                        updated[qIndex].explanation = e.target.value;
                        updateField('questions', updated);
                      }}
                      className="w-full p-2 rounded-lg bg-lab-950 border border-slate-700 text-xs text-slate-300"
                      placeholder="Açıklama (Doğru/yanlış cevaptan sonra gösterilir)"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
          /* Category Management Full View */
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            {/* Add Category Card */}
            <div className="p-5 rounded-2xl bg-lab-850 border border-purple-500/30 space-y-3 shadow-lg">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm uppercase tracking-wider">
                <Plus className="w-4 h-4" />
                <span>Yeni Donanım Kategorisi Ekle</span>
              </div>
              <p className="text-xs text-slate-400">
                Oluşturduğunuz kategoriler alt kısımdaki filtreleme çubuğunda ve donanım kartlarında doğrudan yer alır.
              </p>
              <div className="flex flex-wrap items-center gap-3 max-w-xl">
                <input
                  type="text"
                  placeholder="Örn: Yapay Zeka, Ses Aygıtları, Sensörler..."
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddCategory();
                  }}
                  className="flex-1 min-w-[240px] p-3 rounded-xl bg-lab-900 border border-slate-700 text-white font-semibold text-sm outline-none focus:border-purple-500 placeholder-slate-500"
                />
                <button
                  onClick={() => handleAddCategory()}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition min-h-[44px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Kategori Ekle</span>
                </button>
              </div>
            </div>

            {/* Existing Categories Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-sky-400" />
                  <span>Mevcut Kategoriler ({categories.length})</span>
                </h3>
                <span className="text-xs text-slate-400">
                  Kategori adını yeniden adlandırabilir veya silebilirsiniz.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => {
                  const assignedItems = hardwareList.filter(h => h.category === cat);
                  const isEditing = editingCategory?.original === cat;

                  return (
                    <div
                      key={cat}
                      className="p-4 rounded-2xl bg-lab-850 border border-slate-800 flex flex-col justify-between gap-3 hover:border-slate-700 transition relative group shadow-sm"
                    >
                      {/* Top row: Category title or edit input */}
                      <div>
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingCategory.current}
                              onChange={(e) => setEditingCategory({ ...editingCategory, current: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameCategory(cat, editingCategory.current);
                                if (e.key === 'Escape') setEditingCategory(null);
                              }}
                              autoFocus
                              className="flex-1 p-2 rounded-lg bg-lab-950 border border-purple-500 text-sm font-bold text-white outline-none"
                            />
                            <button
                              onClick={() => handleRenameCategory(cat, editingCategory.current)}
                              className="p-2 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition"
                              title="Kaydet"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingCategory(null)}
                              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition"
                              title="İptal"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
                                <Tag className="w-4 h-4" />
                              </span>
                              <span className="font-bold text-base text-white">{cat}</span>
                            </div>

                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                              assignedItems.length > 0
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {assignedItems.length} donanım
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Middle: Associated hardware pills */}
                      <div className="min-h-[44px]">
                        {assignedItems.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {assignedItems.map(item => (
                              <span
                                key={item.id}
                                className="text-[11px] px-2 py-0.5 rounded-md bg-lab-900 border border-slate-700/60 text-slate-300 font-medium flex items-center gap-1.5 group/pill"
                              >
                                <span>{item.name}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveHardwareFromCategory(item.id, cat);
                                  }}
                                  className="text-slate-500 hover:text-rose-400 font-bold px-0.5 leading-none"
                                  title={`"${item.name}" donanımını bu kategoriden çıkar`}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between py-1">
                            <span className="text-xs text-slate-500 italic">
                              Bu kategoriye atanmış donanım yok
                            </span>
                            <button
                              onClick={() => {
                                soundService.playClick();
                                setAssignModalCategory(cat);
                              }}
                              className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 underline"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Ekle</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Bottom row: Action Buttons */}
                      {!isEditing && (
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                          {/* "+ Donanım Ekle" Prominent Button */}
                          <button
                            onClick={() => {
                              soundService.playClick();
                              setAssignModalCategory(cat);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/35 text-purple-300 hover:text-white border border-purple-500/40 text-xs font-bold transition shadow-sm"
                            title="Bu kategoriye donanım ekle veya mevcut donanımları ata"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Donanım Ekle</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                soundService.playClick();
                                setEditingCategory({ original: cat, current: cat });
                              }}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
                              title="Kategori Adını Değiştir"
                            >
                              <Edit className="w-3.5 h-3.5 text-sky-400" />
                              <span>Adı Değiştir</span>
                            </button>

                            <button
                              onClick={() => handleDeleteCategory(cat)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-xs font-semibold transition"
                              title="Kategoriyi Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                              <span>Sil</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Assign / Add Hardware to Category Popup Dialog */}
            {assignModalCategory && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
                <div className="w-full max-w-2xl flex flex-col rounded-3xl bg-lab-900 border border-purple-500/50 shadow-2xl overflow-hidden max-h-[85vh]">
                  {/* Header */}
                  <div className="p-5 bg-lab-950 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                        <Tag className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          "{assignModalCategory}" Kategorisine Donanım Ekle
                        </h3>
                        <p className="text-xs text-slate-400">
                          Mevcut donanımları bu kategoriye atayabilir veya yeni bir donanım oluşturabilirsiniz.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setAssignModalCategory(null)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 text-left">
                    {/* 1. Quick Add New Hardware under this Category */}
                    <div className="p-4 rounded-2xl bg-lab-850 border border-purple-500/30 space-y-3">
                      <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider">
                        ➕ Bu Kategoride Sıfırdan Yeni Donanım Oluştur:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Yeni donanımın adı (Örn: Ses Kartı, Barkod Okuyucu...)"
                          value={newHardwareNameInCat}
                          onChange={(e) => setNewHardwareNameInCat(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateHardwareInCat(assignModalCategory);
                          }}
                          className="flex-1 p-2.5 rounded-xl bg-lab-900 border border-slate-700 text-white font-semibold text-sm outline-none focus:border-purple-500 placeholder-slate-500"
                        />
                        <button
                          onClick={() => handleCreateHardwareInCat(assignModalCategory)}
                          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 whitespace-nowrap min-h-[42px]"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Oluştur ve Düzenle</span>
                        </button>
                      </div>
                    </div>

                    {/* 2. Assign / Move Existing Hardware */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-sky-400" />
                          <span>Mevcut Donanımlardan Ata ({hardwareList.length} Donanım):</span>
                        </label>
                        <span className="text-[11px] text-slate-400">
                          Tıklayarak kategoriye ekleyin veya çıkarın
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto custom-scrollbar p-1">
                        {hardwareList.map((h) => {
                          const isInThisCat = h.category === assignModalCategory;
                          return (
                            <div
                              key={h.id}
                              onClick={() => handleToggleHardwareCategory(h.id, assignModalCategory)}
                              className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer select-none ${
                                isInThisCat
                                  ? 'bg-purple-600/20 border-purple-500 text-white ring-1 ring-purple-500/40'
                                  : 'bg-lab-850 hover:bg-lab-800 border-slate-800 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold transition ${
                                  isInThisCat ? 'bg-purple-500 text-white' : 'border border-slate-600 text-transparent'
                                }`}>
                                  ✓
                                </div>
                                <div className="truncate">
                                  <span className="font-bold text-sm block truncate">{h.name}</span>
                                  <span className="text-[10px] text-slate-400 block truncate">
                                    {isInThisCat ? 'Bu kategoride' : `Şu an: ${h.category}`}
                                  </span>
                                </div>
                              </div>

                              <span className={`text-[10px] px-2 py-0.5 rounded font-bold whitespace-nowrap ${
                                isInThisCat
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-400'
                              }`}>
                                {isInThisCat ? 'Eklendi' : 'Ekle'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-4 bg-lab-950 border-t border-slate-800 flex items-center justify-end">
                    <button
                      onClick={() => setAssignModalCategory(null)}
                      className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition"
                    >
                      Tamamla
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
