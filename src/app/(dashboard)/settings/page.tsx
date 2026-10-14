"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/theme-provider";
import {
  User,
  Mail,
  Lock,
  Palette,
  Trash2,
  Save,
  Building2,
  Upload,
  X,
  LayoutGrid,
  Check,
} from "lucide-react";
import {
  DEFAULT_WORKSPACE_MODULES,
  saveWorkspaceModules,
  WORKSPACE_MODULES,
  WORKSPACE_MODULES_KEY,
  type WorkspaceModuleId,
} from "@/lib/workspace-modules";
import { DEFAULT_BRAND_COLOR, INSTITUTION_BRAND_EVENT, INSTITUTION_BRAND_KEY, normalizeBrandColor, REPORT_IDENTITY_EVENT, REPORT_IDENTITY_KEY, type InstitutionBrand } from "@/lib/institution-brand";

async function resizeLogo(file: File): Promise<string> {
  if (!file.type.match(/^image\/(png|jpeg|webp|svg\+xml)$/)) throw new Error("Use a PNG, JPG, WebP or SVG logo.");
  if (file.size > 2_000_000) throw new Error("Logo must be smaller than 2 MB.");
  if (file.type === "image/svg+xml") {
    const svg = await file.text();
    if (/<(?:script|foreignObject|iframe|object|embed)\b/i.test(svg) || /(?:href|xlink:href)\s*=\s*["'](?:https?:|\/\/)/i.test(svg)) {
      throw new Error("That SVG contains unsupported scripts or external content.");
    }
  }
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("Could not process that image."));
    element.src = source;
  });
  const scale = Math.min(1, 480 / image.width, 180 / image.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/webp", 0.86);
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [institutionLogo, setInstitutionLogo] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [brandColor, setBrandColor] = useState(DEFAULT_BRAND_COLOR);
  const [profileMessage, setProfileMessage] = useState("");
  const [workspaceModules, setWorkspaceModules] = useState<WorkspaceModuleId[]>(DEFAULT_WORKSPACE_MODULES);
  const fileRef = useRef<HTMLInputElement>(null);
  const [timezone, setTimezone] = useState("America/New_York");
  const [briefingSchedule, setBriefingSchedule] = useState("morning");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        const local = JSON.parse(localStorage.getItem(REPORT_IDENTITY_KEY) || "{}");
        setName(local.name || "");
        setInstitutionLogo(local.institutionLogo || "");
      } catch {}
      try {
        const localBrand = JSON.parse(localStorage.getItem(INSTITUTION_BRAND_KEY) || "{}");
        setCompanyName(localBrand.companyName || "");
        setBrandColor(normalizeBrandColor(localBrand.brandColor));
      } catch {}
      try {
        const localModules = JSON.parse(localStorage.getItem(WORKSPACE_MODULES_KEY) || "null");
        if (Array.isArray(localModules)) setWorkspaceModules(localModules);
      } catch {}
      const response = await fetch("/api/profile");
      if (response.ok) {
        const profile = (await response.json()).data;
        setName(profile.name || "");
        setEmail(profile.email || "");
        setInstitutionLogo(profile.institutionLogo || "");
      }
      const preferencesResponse = await fetch("/api/preferences");
      if (preferencesResponse.ok) {
        const preferences = (await preferencesResponse.json()).data;
        if (Array.isArray(preferences?.workspaceModules)) setWorkspaceModules(preferences.workspaceModules);
        if (typeof preferences?.companyName === "string") setCompanyName(preferences.companyName);
        if (preferences?.brandColor) setBrandColor(normalizeBrandColor(preferences.brandColor));
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setProfileMessage("");
    const identity = { name: name.trim(), institutionLogo };
    const institutionBrand: InstitutionBrand = { companyName: companyName.trim().slice(0, 80), brandColor: normalizeBrandColor(brandColor), institutionLogo };
    localStorage.setItem(REPORT_IDENTITY_KEY, JSON.stringify(identity));
    localStorage.setItem(INSTITUTION_BRAND_KEY, JSON.stringify(institutionBrand));
    saveWorkspaceModules(workspaceModules);
    window.dispatchEvent(new CustomEvent(REPORT_IDENTITY_EVENT, { detail: identity }));
    window.dispatchEvent(new CustomEvent(INSTITUTION_BRAND_EVENT, { detail: institutionBrand }));
    try {
      const response = await fetch("/api/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(identity) });
      const preferencesResponse = await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ timezone, briefingSchedule, theme, workspaceModules, companyName: institutionBrand.companyName, brandColor: institutionBrand.brandColor }),
      });
      setProfileMessage(response.ok && preferencesResponse.ok ? "Settings saved to your account." : "Saved for this browser. Sign in to sync it to your account.");
    } catch {
      setProfileMessage("Saved for this browser. Account sync is currently unavailable.");
    }
    setSaving(false);
  };

  const toggleModule = (moduleId: WorkspaceModuleId) => {
    setWorkspaceModules((current) => current.includes(moduleId) ? current.filter((id) => id !== moduleId) : [...current, moduleId]);
  };

  const handleLogo = async (file?: File) => {
    if (!file) return;
    setProfileMessage("");
    try {
      setInstitutionLogo(await resizeLogo(file));
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : "Could not process that logo.");
    }
  };

  const previewBrand = (nextColor: string) => {
    const normalized = normalizeBrandColor(nextColor);
    setBrandColor(normalized);
    window.dispatchEvent(new CustomEvent(INSTITUTION_BRAND_EVENT, { detail: { companyName, brandColor: normalized } }));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display font-bold text-2xl text-on-surface italic">
        Settings
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Report identity</CardTitle>
        </CardHeader>
        <p className="mb-5 text-sm text-on-surface-variant">This name and institution logo appear in the workspace, on KYP reports and on printed records.</p>
        <div className="space-y-4">
          <div>
            <label className="block text-on-surface-variant text-xs font-mono uppercase tracking-wider mb-1.5">Company logo below BullBrief</label>
            <div className="flex items-center gap-4 rounded-xl border border-outline-variant bg-surface-container-low p-4">
              <div className="flex h-16 w-28 items-center justify-center overflow-hidden rounded-lg border border-outline-variant bg-white p-2">
                {institutionLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={institutionLogo} alt="Financial institution logo preview" className="max-h-full max-w-full object-contain" />
                ) : <Building2 className="h-7 w-7 text-slate-400" />}
              </div>
              <div className="flex flex-wrap gap-2">
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,.svg" className="hidden" onChange={(event) => void handleLogo(event.target.files?.[0])} />
                <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> Upload logo</Button>
                {institutionLogo && <Button variant="ghost" size="sm" onClick={() => setInstitutionLogo("")}><X className="h-4 w-4" /> Remove</Button>}
              </div>
            </div>
            <p className="mt-2 text-[11px] text-on-surface-variant">PNG, JPG, WebP or SVG. The image is safely converted and resized for reports.</p>
          </div>
          <div>
            <label className="block text-on-surface-variant text-xs font-mono uppercase tracking-wider mb-1.5">
              Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<User className="w-4 h-4" />}
              placeholder="Advisor or agent name"
            />
          </div>
          <div>
            <label className="block text-on-surface-variant text-xs font-mono uppercase tracking-wider mb-1.5">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              disabled
            />
          </div>
          {profileMessage && <p className="text-xs text-primary">{profileMessage}</p>}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workspace branding</CardTitle>
        </CardHeader>
        <p className="mb-5 text-sm text-on-surface-variant">Personalize the advisor workspace while BullBrief automatically maintains readable contrast across themes, charts and printed reports.</p>
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-mono uppercase tracking-wider text-on-surface-variant">Company name below BullBrief</label>
            <Input value={companyName} onChange={(event) => setCompanyName(event.target.value.slice(0, 80))} icon={<Building2 className="h-4 w-4" />} placeholder="Manulife Wealth" />
          </div>
          <div>
            <label className="mb-2 flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-on-surface-variant"><Palette className="h-4 w-4" />Primary brand colour</label>
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-low p-4">
              <input type="color" value={brandColor} onChange={(event) => previewBrand(event.target.value)} className="h-11 w-14 cursor-pointer rounded-lg border border-outline-variant bg-transparent p-1" aria-label="Choose primary brand colour" />
              <Input value={brandColor.toUpperCase()} onChange={(event) => /^#[0-9a-f]{6}$/i.test(event.target.value) && previewBrand(event.target.value)} className="max-w-32 font-mono" aria-label="Brand colour hex value" />
              <div className="flex flex-wrap gap-2">
                {["#4be277", "#00a499", "#2f6fed", "#6f4cff", "#c4412f"].map((color) => <button key={color} type="button" onClick={() => previewBrand(color)} className={cn("h-8 w-8 rounded-full border-2 transition-transform hover:scale-105", brandColor === color ? "border-on-surface" : "border-outline-variant")} style={{ backgroundColor: color }} aria-label={`Use ${color}`} />)}
              </div>
              <Button variant="ghost" size="sm" onClick={() => previewBrand(DEFAULT_BRAND_COLOR)}>Reset</Button>
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-outline-variant p-3">
              <div className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-on-primary">Primary action</div>
              <div><p className="text-sm font-semibold text-on-surface">BullBrief</p><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary">{companyName || "Company name preview"}</p></div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
        </CardHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-on-surface-variant text-xs font-mono uppercase tracking-wider mb-1.5">
              Current Password
            </label>
            <Input type="password" placeholder="Enter current password" icon={<Lock className="w-4 h-4" />} />
          </div>
          <div>
            <label className="block text-on-surface-variant text-xs font-mono uppercase tracking-wider mb-1.5">
              New Password
            </label>
            <Input type="password" placeholder="Enter new password" icon={<Lock className="w-4 h-4" />} />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-on-surface-variant text-xs font-mono uppercase tracking-wider mb-1.5">
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
            >
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="America/Toronto">Toronto (ET)</option>
              <option value="America/Vancouver">Vancouver (PT)</option>
            </select>
          </div>

          <div>
            <label className="block text-on-surface-variant text-xs font-mono uppercase tracking-wider mb-1.5">
              Briefing Schedule
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "morning", label: "Morning" },
                { value: "market_close", label: "Market Close" },
                { value: "both", label: "Both" },
                { value: "none", label: "None" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setBriefingSchedule(opt.value)}
                  className={cn(
                    "px-4 py-2.5 rounded-lg text-sm font-medium transition-all border",
                    briefingSchedule === opt.value
                      ? "bg-primary text-on-primary border-primary"
                      : "bg-surface-container-high border-outline-variant text-on-surface-variant hover:border-primary/30"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-on-surface-variant text-xs font-mono uppercase tracking-wider mb-1.5">
              <Palette className="w-4 h-4" />
              Appearance
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([
                ["dark", "Dark"],
                ["light", "Light"],
                ["system", "System"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    "px-4 py-2.5 rounded-lg text-sm font-medium transition-all border",
                    theme === value
                      ? "bg-primary text-on-primary border-primary"
                      : "bg-surface-container-high border-outline-variant text-on-surface-variant hover:border-primary/30"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workspace modules</CardTitle>
        </CardHeader>
        <div className="mb-5 flex items-start gap-3 rounded-xl bg-surface-container-low p-4">
          <LayoutGrid className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div><p className="text-sm font-semibold text-on-surface">Build your own workspace</p><p className="mt-1 text-xs leading-5 text-on-surface-variant">Choose the tools shown in your navigation. Your daily Brief and Settings always remain available.</p></div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {WORKSPACE_MODULES.map((module) => {
            const selected = workspaceModules.includes(module.id);
            return (
              <button key={module.id} type="button" onClick={() => toggleModule(module.id)} aria-pressed={selected} className={cn("flex items-start gap-3 rounded-xl border p-4 text-left transition", selected ? "border-primary/50 bg-primary/10" : "border-outline-variant bg-surface-container-low hover:border-primary/30")}>
                <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border", selected ? "border-primary bg-primary text-on-primary" : "border-outline text-transparent")}><Check className="h-3.5 w-3.5" /></span>
                <span><span className="block text-sm font-semibold text-on-surface">{module.label}</span><span className="mt-1 block text-xs leading-5 text-on-surface-variant">{module.description}</span></span>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={handleSave} loading={saving}>
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>

      <Card className="border-error/30">
        <CardHeader>
          <CardTitle className="text-error">Danger Zone</CardTitle>
        </CardHeader>
        <p className="text-on-surface-variant text-sm mb-4">
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </p>
        <Button variant="danger" size="sm">
          <Trash2 className="w-4 h-4" />
          Delete Account
        </Button>
      </Card>
    </div>
  );
}
