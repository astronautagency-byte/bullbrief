"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { BrandLockup } from "./brand-lockup";
import { WorkspaceNavigation } from "./workspace-navigation";
export function MobileNav({open,onClose}:{open:boolean;onClose:()=>void}){
 const panel=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const d=panel.current;if(open&&!d?.open)d?.showModal();else if(!open&&d?.open)d.close();},[open]);
 return <dialog ref={panel} aria-label="Navigation menu" className="simple-mobile-menu" onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}}><div className="flex items-center justify-between gap-4 px-5 pb-6"><BrandLockup compact onClick={onClose}/><button onClick={onClose} className="ui-button ui-button-secondary" aria-label="Close menu"><X size={20}/></button></div><WorkspaceNavigation onNavigate={onClose}/></dialog>;
}
