import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import CreateView from './components/CreateView';
import TemplatesView from './components/TemplatesView';
import SizesView from './components/SizesView';
import PrinterView from './components/PrinterView';
import SettingsView from './components/SettingsView';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [posterData, setPosterData] = useState({
    title: 'Cerveja Heineken',
    subtitle: 'Long Neck Especial 330ml',
    regularPrice: '8,49',
    promoPrice: '5,99',
    unit: 'un',
    barcode: '7891991000853',
    extraInfo: 'Beba com moderação. Oferta válida até acabar o estoque.',
    template: 'varejo-estrela',
    colorTheme: 'classic-red',
    fontSizeTitle: 'medium',
    showBarcode: true,
    fontFamily: 'impact'
  });

  const [globalSettings, setGlobalSettings] = useState({
    storeName: 'MERCADO RODRIGUES',
    currency: 'R$',
    defaultPrinter: 'EPSON L3250',
    quality: 'standard',
    theme: 'obsidian'
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView setActiveTab={setActiveTab} />;
      case 'criar':
        return (
          <CreateView 
            posterData={posterData} 
            setPosterData={setPosterData} 
            globalSettings={globalSettings} 
          />
        );
      case 'modelos':
        return (
          <TemplatesView 
            setActiveTab={setActiveTab} 
            setPosterData={setPosterData} 
          />
        );
      case 'tamanhos':
        return <SizesView />;
      case 'impressora':
        return <PrinterView />;
      case 'configuracoes':
        return (
          <SettingsView 
            globalSettings={globalSettings} 
            setGlobalSettings={setGlobalSettings} 
          />
        );
      default:
        return <DashboardView setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className={`app-container theme-${globalSettings.theme}`}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}
