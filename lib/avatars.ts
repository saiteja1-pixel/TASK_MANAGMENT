import {
  Rocket,
  Sparkles,
  Zap,
  Crown,
  Flame,
  Compass,
  Smile,
  Star,
  Ghost,
  Bot,
  User,
  LucideIcon,
} from 'lucide-react';
import { UserProfile } from './types/database';

export interface PresetAvatar {
  id: string;
  name: string;
  icon: LucideIcon;
  bgColor: string;
}

export const PRESET_AVATARS: PresetAvatar[] = [
  { id: 'avatar_01', name: 'Rocket', icon: Rocket, bgColor: 'bg-[#7C3AED]' },
  { id: 'avatar_02', name: 'Sparkles', icon: Sparkles, bgColor: 'bg-[#D97706]' },
  { id: 'avatar_03', name: 'Lightning', icon: Zap, bgColor: 'bg-[#2563EB]' },
  { id: 'avatar_04', name: 'Crown', icon: Crown, bgColor: 'bg-[#DB2777]' },
  { id: 'avatar_05', name: 'Flame', icon: Flame, bgColor: 'bg-[#DC2626]' },
  { id: 'avatar_06', name: 'Compass', icon: Compass, bgColor: 'bg-[#4F46E5]' },
  { id: 'avatar_07', name: 'Smile', icon: Smile, bgColor: 'bg-[#0D9488]' },
  { id: 'avatar_08', name: 'Star', icon: Star, bgColor: 'bg-[#CA8A04]' },
  { id: 'avatar_09', name: 'Ghost', icon: Ghost, bgColor: 'bg-[#9333EA]' },
  { id: 'avatar_10', name: 'Bot', icon: Bot, bgColor: 'bg-[#059669]' },
];

export function getPresetAvatar(avatarId?: string | null): PresetAvatar | null {
  if (!avatarId) return null;
  return PRESET_AVATARS.find((a) => a.id === avatarId) || null;
}

export function getLocalUserProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('taskflow_user_profile');
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function setLocalUserProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('taskflow_user_profile', JSON.stringify(profile));
    window.dispatchEvent(new Event('taskflow_profile_updated'));
  } catch {}
}
