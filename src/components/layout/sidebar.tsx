"use client";
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/cn';
import { BrandLockup } from './brand-lockup';
import { WorkspaceNavigation } from './workspace-navigation';
export function Sidebar({className,collapsed=false,onToggle}:{className?:string;collapsed?:boolean;onToggle:()=>void}){return <aside id="desktop-sidebar" data-collapsed={collapsed} className={cn('workspace-sidebar fixed left-0 top-0 z-40 hidden h-screen w-60 flex-col border-r border-outline-variant bg-white py-6 md:flex',className)}><BrandLockup iconOnly={collapsed} className="sidebar-brand"/>{!collapsed&&<p className="px-6 pb-4 text-xs font-semibold text-on-surface-variant">Your workspace</p>}<WorkspaceNavigation collapsed={collapsed}/><div className="sidebar-toggle-row"><button onClick={onToggle} aria-label={collapsed?'Expand sidebar':'Collapse sidebar'} aria-expanded={!collapsed} aria-controls="desktop-sidebar" className="sidebar-toggle" title={collapsed?'Expand sidebar':'Collapse sidebar'}>{collapsed?<PanelLeftOpen size={20}/>:<PanelLeftClose size={20}/>}<span className={collapsed?'sr-only':''}>Collapse sidebar</span></button></div></aside>;}
