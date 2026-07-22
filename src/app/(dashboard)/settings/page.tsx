"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  User,
  Mail,
  Lock,
  Clock,
  Globe,
  Palette,
  Trash2,
  Save,
} from "lucide-react";

export default function SettingsPage() {
  const [name, setName] = useState("Alex");
  const [email, setEmail] = useState("alex@example.com");
  const [timezone, setTimezone] = useState("America/New_York");
  const [theme, setTheme] = useState("dark");
  const [briefingSchedule, setBriefingSchedule] = useState("morning");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display font-bold text-2xl text-on-surface italic">
        Settings
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-on-surface-variant text-xs font-mono uppercase tracking-wider mb-1.5">
              Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<User className="w-4 h-4" />}
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
            />
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
            <label className="block text-on-surface-variant text-xs font-mono uppercase tracking-wider mb-1.5">
              Appearance
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "dark", label: "Dark" },
                { value: "light", label: "Light" },
                { value: "system", label: "System" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    "px-4 py-2.5 rounded-lg text-sm font-medium transition-all border",
                    theme === opt.value
                      ? "bg-primary text-on-primary border-primary"
                      : "bg-surface-container-high border-outline-variant text-on-surface-variant hover:border-primary/30"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
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
