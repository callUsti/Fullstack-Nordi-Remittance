// ============================================================================
// ICONS CENTRAL REGISTRY — Nordi Remittance Mobile
// Centralizes all vector icons, Lucide icons, and ionic glyph maps for reuse
// ============================================================================

import React from 'react';
import * as LucideIcons from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';

export { LucideIcons };
export { Ionicons };
export * from 'lucide-react-native';

export type LucideIconName = keyof typeof LucideIcons;
export type IoniconName = keyof typeof Ionicons.glyphMap;

// Named curated icons for quick access and standard app-wide consistency
export const AppIcons = {
  // Navigation & Tabs
  Home: LucideIcons.Home,
  Access: LucideIcons.ShieldCheck,
  Scan: LucideIcons.QrCode,
  Support: LucideIcons.Headphones || LucideIcons.HelpCircle,
  Profile: LucideIcons.User,
  Markets: LucideIcons.TrendingUp,
  Send: LucideIcons.Send,

  // Financial & Banking
  Wallet: LucideIcons.Wallet,
  CreditCard: LucideIcons.CreditCard,
  ArrowRightLeft: LucideIcons.ArrowRightLeft,
  ArrowUpRight: LucideIcons.ArrowUpRight,
  ArrowDownLeft: LucideIcons.ArrowDownLeft,
  TrendingUp: LucideIcons.TrendingUp,
  TrendingDown: LucideIcons.TrendingDown,
  Building: LucideIcons.Building,
  Coins: LucideIcons.Coins,
  Receipt: LucideIcons.Receipt,
  PiggyBank: LucideIcons.PiggyBank,
  BadgePercent: LucideIcons.BadgePercent,
  Banknote: LucideIcons.Banknote,

  // System & Security
  Shield: LucideIcons.Shield,
  ShieldCheck: LucideIcons.ShieldCheck,
  Lock: LucideIcons.Lock,
  Unlock: LucideIcons.Unlock,
  Key: LucideIcons.Key,
  Fingerprint: LucideIcons.Fingerprint,
  Eye: LucideIcons.Eye,
  EyeOff: LucideIcons.EyeOff,
  Bell: LucideIcons.Bell,
  Search: LucideIcons.Search,
  Settings: LucideIcons.Settings,
  ChevronRight: LucideIcons.ChevronRight,
  ChevronLeft: LucideIcons.ChevronLeft,
  ChevronDown: LucideIcons.ChevronDown,
  ChevronUp: LucideIcons.ChevronUp,
  Check: LucideIcons.Check,
  CheckCircle: LucideIcons.CheckCircle,
  X: LucideIcons.X,
  XCircle: LucideIcons.XCircle,
  AlertCircle: LucideIcons.AlertCircle,
  AlertTriangle: LucideIcons.AlertTriangle,
  Info: LucideIcons.Info,
  RefreshCw: LucideIcons.RefreshCw,
  Copy: LucideIcons.Copy,
  ExternalLink: LucideIcons.ExternalLink,
  Share2: LucideIcons.Share2,
  Phone: LucideIcons.Phone,
  Mail: LucideIcons.Mail,
  Calendar: LucideIcons.Calendar,
  Clock: LucideIcons.Clock,
  Sparkles: LucideIcons.Sparkles,
  Zap: LucideIcons.Zap,
  Globe: LucideIcons.Globe,
  Sliders: LucideIcons.SlidersHorizontal,
  HelpCircle: LucideIcons.HelpCircle,
  FileText: LucideIcons.FileText,
  Download: LucideIcons.Download,
  Upload: LucideIcons.Upload,
  LogOut: LucideIcons.LogOut,
  Camera: LucideIcons.Camera,
  Image: LucideIcons.Image,
  MapPin: LucideIcons.MapPin,
  Filter: LucideIcons.Filter,
};

export default LucideIcons;
