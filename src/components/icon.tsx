import { memo } from "react";
import {
  User,
  Users,
  Heart,
  Menu,
  X,
  ChevronDown,
  Quote,
  CalendarPlus,
  BarChart3,
  LockOpen,
  Lock,
  MessageCircle,
  Mail,
  Send,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Languages,
  Sparkles,
  BadgeCheck,
  ScrollText,
  Loader2,
  LogOut,
  LayoutDashboard,
  ReceiptText,
  Tag,
  Gift,
  CreditCard,
  Settings,
  TrendingUp,
  IndianRupee,
  Clock,
  MapPin,
  Landmark,
  BrainCircuit,
  Flower2,
  BookOpen,
  Route,
  Cake,
  LineChart,
  Handshake,
  Shield,
  Gem,
} from "lucide-react";

const ICONS: Record<string, React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>> = {
  person: User,
  person_2: Users,
  favorite: Heart,
  menu: Menu,
  close: X,
  expand_more: ChevronDown,
  format_quote: Quote,
  edit_calendar: CalendarPlus,
  analytics: BarChart3,
  lock_open: LockOpen,
  lock: Lock,
  chat: MessageCircle,
  mail: Mail,
  send: Send,
  arrow_back: ArrowLeft,
  refresh: RefreshCw,
  error: AlertCircle,
  translate: Languages,
  stars: Sparkles,
  verified: BadgeCheck,
  history_edu: ScrollText,
  progress_activity: Loader2,
  logout: LogOut,
  dashboard: LayoutDashboard,
  receipt_long: ReceiptText,
  sell: Tag,
  group: Users,
  card_giftcard: Gift,
  payments: CreditCard,
  settings: Settings,
  trending_up: TrendingUp,
  currency_rupee: IndianRupee,
  schedule: Clock,
  location_on: MapPin,
  account_balance: Landmark,
  psychology: BrainCircuit,
  self_improvement: Flower2,
  auto_stories: BookOpen,
  route: Route,
  cake: Cake,
  insights: LineChart,
  handshake: Handshake,
  shield: Shield,
  diamond: Gem,
};

export const Icon = memo(function Icon({
  name,
  className,
  size = 24,
}: {
  name: string;
  className?: string;
  size?: number;
}) {
  const Component = ICONS[name];
  if (!Component) {
    if (import.meta.env.DEV) {
      console.warn(`Icon: unknown icon name "${name}"`);
    }
    return null;
  }
  return (
    <Component
      aria-hidden="true"
      focusable="false"
      className={className}
      size={size}
      strokeWidth={1.5}
    />
  );
});
