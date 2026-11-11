import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, AppState, Animated, Easing, Image, Modal, PanResponder, PermissionsAndroid, Platform, StatusBar, TextInput, View, Text, ScrollView, Pressable, StyleSheet, useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import RNCalendarEvents from 'react-native-calendar-events';
import DeviceInfo from 'react-native-device-info';
import { NativeModules } from 'react-native';

type CalendarEvent = { id: string; title: string; startDate: string };
const Calendar = {
  getCalendars: async () => RNCalendarEvents.findCalendars(),
  listEvents: async (calendars: { id: string }[], from: Date, to: Date): Promise<CalendarEvent[]> =>
    RNCalendarEvents.fetchAllEvents(from.toISOString(), to.toISOString(), calendars.map((item) => item.id)),
  getCalendarPermissions: async () => ({ granted: (await RNCalendarEvents.checkPermissions()) === 'authorized' }),
  requestCalendarPermissions: async () => ({ granted: (await RNCalendarEvents.requestPermissions()) === 'authorized' }),
};
const Battery = {
  getBatteryLevelAsync: async () => DeviceInfo.getBatteryLevel(),
};

type Widget = { id: string; title: string; subtitle: string; type: string; icon: string; accent: string; label: string; style: string };
const analogFaces = ['Classic numerals', 'Minimal ticks', 'Full numerals', 'Dot markers', 'Heart markers', 'Skeleton', 'Roman numerals', 'Railway markers', '24-hour numerals', 'Sector dial', 'Bauhaus', 'California dial', 'Pilot Type A', 'Pilot Type B', 'Regulator', 'Chronograph'];
const digitalFaces = ['Clean digital', 'Bold display', 'Stacked date', 'Flip style', 'Soft glow', 'Compact', 'LED segments', 'Split-flap', 'Railway display', 'Large display', 'Matrix', 'Date strip', 'Tall stack', 'Mono', 'Color split', 'Simple seconds'];
const timeZones = [
  { label: 'Device local time', value: 'local' }, { label: 'UTC', value: 'UTC' }, { label: 'Los Angeles', value: 'America/Los_Angeles' },
  { label: 'New York', value: 'America/New_York' }, { label: 'London', value: 'Europe/London' }, { label: 'Dubai', value: 'Asia/Dubai' },
  { label: 'Delhi', value: 'Asia/Kolkata' }, { label: 'Singapore', value: 'Asia/Singapore' }, { label: 'Tokyo', value: 'Asia/Tokyo' }, { label: 'Sydney', value: 'Australia/Sydney' },
];
const zoneLabel = (zone: string) => timeZones.find((item) => item.value === zone)?.label ?? zone;
const getZonedDate = (timestamp: number, zone: string) => {
  const source = new Date(timestamp);
  if (zone === 'local') return source;
  if (Platform.OS !== 'android') return new Date(source.toLocaleString('en-US', { timeZone: zone }));
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).formatToParts(source);
    const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((item) => item.type === type)?.value);
    const values = [part('year'), part('month'), part('day'), part('hour'), part('minute'), part('second')];
    if (values.some((value) => !Number.isFinite(value))) return source;
    return new Date(values[0], values[1] - 1, values[2], values[3], values[4], values[5], source.getMilliseconds());
  } catch {
    return source;
  }
};
const formatClockTime = (timestamp: number, zone: string, format: string, seconds: boolean, period: boolean) => {
  const date = getZonedDate(timestamp, zone);
  const hour = format === '24-hour' ? String(date.getHours()).padStart(2, '0') : String(date.getHours() % 12 || 12).padStart(2, '0');
  const clock = `${hour}:${String(date.getMinutes()).padStart(2, '0')}${seconds ? `:${String(date.getSeconds()).padStart(2, '0')}` : ''}`;
  return `${clock}${format === '12-hour' && period ? ` ${date.getHours() >= 12 ? 'PM' : 'AM'}` : ''}`;
};
const makeClockWidgets = (face: string, index: number, analog: boolean): Widget => ({
  id: `clock-${analog ? 'analog' : 'digital'}-${index + 1}`, title: `${analog ? 'Analog' : 'Digital'} Clock ${index + 1}`,
  subtitle: analog ? `${face} clock face` : `${face} digital clock`, type: 'Clock', icon: analog ? '◷' : '◴', accent: '#8C6CFF', label: analog ? '10:10' : '10:10', style: face,
});
const widgets: Widget[] = [
  ...analogFaces.map((face, index) => makeClockWidgets(face, index, true)),
  ...digitalFaces.map((face, index) => makeClockWidgets(face, index, false)),
  { id: 'health-sleep', title: 'Sleep Summary', subtitle: 'Last night’s sleep from Health Connect', type: 'Health', icon: '☾', accent: '#B8A5FF', label: '7h 42m', style: 'Sleep summary' },
  ...['Step ring', 'Daily goal', 'Weekly bars', 'Simple count'].map((style, index) => ({ id: `health-steps-${index + 1}`, title: `Steps · ${style}`, subtitle: 'A sample of today’s activity', type: 'Health', icon: '⌁', accent: '#88D5C3', label: ['8,420', '8,420 / 10k', 'Mon  Tue  Wed', '8,420 steps'][index], style })),
  { id: 'weather', title: 'Daylight', subtitle: 'A little forecast, a lot of sky', type: 'Weather', icon: '☀', accent: '#D8B8FF', label: '24°', style: 'Current weather' },
  { id: 'battery', title: 'Power Check', subtitle: 'Your current battery level', type: 'Battery', icon: '▰', accent: '#8C6CFF', label: '82%', style: 'Battery level' },
  { id: 'calendar', title: 'One Thing Today', subtitle: 'Choose one event from your calendar', type: 'Calendar', icon: '▦', accent: '#88D5C3', label: '10:30 · Design review', style: 'Selected event' },
  { id: 'music', title: 'Now Playing', subtitle: 'A compact music widget', type: 'Music', icon: '♫', accent: '#FFAE91', label: 'Midnight City', style: 'Now playing' },
  { id: 'storage', title: 'Space Check', subtitle: 'Used, available, and total storage', type: 'Storage', icon: '◫', accent: '#85C8E8', label: '76% used', style: 'Storage overview' },
];
const categories = ['All widgets', 'Clock Analog', 'Clock Digital', 'Health', 'Weather', 'Battery', 'Calendar', 'Music', 'Storage'];
const widgetTypes = ['Clock', 'Health', 'Weather', 'Battery', 'Calendar', 'Music', 'Storage', 'Text'];
const scratchWidget: Widget = { id: 'custom', title: 'Your widget', subtitle: 'Start with a blank canvas', type: 'Custom', icon: '✦', accent: '#8C6CFF', label: 'Make it yours', style: 'Blank' };
const tabs = [
  { name: 'Widgets', icon: '▦' },
  { name: 'Customize', icon: '☷' },
  { name: 'Settings', icon: '⚙︎' },
] as const;
type TabName = (typeof tabs)[number]['name'];
const genericTabs = [
  { name: 'Presets', icon: '▦' },
  { name: 'Customize', icon: '☷' },
  { name: 'Settings', icon: '⚙︎' },
] as const;
type GenericTabName = (typeof genericTabs)[number]['name'];
const sections = [
  { id: 'widgets', label: 'Widgets', icon: '▦' },
  { id: 'icons', label: 'App icons / icon packs', icon: '◉' },
  { id: 'quicktile', label: 'Quick settings tiles', icon: '▣' },
  { id: 'notifications', label: 'Notification look', icon: '◔' },
  { id: 'wallpapers', label: 'Wallpapers', icon: '◧' },
  { id: 'keyboard', label: 'Keyboard', icon: '⌨' },
  { id: 'shortcuts', label: 'App shortcuts', icon: '↗' },
  { id: 'fonts', label: 'Fonts', icon: 'Aa' },
  { id: 'edgepanel', label: 'Edge panel-style popups', icon: '◖' },
] as const;
type SectionId = (typeof sections)[number]['id'];
type SectionCopy = { blurb: string; presets: string; customize: string; settings: string; settingsAction?: 'notification' };
const sectionCopy: Record<Exclude<SectionId, 'widgets'>, SectionCopy> = {
  icons: {
    blurb: 'Themed app icon sets that other launchers can pick up.',
    presets: 'Coming soon — browse icon pack presets here.',
    customize: 'Coming soon — pick per-app icon overrides.',
    settings: 'Coming soon — manage installed icon packs.',
  },
  quicktile: {
    blurb: 'Add the Customize Studio tile to your quick settings panel.',
    presets: 'Open your quick settings edit screen and drag in the Customize Studio tile. Tapping it jumps straight to widget creation.',
    customize: 'Coming soon — choose what the tile opens.',
    settings: 'Coming soon — rename or re-icon the tile.',
  },
  notifications: {
    blurb: 'Preview how a styled notification from this app looks.',
    presets: 'Coming soon — notification style presets.',
    customize: 'Coming soon — pick colors and layout for your notifications.',
    settings: 'Send a styled test notification using your widget’s accent color.',
    settingsAction: 'notification',
  },
  wallpapers: {
    blurb: 'Static, live, and depth lock screen wallpapers.',
    presets: 'Gradient presets you can set in one tap, plus the system live wallpaper picker.',
    customize: 'Pick a photo from your gallery and apply it to your home screen, lock screen, or both.',
    settings: 'Manage wallpapers, live wallpapers, and lock screen effects from system settings.',
  },
  keyboard: {
    blurb: 'Keyboard themes and layouts.',
    presets: 'Coming soon — keyboard theme presets.',
    customize: 'Coming soon — customize keys, colors, and sounds.',
    settings: 'Coming soon — set your default keyboard theme.',
  },
  shortcuts: {
    blurb: 'Long-press the app icon for quick actions.',
    presets: 'Create widget and Settings shortcuts are already available — long-press the Customize Studio app icon to see them.',
    customize: 'Coming soon — add more shortcuts.',
    settings: 'Coming soon — reorder or rename shortcuts.',
  },
  fonts: {
    blurb: 'System-wide and in-app font choices.',
    presets: 'Coming soon — font presets.',
    customize: 'Coming soon — pick a font for your widgets and previews.',
    settings: 'Coming soon — manage installed fonts.',
  },
  edgepanel: {
    blurb: 'Edge panel-style floating shortcuts and popups.',
    presets: 'Coming soon — edge panel presets.',
    customize: 'Coming soon — build your own edge panel.',
    settings: 'Coming soon — choose where the panel lives.',
  },
};
type LayoutMode = 'Fixed' | 'Adaptive';
type WidgetShape = 'Rounded' | 'Circle' | 'Square' | 'Pill' | 'Squircle' | 'Cut corner' | 'Diamond' | 'Heart' | 'Arch' | 'Hexagon';
type WidgetTheme = 'Liquid Glass' | 'Solid Color' | 'Gradient' | 'Transparent';
type ColorKey = 'background' | 'border' | 'icon' | 'value' | 'title' | 'subtitle' | 'meta';
type WidgetColors = Record<ColorKey, string>;
type ClockColorKey = 'hour' | 'minute' | 'second' | 'separator';
type ClockHandColors = Record<ClockColorKey, string>;
const defaultClockHandColors: ClockHandColors = { hour: '#8C6CFF', minute: '#F2EEFC', second: '#FF796D', separator: '#F2EEFC' };
type NativeWidget = {
  updateSnapshot: (props: {
    title: string; subtitle: string; value: string; accent: string; icon: string; size: string; widgetKind: string; monthTitle: string; monthRows: string[];
    layoutMode: LayoutMode; widthCells: number; heightCells: number; shape: WidgetShape; theme: WidgetTheme;
    colors: WidgetColors; positions: { iconX: number; iconY: number; textX: number; textY: number }; gradientEnd: string;
    clockMode: string; timeFormat: string; showSeconds: boolean; showPeriod: boolean; clockStyle: string; stepStyle: string; stepGoal: number;
    clockZone: string; secondClockZone: string; showSecondClock: boolean;
    clockHandColors: ClockHandColors; analogClockStyle: string; digitalClockStyle: string;
  }) => void;
};
type NativeWidgetModule = { widgetSlots: Record<string, NativeWidget> };
type StorageInfo = { totalBytes: number; availableBytes: number; usedBytes: number };
type StudioNative = {
  pinWidget: (name: string) => Promise<boolean>;
  getAvailableWidgetSlot: (names: string[]) => Promise<string | null>;
  getBuildVersion: () => Promise<string>;
  getStorageInfo: () => Promise<StorageInfo>;
  getLaunchShortcutAction: () => Promise<string | null>;
  showStyledNotification: (title: string, message: string, accentColorHex: string) => Promise<boolean>;
  checkForUpdate: () => Promise<{ available: boolean; tagName: string; notes: string; downloadUrl: string }>;
  downloadAndInstallUpdate: (downloadUrl: string) => Promise<boolean>;
  isHealthConnectAvailable: () => Promise<boolean>;
  requestHealthPermissions: (permissions: string[]) => Promise<boolean>;
  getStepsToday: () => Promise<string>;
  getSleepLastNight: () => Promise<string>;
  pickWallpaperImage: () => Promise<string | null>;
  setWallpaperFromPath: (path: string, target: string) => Promise<boolean>;
  setGradientWallpaper: (colors: string[], target: string) => Promise<boolean>;
  openLiveWallpaperPicker: () => Promise<boolean>;
  openWallpaperSettings: () => Promise<boolean>;
  segmentWallpaperSubject: (path: string) => Promise<{ foregroundPath: string; backgroundPath: string }>;
  setDepthWallpaperConfig: (foregroundPath: string, backgroundPath: string, config: DepthWallpaperConfig) => Promise<boolean>;
  openDepthWallpaperPicker: () => Promise<boolean>;
  renderDepthSnapshot: (foregroundPath: string, backgroundPath: string, config: DepthWallpaperConfig) => Promise<string>;
};
const StudioAndroid = NativeModules.WidgetStudioNative as StudioNative | undefined;
const depthClockFonts = ['Sans', 'Serif', 'Monospace', 'Condensed', 'Light'] as const;
type DepthClockFont = (typeof depthClockFonts)[number];
const depthClockFontFamilies: Record<DepthClockFont, string | undefined> = {
  Sans: undefined, Serif: 'serif', Monospace: 'monospace', Condensed: 'sans-serif-condensed', Light: 'sans-serif-light',
};
type DepthOverlayPos = { x: number; y: number };
const defaultDepthClockPos: DepthOverlayPos = { x: 0.5, y: 0.22 };
const defaultDepthDatePos: DepthOverlayPos = { x: 0.5, y: 0.34 };
const depthDateFormats = ['dd/mm/yy', 'dd/mm/yyyy', 'dd-MMM-yyyy', 'dd MMMM', 'dd MMMM yyyy', 'mm/dd/yyyy'] as const;
type DepthDateFormat = (typeof depthDateFormats)[number];
const formatDepthDate = (date: Date, format: DepthDateFormat): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const yearFull = String(date.getFullYear());
  const yearShort = yearFull.slice(-2);
  const monthShort = date.toLocaleDateString([], { month: 'short' });
  const monthLong = date.toLocaleDateString([], { month: 'long' });
  switch (format) {
    case 'dd/mm/yy': return `${day}/${month}/${yearShort}`;
    case 'dd-MMM-yyyy': return `${day} - ${monthShort}- ${yearFull}`;
    case 'dd MMMM': return `${day} ${monthLong}`;
    case 'dd MMMM yyyy': return `${day} ${monthLong} ${yearFull}`;
    case 'mm/dd/yyyy': return `${month}/${day}/${yearFull}`;
    default: return `${day}/${month}/${yearFull}`;
  }
};
type DepthWallpaperConfig = {
  clockEnabled: boolean; clockFont: string; clockBehindSubject: boolean; clockSize: number;
  clockX: number; clockY: number; showDate: boolean; dateFont: string; dateFormat: string; dateX: number; dateY: number;
};
const wallpaperGradientPresets = [
  { id: 'dusk', name: 'Dusk Violet', colors: ['#2B2250', '#8C6CFF'] },
  { id: 'mint', name: 'Mint Fade', colors: ['#123C34', '#88D5C3'] },
  { id: 'sunset', name: 'Warm Sunset', colors: ['#3A1220', '#FFAE91'] },
  { id: 'ocean', name: 'Deep Ocean', colors: ['#0B1C3A', '#32ADE6'] },
  { id: 'rose', name: 'Rose Quartz', colors: ['#3A1230', '#FAB8D0'] },
  { id: 'noir', name: 'Midnight Noir', colors: ['#000000', '#303030'] },
];
const widgetSlotNames = ['StudioWidget', ...Array.from({ length: 11 }, (_, index) => `StudioWidget${index + 2}`)];
const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes < 0) return 'Unknown';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit += 1; }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
};
const formatEventDate = (date: Date | string) => {
  const value = new Date(date);
  return Number.isNaN(value.getTime()) ? 'Date unavailable' : value.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};
const buildCalendarRows = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const dayCount = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstWeekday).fill(' '), ...Array.from({ length: dayCount }, (_, index) => String(index + 1))];
  while (cells.length % 7) cells.push(' ');
  const rows: string[] = [];
  for (let index = 0; index < cells.length; index += 7) rows.push(cells.slice(index, index + 7).map((day) => day.padStart(2, ' ')).join('  '));
  return rows;
};
const colorLabels: { key: ColorKey; label: string }[] = [
  { key: 'background', label: 'Background' },
  { key: 'border', label: 'Border' },
  { key: 'icon', label: 'Icon' },
  { key: 'meta', label: 'Widget label' },
  { key: 'value', label: 'Main value' },
  { key: 'title', label: 'Title' },
  { key: 'subtitle', label: 'Subtitle' },
];
const colorPalette = [
  '#FFFFFF', '#D9D9D9', '#A6A6A6', '#636366', '#303030', '#000000',
  '#FF3B30', '#FF6B35', '#FF9500', '#FFC400', '#8C6CFF', '#8BC34A',
  '#34C759', '#00C7BE', '#00B8D9', '#32ADE6', '#007AFF', '#5856D6',
  '#AF52DE', '#FF2D55', '#A2845E', '#FFABAB', '#FFD3B6', '#FFE8A3',
  '#ECF5A0', '#B9E5C4', '#A7E8E8', '#B6DCFA', '#C6C5FA', '#E4C3FA',
  '#FAB8D0', '#C4A484',
];

export default function App() {
  return <SafeAreaProvider><WidgetStudio /></SafeAreaProvider>;
}

function WidgetStudio() {
  const [selected, setSelected] = useState(scratchWidget);
  const [category, setCategory] = useState('All widgets');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('Adaptive');
  const [fixedWidth, setFixedWidth] = useState(3);
  const [fixedHeight, setFixedHeight] = useState(2);
  const [shape, setShape] = useState<WidgetShape>('Rounded');
  const [theme, setTheme] = useState<WidgetTheme>('Solid Color');
  const [colors, setColors] = useState<WidgetColors>({
    background: '#231F33', border: '#342F47', icon: '#8C6CFF', meta: '#A6A2C4', value: '#8C6CFF', title: '#F2EEFC', subtitle: '#A6A2C4',
  });
  const [colorDrafts, setColorDrafts] = useState<WidgetColors>({
    background: '#231F33', border: '#342F47', icon: '#8C6CFF', meta: '#A6A2C4', value: '#8C6CFF', title: '#F2EEFC', subtitle: '#A6A2C4',
  });
  const [gradientEnd, setGradientEnd] = useState('#5A4FCB');
  const [gradientEndDraft, setGradientEndDraft] = useState('#5A4FCB');
  const [positions, setPositions] = useState({ iconX: 8, iconY: 10, textX: 10, textY: 42 });
  const [tab, setTab] = useState<TabName>('Widgets');
  const [saved, setSaved] = useState(false);
  const [widgetSheetVisible, setWidgetSheetVisible] = useState(false);
  const [eventPickerVisible, setEventPickerVisible] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarEvent, setCalendarEvent] = useState<CalendarEvent | null>(null);
  const [calendarGranted, setCalendarGranted] = useState(false);
  const [healthRequested, setHealthRequested] = useState<Record<string, boolean>>({});
  const [clockMode, setClockMode] = useState('Analog');
  const [timeFormat, setTimeFormat] = useState<'12-hour' | '24-hour'>('12-hour');
  const [showSeconds, setShowSeconds] = useState(true);
  const [showPeriod, setShowPeriod] = useState(true);
  const [clockHandColors, setClockHandColors] = useState<ClockHandColors>(defaultClockHandColors);
  const [analogClockStyle, setAnalogClockStyle] = useState(analogFaces[0]);
  const [digitalClockStyle, setDigitalClockStyle] = useState(digitalFaces[0]);
  const [clockZone, setClockZone] = useState('local');
  const [secondClockZone, setSecondClockZone] = useState('Asia/Tokyo');
  const [showSecondClock, setShowSecondClock] = useState(false);
  const [clockNow, setClockNow] = useState(Date.now());
  const [stepGoal, setStepGoal] = useState(10000);
  const [stepStyle, setStepStyle] = useState('Step ring');
  const [buildVersion, setBuildVersion] = useState<string | null>(null);
  const [updateCheckState, setUpdateCheckState] = useState<'idle' | 'checking' | 'upToDate' | 'available' | 'installing' | 'error'>('idle');
  const [updateInfo, setUpdateInfo] = useState<{ tagName: string; downloadUrl: string } | null>(null);
  const [wallpaperTarget, setWallpaperTarget] = useState<'home' | 'lock' | 'both'>('both');
  const [pickedWallpaperPath, setPickedWallpaperPath] = useState<string | null>(null);
  const [selectedGradientId, setSelectedGradientId] = useState<string | null>(null);
  const [wallpaperBusy, setWallpaperBusy] = useState(false);
  const [wallpaperStatus, setWallpaperStatus] = useState<string | null>(null);
  const [depthLayers, setDepthLayers] = useState<{ foregroundPath: string; backgroundPath: string } | null>(null);
  const [depthProcessing, setDepthProcessing] = useState(false);
  const [depthClockEnabled, setDepthClockEnabled] = useState(false);
  const [depthClockFont, setDepthClockFont] = useState<DepthClockFont>('Sans');
  const [depthClockBehindSubject, setDepthClockBehindSubject] = useState(false);
  const [depthClockSize, setDepthClockSize] = useState(100);
  const [depthShowDate, setDepthShowDate] = useState(false);
  const [depthDateFont, setDepthDateFont] = useState<DepthClockFont>('Sans');
  const [depthDateFormat, setDepthDateFormat] = useState<DepthDateFormat>('dd/mm/yyyy');
  const [depthClockPos, setDepthClockPos] = useState<DepthOverlayPos>(defaultDepthClockPos);
  const [depthDatePos, setDepthDatePos] = useState<DepthOverlayPos>(defaultDepthDatePos);
  const [depthPreviewSize, setDepthPreviewSize] = useState({ width: 0, height: 0 });
  const [depthApplyTarget, setDepthApplyTarget] = useState<'home' | 'lock' | 'both'>('home');
  const [depthApplying, setDepthApplying] = useState(false);
  const [section, setSection] = useState<SectionId>('widgets');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [genericTab, setGenericTab] = useState<GenericTabName>('Presets');
  const drawerPosition = useRef(new Animated.Value(0)).current;
  const activePosition = useRef(new Animated.Value(0)).current;
  const pageOpacity = useRef(new Animated.Value(1)).current;
  const pageOffset = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();
  useEffect(() => {
    if (section !== 'widgets' || (tab !== 'Widgets' && tab !== 'Customize')) return;
    const timer = setInterval(() => setClockNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [tab, section]);
  useEffect(() => {
    const applyShortcutAction = async () => {
      if (Platform.OS !== 'android' || !StudioAndroid) return;
      try {
        const action = await StudioAndroid.getLaunchShortcutAction();
        if (action === 'create_widget') startFromScratch();
        else if (action === 'open_settings') setTab('Settings');
      } catch { }
    };
    applyShortcutAction();
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') applyShortcutAction(); });
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (Platform.OS === 'android' && StudioAndroid) StudioAndroid.getBuildVersion().then(setBuildVersion).catch(() => {});
  }, []);
  const cardWidth = (width - 52) / 2;
  const filtered = category === 'All widgets' ? widgets : category === 'Clock Analog' ? widgets.filter((w) => w.id.startsWith('clock-analog')) : category === 'Clock Digital' ? widgets.filter((w) => w.id.startsWith('clock-digital')) : widgets.filter((w) => w.type === category || (category === 'Health' && w.type === 'Health'));
  const sizeLabel = layoutMode === 'Adaptive' ? 'Adaptive' : `${fixedWidth} × ${fixedHeight}`;
  const previewHeight = layoutMode === 'Adaptive' ? 178 : 104 + fixedHeight * 39;
  const shapeRadius = shape === 'Square' || shape === 'Cut corner' || shape === 'Diamond' || shape === 'Hexagon' ? 5 : shape === 'Rounded' ? 22 : shape === 'Squircle' ? 32 : 100;
  const previewDimensions = shape === 'Circle'
    ? { width: previewHeight, height: previewHeight, alignSelf: 'center' as const }
    : { width: layoutMode === 'Adaptive' ? '100%' as const : `${Math.min(100, 55 + fixedWidth * 11)}%` as const, height: previewHeight };
  const previewTitle = selected.type === 'Calendar' && calendarEvent ? calendarEvent.title : selected.title;
  const previewSubtitle = selected.type === 'Calendar' && calendarEvent ? formatEventDate(calendarEvent.startDate) : selected.subtitle;
  const activeClockHandColors = theme === 'Liquid Glass'
    ? { hour: '#FFFFFF', minute: '#FFFFFF', second: '#FFFFFF', separator: '#FFFFFF' }
    : clockHandColors;
  const selectedColorLabels = selected.type === 'Clock'
    ? colorLabels.filter(({ key }) => key !== 'icon')
    : colorLabels;
  const monthNow = calendarEvent ? new Date(calendarEvent.startDate) : new Date();
  const monthTitle = monthNow.toLocaleDateString([], { month: 'long', year: 'numeric' });
  const monthRows = buildCalendarRows(monthNow);

  const updateColor = (key: ColorKey, value: string) => {
    setColorDrafts((current) => ({ ...current, [key]: value }));
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) setColors((current) => ({ ...current, [key]: value }));
  };
  const finishColorEdit = (key: ColorKey) => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(colorDrafts[key])) setColorDrafts((current) => ({ ...current, [key]: colors[key] }));
  };
  const adjustPosition = (key: keyof typeof positions, amount: number) => {
    setPositions((current) => ({ ...current, [key]: Math.max(0, Math.min(100, current[key] + amount)) }));
  };
  const resetDesign = (accent = '#8C6CFF') => {
    const defaults: WidgetColors = { background: '#231F33', border: '#342F47', icon: accent, meta: '#A6A2C4', value: accent, title: '#F2EEFC', subtitle: '#A6A2C4' };
    setColors(defaults); setColorDrafts(defaults); setShape('Rounded'); setTheme('Solid Color');
    setLayoutMode('Adaptive'); setFixedWidth(3); setFixedHeight(2); setPositions({ iconX: 8, iconY: 10, textX: 10, textY: 42 });
    setGradientEnd('#5A4FCB'); setGradientEndDraft('#5A4FCB'); setClockZone('local'); setSecondClockZone('Asia/Tokyo');
    setClockHandColors({ ...defaultClockHandColors, hour: accent });
    setShowSecondClock(false); setClockNow(Date.now()); setStepGoal(10000); setStepStyle('Step ring');
  };

  const askBeforeSystemPermission = (title: string, message: string) => new Promise<boolean>((resolve) => {
    Alert.alert(title, message, [
      { text: 'Not now', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Continue', onPress: () => resolve(true) },
    ]);
  });

  const loadCalendarEvents = async () => {
    try {
      const calendarsOnDevice = await Calendar.getCalendars();
      const from = new Date();
      const to = new Date();
      to.setDate(to.getDate() + 30);
      const events = (await Calendar.listEvents(calendarsOnDevice, from, to))
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      setCalendarEvents(events);
      setEventPickerVisible(true);
    } catch {
      Alert.alert('Calendar unavailable', 'Customize Studio could not read events from the selected calendars.');
    }
  };

  const ensureCalendarAccess = async () => {
    try {
      const existing = await Calendar.getCalendarPermissions();
      if (existing.granted) {
        setCalendarGranted(true);
        return true;
      }
      const proceed = await askBeforeSystemPermission(
        'Allow calendar access?',
        'The calendar widget needs access so you can choose one event to show. Customize Studio will not create or edit events. Expo’s Android calendar permission request includes read and write access.',
      );
      if (!proceed) return false;
      const response = await Calendar.requestCalendarPermissions();
      setCalendarGranted(response.granted);
      if (!response.granted) Alert.alert('Calendar access not allowed', 'You can still use the other widgets. Enable calendar access in your device settings to select an event.');
      return response.granted;
    } catch {
      Alert.alert('Calendar access unavailable', 'Calendar access needs a development build. It is not available in Expo Go.');
      return false;
    }
  };

  const openCalendarPicker = async () => {
    if (await ensureCalendarAccess()) await loadCalendarEvents();
  };

  const ensureHealthAccess = async (widget: Widget): Promise<boolean> => {
    if (Platform.OS !== 'android' || !StudioAndroid) {
      Alert.alert('Not available', 'Health data is only wired up for Android right now.');
      return false;
    }
    const isSteps = widget.id.includes('steps') || (widget.id === 'custom' && widget.type === 'Health' && widget.style.startsWith('Step'));
    const permission = isSteps ? 'android.permission.health.READ_STEPS' : 'android.permission.health.READ_SLEEP';
    const label = isSteps ? 'today’s steps' : 'sleep data';
    try {
      const available = await StudioAndroid.isHealthConnectAvailable();
      if (!available) {
        Alert.alert('Health Connect needed', 'Install the Health Connect app, then share Steps and Sleep data from Samsung Health or your fitness app into it. The widget will show sample data until then.');
        return false;
      }
      if (!healthRequested[widget.id]) {
        const proceed = await askBeforeSystemPermission(
          `Allow ${label}?`,
          `Customize Studio needs read access to ${label} through Health Connect for this widget. It will not write health records.`,
        );
        if (!proceed) return false;
        const granted = await StudioAndroid.requestHealthPermissions([permission]);
        setHealthRequested((current) => ({ ...current, [widget.id]: true }));
        if (!granted) {
          Alert.alert('Health access not allowed', 'Enable this permission for Customize Studio in Health Connect settings to show live data. The widget will show sample data until then.');
          return false;
        }
      }
    } catch {
      Alert.alert('Health Connect unavailable', 'Could not reach Health Connect. The widget will show sample data.');
      return false;
    }
    const liveData = await refreshSelectedData(widget);
    setSelected((current) => current.id === widget.id ? { ...current, ...liveData } : current);
    return true;
  };

  const sendTestNotification = async () => {
    if (Platform.OS !== 'android' || !StudioAndroid) { Alert.alert('Not available', 'Notifications are only wired up for Android right now.'); return; }
    try {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Notifications not allowed', 'Enable notifications for Customize Studio in your device settings to see styled alerts.');
          return;
        }
      }
      await StudioAndroid.showStyledNotification('Customize Studio', 'This is what a styled notification from your app looks like.', selected.accent);
    } catch {
      Alert.alert('Could not send notification', 'Something went wrong sending the test notification.');
    }
  };

  const checkUpdate = async () => {
    if (Platform.OS !== 'android' || !StudioAndroid) { Alert.alert('Not available', 'Updates are only wired up for Android right now.'); return; }
    setUpdateCheckState('checking');
    try {
      const result = await StudioAndroid.checkForUpdate();
      if (result.available && result.downloadUrl) {
        setUpdateInfo({ tagName: result.tagName, downloadUrl: result.downloadUrl });
        setUpdateCheckState('available');
      } else {
        setUpdateInfo(null);
        setUpdateCheckState('upToDate');
      }
    } catch {
      setUpdateCheckState('error');
    }
  };

  const installUpdate = async () => {
    if (!StudioAndroid || !updateInfo) return;
    setUpdateCheckState('installing');
    try {
      await StudioAndroid.downloadAndInstallUpdate(updateInfo.downloadUrl);
      setUpdateCheckState('available');
    } catch (error) {
      setUpdateCheckState('available');
      const message = error instanceof Error ? error.message : '';
      if (message.includes('install unknown apps')) {
        Alert.alert('Allow installs from Customize Studio', 'Turn on "Allow from this source" for Customize Studio, then tap Download & install again.');
      } else {
        Alert.alert('Update failed', 'Could not download or install the update. Check your connection and try again.');
      }
    }
  };

  const pickWallpaperImage = async () => {
    if (Platform.OS !== 'android' || !StudioAndroid) { Alert.alert('Not available', 'Wallpapers are only wired up for Android right now.'); return; }
    try {
      const path = await StudioAndroid.pickWallpaperImage();
      if (path) { setPickedWallpaperPath(path); setSelectedGradientId(null); setWallpaperStatus(null); setDepthLayers(null); }
    } catch {
      Alert.alert('Could not open picker', 'Try choosing an image again.');
    }
  };

  const applyPickedWallpaper = async () => {
    if (!StudioAndroid || !pickedWallpaperPath) return;
    setWallpaperBusy(true);
    try {
      await StudioAndroid.setWallpaperFromPath(pickedWallpaperPath, wallpaperTarget);
      setWallpaperStatus('Wallpaper applied.');
    } catch {
      Alert.alert('Could not set wallpaper', 'Try a different image.');
    } finally {
      setWallpaperBusy(false);
    }
  };

  const applyGradientWallpaper = async (preset: (typeof wallpaperGradientPresets)[number]) => {
    if (Platform.OS !== 'android' || !StudioAndroid) { Alert.alert('Not available', 'Wallpapers are only wired up for Android right now.'); return; }
    setWallpaperBusy(true);
    try {
      await StudioAndroid.setGradientWallpaper(preset.colors, wallpaperTarget);
      setSelectedGradientId(preset.id);
      setPickedWallpaperPath(null);
      setWallpaperStatus(`${preset.name} applied.`);
    } catch {
      Alert.alert('Could not set wallpaper', 'Try again in a moment.');
    } finally {
      setWallpaperBusy(false);
    }
  };

  const openLiveWallpapers = () => {
    if (Platform.OS !== 'android' || !StudioAndroid) { Alert.alert('Not available', 'Live wallpapers are only wired up for Android right now.'); return; }
    StudioAndroid.openLiveWallpaperPicker().catch(() => Alert.alert('Could not open', 'Your launcher may not support live wallpapers.'));
  };

  const openWallpaperSettingsAction = () => {
    if (Platform.OS !== 'android' || !StudioAndroid) return;
    StudioAndroid.openWallpaperSettings().catch(() => {});
  };

  const createDepthEffect = async () => {
    if (Platform.OS !== 'android' || !StudioAndroid) { Alert.alert('Not available', 'Depth effect is only wired up for Android right now.'); return; }
    if (!pickedWallpaperPath) return;
    setDepthProcessing(true);
    try {
      const layers = await StudioAndroid.segmentWallpaperSubject(pickedWallpaperPath);
      setDepthLayers(layers);
      setDepthClockPos(defaultDepthClockPos);
      setDepthDatePos(defaultDepthDatePos);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      Alert.alert('Could not find a subject', message || 'Try a photo with a clearer foreground subject.');
    } finally {
      setDepthProcessing(false);
    }
  };

  const applyDepthWallpaper = async () => {
    if (!StudioAndroid || !depthLayers) return;
    const config: DepthWallpaperConfig = {
      clockEnabled: depthClockEnabled, clockFont: depthClockFont, clockBehindSubject: depthClockBehindSubject, clockSize: depthClockSize / 100,
      clockX: depthClockPos.x, clockY: depthClockPos.y, showDate: depthShowDate, dateFont: depthDateFont, dateFormat: depthDateFormat,
      dateX: depthDatePos.x, dateY: depthDatePos.y,
    };
    setDepthApplying(true);
    try {
      if (depthApplyTarget === 'lock' || depthApplyTarget === 'both') {
        const snapshotPath = await StudioAndroid.renderDepthSnapshot(depthLayers.foregroundPath, depthLayers.backgroundPath, config);
        await StudioAndroid.setWallpaperFromPath(snapshotPath, 'lock');
      }
      if (depthApplyTarget === 'home' || depthApplyTarget === 'both') {
        await StudioAndroid.setDepthWallpaperConfig(depthLayers.foregroundPath, depthLayers.backgroundPath, config);
        await StudioAndroid.openDepthWallpaperPicker();
      } else {
        Alert.alert('Lock screen updated', 'Your customized design is now your lock screen wallpaper. Live tilt motion only works on the home screen — Android doesn’t let apps animate behind the lock screen.');
      }
    } catch {
      Alert.alert('Could not apply wallpaper', 'Try again from Settings > Wallpaper.');
    } finally {
      setDepthApplying(false);
    }
  };

  const refreshSelectedData = async (widget: Widget = selected): Promise<Partial<Widget>> => {
    if (widget.id === 'battery') {
      try {
        const level = await Battery.getBatteryLevelAsync();
        if (level >= 0) return { label: `${Math.round(level * 100)}%` };
      } catch { }
    } else if (widget.id === 'storage') {
      try {
        if (Platform.OS !== 'android' || !StudioAndroid) return {};
        const storage = await StudioAndroid.getStorageInfo();
        const total = storage.totalBytes;
        const available = storage.availableBytes;
        const used = storage.usedBytes;
        return { label: `${formatBytes(used)} used`, subtitle: `${formatBytes(available)} free of ${formatBytes(total)}` };
      } catch { }
    } else if (widget.id.includes('steps') || (widget.id === 'custom' && widget.type === 'Health' && widget.style.startsWith('Step'))) {
      try {
        if (Platform.OS !== 'android' || !StudioAndroid) return {};
        const steps = await StudioAndroid.getStepsToday();
        return { label: `${Number(steps).toLocaleString()} steps` };
      } catch { }
    } else if (widget.id === 'health-sleep') {
      try {
        if (Platform.OS !== 'android' || !StudioAndroid) return {};
        const minutes = Number(await StudioAndroid.getSleepLastNight());
        return { label: minutes ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : 'No sleep data' };
      } catch { }
    }
    return {};
  };

  const changeTab = (nextTab: TabName) => {
    if (nextTab === tab) return;
    const nextIndex = tabs.findIndex((item) => item.name === nextTab);
    Animated.spring(activePosition, {
      toValue: nextIndex * 60,
      damping: 18,
      stiffness: 210,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
    pageOpacity.setValue(0);
    pageOffset.setValue(10);
    setTab(nextTab);
    Animated.parallel([
      Animated.timing(pageOpacity, { toValue: 1, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(pageOffset, { toValue: 0, damping: 20, stiffness: 190, useNativeDriver: true }),
    ]).start();
  };

  const changeGenericTab = (nextTab: GenericTabName) => {
    if (nextTab === genericTab) return;
    const nextIndex = genericTabs.findIndex((item) => item.name === nextTab);
    Animated.spring(activePosition, {
      toValue: nextIndex * 60,
      damping: 18,
      stiffness: 210,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
    pageOpacity.setValue(0);
    pageOffset.setValue(10);
    setGenericTab(nextTab);
    Animated.parallel([
      Animated.timing(pageOpacity, { toValue: 1, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(pageOffset, { toValue: 0, damping: 20, stiffness: 190, useNativeDriver: true }),
    ]).start();
  };

  const openSection = (id: SectionId) => {
    setDrawerOpen(false);
    if (id === section) return;
    setSection(id);
    activePosition.setValue(0);
    if (id === 'widgets') setTab('Widgets'); else setGenericTab('Presets');
    pageOpacity.setValue(0);
    pageOffset.setValue(10);
    Animated.parallel([
      Animated.timing(pageOpacity, { toValue: 1, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(pageOffset, { toValue: 0, damping: 20, stiffness: 190, useNativeDriver: true }),
    ]).start();
  };

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.timing(drawerPosition, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  };

  const closeDrawer = () => {
    Animated.timing(drawerPosition, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => setDrawerOpen(false));
  };

  const chooseWidget = (widget: Widget) => {
    setSelected(widget);
    resetDesign(widget.accent);
    setClockMode(widget.id.startsWith('clock-analog') ? 'Analog' : 'Digital');
    if (widget.type === 'Clock') {
      setAnalogClockStyle(analogFaces[0]);
      setDigitalClockStyle(digitalFaces[0]);
      if (widget.id.startsWith('clock-analog')) setAnalogClockStyle(widget.style);
      else setDigitalClockStyle(widget.style);
    }
    if (widget.type === 'Clock') setShowSeconds(widget.id.startsWith('clock-digital') ? widget.style !== 'Clean digital' : true);
    setShowSecondClock(false);
    setSaved(false);
    if (widget.id === 'battery' || widget.id === 'storage') {
      void refreshSelectedData(widget).then((liveData) => setSelected((current) => current.id === widget.id ? { ...current, ...liveData } : current));
    }
    if (widget.id === 'calendar') void openCalendarPicker();
    if (widget.type === 'Health') void ensureHealthAccess(widget);
  };
  const startFromScratch = () => {
    setSelected(scratchWidget);
    resetDesign(scratchWidget.accent);
    setClockMode('Analog'); setTimeFormat('12-hour'); setShowSeconds(true); setShowPeriod(true); setStepStyle('Step ring');
    setSaved(false);
    changeTab('Customize');
  };
  const selectScratchType = (type: string) => {
    const samples: Record<string, Partial<Widget>> = {
      Clock: { icon: '◷', label: '10:10', accent: '#8C6CFF', style: 'Classic numerals' },
      Health: { icon: '⌁', label: '8,420 steps', accent: '#88D5C3', style: 'Step ring' },
      Weather: { icon: '☀', label: '24°', accent: '#D8B8FF' }, Battery: { icon: '▰', label: '82%', accent: '#8C6CFF' },
      Calendar: { icon: '▦', label: 'Choose an event', accent: '#88D5C3' }, Music: { icon: '♫', label: 'Now playing', accent: '#FFAE91' },
      Storage: { icon: '◫', label: '76% used', accent: '#85C8E8' }, Text: { icon: 'T', label: 'Your text', accent: '#8C6CFF' },
    };
    setSelected({ ...scratchWidget, ...samples[type], type, title: type === 'Text' ? 'Your text' : `Your ${type.toLowerCase()} widget` });
    if (type === 'Clock') {
      setClockMode('Analog');
      setAnalogClockStyle('Classic numerals');
      setDigitalClockStyle('Clean digital');
    }
  };
  const updateGradientEnd = (value: string) => {
    setGradientEndDraft(value);
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) setGradientEnd(value);
  };
  const finishGradientEndEdit = () => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(gradientEndDraft)) setGradientEndDraft(gradientEnd);
  };
  const addSelectedFromSheet = () => {
    setWidgetSheetVisible(false);
    setTimeout(addToHomeScreen, 300);
  };
  const addToHomeScreen = async () => {
    if (selected.type === 'Health' && !(await ensureHealthAccess(selected))) return;
    if (selected.type === 'Calendar') {
      if (!(await ensureCalendarAccess())) return;
      if (!calendarEvent) {
        await loadCalendarEvents();
        return;
      }
    }
    const liveData = await refreshSelectedData();
    const selectedForSnapshot = { ...selected, ...liveData };
    let slotName = 'StudioWidget';
    try {
      if (Platform.OS === 'android') {
        if (!StudioAndroid) throw new Error('Native widget pinning is unavailable in this app build.');
        const freeSlot = await StudioAndroid.getAvailableWidgetSlot(widgetSlotNames);
        if (!freeSlot) throw new Error('All Customize Studio widget slots are in use. Remove a Customize Studio widget from your home screen and try again.');
        slotName = freeSlot;
      }
      // Load the native widget only on demand so the designer can still run in Expo Go.
      const nativeWidgets = require('./widgets/StudioWidget') as NativeWidgetModule;
      const nativeWidget = nativeWidgets.widgetSlots[slotName];
      if (!nativeWidget) throw new Error(`Widget ${slotName} is not included in this app build.`);
      nativeWidget.updateSnapshot({
        title: selected.type === 'Calendar' && calendarEvent ? calendarEvent.title : selectedForSnapshot.title,
        subtitle: selected.type === 'Calendar' && calendarEvent ? formatEventDate(calendarEvent.startDate) : selectedForSnapshot.subtitle,
        value: selected.type === 'Calendar' && calendarEvent ? formatEventDate(calendarEvent.startDate) : selected.type === 'Clock' ? formatClockTime(clockNow, clockZone, timeFormat, showSeconds, showPeriod) : selectedForSnapshot.label,
        accent: colors.value, icon: selected.icon, size: sizeLabel,
        widgetKind: selected.type === 'Clock' ? `clock-${clockMode.toLowerCase()}` : selected.id === 'custom' ? selected.type.toLowerCase() : selected.id, monthTitle, monthRows,
        layoutMode, widthCells: fixedWidth, heightCells: fixedHeight, shape, theme, colors, positions, gradientEnd,
        clockMode, timeFormat, showSeconds, showPeriod, clockStyle: selected.style, analogClockStyle, digitalClockStyle, clockHandColors, stepStyle, stepGoal, clockZone, secondClockZone, showSecondClock,
      });
    } catch {
      Alert.alert(
        'Widget unavailable',
        'This app build cannot prepare another widget. Use the installed Customize Studio release and try again.',
      );
      return;
    }
    setSaved(true);
    if (Platform.OS === 'android') {
      try {
        if (!StudioAndroid) throw new Error('Native widget pinning is unavailable in this app build.');
        await StudioAndroid.pinWidget(slotName);
      } catch (error) {
        Alert.alert('Could not add widget', error instanceof Error ? error.message : 'Try adding Customize Studio from your launcher’s Widgets panel.');
      }
    } else {
      Alert.alert('Widget saved', 'Your design is saved. Add Customize Studio from your home screen’s widget gallery.');
    }
  };


  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topbar}>
        <Pressable onPress={openDrawer} style={styles.hamburger} accessibilityLabel="Open menu"><Text style={styles.hamburgerText}>☰</Text></Pressable>
        <View style={styles.brandMark}><Text style={styles.brandMarkText}>c.</Text></View>
        <View style={styles.brandCopy}><Text style={styles.brand}>CUSTOMIZE STUDIO</Text><Text style={styles.brandSub}>Make your device yours</Text></View>
        <Pressable onPress={() => (section === 'widgets' ? changeTab('Settings') : changeGenericTab('Settings'))} style={styles.avatar} accessibilityLabel="Settings"><Text style={styles.avatarText}>A</Text></Pressable>
      </View>
      <Animated.ScrollView stickyHeaderIndices={section === 'widgets' && tab === 'Customize' ? [1] : undefined} style={{ opacity: pageOpacity, transform: [{ translateY: pageOffset }] }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {section === 'widgets' && tab !== 'Widgets' && <View style={styles.headingRow}>
          <View><Text style={styles.eyebrow}>{tab === 'Customize' ? (selected.id === 'custom' ? 'START WITH A BLANK CANVAS' : 'A FEW LITTLE DETAILS') : 'YOUR STUDIO'}</Text><Text style={styles.heading}>{tab === 'Customize' ? selected.id === 'custom' ? <>Create your{'\n'}own widget.</> : <>Fine-tune{'\n'}your widget.</> : <>A space that{'\n'}feels like you.</>}</Text></View>
          <View style={styles.sparkle}><Text style={{ color: '#8C6CFF', fontSize: 27 }}>✳</Text></View>
        </View>}
        {section !== 'widgets' && <View style={styles.headingRow}>
          <View><Text style={styles.eyebrow}>{genericTab.toUpperCase()}</Text><Text style={styles.heading}>{sections.find((item) => item.id === section)?.label}</Text></View>
          <View style={styles.sparkle}><Text style={{ color: '#8C6CFF', fontSize: 27 }}>{sections.find((item) => item.id === section)?.icon}</Text></View>
        </View>}
        {section !== 'widgets' && section !== 'wallpapers' && (() => {
          const copy = sectionCopy[section as Exclude<SectionId, 'widgets'>];
          const note = genericTab === 'Presets' ? copy.presets : genericTab === 'Customize' ? copy.customize : copy.settings;
          return (
            <View style={styles.settingsCard}>
              <View style={styles.settingsIntro}><Text style={styles.settingsIntroIcon}>{sections.find((item) => item.id === section)?.icon}</Text><View><Text style={styles.sectionTitle}>{sections.find((item) => item.id === section)?.label}</Text><Text style={styles.sectionSub}>{copy.blurb}</Text></View></View>
              <View style={styles.divider} />
              <View style={styles.settingsRow}><Text style={styles.controlSub}>{note}</Text></View>
              {genericTab === 'Settings' && copy.settingsAction === 'notification' && (
                <Pressable onPress={sendTestNotification} style={styles.addHomeButton}><Text style={styles.addHomeIcon}>◔</Text><View style={{ flex: 1 }}><Text style={styles.addHomeTitle}>Send test notification</Text></View><Text style={styles.addHomeArrow}>↗</Text></Pressable>
              )}
            </View>
          );
        })()}
        {section === 'wallpapers' && (
          <View style={styles.settingsCard}>
            <View style={styles.settingsIntro}><Text style={styles.settingsIntroIcon}>◧</Text><View><Text style={styles.sectionTitle}>Wallpapers</Text><Text style={styles.sectionSub}>{sectionCopy.wallpapers.blurb}</Text></View></View>
            <View style={styles.divider} />
            {genericTab === 'Presets' && <View style={{ paddingBottom: 16 }}>
              <Text style={[styles.controlSub, { marginTop: 14 }]}>{sectionCopy.wallpapers.presets}</Text>
              <View style={styles.optionGrid}>
                {wallpaperGradientPresets.map((preset) => (
                  <Pressable key={preset.id} onPress={() => applyGradientWallpaper(preset)} disabled={wallpaperBusy} style={styles.wallpaperSwatchWrap}>
                    <LinearGradient colors={preset.colors as [string, string]} style={styles.wallpaperSwatch}>
                      {selectedGradientId === preset.id && <Text style={styles.wallpaperSwatchCheck}>✓</Text>}
                    </LinearGradient>
                    <Text style={styles.wallpaperSwatchLabel}>{preset.name}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable onPress={openLiveWallpapers} style={styles.addHomeButton}><Text style={styles.addHomeIcon}>▶</Text><View style={{ flex: 1 }}><Text style={styles.addHomeTitle}>Browse live wallpapers</Text></View><Text style={styles.addHomeArrow}>↗</Text></Pressable>
            </View>}
            {genericTab === 'Customize' && <View style={{ paddingBottom: 16 }}>
              <Pressable onPress={pickWallpaperImage} style={styles.createScratchButton}><Text style={styles.createScratchIcon}>⛰</Text><View style={{ flex: 1 }}><Text style={styles.controlTitle}>Choose from gallery</Text><Text style={styles.controlSub}>Pick a photo to use as your wallpaper.</Text></View><Text style={styles.settingsChevron}>›</Text></Pressable>
              {pickedWallpaperPath && <Image source={{ uri: pickedWallpaperPath }} style={styles.wallpaperPreviewImage} />}
              <Text style={[styles.controlTitle, { marginTop: 14 }]}>Apply to</Text>
              <OptionPicker
                options={['Home screen', 'Lock screen', 'Both']}
                value={wallpaperTarget === 'home' ? 'Home screen' : wallpaperTarget === 'lock' ? 'Lock screen' : 'Both'}
                onSelect={(value) => setWallpaperTarget(value === 'Home screen' ? 'home' : value === 'Lock screen' ? 'lock' : 'both')}
              />
              {pickedWallpaperPath && <Pressable onPress={applyPickedWallpaper} disabled={wallpaperBusy} style={styles.addHomeButton}><Text style={styles.addHomeIcon}>✓</Text><View style={{ flex: 1 }}><Text style={styles.addHomeTitle}>{wallpaperBusy ? 'Applying…' : 'Set as wallpaper'}</Text></View></Pressable>}
              <View style={styles.customCard}>
                <Text style={styles.controlTitle}>Depth effect</Text>
                <Text style={styles.controlSub}>Cuts the subject out of your photo on-device, then renders it as a live wallpaper that shifts over a blurred background as you tilt your phone or swipe home screens.</Text>
                {pickedWallpaperPath ? (
                  <Pressable onPress={createDepthEffect} disabled={depthProcessing} style={[styles.addHomeButton, { marginTop: 12 }]}>
                    <Text style={styles.addHomeIcon}>◎</Text>
                    <View style={{ flex: 1 }}><Text style={styles.addHomeTitle}>{depthProcessing ? 'Finding the subject…' : 'Create depth effect'}</Text></View>
                  </Pressable>
                ) : (
                  <Text style={[styles.controlSub, { marginTop: 10 }]}>Choose a photo above first.</Text>
                )}
                {depthLayers && <>
                  <View
                    style={styles.wallpaperDepthPreview}
                    onLayout={(event) => setDepthPreviewSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}
                  >
                    <Image source={{ uri: depthLayers.backgroundPath }} style={styles.wallpaperDepthLayer} blurRadius={2} />
                    {depthClockBehindSubject && <>
                      {depthClockEnabled && <DraggableOverlay pos={depthClockPos} onChange={setDepthClockPos} containerWidth={depthPreviewSize.width} containerHeight={depthPreviewSize.height}>
                        <Text style={[styles.wallpaperDepthClock, { fontFamily: depthClockFontFamilies[depthClockFont], fontSize: 34 * (depthClockSize / 100) }]}>12:45</Text>
                      </DraggableOverlay>}
                      {depthShowDate && <DraggableOverlay pos={depthDatePos} onChange={setDepthDatePos} containerWidth={depthPreviewSize.width} containerHeight={depthPreviewSize.height}>
                        <Text style={[styles.wallpaperDepthDate, { fontFamily: depthClockFontFamilies[depthDateFont], fontSize: 13 * (depthClockSize / 100) }]}>{formatDepthDate(new Date(), depthDateFormat)}</Text>
                      </DraggableOverlay>}
                    </>}
                    <Image source={{ uri: depthLayers.foregroundPath }} style={styles.wallpaperDepthLayer} resizeMode="contain" />
                    {!depthClockBehindSubject && <>
                      {depthClockEnabled && <DraggableOverlay pos={depthClockPos} onChange={setDepthClockPos} containerWidth={depthPreviewSize.width} containerHeight={depthPreviewSize.height}>
                        <Text style={[styles.wallpaperDepthClock, { fontFamily: depthClockFontFamilies[depthClockFont], fontSize: 34 * (depthClockSize / 100) }]}>12:45</Text>
                      </DraggableOverlay>}
                      {depthShowDate && <DraggableOverlay pos={depthDatePos} onChange={setDepthDatePos} containerWidth={depthPreviewSize.width} containerHeight={depthPreviewSize.height}>
                        <Text style={[styles.wallpaperDepthDate, { fontFamily: depthClockFontFamilies[depthDateFont], fontSize: 13 * (depthClockSize / 100) }]}>{formatDepthDate(new Date(), depthDateFormat)}</Text>
                      </DraggableOverlay>}
                    </>}
                  </View>
                  <Text style={[styles.controlSub, { marginTop: 8 }]}>Drag the clock or date anywhere on the preview.</Text>
                  <View style={{ marginTop: 10 }}>
                    <ToggleRow label="Show clock" value={depthClockEnabled} onChange={setDepthClockEnabled} />
                  </View>
                  {depthClockEnabled && <>
                    <Text style={[styles.controlTitle, { marginTop: 10 }]}>Clock font</Text>
                    <OptionPicker options={[...depthClockFonts]} value={depthClockFont} onSelect={(value) => setDepthClockFont(value as DepthClockFont)} />
                    <StepperControl label="Size" value={depthClockSize} unit="%" min={50} max={200} step={10} onChange={setDepthClockSize} />
                    <ToggleRow label="Clock behind subject" value={depthClockBehindSubject} onChange={setDepthClockBehindSubject} />
                  </>}
                  <View style={{ marginTop: 10 }}>
                    <ToggleRow label="Show date" value={depthShowDate} onChange={setDepthShowDate} />
                  </View>
                  {depthShowDate && <>
                    <Text style={[styles.controlTitle, { marginTop: 10 }]}>Date font</Text>
                    <OptionPicker options={[...depthClockFonts]} value={depthDateFont} onSelect={(value) => setDepthDateFont(value as DepthClockFont)} />
                    <Text style={[styles.controlTitle, { marginTop: 10 }]}>Date format</Text>
                    <OptionPicker options={[...depthDateFormats]} value={depthDateFormat} onSelect={(value) => setDepthDateFormat(value as DepthDateFormat)} />
                  </>}
                  <Text style={[styles.controlTitle, { marginTop: 14 }]}>Apply to</Text>
                  <OptionPicker
                    options={['Home screen', 'Lock screen', 'Both']}
                    value={depthApplyTarget === 'home' ? 'Home screen' : depthApplyTarget === 'lock' ? 'Lock screen' : 'Both'}
                    onSelect={(value) => setDepthApplyTarget(value === 'Home screen' ? 'home' : value === 'Lock screen' ? 'lock' : 'both')}
                  />
                  <Text style={[styles.controlSub, { marginTop: 6 }]}>
                    {depthApplyTarget === 'home'
                      ? 'The home screen gets the full live effect — tilt and swipe parallax.'
                      : depthApplyTarget === 'lock'
                        ? 'Android can’t animate a live wallpaper behind the lock screen, so it gets a still snapshot of this exact same design.'
                        : 'Home screen gets the live, moving version. Lock screen gets a still snapshot of this same design — Android doesn’t allow live wallpapers behind the lock screen.'}
                  </Text>
                  <Pressable onPress={applyDepthWallpaper} disabled={depthApplying} style={[styles.addHomeButton, { marginTop: 12 }]}>
                    <Text style={styles.addHomeIcon}>▶</Text><View style={{ flex: 1 }}><Text style={styles.addHomeTitle}>{depthApplying ? 'Applying…' : depthApplyTarget === 'home' ? 'Set as live wallpaper' : depthApplyTarget === 'lock' ? 'Set lock screen wallpaper' : 'Set both wallpapers'}</Text></View><Text style={styles.addHomeArrow}>↗</Text>
                  </Pressable>
                </>}
              </View>
            </View>}
            {genericTab === 'Settings' && <View style={{ paddingBottom: 16 }}>
              <Text style={[styles.controlSub, { marginTop: 14 }]}>{wallpaperStatus ?? sectionCopy.wallpapers.settings}</Text>
              <Pressable onPress={openWallpaperSettingsAction} style={styles.addHomeButton}><Text style={styles.addHomeIcon}>⚙︎</Text><View style={{ flex: 1 }}><Text style={styles.addHomeTitle}>Open wallpaper & style settings</Text></View><Text style={styles.addHomeArrow}>↗</Text></Pressable>
            </View>}
          </View>
        )}
        {section === 'widgets' && tab === 'Settings' && (
          <View style={styles.settingsCard}>
            <View style={styles.settingsIntro}><Text style={styles.settingsIntroIcon}>⚙︎</Text><View><Text style={styles.sectionTitle}>Studio settings</Text><Text style={styles.sectionSub}>A few details about your setup.</Text></View></View>
            <View style={styles.divider} />
            <View style={styles.settingsRow}><View><Text style={styles.controlTitle}>Appearance</Text><Text style={styles.controlSub}>Dark · soft contrast</Text></View><Text style={styles.settingsValue}>●</Text></View>
            <View style={styles.divider} />
            <Pressable onPress={() => changeTab('Customize')} style={styles.settingsRow}><View><Text style={styles.controlTitle}>Widget sizing</Text><Text style={styles.controlSub}>{sizeLabel} · change in Customize</Text></View><Text style={styles.settingsChevron}>›</Text></Pressable>
            <View style={styles.divider} />
            <View style={styles.settingsRow}><View><Text style={styles.controlTitle}>Saved design</Text><Text style={styles.controlSub}>{saved ? selected.title : 'No saved widget yet'}</Text></View><Text style={styles.settingsValue}>{saved ? '✓' : '♡'}</Text></View>
            <View style={styles.divider} />
            <View style={styles.settingsRow}><View><Text style={styles.controlTitle}>Customize Studio</Text><Text style={styles.controlSub}>Version {buildVersion ?? '1.0.2'}</Text></View><Text style={styles.settingsValue}>✳</Text></View>
            <View style={styles.divider} />
            {(updateCheckState === 'available' || updateCheckState === 'installing') && updateInfo ? (
              <Pressable onPress={installUpdate} disabled={updateCheckState === 'installing'} style={styles.settingsRow}>
                <View><Text style={styles.controlTitle}>Update available · {updateInfo.tagName}</Text><Text style={styles.controlSub}>{updateCheckState === 'installing' ? 'Downloading…' : 'Tap to download & install'}</Text></View>
                <Text style={styles.settingsChevron}>›</Text>
              </Pressable>
            ) : (
              <Pressable onPress={checkUpdate} disabled={updateCheckState === 'checking'} style={styles.settingsRow}>
                <View><Text style={styles.controlTitle}>Check for updates</Text><Text style={styles.controlSub}>{updateCheckState === 'checking' ? 'Checking…' : updateCheckState === 'upToDate' ? 'You’re on the latest build' : updateCheckState === 'error' ? 'Could not check — tap to retry' : 'Updates install without the Play Store'}</Text></View>
                <Text style={styles.settingsChevron}>›</Text>
              </Pressable>
            )}
          </View>
        )}
        {section === 'widgets' && tab === 'Customize' && <View style={styles.previewShell}>
              <View style={styles.previewTop}><Text style={styles.previewEyebrow}>LIVE PREVIEW</Text><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text></View>
              <View style={[styles.widgetPreview, previewDimensions, { borderColor: theme === 'Transparent' ? 'transparent' : theme === 'Liquid Glass' ? 'rgba(255,255,255,0.48)' : colors.border, borderRadius: shapeRadius, backgroundColor: theme === 'Solid Color' ? colors.background : 'transparent' }]}>
                {theme === 'Gradient' && <LinearGradient pointerEvents="none" colors={[colors.background, gradientEnd] as const} style={styles.previewBackground} />}
                {theme === 'Liquid Glass' && <LinearGradient pointerEvents="none" colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.05)']} style={styles.previewBackground} />}
                {selected.id === 'custom' && selected.type === 'Custom' ? <View style={styles.scratchEmpty}><Text style={styles.scratchStar}>✦</Text><Text style={styles.previewTitle}>Your canvas is ready</Text><Text style={styles.previewSubtitle}>Choose a widget type below to begin.</Text></View>
                  : <WidgetSample widget={selected} large accent={theme === 'Liquid Glass' ? '#FFFFFF' : colors.value} clockMode={clockMode} analogClockStyle={analogClockStyle} digitalClockStyle={digitalClockStyle} clockHandColors={activeClockHandColors} timeFormat={timeFormat} showSeconds={showSeconds} showPeriod={showPeriod} clockZone={clockZone} secondClockZone={secondClockZone} showSecondClock={showSecondClock} now={clockNow} stepGoal={stepGoal} stepStyle={stepStyle} />}
              </View>
              <View style={styles.previewFooter}><Text style={styles.previewHint}>◉  Updates live as you customize</Text><Pressable onPress={() => setSaved(!saved)} style={[styles.saveButton, saved && styles.saveButtonDone]}><Text style={[styles.saveButtonText, saved && { color: '#0E0C16' }]}>{saved ? '✓  Saved' : '＋  Save widget'}</Text></Pressable></View>
            </View>}
        {section === 'widgets' && tab === 'Widgets' && <View>
              <Pressable onPress={startFromScratch} style={styles.createScratchButton}><Text style={styles.createScratchIcon}>＋</Text><View style={{ flex: 1 }}><Text style={styles.controlTitle}>Create from scratch</Text><Text style={styles.controlSub}>Choose a widget type, then build every detail.</Text></View><Text style={styles.settingsChevron}>›</Text></Pressable>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {categories.map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.chip, category === item && styles.chipActive]}><Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text></Pressable>)}
              </ScrollView>
              <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Start with a widget</Text><Text style={styles.sectionSub}>Made to fit your kind of day.</Text></View><Text style={styles.count}>{filtered.length.toString().padStart(2, '0')} DESIGNS</Text></View>
              <View style={styles.grid}>
                {filtered.map((widget) => <Pressable key={widget.id} onPress={() => { chooseWidget(widget); setWidgetSheetVisible(true); }} style={[styles.templateCard, { width: cardWidth }]}>
                <View style={[styles.templateArt, { backgroundColor: '#110F1D' }]}><WidgetSample widget={widget} now={clockNow} clockMode={widget.id.startsWith('clock-analog') ? 'Analog' : 'Digital'} showSeconds={widget.id.startsWith('clock-digital') && widget.style !== 'Clean digital'} /></View>
                  <View style={styles.templateInfo}><View><Text style={styles.templateTitle}>{widget.title}</Text><Text style={styles.templateType}>{widget.type} · {widget.style}</Text></View></View>
                </Pressable>)}
              </View>
        </View>}
        {section === 'widgets' && tab === 'Customize' && <View>
              {selected.id === 'custom' && <View style={styles.customCard}>
                <Text style={styles.controlTitle}>Choose a starting point</Text><Text style={styles.controlSub}>You can change this later. All design options stay editable.</Text>
                <View style={styles.optionGrid}>{widgetTypes.map((type) => <Pressable key={type} onPress={() => selectScratchType(type)} style={[styles.typeButton, selected.type === type && styles.optionButtonActive]}><Text style={[styles.optionText, selected.type === type && styles.optionTextActive]}>{type}</Text></Pressable>)}</View>
              </View>}
              {selected.type === 'Clock' && <View style={styles.customCard}>
                {Platform.OS === 'android' ? <>
                  <Text style={styles.controlTitle}>Clock display</Text><Text style={styles.controlSub}>Choose what this clock shows.</Text>
                  <View style={styles.optionGrid}>{['Analog', 'Digital', 'Both'].map((mode) => <Pressable key={mode} onPress={() => setClockMode(mode)} style={[styles.typeButton, clockMode === mode && styles.optionButtonActive]}><Text style={[styles.optionText, clockMode === mode && styles.optionTextActive]}>{mode}</Text></Pressable>)}</View>
                  {clockMode !== 'Digital' && <><Text style={[styles.controlTitle, { marginTop: 15 }]}>Analog face</Text><OptionPicker options={analogFaces} value={analogClockStyle} onSelect={(value) => { setAnalogClockStyle(value); setSelected((current) => ({ ...current, style: value, id: current.id === 'custom' ? 'custom' : `clock-analog-${analogFaces.indexOf(value) + 1}` })); }} /></>}
                  {clockMode !== 'Analog' && <><Text style={[styles.controlTitle, { marginTop: 15 }]}>Digital face</Text><OptionPicker options={digitalFaces} value={digitalClockStyle} onSelect={(value) => { setDigitalClockStyle(value); setSelected((current) => ({ ...current, style: value, id: current.id === 'custom' ? 'custom' : `clock-digital-${digitalFaces.indexOf(value) + 1}` })); }} /></>}
                </> : <>
                  <Text style={[styles.controlSub, { marginTop: 12 }]}>Analog face</Text><OptionPicker options={analogFaces} value={analogClockStyle} onSelect={(value) => { setAnalogClockStyle(value); setSelected((current) => ({ ...current, style: value, id: current.id === 'custom' ? 'custom' : `clock-analog-${analogFaces.indexOf(value) + 1}` })); setClockMode('Analog'); }} />
                  <Text style={[styles.controlSub, { marginTop: 12 }]}>Digital face</Text><OptionPicker options={digitalFaces} value={digitalClockStyle} onSelect={(value) => { setDigitalClockStyle(value); setSelected((current) => ({ ...current, style: value, id: current.id === 'custom' ? 'custom' : `clock-digital-${digitalFaces.indexOf(value) + 1}` })); setClockMode('Digital'); }} />
                  <Text style={[styles.controlTitle, { marginTop: 15 }]}>Clock display</Text><View style={styles.optionGrid}>{['Analog', 'Digital', 'Both'].map((mode) => <Pressable key={mode} onPress={() => setClockMode(mode)} style={[styles.typeButton, clockMode === mode && styles.optionButtonActive]}><Text style={[styles.optionText, clockMode === mode && styles.optionTextActive]}>{mode}</Text></Pressable>)}</View>
                </>}
                {Platform.OS === 'android' && theme !== 'Liquid Glass' && clockMode !== 'Digital' && <View style={colorPickerStyles.handCard}>
                  <Text style={styles.controlTitle}>Analog hand colors</Text><Text style={styles.controlSub}>Set each hand color separately.</Text>
                  <View style={styles.colorGrid}>{([['hour', 'Hours hand'], ['minute', 'Minutes hand'], ['second', 'Seconds hand']] as const).map(([key, label]) => <ColorControl key={key} label={label} value={clockHandColors[key]} onChange={(value) => setClockHandColors((current) => ({ ...current, [key]: value }))} />)}</View>
                </View>}
                {Platform.OS === 'android' && theme !== 'Liquid Glass' && clockMode !== 'Analog' && <View style={colorPickerStyles.handCard}>
                  <Text style={styles.controlTitle}>Digital time colors</Text><Text style={styles.controlSub}>Set the hours, minutes, seconds, and separators.</Text>
                  <View style={styles.colorGrid}>{([['hour', 'Hours'], ['minute', 'Minutes'], ['second', 'Seconds'], ['separator', 'Colon (:)']] as const).map(([key, label]) => <ColorControl key={key} label={label} value={clockHandColors[key]} onChange={(value) => setClockHandColors((current) => ({ ...current, [key]: value }))} />)}</View>
                </View>}
                {clockMode !== 'Analog' && <><Text style={[styles.controlTitle, { marginTop: 15 }]}>Digital time</Text><View style={styles.optionGrid}>{(['12-hour', '24-hour'] as const).map((format) => <Pressable key={format} onPress={() => setTimeFormat(format)} style={[styles.typeButton, timeFormat === format && styles.optionButtonActive]}><Text style={[styles.optionText, timeFormat === format && styles.optionTextActive]}>{format}</Text></Pressable>)}</View><ToggleRow label="Show seconds" value={showSeconds} onChange={setShowSeconds} /><ToggleRow label="Show AM / PM" value={showPeriod} onChange={setShowPeriod} /></>}
                <Text style={[styles.controlTitle, { marginTop: 15 }]}>Time zones</Text><Text style={styles.controlSub}>Set the time zone for the first clock.</Text><OptionPicker options={timeZones.map((zone) => zone.label)} value={zoneLabel(clockZone)} onSelect={(label) => setClockZone(timeZones.find((zone) => zone.label === label)?.value ?? 'local')} />
                <ToggleRow label="Show a second clock" value={showSecondClock} onChange={setShowSecondClock} />
                {showSecondClock && <><Text style={styles.controlSub}>Select a separate zone for the second clock.</Text><OptionPicker options={timeZones.map((zone) => zone.label)} value={zoneLabel(secondClockZone)} onSelect={(label) => setSecondClockZone(timeZones.find((zone) => zone.label === label)?.value ?? 'Asia/Tokyo')} /></>}
              </View>}
              <View style={styles.customCard}>
                <Text style={styles.controlTitle}>Sizing</Text><Text style={styles.controlSub}>Choose how the widget fits your home screen.</Text>
                <View style={styles.modeSwitch}>{(['Fixed', 'Adaptive'] as const).map((mode) => <Pressable key={mode} onPress={() => setLayoutMode(mode)} style={[styles.modeButton, layoutMode === mode && styles.modeButtonActive]}><Text style={[styles.modeText, layoutMode === mode && styles.modeTextActive]}>{mode}</Text></Pressable>)}</View>
                {layoutMode === 'Fixed' ? <>
                  <StepperControl label="Width" value={fixedWidth} unit=" cells" min={1} max={6} onChange={setFixedWidth} />
                  <View style={styles.divider} />
                  <StepperControl label="Height" value={fixedHeight} unit=" cells" min={1} max={6} onChange={setFixedHeight} />
                  <Pressable onPress={() => { setFixedWidth(6); setFixedHeight(6); }} style={styles.fullPageButton}><Text style={styles.fullPageText}>▦  Fill the page · 6 × 6 cells</Text></Pressable>
                </> : <Text style={styles.helperText}>Adaptive widgets use the space provided by the launcher and can be resized there.</Text>}
              </View>
              <View style={styles.customCard}>
                <Text style={styles.controlTitle}>Shape</Text><Text style={styles.controlSub}>Choose the outline for your widget.</Text>
                <View style={styles.optionGrid}>{(['Rounded', 'Circle', 'Square', 'Pill', 'Squircle', 'Cut corner', 'Diamond', 'Heart', 'Arch', 'Hexagon'] as const).map((item) => <Pressable key={item} onPress={() => setShape(item)} style={[styles.optionButton, shape === item && styles.optionButtonActive]}><View style={[styles.shapeSample, item === 'Rounded' && { borderRadius: 8 }, item === 'Circle' && { borderRadius: 20 }, item === 'Pill' && { borderRadius: 20, width: 38 }, item === 'Squircle' && { borderRadius: 13 }, item === 'Diamond' && { transform: [{ rotate: '45deg' }] }, item === 'Heart' && { borderRadius: 4 }, shape === item && { borderColor: '#8C6CFF' }]} /><Text style={[styles.optionText, shape === item && styles.optionTextActive]}>{item}</Text></Pressable>)}</View>
              </View>
              <View style={styles.customCard}>
                <Text style={styles.controlTitle}>Theme</Text><Text style={styles.controlSub}>Set the overall feel.</Text>
                <View style={styles.optionGrid}>{(['Liquid Glass', 'Solid Color', 'Gradient', 'Transparent'] as const).map((item) => <Pressable key={item} onPress={() => setTheme(item)} style={[styles.themeButton, theme === item && styles.optionButtonActive]}><View style={[styles.themeSample, item === 'Liquid Glass' && styles.glassSample, item === 'Solid Color' && { backgroundColor: colors.background }, item === 'Gradient' && styles.gradientSample, item === 'Transparent' && styles.transparentSample]} /><Text style={[styles.optionText, theme === item && styles.optionTextActive]}>{item}</Text></Pressable>)}</View>
              </View>
              {theme !== 'Liquid Glass' && <View style={styles.customCard}>
                <Text style={styles.controlTitle}>{Platform.OS === 'android' ? `Colors for ${selected.title}` : 'Colors'}</Text><Text style={styles.controlSub}>{Platform.OS === 'android' ? 'These colors apply to this widget design. Text layers stay separate.' : 'Enter any hex color. Each text layer is independent.'}</Text>
                <View style={styles.colorGrid}>{(Platform.OS === 'android' ? selectedColorLabels : colorLabels).map(({ key, label }) => <ColorControl key={key} label={label} value={colorDrafts[key]} onChange={(value) => updateColor(key, value)} onFinish={() => finishColorEdit(key)} />)}</View>
                {theme === 'Gradient' && <ColorControl label="Gradient end" value={gradientEndDraft} onChange={updateGradientEnd} onFinish={finishGradientEndEdit} />}
              </View>}
              {theme === 'Liquid Glass' && <View style={styles.glassNotice}><Text style={styles.glassNoticeIcon}>✧</Text><Text style={styles.glassNoticeText}>Liquid Glass uses its own translucent finish, so manual colors are turned off.</Text></View>}
              {selected.type !== 'Clock' && selected.type !== 'Calendar' && <View style={styles.customCard}>
                <Text style={styles.controlTitle}>Position</Text><Text style={styles.controlSub}>Move the icon and text by percentage.</Text>
                <StepperControl label="Icon · horizontal" value={positions.iconX} unit="%" min={0} max={100} step={5} onChange={(value) => setPositions((current) => ({ ...current, iconX: value }))} />
                <View style={styles.divider} />
                <StepperControl label="Icon · vertical" value={positions.iconY} unit="%" min={0} max={100} step={5} onChange={(value) => setPositions((current) => ({ ...current, iconY: value }))} />
                <View style={styles.divider} />
                <StepperControl label="Text · horizontal" value={positions.textX} unit="%" min={0} max={100} step={5} onChange={(value) => setPositions((current) => ({ ...current, textX: value }))} />
                <View style={styles.divider} />
                <StepperControl label="Text · vertical" value={positions.textY} unit="%" min={0} max={100} step={5} onChange={(value) => setPositions((current) => ({ ...current, textY: value }))} />
              </View>}
              {selected.type === 'Calendar' && <Pressable onPress={openCalendarPicker} style={styles.customCard}>
                <Text style={styles.controlTitle}>Calendar event</Text>
                <Text style={styles.controlSub}>{calendarEvent ? `${calendarEvent.title} · ${formatEventDate(calendarEvent.startDate)}` : 'Choose one event to show on this widget.'}</Text>
                <Text style={styles.calendarPickButton}>Choose event  ›</Text>
              </Pressable>}
              {selected.type === 'Health' && selected.style !== 'Sleep summary' && <View style={styles.customCard}>
                <Text style={styles.controlTitle}>Steps display</Text><Text style={styles.controlSub}>Choose how today's steps are shown.</Text>
                <OptionPicker options={['Step ring', 'Daily goal', 'Weekly bars', 'Simple count']} value={stepStyle} onSelect={(value) => { setStepStyle(value); setSelected((current) => ({ ...current, style: value })); }} />
                {(stepStyle === 'Daily goal' || selected.style === 'Daily goal') && <StepperControl label="Daily goal" value={stepGoal} unit=" steps" min={1000} max={30000} step={500} onChange={setStepGoal} />}
                <View style={styles.note}><Text style={styles.noteIcon}>⌁</Text><Text style={styles.noteText}>Reads today's step count from Health Connect. Needs the Health Connect app with step data shared from Samsung Health or another fitness app.</Text></View>
              </View>}
              {selected.type === 'Health' && selected.style === 'Sleep summary' && <View style={styles.customCard}>
                <Text style={styles.controlTitle}>Sleep summary</Text><Text style={styles.controlSub}>Shows last night's total sleep time.</Text>
                <View style={styles.note}><Text style={styles.noteIcon}>☾</Text><Text style={styles.noteText}>Reads last night's sleep from Health Connect. Needs the Health Connect app with sleep data shared from Samsung Health or another sleep tracker.</Text></View>
              </View>}
              {selected.type === 'Weather' && <View style={styles.customCard}><Text style={styles.controlTitle}>Forecast layout</Text><Text style={styles.controlSub}>Choose how much weather to show.</Text><OptionPicker options={['Current conditions', 'Hourly forecast', 'Three-day forecast']} value={selected.style} onSelect={(value) => setSelected((current) => ({ ...current, style: value, label: value === 'Hourly forecast' ? '24°  25°  23°' : value === 'Three-day forecast' ? 'Today 24° · Sat 26°' : '24°' }))} /></View>}
              {selected.type === 'Battery' && <View style={styles.customCard}><Text style={styles.controlTitle}>Battery display</Text><Text style={styles.controlSub}>Choose the battery detail to emphasize.</Text><OptionPicker options={['Ring percentage', 'Compact percentage', 'Remaining time']} value={selected.style} onSelect={(value) => setSelected((current) => ({ ...current, style: value, label: value === 'Remaining time' ? '3h 14m left' : '82%' }))} /></View>}
              {selected.type === 'Calendar' && <View style={styles.customCard}><Text style={styles.controlTitle}>Calendar layout</Text><Text style={styles.controlSub}>Show the month or focus on your selected event.</Text><OptionPicker options={['Monthly calendar', 'Next event', 'Agenda list']} value={selected.style} onSelect={(value) => setSelected((current) => ({ ...current, style: value }))} /></View>}
              {selected.type === 'Music' && <View style={styles.customCard}><Text style={styles.controlTitle}>Music layout</Text><Text style={styles.controlSub}>Set the track details yourself; Customize Studio does not read other apps or notifications.</Text><OptionPicker options={['Album artwork', 'Playback controls', 'Track and progress']} value={selected.style} onSelect={(value) => setSelected((current) => ({ ...current, style: value }))} /><TextInput value={selected.title} onChangeText={(title) => setSelected((current) => ({ ...current, title }))} placeholder="Track title" placeholderTextColor="#8A86A8" style={styles.scratchInput} /><TextInput value={selected.subtitle} onChangeText={(subtitle) => setSelected((current) => ({ ...current, subtitle }))} placeholder="Artist or album" placeholderTextColor="#8A86A8" style={styles.scratchInput} /></View>}
              {selected.type === 'Storage' && <View style={styles.customCard}><Text style={styles.controlTitle}>Storage layout</Text><Text style={styles.controlSub}>Choose which storage details are visible.</Text><OptionPicker options={['Used and free', 'Storage ring', 'Category breakdown']} value={selected.style} onSelect={(value) => setSelected((current) => ({ ...current, style: value }))} /></View>}
              {selected.type === 'Text' && <View style={styles.customCard}><Text style={styles.controlTitle}>Your text</Text><Text style={styles.controlSub}>Set a title and a short line for your widget.</Text><TextInput value={selected.title} onChangeText={(title) => setSelected((current) => ({ ...current, title }))} placeholder="Title" placeholderTextColor="#8A86A8" style={styles.scratchInput} /><TextInput value={selected.label} onChangeText={(label) => setSelected((current) => ({ ...current, label }))} placeholder="Your text" placeholderTextColor="#8A86A8" style={styles.scratchInput} /></View>}
              {selected.type !== 'Custom' && <Pressable onPress={addToHomeScreen} style={styles.addHomeButton}>
                <Text style={styles.addHomeIcon}>＋</Text>
                <View style={{ flex: 1 }}><Text style={styles.addHomeTitle}>Add to home screen</Text><Text style={styles.addHomeSub}>Your design will be ready in Widgets</Text></View>
                <Text style={styles.addHomeArrow}>↗</Text>
              </Pressable>}
              <View style={styles.note}><Text style={styles.noteIcon}>✦</Text><Text style={styles.noteText}>The launcher controls the final widget bounds after it is added.</Text></View>
        </View>}
      </Animated.ScrollView>
      <View pointerEvents="box-none" style={styles.bottomDock}>
        <View style={styles.bottomNav}>
          <Animated.View pointerEvents="none" style={[styles.navActiveCircle, { transform: [{ translateX: activePosition }] }]} />
          {(section === 'widgets' ? tabs : genericTabs).map((item) => {
            const active = section === 'widgets' ? tab === item.name : genericTab === item.name;
            return <Pressable key={item.name} onPress={() => (section === 'widgets' ? changeTab(item.name as TabName) : changeGenericTab(item.name as GenericTabName))} style={styles.navItem} android_ripple={{ color: '#2C2740', borderless: true, radius: 24 }} accessibilityRole="tab" accessibilityLabel={item.name} accessibilityState={{ selected: active }}>
              <View style={styles.navIconWrap}><Text style={[styles.navIcon, active && styles.navIconActive]}>{item.icon}</Text></View>
            </Pressable>;
          })}
        </View>
      </View>
      <Modal visible={widgetSheetVisible} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setWidgetSheetVisible(false)}>
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetScrim} onPress={() => setWidgetSheetVisible(false)} accessibilityLabel="Close widget preview" />
          <View style={styles.widgetSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}><View><Text style={styles.sheetEyebrow}>WIDGET PREVIEW</Text><Text style={styles.sheetTitle}>{previewTitle}</Text></View><Pressable onPress={() => setWidgetSheetVisible(false)} style={styles.sheetClose}><Text style={styles.sheetCloseText}>×</Text></Pressable></View>
            <View style={[styles.sheetWidgetPreview, { borderColor: theme === 'Transparent' ? 'transparent' : theme === 'Liquid Glass' ? 'rgba(255,255,255,0.48)' : colors.border, borderRadius: shapeRadius, backgroundColor: theme === 'Transparent' ? 'transparent' : theme === 'Liquid Glass' ? 'rgba(255,255,255,0.12)' : colors.background }]}>
              <WidgetSample widget={selected} large accent={theme === 'Liquid Glass' ? '#FFFFFF' : colors.value} clockMode={clockMode} analogClockStyle={analogClockStyle} digitalClockStyle={digitalClockStyle} clockHandColors={activeClockHandColors} timeFormat={timeFormat} showSeconds={showSeconds} showPeriod={showPeriod} clockZone={clockZone} secondClockZone={secondClockZone} showSecondClock={showSecondClock} now={clockNow} stepGoal={stepGoal} stepStyle={stepStyle} />
            </View>
            <View style={styles.sheetActions}>
              <Pressable onPress={() => { setWidgetSheetVisible(false); changeTab('Customize'); }} style={styles.customizeButton}><Text style={styles.customizeButtonText}>Customize</Text></Pressable>
              <Pressable onPress={addSelectedFromSheet} style={styles.addScreenButton}><Text style={styles.addScreenButtonText}>Add to screen</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={eventPickerVisible} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setEventPickerVisible(false)}>
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetScrim} onPress={() => setEventPickerVisible(false)} accessibilityLabel="Close event picker" />
          <View style={styles.eventPickerSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sectionTitle}>Choose one event</Text>
            <Text style={styles.sectionSub}>Upcoming events from your calendars.</Text>
            <ScrollView style={styles.eventList}>
              {calendarEvents.length === 0 ? <Text style={styles.helperText}>No upcoming events were found in the next 30 days.</Text> : calendarEvents.map((event) => <Pressable key={event.id} onPress={() => { setCalendarEvent(event); setSelected((current) => current.type === 'Calendar' ? { ...current, title: event.title || 'Untitled event', subtitle: formatEventDate(event.startDate), label: formatEventDate(event.startDate) } : current); setEventPickerVisible(false); }} style={styles.eventOption}>
                <View style={styles.eventOptionCopy}><Text style={styles.controlTitle}>{event.title || 'Untitled event'}</Text><Text style={styles.controlSub}>{formatEventDate(event.startDate)}</Text></View>
                {calendarEvent?.id === event.id && <Text style={styles.calendarCheck}>✓</Text>}
              </Pressable>)}
            </ScrollView>
            <Pressable onPress={() => setEventPickerVisible(false)} style={styles.closeSheetButton}><Text style={styles.closeSheetText}>Done</Text></Pressable>
          </View>
        </View>
      </Modal>
      <Modal visible={drawerOpen} transparent animationType="none" statusBarTranslucent onRequestClose={closeDrawer}>
        <View style={styles.drawerOverlay}>
          <Animated.View style={[styles.drawerScrim, { opacity: drawerPosition }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} accessibilityLabel="Close menu" />
          </Animated.View>
          <Animated.View style={[styles.drawerPanel, { transform: [{ translateX: drawerPosition.interpolate({ inputRange: [0, 1], outputRange: [-300, 0] }) }] }]}>
            <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
              <Text style={styles.drawerEyebrow}>CUSTOMIZE</Text>
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {sections.map((item) => <Pressable key={item.id} onPress={() => openSection(item.id)} style={[styles.drawerItem, section === item.id && styles.drawerItemActive]}>
                  <Text style={[styles.drawerItemIcon, section === item.id && styles.drawerItemIconActive]}>{item.icon}</Text>
                  <Text style={[styles.drawerItemLabel, section === item.id && styles.drawerItemLabelActive]}>{item.label}</Text>
                </Pressable>)}
              </ScrollView>
              <View style={styles.drawerFooter}>
                <Text style={styles.drawerFooterTitle}>Customize Studio</Text>
                <Text style={styles.drawerFooterSub}>Version {buildVersion ?? '1.0.2'}</Text>
              </View>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function StepperControl({
  label, value, unit, min, max, onChange, step = 1,
}: {
  label: string; value: number; unit: string; min: number; max: number; step?: number; onChange: (value: number) => void;
}) {
  return (
    <View style={styles.stepperRow}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <Pressable onPress={() => onChange(Math.max(min, value - step))} style={styles.stepperButton}><Text style={styles.stepperButtonText}>−</Text></Pressable>
        <Text style={styles.stepperValue}>{value}{unit}</Text>
        <Pressable onPress={() => onChange(Math.min(max, value + step))} style={styles.stepperButton}><Text style={styles.stepperButtonText}>＋</Text></Pressable>
      </View>
    </View>
  );
}

const colorPickerStyles = StyleSheet.create({
  handCard: { borderTopWidth: 1, borderTopColor: '#282339', marginTop: 16, paddingTop: 15 },
  button: { height: 40, flexDirection: 'row', alignItems: 'center', backgroundColor: '#211E30', borderRadius: 10, borderWidth: 1, borderColor: '#332E45', paddingHorizontal: 9 },
  buttonText: { color: '#E4E0F5', fontSize: 10, fontWeight: '600', flex: 1 },
  chevron: { color: '#A6A2C4', fontSize: 19, marginLeft: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 9, marginTop: 20, marginBottom: 8 },
  option: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  optionSelected: { borderColor: '#8C6CFF', borderWidth: 3 },
  check: { fontSize: 15, fontWeight: '900' },
  customToggle: { alignSelf: 'center', paddingVertical: 11, paddingHorizontal: 14 },
  customToggleText: { color: '#A6A2C4', fontSize: 10, textDecorationLine: 'underline' },
  customRow: { flexDirection: 'row', gap: 9, marginTop: 3 },
  customInput: { flex: 1, height: 42, backgroundColor: '#211E30', borderRadius: 9, borderWidth: 1, borderColor: '#332E45', paddingHorizontal: 11, color: '#E4E0F5', fontSize: 12 },
  customApply: { minWidth: 78, height: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: '#8C6CFF', borderRadius: 10 },
  customApplyDisabled: { opacity: 0.4 },
  customApplyText: { color: '#15131F', fontSize: 11, fontWeight: '800' },
});

function ColorControl({ label, value, onChange, onFinish = () => {} }: {
  label: string; value: string; onChange: (value: string) => void; onFinish?: () => void;
}) {
  const validColor = /^#[0-9A-Fa-f]{6}$/.test(value);
  const [visible, setVisible] = useState(false);
  const [customEntry, setCustomEntry] = useState(false);
  const [customHex, setCustomHex] = useState(value);
  const chooseColor = (color: string) => {
    onChange(color);
    setCustomHex(color);
    setVisible(false);
  };
  if (Platform.OS !== 'android') return (
    <View style={styles.colorControl}>
      <Text style={styles.colorLabel}>{label}</Text>
      <View style={styles.colorInputRow}>
        <View style={[styles.colorSwatch, { backgroundColor: validColor ? value : '#302B42' }]} />
        <TextInput value={value} onChangeText={onChange} onEndEditing={onFinish} autoCapitalize="characters" autoCorrect={false} maxLength={7} placeholder="#RRGGBB" placeholderTextColor="#8A86A8" selectionColor="#8C6CFF" style={styles.colorInput} />
      </View>
    </View>
  );
  return (
    <View style={styles.colorControl}>
      <Text style={styles.colorLabel}>{label}</Text>
      <Pressable onPress={() => { setCustomHex(value); setVisible(true); }} style={colorPickerStyles.button} accessibilityRole="button" accessibilityLabel={`Choose ${label} color`}>
        <View style={[styles.colorSwatch, { backgroundColor: validColor ? value : '#302B42' }]} />
        <Text style={colorPickerStyles.buttonText}>Choose color</Text>
        <Text style={colorPickerStyles.chevron}>›</Text>
      </Pressable>
      <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setVisible(false)}>
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetScrim} onPress={() => setVisible(false)} accessibilityLabel="Close color picker" />
          <View style={styles.widgetSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetEyebrow}>WIDGET COLORS</Text>
            <Text style={styles.sheetTitle}>Choose {label.toLowerCase()}</Text>
            <Text style={styles.controlSub}>Pick a swatch to preview it on your widget.</Text>
            <View style={colorPickerStyles.grid}>{colorPalette.map((color) => (
              <Pressable key={color} onPress={() => chooseColor(color)} style={[colorPickerStyles.option, { backgroundColor: color }, value.toUpperCase() === color && colorPickerStyles.optionSelected]} accessibilityRole="button" accessibilityLabel={`Select ${color}`}>
                {value.toUpperCase() === color && <Text style={[colorPickerStyles.check, { color: ['#FFFFFF', '#D9D9D9', '#FFABAB', '#FFD3B6', '#FFE8A3', '#ECF5A0', '#B9E5C4', '#A7E8E8', '#B6DCFA', '#C6C5FA', '#E4C3FA', '#FAB8D0'].includes(color) ? '#15131F' : '#FFFFFF' }]}>✓</Text>}
              </Pressable>
            ))}</View>
            <Pressable onPress={() => setCustomEntry((current) => !current)} style={colorPickerStyles.customToggle}><Text style={colorPickerStyles.customToggleText}>{customEntry ? 'Hide custom color' : 'Enter a custom color'}</Text></Pressable>
            {customEntry && <View style={colorPickerStyles.customRow}>
              <TextInput value={customHex} onChangeText={setCustomHex} autoCapitalize="characters" autoCorrect={false} maxLength={7} placeholder="#RRGGBB" placeholderTextColor="#8A86A8" selectionColor="#8C6CFF" style={colorPickerStyles.customInput} />
              <Pressable disabled={!/^#[0-9A-Fa-f]{6}$/.test(customHex)} onPress={() => chooseColor(customHex.toUpperCase())} style={[colorPickerStyles.customApply, !/^#[0-9A-Fa-f]{6}$/.test(customHex) && colorPickerStyles.customApplyDisabled]}><Text style={colorPickerStyles.customApplyText}>Apply</Text></Pressable>
            </View>}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function OptionPicker({ options, value, onSelect }: { options: string[]; value: string; onSelect: (value: string) => void }) {
  return <View style={styles.optionGrid}>{options.map((option) => <Pressable key={option} onPress={() => onSelect(option)} style={[styles.typeButton, value === option && styles.optionButtonActive]}><Text style={[styles.optionText, value === option && styles.optionTextActive]}>{option}</Text></Pressable>)}</View>;
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return <Pressable onPress={() => onChange(!value)} style={styles.toggleRow}><Text style={styles.stepperLabel}>{label}</Text><View style={[styles.toggleTrack, value && styles.toggleTrackActive]}><View style={[styles.toggleThumb, value && styles.toggleThumbActive]} /></View></Pressable>;
}

function DraggableOverlay({
  pos, onChange, containerWidth, containerHeight, children,
}: { pos: { x: number; y: number }; onChange: (pos: { x: number; y: number }) => void; containerWidth: number; containerHeight: number; children: React.ReactNode }) {
  const posRef = useRef(pos);
  posRef.current = pos;
  const sizeRef = useRef({ width: containerWidth, height: containerHeight });
  sizeRef.current = { width: containerWidth, height: containerHeight };
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const start = useRef(pos);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { start.current = posRef.current; },
      onPanResponderMove: (_event, gesture) => {
        const { width, height } = sizeRef.current;
        if (!width || !height) return;
        onChangeRef.current({
          x: Math.min(1, Math.max(0, start.current.x + gesture.dx / width)),
          y: Math.min(1, Math.max(0, start.current.y + gesture.dy / height)),
        });
      },
    }),
  ).current;
  return (
    <View
      {...panResponder.panHandlers}
      style={[styles.depthDragHandle, { left: pos.x * containerWidth - 80, top: pos.y * containerHeight - 16 }]}
    >
      {children}
    </View>
  );
}

function AnalogClockSample({ style, large, tint, date, zone, handColors = defaultClockHandColors }: { style: string; large: boolean; tint: string; date: Date; zone: string; handColors?: ClockHandColors }) {
  const size = large ? 144 : 78;
  const center = size / 2;
  const radius = size * 0.39;
  const hourAngle = (date.getHours() % 12) * 30 + date.getMinutes() * 0.5 + date.getSeconds() / 120;
  const minuteAngle = date.getMinutes() * 6 + date.getSeconds() * 0.1;
  const secondAngle = date.getSeconds() * 6 + date.getMilliseconds() * 0.006;
  const count = ['Minimal ticks', 'Railway markers', 'Pilot Type B', 'Chronograph'].includes(style) ? 60 : style === 'Skeleton' || style === 'Full numerals' || style === '24-hour numerals' || style === 'Pilot Type A' ? 0 : style === 'Sector dial' ? 4 : 12;
  const numeralItems = style === 'Full numerals' || style === 'Pilot Type A'
    ? Array.from({ length: 12 }, (_, index) => ({ label: String(index + 1), hour: (index + 1) % 12, full: true }))
    : style === '24-hour numerals' ? ['00', '06', '12', '18'].map((label, index) => ({ label, hour: index * 6, full: true }))
      : style === 'Pilot Type B' ? Array.from({ length: 12 }, (_, index) => ({ label: String((index + 1) * 5).padStart(2, '0'), hour: (index + 1) % 12, full: true }))
        : style === 'California dial' ? ['XII', 'II', 'III', 'IV', 'V', '6', '7', '8', 'IX', 'X', 'XI', '12'].map((label, index) => ({ label, hour: index, full: true }))
          : style === 'Roman numerals' ? ['XII', 'III', 'VI', 'IX'].map((label, index) => ({ label, hour: index * 3, full: false }))
            : ['12', '3', '6', '9'].map((label, index) => ({ label, hour: index * 3, full: false }));
  return <View style={styles.analogWrap}><View style={[styles.clockFace, { width: size, height: size, borderRadius: ['Full numerals', 'Roman numerals', 'Railway markers', '24-hour numerals', 'Sector dial', 'Bauhaus'].includes(style) ? size / 2 : large ? 22 : 13 }]}>
    {Array.from({ length: count }, (_, index) => {
      const angle = (index * 360 / count) * Math.PI / 180;
      const dot = style === 'Dot markers' || style === 'Heart markers';
      const majorMark = style === 'Railway markers' ? index % 5 === 0 : style === 'Sector dial' || style === 'Bauhaus' ? true : index % 5 === 0;
      const markerStyle = { left: center + Math.sin(angle) * radius - (style === 'Heart markers' ? 4 : 2), top: center - Math.cos(angle) * radius - (style === 'Heart markers' ? 4 : 2), opacity: style === 'Minimal ticks' ? 0.62 : 0.9, transform: [{ rotate: `${index * 360 / count}deg` }] } as const;
      return style === 'Heart markers'
        ? <Text key={index} style={[styles.clockTick, markerStyle, { color: '#F2EEFC', fontSize: large ? 9 : 7 }]}>♥</Text>
        : <View key={index} style={[styles.clockTick, markerStyle, { width: dot ? 4 : majorMark ? 2 : 1, height: dot ? 4 : majorMark ? (style === 'Railway markers' ? 10 : 9) : 4, backgroundColor: style === 'Sector dial' ? '#F2EEFC' : tint }]} />;
    })}
    {numeralItems.map(({ label, hour, full }, index) => {
      const sizeOffset = ['Roman numerals', 'California dial'].includes(style) ? 9 : 5;
      const radiusFactor = style === 'Pilot Type B' ? 0.4 : style === '24-hour numerals' ? 0.34 : 0.35;
      const position = full
        ? { left: center + Math.sin(hour * Math.PI / 6) * size * radiusFactor - sizeOffset, top: center - Math.cos(hour * Math.PI / 6) * size * radiusFactor - 7 }
        : index === 0 ? { top: 4 } : index === 1 ? { right: 4 } : index === 2 ? { bottom: 4 } : { left: 4 };
      const show = style !== 'Minimal ticks' && style !== 'Dot markers' && style !== 'Heart markers' && style !== 'Skeleton';
      return show ? <Text key={`${label}-${hour}`} style={[styles.clockNumber, position, { fontSize: style === 'Full numerals' || style === '24-hour numerals' || style === 'Pilot Type A' || style === 'Pilot Type B' || style === 'California dial' ? large ? 10 : 6 : style === 'Roman numerals' ? large ? 13 : 8 : large ? 15 : 9, fontWeight: ['Bauhaus', 'Railway markers', 'Pilot Type A', 'Pilot Type B', 'Chronograph'].includes(style) ? '900' : '700' }]}>{label}</Text> : null;
    })}
    {['California dial', 'Pilot Type A'].includes(style) && <Text style={{ position: 'absolute', top: large ? 17 : 10, left: center - 4, color: '#8C6CFF', fontSize: large ? 9 : 6 }}>▲</Text>}
    {['Regulator', 'Chronograph'].includes(style) && [center * 0.28, center * 1.72].map((top, index) => <View key={index} style={{ position: 'absolute', width: size * 0.19, height: size * 0.19, borderRadius: size, borderWidth: 1, borderColor: style === 'Chronograph' ? '#E8914D' : tint, left: center - size * 0.095, top: top - size * 0.095 }} />)}
    {style === 'Regulator' && <View style={[styles.clockHandPivot, { left: center, top: center * 0.28, transform: [{ rotate: `${hourAngle}deg` }] }]}><View style={[styles.clockHand, { width: 2, height: size * 0.11, left: -1, top: -size * 0.11, backgroundColor: handColors.hour }]} /></View>}
    {style !== 'Regulator' && <View style={[styles.clockHandPivot, { left: center, top: center, transform: [{ rotate: `${hourAngle}deg` }] }]}><View style={[styles.clockHand, { width: large ? 3 : 2, height: size * 0.24, left: -1, top: -size * 0.24, backgroundColor: handColors.hour }]} /></View>}
    <View style={[styles.clockHandPivot, { left: center, top: center, transform: [{ rotate: `${minuteAngle}deg` }] }]}><View style={[styles.clockHand, { width: large ? 2 : 1.5, height: size * 0.34, left: -1, top: -size * 0.34, backgroundColor: handColors.minute }]} /></View>
    {style === 'Regulator' ? <View style={[styles.clockHandPivot, { left: center, top: center * 1.72, transform: [{ rotate: `${secondAngle}deg` }] }]}><View style={[styles.clockHand, { width: 1, height: size * 0.08, left: -0.5, top: -size * 0.08, backgroundColor: handColors.second }]} /></View>
      : <View style={[styles.clockHandPivot, { left: center, top: center, transform: [{ rotate: `${secondAngle}deg` }] }]}><View style={[styles.clockHand, { width: 1, height: size * 0.37, left: -0.5, top: -size * 0.37, backgroundColor: handColors.second }]} /></View>}
    <View style={[styles.clockPin, { width: large ? 7 : 5, height: large ? 7 : 5, backgroundColor: tint }]} />
  </View><Text style={[styles.digitalDate, { fontSize: large ? 8 : 6 }]}>{zoneLabel(zone)}</Text></View>;
}

function DigitalClockSample({ widget, large, tint, time, zone, handColors = defaultClockHandColors }: { widget: Widget; large: boolean; tint: string; time: string; zone: string; handColors?: ClockHandColors }) {
  const timeParts = time.match(/^(\d{1,2})(:)(\d{2})(?::(\d{2}))?(.*)$/);
  const formattedTime = Platform.OS !== 'android' ? time : timeParts ? <>
    <Text style={{ color: handColors.hour }}>{timeParts[1]}</Text><Text style={{ color: handColors.separator }}>{timeParts[2]}</Text><Text style={{ color: handColors.minute }}>{timeParts[3]}</Text>
    {timeParts[4] && <><Text style={{ color: handColors.separator }}>:</Text><Text style={{ color: handColors.second }}>{timeParts[4]}</Text></>}
    {!!timeParts[5] && <Text style={{ color: tint }}>{timeParts[5]}</Text>}
  </> : time;
  const framed = widget.style === 'Flip style' || widget.style === 'Split-flap';
  const displayColor = widget.style === 'Matrix' ? '#63FF9A' : widget.style === 'Railway display' ? '#F2EEFC' : tint;
  return <View style={[styles.digitalFace, large && styles.digitalFaceLarge, framed && styles.flipClockFace, widget.style === 'Soft glow' && { backgroundColor: `${tint}18` }, widget.style === 'LED segments' && { backgroundColor: '#101A13', borderColor: '#356D45', borderWidth: 1, borderRadius: 8, padding: 7 }, widget.style === 'Matrix' && { backgroundColor: '#07150F', borderColor: '#2A6545', borderWidth: 1, borderRadius: 8, padding: 7 }, widget.style === 'Railway display' && { backgroundColor: '#18221F', borderColor: '#D14545', borderWidth: 1, borderRadius: 6, padding: 7 }]}>
    <Text style={[styles.digitalTime, large && styles.digitalTimeLarge, widget.style === 'Bold display' && { fontSize: large ? 46 : 18, fontWeight: '900' }, widget.style === 'Compact' && { fontSize: large ? 24 : 12 }, widget.style === 'Large display' && { fontSize: large ? 52 : 23, letterSpacing: -1 }, widget.style === 'LED segments' && { fontFamily: 'monospace', letterSpacing: 1 }, widget.style === 'Matrix' && { fontFamily: 'monospace', letterSpacing: 1, fontSize: large ? 31 : 17 }, { color: displayColor }]}>{formattedTime}</Text>
    <Text style={[styles.digitalDate, { fontSize: large ? 8 : 6 }]}>{zoneLabel(zone)}</Text>
    {widget.style === 'Stacked date' && <Text style={[styles.digitalDate, { color: '#F2EEFC' }]}>TODAY</Text>}
  </View>;
}

function WidgetSample({ widget, large = false, accent, clockMode = 'Analog', analogClockStyle, digitalClockStyle, clockHandColors = defaultClockHandColors, timeFormat = '12-hour', showSeconds = true, showPeriod = true, stepGoal = 10000, stepStyle = 'Step ring', clockZone = 'local', secondClockZone = 'Asia/Tokyo', showSecondClock = false, now = Date.now() }: {
  widget: Widget; large?: boolean; accent?: string; clockMode?: string; analogClockStyle?: string; digitalClockStyle?: string; clockHandColors?: ClockHandColors; timeFormat?: string; showSeconds?: boolean; showPeriod?: boolean; stepGoal?: number; stepStyle?: string; clockZone?: string; secondClockZone?: string; showSecondClock?: boolean; now?: number;
}) {
  const tint = accent ?? widget.accent;
  const analogStyle = analogClockStyle ?? (widget.id.startsWith('clock-analog') ? widget.style : analogFaces[0]);
  const digitalStyle = digitalClockStyle ?? (widget.id.startsWith('clock-digital') ? widget.style : digitalFaces[0]);
  const isAnalog = clockMode !== 'Digital';
  const isDigital = clockMode !== 'Analog';
  const primaryTime = formatClockTime(now, clockZone, timeFormat, showSeconds, showPeriod);
  const secondaryTime = formatClockTime(now, secondClockZone, timeFormat, showSeconds, showPeriod);
  const pair = showSecondClock;
  if (widget.type === 'Clock' && (isAnalog || isDigital)) return <View style={[styles.sampleContent, large && styles.sampleLarge]}>
    <View style={[styles.clockPairRow, pair && { gap: large ? 10 : 4 }]}>
      {isAnalog && <AnalogClockSample style={analogStyle} large={large && !pair} tint={tint} date={getZonedDate(now, clockZone)} zone={clockZone} handColors={clockHandColors} />}
      {isDigital && <DigitalClockSample widget={{ ...widget, style: digitalStyle }} large={large && !pair} tint={tint} time={primaryTime} zone={clockZone} handColors={clockHandColors} />}
      {pair && isAnalog && <AnalogClockSample style={analogStyle} large={false} tint={tint} date={getZonedDate(now, secondClockZone)} zone={secondClockZone} handColors={clockHandColors} />}
      {pair && isDigital && <DigitalClockSample widget={{ ...widget, style: digitalStyle }} large={false} tint={tint} time={secondaryTime} zone={secondClockZone} handColors={clockHandColors} />}
    </View>
    {pair && <Text style={styles.digitalDate}>{zoneLabel(clockZone)}   ·   {zoneLabel(secondClockZone)}</Text>}
  </View>;
  if ((widget.id.includes('steps') || (widget.id === 'custom' && widget.type === 'Health' && widget.style.startsWith('Step'))) && widget.style !== 'Sleep summary') return <View style={styles.sampleContent}>
    {stepStyle === 'Weekly bars' || widget.style === 'Weekly bars' ? <View style={styles.stepsBars}>{[38, 66, 48, 83, 58, 92, 74].map((height, index) => <View key={index} style={[styles.stepsBar, { height, backgroundColor: index > 4 ? tint : `${tint}88` }]} />)}</View> : <>
      <Text style={[styles.stepsValue, large && { fontSize: 34 }, (stepStyle === 'Simple count' || widget.style === 'Simple count') && { fontSize: large ? 38 : 26 }, { color: tint }]}>8,420</Text><Text style={styles.digitalDate}>{stepStyle === 'Daily goal' || widget.style === 'Daily goal' ? `of ${stepGoal.toLocaleString()} steps` : 'steps today'}</Text>
      <View style={styles.stepsTrack}><View style={[styles.stepsFill, { width: `${Math.min(100, 8420 / stepGoal * 100)}%`, backgroundColor: tint }]} /></View><Text style={styles.digitalDate}>{Math.round(Math.min(100, 8420 / stepGoal * 100))}% of daily goal</Text>
    </>}
  </View>;
  if (widget.type === 'Calendar') {
    const month = new Date();
    return <View style={[styles.sampleContent, styles.calendarFace]}>
      <Text style={[styles.calendarMonth, { color: tint }]}>{month.toLocaleDateString([], { month: 'long', year: 'numeric' })}</Text>
      <Text style={[styles.calendarWeekdays, { fontFamily: 'monospace' }]}>Su Mo Tu We Th Fr Sa</Text>
      {buildCalendarRows(month).map((row, index) => <Text key={index} style={[styles.calendarDays, { fontFamily: 'monospace' }]}>{row}</Text>)}
      <Text numberOfLines={1} style={[styles.calendarEvent, { color: tint }]}>{widget.title}</Text>
      <Text numberOfLines={1} style={styles.digitalDate}>{widget.subtitle}</Text>
    </View>;
  }
  return <View style={styles.sampleContent}>
    <Text style={[styles.sampleIcon, large && { fontSize: 34 }, { color: tint }]}>{widget.icon}</Text>
    <Text style={[styles.sampleValue, large && { fontSize: 28 }, { color: tint }]}>{widget.type === 'Clock' ? primaryTime : widget.label}</Text>
    {widget.type === 'Weather' && <Text style={styles.digitalDate}>Sunny · High 27° · Low 18°</Text>}
    {widget.type === 'Battery' && <View style={styles.stepsTrack}><View style={[styles.stepsFill, { width: '82%', backgroundColor: tint }]} /></View>}
    {widget.type === 'Storage' && <View style={styles.stepsTrack}><View style={[styles.stepsFill, { width: '76%', backgroundColor: tint }]} /></View>}
    {widget.type === 'Calendar' && <Text style={styles.digitalDate}>TODAY · 10:30 AM</Text>}
    {widget.type === 'Music' && <Text style={styles.digitalDate}>ARTIST · ALBUM</Text>}
    {widget.type === 'Health' && widget.style === 'Sleep summary' && <Text style={styles.digitalDate}>Deep 2h 10m · REM 1h 34m</Text>}
    <Text style={styles.digitalDate}>{widget.type === 'Health' && widget.style === 'Sleep summary' ? 'Last night' : widget.type}</Text>
  </View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0E0C16' }, topbar: { height: 70, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#221E33' },
  hamburger: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 9 }, hamburgerText: { color: '#F2EEFC', fontSize: 20 },
  drawerOverlay: { flex: 1, flexDirection: 'row' }, drawerScrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.58)' },
  drawerPanel: { width: 280, height: '100%', backgroundColor: '#15131F', borderRightWidth: 1, borderRightColor: '#282339', paddingHorizontal: 16, paddingTop: 10 },
  drawerEyebrow: { color: '#9D99BE', letterSpacing: 2, fontWeight: '700', fontSize: 10, marginTop: 10, marginBottom: 6, marginLeft: 6 },
  drawerItem: { flexDirection: 'row', alignItems: 'center', minHeight: 50, borderRadius: 12, paddingHorizontal: 10, gap: 12 },
  drawerItemActive: { backgroundColor: '#231F33' },
  drawerItemIcon: { color: '#8884A8', fontSize: 17, width: 24, textAlign: 'center' }, drawerItemIconActive: { color: '#8C6CFF' },
  drawerItemLabel: { color: '#A6A2C4', fontSize: 13, fontWeight: '600', flex: 1 }, drawerItemLabelActive: { color: '#F2EEFC' },
  drawerFooter: { borderTopWidth: 1, borderTopColor: '#282339', paddingVertical: 16, paddingHorizontal: 6 },
  drawerFooterTitle: { color: '#F2EEFC', fontSize: 12, fontWeight: '700' }, drawerFooterSub: { color: '#8A86A8', fontSize: 10, marginTop: 3 },
  brandMark: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#8C6CFF', alignItems: 'center', justifyContent: 'center' }, brandMarkText: { fontSize: 22, fontWeight: '800', color: '#0E0C16', letterSpacing: -2 }, brandCopy: { marginLeft: 11, flex: 1 }, brand: { color: '#F4F1E8', fontSize: 11, letterSpacing: 2.1, fontWeight: '800' }, brandSub: { color: '#81809F', fontSize: 11, marginTop: 3 }, avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#272238', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#35304A' }, avatarText: { color: '#8C6CFF', fontWeight: '700' },
  content: { paddingHorizontal: 22, paddingBottom: 112 }, headingRow: { marginTop: 26, marginBottom: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, eyebrow: { color: '#9D99BE', letterSpacing: 2, fontWeight: '700', fontSize: 9 }, heading: { color: '#F2EEFC', fontSize: 37, lineHeight: 40, fontWeight: '700', letterSpacing: -1.6, marginTop: 8 }, sparkle: { width: 55, height: 55, borderRadius: 20, borderWidth: 1, borderColor: '#353048', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '8deg' }] },
  previewShell: { backgroundColor: '#1C1A28', borderRadius: 23, padding: 14, borderWidth: 1, borderColor: '#282339' }, previewTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingHorizontal: 3 }, previewEyebrow: { color: '#A29ECB', fontSize: 9, letterSpacing: 1.7, fontWeight: '700', flex: 1 }, liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#8C6CFF', marginRight: 5 }, liveText: { color: '#8C6CFF', fontSize: 8, letterSpacing: 1.3, fontWeight: '800' }, widgetPreview: { overflow: 'hidden', position: 'relative', borderWidth: 1, padding: 0, justifyContent: 'flex-start' }, previewBackground: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }, previewIconPosition: { position: 'absolute' }, previewTextPosition: { position: 'absolute', width: '78%' }, miniIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, previewType: { color: '#8D89AD', fontSize: 8, letterSpacing: 1.4, marginLeft: 9, flex: 1, fontWeight: '700' }, more: { color: '#8884A8', letterSpacing: 2, fontSize: 12 }, previewValue: { fontSize: 36, fontWeight: '600', letterSpacing: -1.3, marginTop: 7 }, previewBottom: {}, previewTitle: { color: '#F2EEFC', fontSize: 13, fontWeight: '700' }, previewSubtitle: { color: '#8E8AAE', fontSize: 10, marginTop: 3 }, calendarFace: { paddingHorizontal: 17, paddingVertical: 9 }, calendarMonth: { fontSize: 16, fontWeight: '800', marginBottom: 5 }, calendarWeekdays: { fontSize: 8, letterSpacing: 0.1, fontWeight: '700' }, calendarDays: { fontSize: 9, lineHeight: 12, fontVariant: ['tabular-nums'] }, calendarEvent: { fontSize: 8, marginTop: 2 }, previewFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12 }, previewHint: { color: '#81809F', fontSize: 9, flex: 1 }, saveButton: { backgroundColor: '#8C6CFF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, marginLeft: 8 }, saveButtonDone: { backgroundColor: '#8C6CFF' }, saveButtonText: { color: '#15131F', fontWeight: '800', fontSize: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 27, marginBottom: 13 }, sectionTitle: { color: '#F2EEFC', fontSize: 17, fontWeight: '700', letterSpacing: -0.35 }, sectionSub: { color: '#8B87AB', fontSize: 11, marginTop: 4 }, count: { color: '#7A7C9A', fontSize: 8, letterSpacing: 1.4, fontWeight: '700', marginBottom: 2 }, chips: { paddingTop: 12, paddingBottom: 13, gap: 7 }, chip: { borderRadius: 20, paddingHorizontal: 13, paddingVertical: 8, borderWidth: 1, borderColor: '#2C2740', backgroundColor: '#1C1A28' }, chipActive: { backgroundColor: '#8C6CFF', borderColor: '#8C6CFF' }, chipText: { color: '#ACA5CD', fontSize: 10, fontWeight: '600' }, chipTextActive: { color: '#17142A', fontWeight: '800' }, grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 11 }, templateCard: { borderRadius: 17, backgroundColor: '#1C1A28', padding: 8, borderWidth: 1, borderColor: '#2A2538' }, templateSelected: { borderColor: '#8C6CFF', backgroundColor: '#1C1830' }, templateArt: { height: 105, borderRadius: 11, overflow: 'hidden', padding: 10, justifyContent: 'space-between' }, artOrb: { position: 'absolute', width: 100, height: 100, borderRadius: 50, opacity: 0.1, top: -30, right: -20 }, artSymbol: { fontSize: 21, position: 'absolute', top: 9, right: 11 }, artLabel: { fontWeight: '700', fontSize: 22, letterSpacing: -0.7, marginTop: 21 }, artTime: { color: '#A29ECB', fontSize: 8, letterSpacing: 1.1 }, artLine: { position: 'absolute', height: 2, width: 25, backgroundColor: '#F2EEFC', opacity: 0.35, bottom: 15, right: 12, borderRadius: 2 }, templateInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 3, paddingTop: 9, paddingBottom: 2 }, templateTitle: { color: '#ECE8FA', fontSize: 11, fontWeight: '700' }, templateType: { color: '#8884A8', fontSize: 9, marginTop: 3 }, selectDot: { width: 17, height: 17, borderRadius: 9, borderWidth: 1, borderColor: '#504B6A', alignItems: 'center', justifyContent: 'center' }, check: { fontSize: 10, color: '#15131F', fontWeight: '900' }, editIcon: { color: '#8C6CFF', fontSize: 20, marginBottom: -1 },
  customCard: { backgroundColor: '#1C1A28', borderRadius: 17, borderWidth: 1, borderColor: '#2A2538', paddingHorizontal: 15, paddingVertical: 16, marginTop: 16 }, customRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, controlTitle: { color: '#ECE8FA', fontSize: 12, fontWeight: '700' }, controlSub: { color: '#8A86A8', fontSize: 9, marginTop: 4 }, palette: { flexDirection: 'row', gap: 7 }, swatch: { width: 23, height: 23, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, swatchSelected: { borderColor: '#F5F3E9', borderWidth: 2 }, swatchCheck: { color: '#15131F', fontSize: 10, fontWeight: '900' }, divider: { height: 1, backgroundColor: '#282339', marginVertical: 2 }, sizeGroup: { flexDirection: 'row', gap: 5, padding: 4, borderRadius: 10, backgroundColor: '#231F33' }, sizeOption: { width: 27, height: 27, borderRadius: 7, alignItems: 'center', justifyContent: 'center' }, sizeOptionActive: { backgroundColor: '#8C6CFF' }, sizeText: { color: '#958EB6', fontSize: 11, fontWeight: '700' }, sizeTextActive: { color: '#15131F' }, note: { flexDirection: 'row', marginTop: 17, marginBottom: 10, alignItems: 'center', paddingHorizontal: 4 }, noteIcon: { color: '#8C6CFF', fontSize: 14, marginRight: 8 }, noteText: { color: '#80809E', fontSize: 10, lineHeight: 15, flex: 1 },
  modeSwitch: { flexDirection: 'row', backgroundColor: '#231F33', borderRadius: 12, padding: 4, marginTop: 14, marginBottom: 5 }, modeButton: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 9 }, modeButtonActive: { backgroundColor: '#8C6CFF' }, modeText: { color: '#968FB7', fontSize: 11, fontWeight: '700' }, modeTextActive: { color: '#15131F' }, helperText: { color: '#938FB3', fontSize: 10, lineHeight: 15, marginTop: 12 }, fullPageButton: { minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#3D3952', marginTop: 9 }, fullPageText: { color: '#8C6CFF', fontSize: 10, fontWeight: '700' }, optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 13 }, optionButton: { flexGrow: 1, minWidth: '21%', minHeight: 64, borderRadius: 12, borderWidth: 1, borderColor: '#302B42', backgroundColor: '#1A1726', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }, themeButton: { flexGrow: 1, minWidth: '29%', minHeight: 76, borderRadius: 12, borderWidth: 1, borderColor: '#302B42', backgroundColor: '#1A1726', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7, gap: 6 }, optionButtonActive: { borderColor: '#8C6CFF', backgroundColor: '#252037' }, optionText: { color: '#A09BC1', fontSize: 9, fontWeight: '600' }, optionTextActive: { color: '#F0F0E8' }, shapeSample: { width: 27, height: 27, borderRadius: 5, borderWidth: 1, borderColor: '#81809F', marginBottom: 5 }, themeSample: { width: 36, height: 23, borderRadius: 7, backgroundColor: '#2F2A42', borderWidth: 1, borderColor: '#514C6B' }, glassSample: { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.55)' }, gradientSample: { backgroundColor: '#66778D', borderColor: '#66778D' }, transparentSample: { backgroundColor: 'transparent', borderStyle: 'dashed', borderColor: '#B1AAD2' }, colorGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12, marginTop: 16 }, colorControl: { width: '48%', marginBottom: 2 }, colorLabel: { color: '#B5AED6', fontSize: 9, fontWeight: '600', marginBottom: 6 }, colorInputRow: { height: 38, flexDirection: 'row', alignItems: 'center', backgroundColor: '#211E30', borderRadius: 9, borderWidth: 1, borderColor: '#332E45', paddingHorizontal: 7 }, colorSwatch: { width: 17, height: 17, borderRadius: 5, marginRight: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)' }, colorInput: { flex: 1, color: '#E4E0F5', fontSize: 10, paddingVertical: 0 }, glassNotice: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1726', borderRadius: 14, padding: 14, marginTop: 16, borderWidth: 1, borderColor: '#37334D' }, glassNoticeIcon: { color: '#E7F2FF', fontSize: 18, marginRight: 10 }, glassNoticeText: { flex: 1, color: '#AEB6BF', fontSize: 10, lineHeight: 15 }, stepperRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, stepperLabel: { color: '#D5CDEE', fontSize: 11, fontWeight: '600' }, stepperControls: { minWidth: 126, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#231F33', borderRadius: 10, padding: 4 }, stepperButton: { width: 31, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2C2740' }, stepperButtonText: { color: '#8C6CFF', fontSize: 15, fontWeight: '700' }, stepperValue: { color: '#EFEBFB', minWidth: 48, textAlign: 'center', fontSize: 10, fontWeight: '700' },
  emptyState: { minHeight: 145, borderRadius: 17, backgroundColor: '#1C1A28', borderWidth: 1, borderColor: '#2A2538', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }, emptyIcon: { color: '#8C6CFF', fontSize: 25 }, emptyTitle: { color: '#ECE8FA', fontSize: 13, fontWeight: '700', marginTop: 9 }, emptySub: { color: '#8A86A8', fontSize: 10, marginTop: 5 },
  addHomeButton: { minHeight: 66, borderRadius: 15, backgroundColor: '#8C6CFF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginTop: 12 }, addHomeIcon: { fontSize: 23, color: '#15131F', fontWeight: '600', marginRight: 12 }, addHomeTitle: { color: '#15131F', fontSize: 12, fontWeight: '800' }, addHomeSub: { color: '#332C52', fontSize: 9, marginTop: 3 }, addHomeArrow: { color: '#15131F', fontSize: 18, fontWeight: '700' },
  settingsCard: { backgroundColor: '#1C1A28', borderRadius: 20, borderWidth: 1, borderColor: '#2A2538', paddingHorizontal: 16, marginTop: 4 }, settingsIntro: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18 }, settingsIntroIcon: { color: '#8C6CFF', fontSize: 24, marginRight: 13 }, settingsRow: { minHeight: 65, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, settingsValue: { color: '#8C6CFF', fontSize: 15, fontWeight: '700', marginRight: 4 }, settingsChevron: { color: '#81809F', fontSize: 23, marginRight: 4 },
  wallpaperSwatchWrap: { width: '30%', alignItems: 'center' }, wallpaperSwatch: { width: '100%', aspectRatio: 0.72, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#332E45' }, wallpaperSwatchCheck: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' }, wallpaperSwatchLabel: { color: '#A6A2C4', fontSize: 9, marginTop: 6, textAlign: 'center' }, wallpaperPreviewImage: { width: '100%', height: 220, borderRadius: 16, marginTop: 12, backgroundColor: '#231F33' },
  wallpaperDepthPreview: { width: '100%', height: 220, borderRadius: 16, marginTop: 12, backgroundColor: '#0E0C16', overflow: 'hidden', position: 'relative' }, wallpaperDepthLayer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, width: '100%', height: '100%' }, depthDragHandle: { position: 'absolute', width: 160, alignItems: 'center' }, wallpaperDepthClock: { color: '#F2EEFC', fontWeight: '700' }, wallpaperDepthDate: { color: '#F2EEFC', fontWeight: '600', marginTop: 2 },
  bottomDock: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', backgroundColor: 'transparent' }, bottomNav: { alignSelf: 'center', width: 202, height: 62, borderRadius: 31, borderWidth: 1, borderColor: '#332E45', backgroundColor: '#1C1A28', flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', marginTop: 8, marginBottom: 18, paddingHorizontal: 8, shadowColor: '#000000', shadowOpacity: 0.28, shadowRadius: 18, shadowOffset: { width: 0, height: 7 }, elevation: 9 }, navActiveCircle: { position: 'absolute', left: 19, top: 8, width: 44, height: 44, borderRadius: 22, backgroundColor: '#8C6CFF' }, navItem: { width: 54, height: 50, borderRadius: 27, alignItems: 'center', justifyContent: 'center' }, navIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, navIcon: { color: '#8E8AAE', fontSize: 20, fontWeight: '600' }, navIconActive: { color: '#15131F' },
  sheetOverlay: { flex: 1, justifyContent: 'flex-end' }, sheetScrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.58)' }, widgetSheet: { backgroundColor: '#1C1A28', borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, borderColor: '#302B42', paddingHorizontal: 22, paddingTop: 10, paddingBottom: 30 }, sheetHandle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: '#514C6B', marginBottom: 18 }, sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }, sheetEyebrow: { color: '#9D99BE', fontSize: 9, letterSpacing: 1.6, fontWeight: '700' }, sheetTitle: { color: '#F2EEFC', fontSize: 20, fontWeight: '700', marginTop: 4 }, sheetClose: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2A2538' }, sheetCloseText: { color: '#C4BDDF', fontSize: 22, lineHeight: 24 }, sheetWidgetPreview: { minHeight: 184, borderRadius: 18, borderWidth: 1, overflow: 'hidden', backgroundColor: '#231F33', padding: 16, justifyContent: 'space-between' }, sheetGlow: { position: 'absolute', width: 150, height: 150, borderRadius: 75, opacity: 0.08, right: -30, top: 15 }, sheetPreviewMeta: { flexDirection: 'row', alignItems: 'center' }, sheetValue: { fontSize: 38, fontWeight: '700', letterSpacing: -1.2 }, sheetSubtitle: { color: '#ADA6CE', fontSize: 11, marginTop: -8 }, sheetCalendarFace: { flex: 1, justifyContent: 'space-evenly' }, sheetCalendarDays: { fontSize: 9, lineHeight: 11, fontVariant: ['tabular-nums'] }, sheetCalendarEvent: { fontSize: 8, marginTop: 1 }, sheetActions: { flexDirection: 'row', gap: 10, marginTop: 16 }, customizeButton: { flex: 1, minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: '#504B6A', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' }, customizeButtonText: { color: '#E8E6DE', fontSize: 12, fontWeight: '700' }, addScreenButton: { flex: 1.25, minHeight: 52, borderRadius: 14, backgroundColor: '#8C6CFF', alignItems: 'center', justifyContent: 'center' }, addScreenButtonText: { color: '#15131F', fontSize: 12, fontWeight: '800' },
  eventPickerSheet: { backgroundColor: '#1C1A28', borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, borderColor: '#302B42', paddingHorizontal: 22, paddingTop: 10, paddingBottom: 22, maxHeight: '76%' }, eventList: { marginTop: 14 }, eventOption: { minHeight: 62, borderBottomWidth: 1, borderBottomColor: '#282339', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, eventOptionCopy: { flex: 1, paddingVertical: 11, paddingRight: 12 }, calendarCheck: { color: '#8C6CFF', fontWeight: '800', fontSize: 16 }, calendarPickButton: { color: '#8C6CFF', fontSize: 11, fontWeight: '700', marginTop: 12 }, closeSheetButton: { height: 46, marginTop: 14, backgroundColor: '#8C6CFF', borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, closeSheetText: { color: '#15131F', fontWeight: '800', fontSize: 12 },
  createScratchButton: { minHeight: 69, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1A28', borderRadius: 16, borderWidth: 1, borderColor: '#37334B', paddingHorizontal: 14, marginTop: 8, marginBottom: 8 }, createScratchIcon: { color: '#8C6CFF', fontSize: 24, marginRight: 12 }, typeButton: { flexGrow: 1, minWidth: '30%', minHeight: 40, paddingHorizontal: 10, borderRadius: 11, borderWidth: 1, borderColor: '#302B42', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A1726' }, scratchEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 }, scratchStar: { color: '#8C6CFF', fontSize: 28 }, scratchInput: { height: 44, marginTop: 10, borderWidth: 1, borderColor: '#332E45', borderRadius: 11, backgroundColor: '#211E30', paddingHorizontal: 12, color: '#F2EEFC', fontSize: 12 }, toggleRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, toggleTrack: { width: 43, height: 25, borderRadius: 13, padding: 3, justifyContent: 'center', backgroundColor: '#3E3A54' }, toggleTrackActive: { backgroundColor: '#6B4FD1' }, toggleThumb: { width: 19, height: 19, borderRadius: 10, backgroundColor: '#EFEBFB' }, toggleThumbActive: { alignSelf: 'flex-end', backgroundColor: '#8C6CFF' }, sampleContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 5 }, sampleLarge: { padding: 8 }, clockFace: { width: 96, height: 96, borderRadius: 15, borderWidth: 1, borderColor: '#71739A', backgroundColor: '#1C1A28', alignItems: 'center', justifyContent: 'center', position: 'relative' }, clockFaceLarge: { width: 152, height: 152, borderRadius: 100 }, clockTick: { position: 'absolute', borderRadius: 3 }, clockNumber: { position: 'absolute', color: '#F2EEFC', fontSize: 11, fontWeight: '700' }, clockNumberLarge: { fontSize: 18 }, clockHandPivot: { position: 'absolute', width: 0, height: 0 }, clockHand: { position: 'absolute', borderRadius: 2 }, clockPin: { position: 'absolute', width: 7, height: 7, borderRadius: 4 }, analogWrap: { alignItems: 'center' }, clockPairRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' }, digitalFace: { alignItems: 'center', justifyContent: 'center' }, digitalFaceLarge: { gap: 7 }, flipClockFace: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#62645A', backgroundColor: '#19152C' }, digitalTime: { color: '#8C6CFF', fontSize: 20, fontWeight: '700', letterSpacing: -0.5 }, digitalTimeLarge: { fontSize: 38, letterSpacing: -1.3 }, digitalDate: { color: '#938FB3', fontSize: 8, letterSpacing: 1, textAlign: 'center', marginTop: 5 }, sampleIcon: { color: '#8C6CFF', fontSize: 20, marginBottom: 4 }, sampleValue: { color: '#8C6CFF', fontSize: 15, fontWeight: '700', textAlign: 'center' }, stepsValue: { fontSize: 21, fontWeight: '700' }, stepsTrack: { width: '85%', height: 5, backgroundColor: '#353049', borderRadius: 3, overflow: 'hidden', marginTop: 8 }, stepsFill: { height: '100%', borderRadius: 3 }, stepsBars: { height: 78, flexDirection: 'row', alignItems: 'flex-end', gap: 5 }, stepsBar: { width: 8, borderRadius: 5 },
});
