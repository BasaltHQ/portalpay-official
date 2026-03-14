'use client';
import React, { useState } from 'react';

interface NavItem {
  id: string;
  label: string;
  type: 'page' | 'collection' | 'product' | 'url' | 'blog';
  target: string;
  children?: NavItem[];
  visible: boolean;
}

interface NavMenu {
  id: string;
  name: string;
  location: 'header' | 'footer' | 'mobile' | 'custom';
  items: NavItem[];
}

export default function NavigationBuilder() {
  const [menus, setMenus] = useState<NavMenu[]>([
    { id: 'main', name: 'Main Navigation', location: 'header', items: [] },
    { id: 'footer', name: 'Footer Navigation', location: 'footer', items: [] },
  ]);
  const [activeMenu, setActiveMenu] = useState<string>('main');
  const currentMenu = menus.find(m => m.id === activeMenu);

  const createItem = (): NavItem => ({
    id: `nav-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    label: '', type: 'url', target: '', children: [], visible: true,
  });

  const addItemToMenu = (parentId: string | null, item: NavItem) => {
    setMenus(prev => prev.map(menu => {
      if (menu.id !== activeMenu) return menu;
      if (!parentId) return { ...menu, items: [...menu.items, item] };
      return { ...menu, items: insertChild(menu.items, parentId, item) };
    }));
  };

  function insertChild(items: NavItem[], parentId: string, child: NavItem): NavItem[] {
    return items.map(item => {
      if (item.id === parentId) return { ...item, children: [...(item.children || []), child] };
      if (item.children?.length) return { ...item, children: insertChild(item.children, parentId, child) };
      return item;
    });
  }

  const removeItem = (itemId: string) => {
    setMenus(prev => prev.map(menu => {
      if (menu.id !== activeMenu) return menu;
      return { ...menu, items: filterDeep(menu.items, itemId) };
    }));
  };

  function filterDeep(items: NavItem[], removeId: string): NavItem[] {
    return items.filter(i => i.id !== removeId).map(i => ({
      ...i, children: i.children ? filterDeep(i.children, removeId) : [],
    }));
  }

  const updateItem = (itemId: string, patch: Partial<NavItem>) => {
    setMenus(prev => prev.map(menu => {
      if (menu.id !== activeMenu) return menu;
      return { ...menu, items: updateDeep(menu.items, itemId, patch) };
    }));
  };

  function updateDeep(items: NavItem[], itemId: string, patch: Partial<NavItem>): NavItem[] {
    return items.map(item => {
      if (item.id === itemId) return { ...item, ...patch };
      if (item.children?.length) return { ...item, children: updateDeep(item.children, itemId, patch) };
      return item;
    });
  }

  const renderNavItems = (items: NavItem[], depth = 0): React.ReactNode => {
    return items.map(item => (
      <div key={item.id} style={{ marginLeft: depth * 16 }}>
        <div className={`flex items-center gap-2 p-2 rounded border mb-1 ${item.visible ? 'bg-white/5 border-white/10' : 'bg-black/20 border-white/5 opacity-50'}`}>
          <span className="text-gray-500 text-[10px]">{depth === 0 ? '├' : '│├'}</span>
          <input type="text" value={item.label} onChange={e => updateItem(item.id, { label: e.target.value })} className="bg-transparent border-none text-xs font-medium text-white w-20 focus:outline-none" placeholder="Label" />
          <select value={item.type} onChange={e => updateItem(item.id, { type: e.target.value as NavItem['type'] })} className="bg-black/40 border border-white/10 rounded px-1 py-0.5 text-[9px] w-20">
            <option value="url">URL</option><option value="page">Page</option><option value="collection">Collection</option><option value="product">Product</option><option value="blog">Blog</option>
          </select>
          <input type="text" value={item.target} onChange={e => updateItem(item.id, { target: e.target.value })} className="flex-1 bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-[9px] font-mono" placeholder={item.type === 'url' ? 'https://...' : '/slug'} />
          {depth < 2 && <button onClick={() => addItemToMenu(item.id, createItem())} className="text-[9px] text-gray-400 hover:text-emerald-400">+</button>}
          <button onClick={() => updateItem(item.id, { visible: !item.visible })} className="text-[10px]">{item.visible ? '●' : '○'}</button>
          <button onClick={() => removeItem(item.id)} className="text-[10px] text-red-400">✕</button>
        </div>
        {item.children && item.children.length > 0 && renderNavItems(item.children, depth + 1)}
      </div>
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Navigation</h3>
          <p className="text-[10px] text-gray-400">Build menus for your storefront</p>
        </div>
      </div>
      <div className="flex gap-1">
        {menus.map(menu => (
          <button key={menu.id} onClick={() => setActiveMenu(menu.id)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeMenu === menu.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
            {menu.location === 'header' ? '▲' : '▼'} {menu.name}
          </button>
        ))}
      </div>
      {currentMenu && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-wider text-gray-500">{currentMenu.name} ({currentMenu.items.length} items)</p>
            <button onClick={() => addItemToMenu(null, createItem())} className="text-[10px] px-2 py-0.5 bg-white/5 text-gray-300 rounded hover:bg-white/10">+ Add Item</button>
          </div>
          {currentMenu.items.length === 0 && <div className="text-center py-6 border border-dashed border-white/10 rounded"><p className="text-xs text-gray-500">No items yet.</p></div>}
          {renderNavItems(currentMenu.items)}
        </div>
      )}
    </div>
  );
}
