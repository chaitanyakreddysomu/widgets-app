<<<<<<< HEAD
import React, { useRef, useState } from 'react';
=======
import React, { useEffect, useRef, useState } from 'react';
>>>>>>> origin/master
import {
  Alert, Animated, Easing, Modal, Platform, StatusBar, TextInput, View, Text, ScrollView, Pressable, StyleSheet, useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Calendar from 'expo-calendar';
import * as Battery from 'expo-battery';
import { File, Paths } from 'expo-file-system';
import { NativeModules } from 'react-native';

<<<<<<< HEAD
type Widget = { id: string; title: string; subtitle: string; type: string; icon: string; accent: string; label: string };
const widgets: Widget[] = [
  { id: 'clock-analog', title: 'Quiet Face', subtitle: 'An analog clock for your home screen', type: 'Clock', icon: '◷', accent: '#D7F36A', label: 'Analog' },
  { id: 'clock-digital', title: 'Soft Hours', subtitle: 'A clear digital clock at a glance', type: 'Clock', icon: '◷', accent: '#D7F36A', label: '09:41' },
  { id: 'health-sleep', title: 'Rest Report', subtitle: 'Last night’s sleep from Health', type: 'Health', icon: '☾', accent: '#B8A5FF', label: 'Sleep' },
  { id: 'health-steps', title: 'Step Count', subtitle: 'Today’s steps from Health', type: 'Health', icon: '⌁', accent: '#88D5C3', label: 'Steps' },
  { id: 'weather', title: 'Daylight', subtitle: 'A little forecast, a lot of sky', type: 'Weather', icon: '☼', accent: '#D8B8FF', label: '24°' },
  { id: 'battery', title: 'Power Check', subtitle: 'Your current battery level', type: 'Battery', icon: '▰', accent: '#D7F36A', label: 'Battery' },
  { id: 'calendar', title: 'One Thing Today', subtitle: 'Choose one event from your calendar', type: 'Calendar', icon: '▦', accent: '#88D5C3', label: 'Select event' },
  { id: 'music', title: 'Now Playing', subtitle: 'A compact music widget', type: 'Music', icon: '♫', accent: '#FFAE91', label: 'Music' },
  { id: 'storage', title: 'Space Check', subtitle: 'Used, available, and total storage', type: 'Storage', icon: '◫', accent: '#85C8E8', label: 'Storage' },
];
const categories = ['All widgets', 'Clock', 'Health', 'Weather', 'Battery', 'Calendar', 'Music', 'Storage'];
=======
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
  subtitle: analog ? `${face} clock face` : `${face} digital clock`, type: 'Clock', icon: analog ? '◷' : '◴', accent: '#D7F36A', label: analog ? '10:10' : '10:10', style: face,
});
const widgets: Widget[] = [
  ...analogFaces.map((face, index) => makeClockWidgets(face, index, true)),
  ...digitalFaces.map((face, index) => makeClockWidgets(face, index, false)),
  { id: 'health-sleep', title: 'Sleep Summary', subtitle: 'Last night’s sleep from Health', type: 'Health', icon: '☾', accent: '#B8A5FF', label: '7h 42m', style: 'Sleep summary' },
  ...['Step ring', 'Daily goal', 'Weekly bars', 'Simple count'].map((style, index) => ({ id: `health-steps-${index + 1}`, title: `Steps · ${style}`, subtitle: 'A sample of today’s activity', type: 'Health', icon: '⌁', accent: '#88D5C3', label: ['8,420', '8,420 / 10k', 'Mon  Tue  Wed', '8,420 steps'][index], style })),
  { id: 'weather', title: 'Daylight', subtitle: 'A little forecast, a lot of sky', type: 'Weather', icon: '☀', accent: '#D8B8FF', label: '24°', style: 'Current weather' },
  { id: 'battery', title: 'Power Check', subtitle: 'Your current battery level', type: 'Battery', icon: '▰', accent: '#D7F36A', label: '82%', style: 'Battery level' },
  { id: 'calendar', title: 'One Thing Today', subtitle: 'Choose one event from your calendar', type: 'Calendar', icon: '▦', accent: '#88D5C3', label: '10:30 · Design review', style: 'Selected event' },
  { id: 'music', title: 'Now Playing', subtitle: 'A compact music widget', type: 'Music', icon: '♫', accent: '#FFAE91', label: 'Midnight City', style: 'Now playing' },
  { id: 'storage', title: 'Space Check', subtitle: 'Used, available, and total storage', type: 'Storage', icon: '◫', accent: '#85C8E8', label: '76% used', style: 'Storage overview' },
];
const categories = ['All widgets', 'Clock Analog', 'Clock Digital', 'Health', 'Weather', 'Battery', 'Calendar', 'Music', 'Storage'];
const widgetTypes = ['Clock', 'Health', 'Weather', 'Battery', 'Calendar', 'Music', 'Storage', 'Text'];
const scratchWidget: Widget = { id: 'custom', title: 'Your widget', subtitle: 'Start with a blank canvas', type: 'Custom', icon: '✦', accent: '#D7F36A', label: 'Make it yours', style: 'Blank' };
>>>>>>> origin/master
const tabs = [
  { name: 'Widgets', icon: '▦' },
  { name: 'Customize', icon: '☷' },
  { name: 'Settings', icon: '⚙︎' },
] as const;
type TabName = (typeof tabs)[number]['name'];
type LayoutMode = 'Fixed' | 'Adaptive';
<<<<<<< HEAD
type WidgetShape = 'Rounded' | 'Circle' | 'Square' | 'Pill';
type WidgetTheme = 'Liquid Glass' | 'Solid Color' | 'Gradient';
type ColorKey = 'background' | 'border' | 'icon' | 'value' | 'title' | 'subtitle' | 'meta';
type WidgetColors = Record<ColorKey, string>;
=======
type WidgetShape = 'Rounded' | 'Circle' | 'Square' | 'Pill' | 'Squircle' | 'Cut corner' | 'Diamond' | 'Heart' | 'Arch' | 'Hexagon';
type WidgetTheme = 'Liquid Glass' | 'Solid Color' | 'Gradient';
type ColorKey = 'background' | 'border' | 'icon' | 'value' | 'title' | 'subtitle' | 'meta';
type WidgetColors = Record<ColorKey, string>;
type ClockColorKey = 'hour' | 'minute' | 'second' | 'separator';
type ClockHandColors = Record<ClockColorKey, string>;
const defaultClockHandColors: ClockHandColors = { hour: '#D7F36A', minute: '#F1EFE7', second: '#FF796D', separator: '#F1EFE7' };
>>>>>>> origin/master
type HealthApi = typeof import('@appeeky/expo-healthkit');
const getHealthApi = () => require('@appeeky/expo-healthkit') as HealthApi;
type NativeWidget = {
  updateSnapshot: (props: {
    title: string; subtitle: string; value: string; accent: string; icon: string; size: string; widgetKind: string; monthTitle: string; monthRows: string[];
    layoutMode: LayoutMode; widthCells: number; heightCells: number; shape: WidgetShape; theme: WidgetTheme;
    colors: WidgetColors; positions: { iconX: number; iconY: number; textX: number; textY: number }; gradientEnd: string;
<<<<<<< HEAD
  }) => void;
};
type StudioNative = { pinWidget: (name: string) => Promise<boolean>; installApk: (path: string) => Promise<void>; getBuildVersion: () => Promise<string>; };
const StudioAndroid = NativeModules.WidgetStudioNative as StudioNative | undefined;
=======
    clockMode: string; timeFormat: string; showSeconds: boolean; showPeriod: boolean; clockStyle: string; stepStyle: string; stepGoal: number;
    clockZone: string; secondClockZone: string; showSecondClock: boolean;
    clockHandColors: ClockHandColors; analogClockStyle: string; digitalClockStyle: string;
  }) => void;
};
type NativeWidgetModule = { widgetSlots: Record<string, NativeWidget> };
type StudioNative = { pinWidget: (name: string) => Promise<boolean>; getAvailableWidgetSlot: (names: string[]) => Promise<string | null>; installApk: (path: string) => Promise<void>; getBuildVersion: () => Promise<string>; };
const StudioAndroid = NativeModules.WidgetStudioNative as StudioNative | undefined;
const widgetSlotNames = ['StudioWidget', ...Array.from({ length: 11 }, (_, index) => `StudioWidget${index + 2}`)];
>>>>>>> origin/master
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
<<<<<<< HEAD
=======
const colorPalette = [
  '#FFFFFF', '#D9D9D9', '#A6A6A6', '#636366', '#303030', '#000000',
  '#FF3B30', '#FF6B35', '#FF9500', '#FFC400', '#D7F36A', '#8BC34A',
  '#34C759', '#00C7BE', '#00B8D9', '#32ADE6', '#007AFF', '#5856D6',
  '#AF52DE', '#FF2D55', '#A2845E', '#FFABAB', '#FFD3B6', '#FFE8A3',
  '#ECF5A0', '#B9E5C4', '#A7E8E8', '#B6DCFA', '#C6C5FA', '#E4C3FA',
  '#FAB8D0', '#C4A484',
];
>>>>>>> origin/master

export default function App() {
  return <SafeAreaProvider><WidgetStudio /></SafeAreaProvider>;
}

function WidgetStudio() {
<<<<<<< HEAD
  const [selected, setSelected] = useState(widgets[0]);
=======
  const [selected, setSelected] = useState(scratchWidget);
>>>>>>> origin/master
  const [category, setCategory] = useState('All widgets');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('Adaptive');
  const [fixedWidth, setFixedWidth] = useState(3);
  const [fixedHeight, setFixedHeight] = useState(2);
  const [shape, setShape] = useState<WidgetShape>('Rounded');
  const [theme, setTheme] = useState<WidgetTheme>('Solid Color');
  const [colors, setColors] = useState<WidgetColors>({
    background: '#24251F', border: '#3C4030', icon: '#D7F36A', meta: '#A6A79A', value: '#D7F36A', title: '#F1EFE7', subtitle: '#A6A79A',
  });
  const [colorDrafts, setColorDrafts] = useState<WidgetColors>({
    background: '#24251F', border: '#3C4030', icon: '#D7F36A', meta: '#A6A79A', value: '#D7F36A', title: '#F1EFE7', subtitle: '#A6A79A',
  });
  const [gradientEnd, setGradientEnd] = useState('#536B84');
  const [gradientEndDraft, setGradientEndDraft] = useState('#536B84');
  const [positions, setPositions] = useState({ iconX: 8, iconY: 10, textX: 10, textY: 42 });
  const [tab, setTab] = useState<TabName>('Widgets');
  const [saved, setSaved] = useState(false);
  const [widgetSheetVisible, setWidgetSheetVisible] = useState(false);
  const [eventPickerVisible, setEventPickerVisible] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<Calendar.ExpoCalendarEvent[]>([]);
  const [calendarEvent, setCalendarEvent] = useState<Calendar.ExpoCalendarEvent | null>(null);
  const [calendarGranted, setCalendarGranted] = useState(false);
  const [healthRequested, setHealthRequested] = useState<Record<string, boolean>>({});
  const [updatesVisible, setUpdatesVisible] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'current' | 'error' | 'downloading'>('idle');
  const [updateUrl, setUpdateUrl] = useState('');
  const [updateVersion, setUpdateVersion] = useState('');
<<<<<<< HEAD
=======
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
  const [healthMetric, setHealthMetric] = useState<'Steps' | 'Sleep'>('Steps');
>>>>>>> origin/master
  const activePosition = useRef(new Animated.Value(0)).current;
  const pageOpacity = useRef(new Animated.Value(1)).current;
  const pageOffset = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();
<<<<<<< HEAD
  const cardWidth = (width - 52) / 2;
  const filtered = category === 'All widgets' ? widgets : widgets.filter((w) => w.type === category);
  const sizeLabel = layoutMode === 'Adaptive' ? 'Adaptive' : `${fixedWidth} × ${fixedHeight}`;
  const previewHeight = layoutMode === 'Adaptive' ? 178 : 104 + fixedHeight * 39;
  const shapeRadius = shape === 'Square' ? 5 : shape === 'Rounded' ? 22 : 100;
  const previewDimensions = shape === 'Circle'
    ? { width: previewHeight, height: previewHeight, alignSelf: 'center' as const }
    : { width: layoutMode === 'Adaptive' ? '100%' as const : `${Math.min(100, 55 + fixedWidth * 11)}%` as const, height: previewHeight };
  const previewTitle = selected.id === 'calendar' && calendarEvent ? calendarEvent.title : selected.title;
  const previewSubtitle = selected.id === 'calendar' && calendarEvent ? formatEventDate(calendarEvent.startDate) : selected.subtitle;
=======
  useEffect(() => {
    if (tab !== 'Widgets' && tab !== 'Customize') return;
    const timer = setInterval(() => setClockNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [tab]);
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
>>>>>>> origin/master
  const monthNow = new Date();
  const monthTitle = monthNow.toLocaleDateString([], { month: 'long', year: 'numeric' });
  const monthRows = buildCalendarRows(monthNow);

  const updateColor = (key: ColorKey, value: string) => {
    setColorDrafts((current) => ({ ...current, [key]: value }));
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) setColors((current) => ({ ...current, [key]: value }));
  };
  const finishColorEdit = (key: ColorKey) => {
<<<<<<< HEAD
    if (!/^#[0-9A-Fa-f]{6}$/.test(colorDrafts[key])) {
      setColorDrafts((current) => ({ ...current, [key]: colors[key] }));
    }
=======
    if (!/^#[0-9A-Fa-f]{6}$/.test(colorDrafts[key])) setColorDrafts((current) => ({ ...current, [key]: colors[key] }));
>>>>>>> origin/master
  };
  const adjustPosition = (key: keyof typeof positions, amount: number) => {
    setPositions((current) => ({ ...current, [key]: Math.max(0, Math.min(100, current[key] + amount)) }));
  };
<<<<<<< HEAD
=======
  const resetDesign = (accent = '#D7F36A') => {
    const defaults: WidgetColors = { background: '#24251F', border: '#3C4030', icon: accent, meta: '#A6A79A', value: accent, title: '#F1EFE7', subtitle: '#A6A79A' };
    setColors(defaults); setColorDrafts(defaults); setShape('Rounded'); setTheme('Solid Color');
    setLayoutMode('Adaptive'); setFixedWidth(3); setFixedHeight(2); setPositions({ iconX: 8, iconY: 10, textX: 10, textY: 42 });
    setGradientEnd('#536B84'); setGradientEndDraft('#536B84'); setClockZone('local'); setSecondClockZone('Asia/Tokyo');
    setClockHandColors({ ...defaultClockHandColors, hour: accent });
    setShowSecondClock(false); setClockNow(Date.now()); setStepGoal(10000); setStepStyle('Step ring');
  };
>>>>>>> origin/master

  const askBeforeSystemPermission = (title: string, message: string) => new Promise<boolean>((resolve) => {
    Alert.alert(title, message, [
      { text: 'Not now', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Continue', onPress: () => resolve(true) },
    ]);
  });

  const loadCalendarEvents = async () => {
    try {
      const calendarsOnDevice = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
      const from = new Date();
      const to = new Date();
      to.setDate(to.getDate() + 30);
      const events = (await Calendar.listEvents(calendarsOnDevice, from, to))
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      setCalendarEvents(events);
      setEventPickerVisible(true);
    } catch {
      Alert.alert('Calendar unavailable', 'Widget Studio could not read events from the selected calendars.');
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
        'The calendar widget needs access so you can choose one event to show. Widget Studio will not create or edit events. Expo’s Android calendar permission request includes read and write access.',
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

  const ensureHealthAccess = async (widget: Widget) => {
    let Health: HealthApi;
    try {
      Health = getHealthApi();
    } catch {
      Alert.alert('Development build needed', 'Health data is available only in a development build with the HealthKit / Health Connect native module installed.');
      return false;
    }
<<<<<<< HEAD
    const identifier = widget.id === 'health-steps' ? Health.QuantityType.stepCount : Health.CategoryType.sleepAnalysis;
    const label = widget.id === 'health-steps' ? 'today’s steps' : 'sleep data';
=======
    const isSteps = widget.id.includes('steps') || (widget.id === 'custom' && widget.style.startsWith('Step'));
    const identifier = isSteps ? Health.QuantityType.stepCount : Health.CategoryType.sleepAnalysis;
    const label = isSteps ? 'today’s steps' : 'sleep data';
>>>>>>> origin/master
    if (!Health.isAvailable()) {
      Alert.alert('Health data unavailable', 'HealthKit or Health Connect is not available on this device.');
      return false;
    }
    if (Health.getUnsupportedTypes([identifier]).length > 0) {
      Alert.alert('Health data unavailable', `This device does not support ${label}.`);
      return false;
    }
    if (!healthRequested[widget.id]) {
      const proceed = await askBeforeSystemPermission(
        `Allow ${label}?`,
        `Widget Studio needs read access to ${label} for this widget. It will not write health records.`,
      );
      if (!proceed) return false;
      try {
        await Health.requestAuthorization({ toRead: [identifier] });
        setHealthRequested((current) => ({ ...current, [widget.id]: true }));
      } catch {
        Alert.alert('Health access unavailable', 'The HealthKit / Health Connect permission screen could not be opened. Use a development build and make sure Health Connect is installed on Android.');
        return false;
      }
    }
    const liveData = await refreshSelectedData(widget);
    setSelected((current) => current.id === widget.id ? { ...current, ...liveData } : current);
    return true;
  };

  const openCalendarPicker = async () => {
    if (await ensureCalendarAccess()) await loadCalendarEvents();
  };

  const refreshSelectedData = async (widget: Widget = selected): Promise<Partial<Widget>> => {
    if (widget.id === 'battery') {
      try {
        const level = await Battery.getBatteryLevelAsync();
        if (level >= 0) return { label: `${Math.round(level * 100)}%` };
<<<<<<< HEAD
      } catch {}
=======
      } catch { }
>>>>>>> origin/master
    } else if (widget.id === 'storage') {
      try {
        const total = Paths.totalDiskSpace;
        const available = Paths.availableDiskSpace;
        const used = Math.max(0, total - available);
        return { label: `${formatBytes(used)} used`, subtitle: `${formatBytes(available)} free of ${formatBytes(total)}` };
<<<<<<< HEAD
      } catch {}
    } else if (widget.id === 'health-steps') {
=======
      } catch { }
    } else if (widget.id.includes('steps') || (widget.id === 'custom' && widget.type === 'Health' && widget.style.startsWith('Step'))) {
>>>>>>> origin/master
      try {
        const Health = getHealthApi();
        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        const steps = await Health.queryStatistics({
          type: Health.QuantityType.stepCount,
          unit: Health.Unit.count,
          from: today,
          to: now,
          options: Health.StatisticsOption.cumulativeSum,
        });
        return { label: `${Math.round(steps.sum ?? 0).toLocaleString()} steps` };
<<<<<<< HEAD
      } catch {}
=======
      } catch { }
>>>>>>> origin/master
    } else if (widget.id === 'health-sleep') {
      try {
        const Health = getHealthApi();
        const now = new Date();
        const from = new Date(now);
        from.setDate(from.getDate() - 1);
        from.setHours(18, 0, 0, 0);
        const samples = await Health.queryCategorySamples({ type: Health.CategoryType.sleepAnalysis, from, to: now });
        const sleepValues: number[] = [Health.SleepAnalysisValue.asleepUnspecified, Health.SleepAnalysisValue.asleepCore, Health.SleepAnalysisValue.asleepDeep, Health.SleepAnalysisValue.asleepREM];
        const asleepMs = samples.filter((sample) => sleepValues.includes(sample.value)).reduce((total, sample) => total + (sample.endDate.getTime() - sample.startDate.getTime()), 0);
        return { label: asleepMs ? `${Math.floor(asleepMs / 3600000)}h ${Math.floor((asleepMs % 3600000) / 60000)}m` : 'No sleep data' };
<<<<<<< HEAD
      } catch {}
=======
      } catch { }
>>>>>>> origin/master
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

  const chooseWidget = (widget: Widget) => {
    setSelected(widget);
<<<<<<< HEAD
    setColors((current) => ({ ...current, value: widget.accent }));
    setColorDrafts((current) => ({ ...current, value: widget.accent }));
=======
    resetDesign(widget.accent);
    setClockMode(widget.id.startsWith('clock-analog') ? 'Analog' : 'Digital');
    if (widget.type === 'Clock') {
      setAnalogClockStyle(analogFaces[0]);
      setDigitalClockStyle(digitalFaces[0]);
      if (widget.id.startsWith('clock-analog')) setAnalogClockStyle(widget.style);
      else setDigitalClockStyle(widget.style);
    }
    if (widget.type === 'Clock') setShowSeconds(widget.id.startsWith('clock-digital') ? widget.style !== 'Clean digital' : true);
    if (widget.id === 'health-sleep') setHealthMetric('Sleep');
    if (widget.id.includes('steps')) setHealthMetric('Steps');
    if (widget.id.startsWith('health-steps')) setStepStyle(widget.style);
    setShowSecondClock(false);
>>>>>>> origin/master
    setSaved(false);
    if (widget.id === 'battery' || widget.id === 'storage') {
      void refreshSelectedData(widget).then((liveData) => setSelected((current) => current.id === widget.id ? { ...current, ...liveData } : current));
    }
    if (widget.id === 'calendar') void openCalendarPicker();
    if (widget.type === 'Health') void ensureHealthAccess(widget);
    if (widget.id === 'music') {
      Alert.alert(
        'Allow music access?',
        Platform.OS === 'android'
          ? 'Showing the current track requires Notification access so Widget Studio can read active media sessions.'
          : 'Reading Apple Music library details requires Media & Apple Music access.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Continue', onPress: () => Alert.alert('Music connection unavailable', 'This project does not yet include the native media-session integration, so it cannot open the platform permission screen or display the current track.') },
        ],
      );
    }
  };
<<<<<<< HEAD
=======
  const startFromScratch = () => {
    setSelected(scratchWidget);
    resetDesign(scratchWidget.accent);
    setClockMode('Analog'); setTimeFormat('12-hour'); setShowSeconds(true); setShowPeriod(true); setStepStyle('Step ring'); setHealthMetric('Steps');
    setSaved(false);
    changeTab('Customize');
  };
  const selectScratchType = (type: string) => {
    const samples: Record<string, Partial<Widget>> = {
      Clock: { icon: '◷', label: '10:10', accent: '#D7F36A', style: 'Classic numerals' },
      Health: { icon: '⌁', label: '8,420 steps', accent: '#88D5C3', style: 'Step ring' },
      Weather: { icon: '☀', label: '24°', accent: '#D8B8FF' }, Battery: { icon: '▰', label: '82%', accent: '#D7F36A' },
      Calendar: { icon: '▦', label: 'Choose an event', accent: '#88D5C3' }, Music: { icon: '♫', label: 'Now playing', accent: '#FFAE91' },
      Storage: { icon: '◫', label: '76% used', accent: '#85C8E8' }, Text: { icon: 'T', label: 'Your text', accent: '#D7F36A' },
    };
    setSelected({ ...scratchWidget, ...samples[type], type, title: type === 'Text' ? 'Your text' : `Your ${type.toLowerCase()} widget` });
    if (type === 'Clock') {
      setClockMode('Analog');
      setAnalogClockStyle('Classic numerals');
      setDigitalClockStyle('Clean digital');
    }
  };
>>>>>>> origin/master
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
<<<<<<< HEAD
    if (selected.id === 'calendar') {
=======
    if (selected.type === 'Calendar') {
>>>>>>> origin/master
      if (!(await ensureCalendarAccess())) return;
      if (!calendarEvent) {
        await loadCalendarEvents();
        return;
      }
    }
    const liveData = await refreshSelectedData();
    const selectedForSnapshot = { ...selected, ...liveData };
<<<<<<< HEAD
    try {
      // Load the native widget only on demand so the designer can still run in Expo Go.
      const nativeWidget = require('./widgets/StudioWidget').default as NativeWidget;
      nativeWidget.updateSnapshot({
        title: selected.id === 'calendar' && calendarEvent ? calendarEvent.title : selectedForSnapshot.title,
        subtitle: selected.id === 'calendar' && calendarEvent ? formatEventDate(calendarEvent.startDate) : selectedForSnapshot.subtitle,
        value: selected.id === 'calendar' && calendarEvent ? formatEventDate(calendarEvent.startDate) : selectedForSnapshot.label,
        accent: colors.value, icon: selected.icon, size: sizeLabel,
        widgetKind: selected.id, monthTitle, monthRows,
        layoutMode, widthCells: fixedWidth, heightCells: fixedHeight, shape, theme, colors, positions, gradientEnd,
      });
    } catch {
      Alert.alert(
        'Development build needed',
        'Expo Go does not include the native widget module. Open this app in a development build to add your widget.',
=======
    let slotName = 'StudioWidget';
    try {
      if (Platform.OS === 'android') {
        if (!StudioAndroid) throw new Error('Native widget pinning is unavailable in this app build.');
        const freeSlot = await StudioAndroid.getAvailableWidgetSlot(widgetSlotNames);
        if (!freeSlot) throw new Error('All Widget Studio widget slots are in use. Remove a Widget Studio widget from your home screen and try again.');
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
        widgetKind: selected.type === 'Clock' ? `clock-${clockMode.toLowerCase()}` : selected.id === 'custom' && selected.type === 'Health' ? 'health-steps' : selected.id === 'custom' ? selected.type.toLowerCase() : selected.id, monthTitle, monthRows,
        layoutMode, widthCells: fixedWidth, heightCells: fixedHeight, shape, theme, colors, positions, gradientEnd,
        clockMode, timeFormat, showSeconds, showPeriod, clockStyle: selected.style, analogClockStyle, digitalClockStyle, clockHandColors, stepStyle, stepGoal, clockZone, secondClockZone, showSecondClock,
      });
    } catch {
      Alert.alert(
        'Widget unavailable',
        'This app build cannot prepare another widget. Use the installed Widget Studio release and try again.',
>>>>>>> origin/master
      );
      return;
    }
    setSaved(true);
    if (Platform.OS === 'android') {
      try {
        if (!StudioAndroid) throw new Error('Native widget pinning is unavailable in this app build.');
<<<<<<< HEAD
        await StudioAndroid.pinWidget('StudioWidget');
=======
        await StudioAndroid.pinWidget(slotName);
>>>>>>> origin/master
      } catch (error) {
        Alert.alert('Could not add widget', error instanceof Error ? error.message : 'Try adding Widget Studio from your launcher’s Widgets panel.');
      }
    } else {
      Alert.alert('Widget saved', 'Your design is saved. Add Widget Studio from your home screen’s widget gallery.');
    }
  };

  const checkForUpdates = async () => {
    setUpdateStatus('checking');
    try {
      const response = await fetch('https://api.github.com/repos/chaitanyakreddysomu/widgets-app/releases/latest', { headers: { Accept: 'application/vnd.github+json' } });
      if (!response.ok) throw new Error('Could not reach the update service.');
      const release = await response.json() as { tag_name?: string; assets?: { name: string; browser_download_url: string }[] };
      const apk = release.assets?.find((asset) => asset.name.toLowerCase().endsWith('.apk'));
      if (!apk) throw new Error('No APK is attached to the latest release yet.');
      const latest = Number(release.tag_name?.replace(/^build-/, ''));
      const installed = Number(Platform.OS === 'android' && StudioAndroid ? await StudioAndroid.getBuildVersion() : '0');
      if (Number.isFinite(latest) && latest <= installed) { setUpdateStatus('current'); return; }
      setUpdateVersion(release.tag_name ?? 'Latest release');
      setUpdateUrl(apk.browser_download_url);
      setUpdateStatus('available');
    } catch (error) {
      setUpdateStatus('error');
      Alert.alert('Update check failed', error instanceof Error ? error.message : 'Please try again later.');
    }
  };
  const downloadAndInstallUpdate = async () => {
    if (!updateUrl || !StudioAndroid) {
      Alert.alert('Update unavailable', 'In-app installation is available in the Android release build.');
      return;
    }
    setUpdateStatus('downloading');
    try {
      const file = await File.downloadFileAsync(updateUrl, new File(Paths.cache, 'widget-studio-update.apk'));
      await StudioAndroid.installApk(file.uri);
    } catch (error) {
      setUpdateStatus('available');
      Alert.alert('Download failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topbar}>
        <View style={styles.brandMark}><Text style={styles.brandMarkText}>w.</Text></View>
        <View style={styles.brandCopy}><Text style={styles.brand}>WIDGET STUDIO</Text><Text style={styles.brandSub}>A little space, made yours</Text></View>
        <Pressable onPress={() => changeTab('Settings')} style={styles.avatar} accessibilityLabel="Settings"><Text style={styles.avatarText}>A</Text></Pressable>
      </View>
<<<<<<< HEAD
      <Animated.ScrollView style={{ opacity: pageOpacity, transform: [{ translateY: pageOffset }] }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {tab !== 'Widgets' && <View style={styles.headingRow}>
          <View><Text style={styles.eyebrow}>{tab === 'Customize' ? 'A FEW LITTLE DETAILS' : 'YOUR STUDIO'}</Text><Text style={styles.heading}>{tab === 'Customize' ? <>Fine-tune{'\n'}your widget.</> : <>A space that{'\n'}feels like you.</>}</Text></View>
          <View style={styles.sparkle}><Text style={{ color: '#D7F36A', fontSize: 27 }}>✳</Text></View>
        </View>}
        {tab === 'Settings' ? (
=======
      <Animated.ScrollView stickyHeaderIndices={tab === 'Customize' ? [1] : undefined} style={{ opacity: pageOpacity, transform: [{ translateY: pageOffset }] }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {tab !== 'Widgets' && <View style={styles.headingRow}>
          <View><Text style={styles.eyebrow}>{tab === 'Customize' ? (selected.id === 'custom' ? 'START WITH A BLANK CANVAS' : 'A FEW LITTLE DETAILS') : 'YOUR STUDIO'}</Text><Text style={styles.heading}>{tab === 'Customize' ? selected.id === 'custom' ? <>Create your{'\n'}own widget.</> : <>Fine-tune{'\n'}your widget.</> : <>A space that{'\n'}feels like you.</>}</Text></View>
          <View style={styles.sparkle}><Text style={{ color: '#D7F36A', fontSize: 27 }}>✳</Text></View>
        </View>}
        {tab === 'Settings' && (
>>>>>>> origin/master
          <View style={styles.settingsCard}>
            <View style={styles.settingsIntro}><Text style={styles.settingsIntroIcon}>⚙︎</Text><View><Text style={styles.sectionTitle}>Studio settings</Text><Text style={styles.sectionSub}>A few details about your setup.</Text></View></View>
            <View style={styles.divider} />
            <Pressable onPress={() => { setUpdatesVisible(true); void checkForUpdates(); }} style={styles.settingsRow}><View><Text style={styles.controlTitle}>Update app</Text><Text style={styles.controlSub}>Check for the latest Widget Studio release</Text></View><Text style={styles.settingsChevron}>›</Text></Pressable>
            <View style={styles.divider} />
            <View style={styles.settingsRow}><View><Text style={styles.controlTitle}>Appearance</Text><Text style={styles.controlSub}>Dark · soft contrast</Text></View><Text style={styles.settingsValue}>●</Text></View>
            <View style={styles.divider} />
            <Pressable onPress={() => changeTab('Customize')} style={styles.settingsRow}><View><Text style={styles.controlTitle}>Widget sizing</Text><Text style={styles.controlSub}>{sizeLabel} · change in Customize</Text></View><Text style={styles.settingsChevron}>›</Text></Pressable>
            <View style={styles.divider} />
            <View style={styles.settingsRow}><View><Text style={styles.controlTitle}>Saved design</Text><Text style={styles.controlSub}>{saved ? selected.title : 'No saved widget yet'}</Text></View><Text style={styles.settingsValue}>{saved ? '✓' : '♡'}</Text></View>
            <View style={styles.divider} />
            <View style={styles.settingsRow}><View><Text style={styles.controlTitle}>Widget Studio</Text><Text style={styles.controlSub}>Expo SDK 58.0.5</Text></View><Text style={styles.settingsValue}>✳</Text></View>
          </View>
<<<<<<< HEAD
        ) : (
          <>
          {tab === 'Customize' && <View style={styles.previewShell}>
          <View style={styles.previewTop}><Text style={styles.previewEyebrow}>LIVE PREVIEW</Text><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text></View>
          <View style={[styles.widgetPreview, previewDimensions, { borderColor: theme === 'Liquid Glass' ? 'rgba(255,255,255,0.48)' : colors.border, borderRadius: shapeRadius, backgroundColor: theme === 'Solid Color' ? colors.background : 'transparent' }]}>
            {theme === 'Gradient' && <LinearGradient pointerEvents="none" colors={[colors.background, gradientEnd] as const} style={styles.previewBackground} />}
            {theme === 'Liquid Glass' && <LinearGradient pointerEvents="none" colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.05)']} style={styles.previewBackground} />}
            {selected.id === 'calendar' ? <View style={styles.calendarFace}>
              <Text style={[styles.calendarMonth, { color: colors.title }]}>{monthTitle}</Text>
              <Text style={[styles.calendarWeekdays, { color: colors.meta }]}>Su  Mo  Tu  We  Th  Fr  Sa</Text>
              {monthRows.map((row, index) => <Text key={index} style={[styles.calendarDays, { color: colors.value }]}>{row}</Text>)}
              <Text numberOfLines={1} style={[styles.calendarEvent, { color: colors.subtitle }]}>{calendarEvent ? `● ${calendarEvent.title} · ${formatEventDate(calendarEvent.startDate)}` : 'Choose one event below'}</Text>
            </View> : <>
              <View style={[styles.previewIconPosition, { left: `${positions.iconX}%`, top: `${positions.iconY}%` }]}><View style={[styles.miniIcon, { backgroundColor: theme === 'Liquid Glass' ? 'rgba(255,255,255,0.18)' : `${colors.icon}20` }]}><Text style={{ color: theme === 'Liquid Glass' ? '#FFFFFF' : colors.icon, fontSize: 19 }}>{selected.icon}</Text></View></View>
              <View style={[styles.previewTextPosition, { left: `${positions.textX}%`, top: `${positions.textY}%` }]}>
                <Text style={[styles.previewType, { color: theme === 'Liquid Glass' ? '#E8EDF4' : colors.meta }]}>{selected.type.toUpperCase()} · {sizeLabel.toUpperCase()}</Text>
                <Text style={[styles.previewValue, { color: theme === 'Liquid Glass' ? '#FFFFFF' : colors.value }]}>{selected.id === 'weather' ? '☀  ' : ''}{selected.label}</Text>
                <Text style={[styles.previewTitle, { color: theme === 'Liquid Glass' ? '#FFFFFF' : colors.title }]}>{previewTitle}</Text>
                <Text style={[styles.previewSubtitle, { color: theme === 'Liquid Glass' ? '#E8EDF4' : colors.subtitle }]}>{previewSubtitle}</Text>
              </View>
            </>}
          </View>
          <View style={styles.previewFooter}><Text style={styles.previewHint}>◉  Updates live as you customize</Text><Pressable onPress={() => setSaved(!saved)} style={[styles.saveButton, saved && styles.saveButtonDone]}><Text style={[styles.saveButtonText, saved && { color: '#10110F' }]}>{saved ? '✓  Saved' : '＋  Save widget'}</Text></Pressable></View>
          </View>}
          {tab === 'Widgets' && <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {categories.map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.chip, category === item && styles.chipActive]}><Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text></Pressable>)}
          </ScrollView>
          <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Start with a widget</Text><Text style={styles.sectionSub}>Made to fit your kind of day.</Text></View><Text style={styles.count}>{filtered.length.toString().padStart(2, '0')} DESIGNS</Text></View>
          <View style={styles.grid}>
          {filtered.map((widget) => <Pressable key={widget.id} onPress={() => { chooseWidget(widget); setWidgetSheetVisible(true); }} style={[styles.templateCard, { width: cardWidth }, selected.id === widget.id && styles.templateSelected]}>
            <View style={[styles.templateArt, { backgroundColor: `${widget.accent}12` }]}><View style={[styles.artOrb, { backgroundColor: widget.accent }]} /><Text style={[styles.artSymbol, { color: widget.accent }]}>{widget.icon}</Text><Text style={[styles.artLabel, { color: widget.accent }]}>{widget.label}</Text><Text style={styles.artTime}>MON, 09:41</Text><View style={styles.artLine} /></View>
            <View style={styles.templateInfo}><View><Text style={styles.templateTitle}>{widget.title}</Text><Text style={styles.templateType}>{widget.type} widget</Text></View><View style={[styles.selectDot, selected.id === widget.id && { backgroundColor: '#D7F36A', borderColor: '#D7F36A' }]}>{selected.id === widget.id && <Text style={styles.check}>✓</Text>}</View></View>
          </Pressable>)}
          </View>
          </>}
          {tab === 'Customize' && <>
        <View style={styles.customCard}>
          <Text style={styles.controlTitle}>Sizing</Text><Text style={styles.controlSub}>Choose how the widget fits your home screen.</Text>
          <View style={styles.modeSwitch}>{(['Fixed', 'Adaptive'] as const).map((mode) => <Pressable key={mode} onPress={() => setLayoutMode(mode)} style={[styles.modeButton, layoutMode === mode && styles.modeButtonActive]}><Text style={[styles.modeText, layoutMode === mode && styles.modeTextActive]}>{mode}</Text></Pressable>)}</View>
          {layoutMode === 'Fixed' ? <>
            <StepperControl label="Width" value={fixedWidth} unit=" cells" min={1} max={6} onChange={setFixedWidth} />
            <View style={styles.divider} />
            <StepperControl label="Height" value={fixedHeight} unit=" cells" min={1} max={6} onChange={setFixedHeight} />
          </> : <Text style={styles.helperText}>Adaptive widgets use the space provided by the launcher and can be resized there.</Text>}
        </View>
        <View style={styles.customCard}>
          <Text style={styles.controlTitle}>Shape</Text><Text style={styles.controlSub}>Choose the outline for your widget.</Text>
          <View style={styles.optionGrid}>{(['Rounded', 'Circle', 'Square', 'Pill'] as const).map((item) => <Pressable key={item} onPress={() => setShape(item)} style={[styles.optionButton, shape === item && styles.optionButtonActive]}><View style={[styles.shapeSample, item === 'Rounded' && { borderRadius: 8 }, item === 'Circle' && { borderRadius: 20 }, item === 'Pill' && { borderRadius: 20, width: 38 }, item === 'Square' && { borderRadius: 2 }, shape === item && { borderColor: '#D7F36A' }]} /><Text style={[styles.optionText, shape === item && styles.optionTextActive]}>{item}</Text></Pressable>)}</View>
        </View>
        <View style={styles.customCard}>
          <Text style={styles.controlTitle}>Theme</Text><Text style={styles.controlSub}>Set the overall feel.</Text>
          <View style={styles.optionGrid}>{(['Liquid Glass', 'Solid Color', 'Gradient'] as const).map((item) => <Pressable key={item} onPress={() => setTheme(item)} style={[styles.themeButton, theme === item && styles.optionButtonActive]}><View style={[styles.themeSample, item === 'Liquid Glass' && styles.glassSample, item === 'Solid Color' && { backgroundColor: colors.background }, item === 'Gradient' && styles.gradientSample]} /><Text style={[styles.optionText, theme === item && styles.optionTextActive]}>{item}</Text></Pressable>)}</View>
        </View>
        {theme !== 'Liquid Glass' && <View style={styles.customCard}>
          <Text style={styles.controlTitle}>Colors</Text><Text style={styles.controlSub}>Enter any hex color. Each text layer is independent.</Text>
          <View style={styles.colorGrid}>{colorLabels.map(({ key, label }) => <ColorControl key={key} label={label} value={colorDrafts[key]} onChange={(value) => updateColor(key, value)} onFinish={() => finishColorEdit(key)} />)}</View>
          {theme === 'Gradient' && <ColorControl label="Gradient end" value={gradientEndDraft} onChange={updateGradientEnd} onFinish={finishGradientEndEdit} />}
        </View>}
        {theme === 'Liquid Glass' && <View style={styles.glassNotice}><Text style={styles.glassNoticeIcon}>✧</Text><Text style={styles.glassNoticeText}>Liquid Glass uses its own translucent finish, so manual colors are turned off.</Text></View>}
        <View style={styles.customCard}>
          <Text style={styles.controlTitle}>Position</Text><Text style={styles.controlSub}>Move the icon and text by percentage.</Text>
          <StepperControl label="Icon · horizontal" value={positions.iconX} unit="%" min={0} max={100} step={5} onChange={(value) => setPositions((current) => ({ ...current, iconX: value }))} />
          <View style={styles.divider} />
          <StepperControl label="Icon · vertical" value={positions.iconY} unit="%" min={0} max={100} step={5} onChange={(value) => setPositions((current) => ({ ...current, iconY: value }))} />
          <View style={styles.divider} />
          <StepperControl label="Text · horizontal" value={positions.textX} unit="%" min={0} max={100} step={5} onChange={(value) => setPositions((current) => ({ ...current, textX: value }))} />
          <View style={styles.divider} />
          <StepperControl label="Text · vertical" value={positions.textY} unit="%" min={0} max={100} step={5} onChange={(value) => setPositions((current) => ({ ...current, textY: value }))} />
        </View>
        {selected.id === 'calendar' && <Pressable onPress={openCalendarPicker} style={styles.customCard}>
          <Text style={styles.controlTitle}>Calendar event</Text>
          <Text style={styles.controlSub}>{calendarEvent ? `${calendarEvent.title} · ${formatEventDate(calendarEvent.startDate)}` : 'Choose one event to show on this widget.'}</Text>
          <Text style={styles.calendarPickButton}>Choose event  ›</Text>
        </Pressable>}
        <Pressable onPress={addToHomeScreen} style={styles.addHomeButton}>
          <Text style={styles.addHomeIcon}>＋</Text>
          <View style={{ flex: 1 }}><Text style={styles.addHomeTitle}>Add to home screen</Text><Text style={styles.addHomeSub}>Your design will be ready in Widgets</Text></View>
          <Text style={styles.addHomeArrow}>↗</Text>
        </Pressable>
        <View style={styles.note}><Text style={styles.noteIcon}>✦</Text><Text style={styles.noteText}>The launcher controls the final widget bounds after it is added.</Text></View>
          </>}
          </>
        )}
=======
        )}
        {tab === 'Customize' && <View style={styles.previewShell}>
              <View style={styles.previewTop}><Text style={styles.previewEyebrow}>LIVE PREVIEW</Text><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text></View>
              <View style={[styles.widgetPreview, previewDimensions, { borderColor: theme === 'Liquid Glass' ? 'rgba(255,255,255,0.48)' : colors.border, borderRadius: shapeRadius, backgroundColor: theme === 'Solid Color' ? colors.background : 'transparent' }]}>
                {theme === 'Gradient' && <LinearGradient pointerEvents="none" colors={[colors.background, gradientEnd] as const} style={styles.previewBackground} />}
                {theme === 'Liquid Glass' && <LinearGradient pointerEvents="none" colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.05)']} style={styles.previewBackground} />}
                {selected.id === 'custom' && selected.type === 'Custom' ? <View style={styles.scratchEmpty}><Text style={styles.scratchStar}>✦</Text><Text style={styles.previewTitle}>Your canvas is ready</Text><Text style={styles.previewSubtitle}>Choose a widget type below to begin.</Text></View>
                  : <WidgetSample widget={selected} large accent={theme === 'Liquid Glass' ? '#FFFFFF' : colors.value} clockMode={clockMode} analogClockStyle={analogClockStyle} digitalClockStyle={digitalClockStyle} clockHandColors={activeClockHandColors} timeFormat={timeFormat} showSeconds={showSeconds} showPeriod={showPeriod} clockZone={clockZone} secondClockZone={secondClockZone} showSecondClock={showSecondClock} now={clockNow} stepGoal={stepGoal} stepStyle={stepStyle} />}
              </View>
              <View style={styles.previewFooter}><Text style={styles.previewHint}>◉  Updates live as you customize</Text><Pressable onPress={() => setSaved(!saved)} style={[styles.saveButton, saved && styles.saveButtonDone]}><Text style={[styles.saveButtonText, saved && { color: '#10110F' }]}>{saved ? '✓  Saved' : '＋  Save widget'}</Text></Pressable></View>
            </View>}
        {tab === 'Widgets' && <View>
              <Pressable onPress={startFromScratch} style={styles.createScratchButton}><Text style={styles.createScratchIcon}>＋</Text><View style={{ flex: 1 }}><Text style={styles.controlTitle}>Create from scratch</Text><Text style={styles.controlSub}>Choose a widget type, then build every detail.</Text></View><Text style={styles.settingsChevron}>›</Text></Pressable>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {categories.map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.chip, category === item && styles.chipActive]}><Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text></Pressable>)}
              </ScrollView>
              <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Start with a widget</Text><Text style={styles.sectionSub}>Made to fit your kind of day.</Text></View><Text style={styles.count}>{filtered.length.toString().padStart(2, '0')} DESIGNS</Text></View>
              <View style={styles.grid}>
                {filtered.map((widget) => <Pressable key={widget.id} onPress={() => { chooseWidget(widget); setWidgetSheetVisible(true); }} style={[styles.templateCard, { width: cardWidth }]}>
                <View style={[styles.templateArt, { backgroundColor: '#121310' }]}><WidgetSample widget={widget} now={clockNow} clockMode={widget.id.startsWith('clock-analog') ? 'Analog' : 'Digital'} showSeconds={widget.id.startsWith('clock-digital') && widget.style !== 'Clean digital'} /></View>
                  <View style={styles.templateInfo}><View><Text style={styles.templateTitle}>{widget.title}</Text><Text style={styles.templateType}>{widget.type} · {widget.style}</Text></View></View>
                </Pressable>)}
              </View>
        </View>}
        {tab === 'Customize' && <View>
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
              {selected.type === 'Health' && <View style={styles.customCard}>
                {selected.id === 'custom' && <View style={styles.optionGrid}>{(['Steps', 'Sleep'] as const).map((metric) => <Pressable key={metric} onPress={() => { setHealthMetric(metric); setSelected((current) => ({ ...current, style: metric === 'Steps' ? stepStyle : 'Sleep summary', label: metric === 'Steps' ? '8,420 steps' : '7h 42m' })); }} style={[styles.typeButton, healthMetric === metric && styles.optionButtonActive]}><Text style={[styles.optionText, healthMetric === metric && styles.optionTextActive]}>{metric}</Text></Pressable>)}</View>}
                {healthMetric === 'Steps' ? <><Text style={styles.controlTitle}>Steps display</Text><OptionPicker options={['Step ring', 'Daily goal', 'Weekly bars', 'Simple count']} value={stepStyle} onSelect={(value) => { setStepStyle(value); if (selected.id === 'custom' || selected.id.includes('steps')) setSelected((current) => ({ ...current, style: value, label: value === 'Daily goal' ? '8,420 / 10k' : value === 'Weekly bars' ? 'Mon  Tue  Wed' : '8,420', id: current.id === 'custom' ? 'custom' : `health-steps-${['Step ring', 'Daily goal', 'Weekly bars', 'Simple count'].indexOf(value) + 1}` })); }} /><StepperControl label="Daily step goal" value={stepGoal} unit=" steps" min={1000} max={50000} step={1000} onChange={setStepGoal} /></> : <><Text style={styles.controlTitle}>Sleep display</Text><OptionPicker options={['Sleep summary', 'Sleep stages', 'Bedtime']} value={selected.style === 'Blank' || selected.style.startsWith('Step') ? 'Sleep summary' : selected.style} onSelect={(value) => setSelected((current) => ({ ...current, style: value, label: value === 'Bedtime' ? '10:42 PM' : '7h 42m' }))} /></>}
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
                <View style={styles.optionGrid}>{(['Rounded', 'Circle', 'Square', 'Pill', 'Squircle', 'Cut corner', 'Diamond', 'Heart', 'Arch', 'Hexagon'] as const).map((item) => <Pressable key={item} onPress={() => setShape(item)} style={[styles.optionButton, shape === item && styles.optionButtonActive]}><View style={[styles.shapeSample, item === 'Rounded' && { borderRadius: 8 }, item === 'Circle' && { borderRadius: 20 }, item === 'Pill' && { borderRadius: 20, width: 38 }, item === 'Squircle' && { borderRadius: 13 }, item === 'Diamond' && { transform: [{ rotate: '45deg' }] }, item === 'Heart' && { borderRadius: 4 }, shape === item && { borderColor: '#D7F36A' }]} /><Text style={[styles.optionText, shape === item && styles.optionTextActive]}>{item}</Text></Pressable>)}</View>
              </View>
              <View style={styles.customCard}>
                <Text style={styles.controlTitle}>Theme</Text><Text style={styles.controlSub}>Set the overall feel.</Text>
                <View style={styles.optionGrid}>{(['Liquid Glass', 'Solid Color', 'Gradient'] as const).map((item) => <Pressable key={item} onPress={() => setTheme(item)} style={[styles.themeButton, theme === item && styles.optionButtonActive]}><View style={[styles.themeSample, item === 'Liquid Glass' && styles.glassSample, item === 'Solid Color' && { backgroundColor: colors.background }, item === 'Gradient' && styles.gradientSample]} /><Text style={[styles.optionText, theme === item && styles.optionTextActive]}>{item}</Text></Pressable>)}</View>
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
              {selected.type === 'Weather' && <View style={styles.customCard}><Text style={styles.controlTitle}>Forecast layout</Text><Text style={styles.controlSub}>Choose how much weather to show.</Text><OptionPicker options={['Current conditions', 'Hourly forecast', 'Three-day forecast']} value={selected.style} onSelect={(value) => setSelected((current) => ({ ...current, style: value, label: value === 'Hourly forecast' ? '24°  25°  23°' : value === 'Three-day forecast' ? 'Today 24° · Sat 26°' : '24°' }))} /></View>}
              {selected.type === 'Battery' && <View style={styles.customCard}><Text style={styles.controlTitle}>Battery display</Text><Text style={styles.controlSub}>Choose the battery detail to emphasize.</Text><OptionPicker options={['Ring percentage', 'Compact percentage', 'Remaining time']} value={selected.style} onSelect={(value) => setSelected((current) => ({ ...current, style: value, label: value === 'Remaining time' ? '3h 14m left' : '82%' }))} /></View>}
              {selected.type === 'Calendar' && <View style={styles.customCard}><Text style={styles.controlTitle}>Calendar layout</Text><Text style={styles.controlSub}>Show the month or focus on your selected event.</Text><OptionPicker options={['Monthly calendar', 'Next event', 'Agenda list']} value={selected.style} onSelect={(value) => setSelected((current) => ({ ...current, style: value }))} /></View>}
              {selected.type === 'Music' && <View style={styles.customCard}><Text style={styles.controlTitle}>Music layout</Text><Text style={styles.controlSub}>Choose how the track and controls appear.</Text><OptionPicker options={['Album artwork', 'Playback controls', 'Track and progress']} value={selected.style} onSelect={(value) => setSelected((current) => ({ ...current, style: value }))} /></View>}
              {selected.type === 'Storage' && <View style={styles.customCard}><Text style={styles.controlTitle}>Storage layout</Text><Text style={styles.controlSub}>Choose which storage details are visible.</Text><OptionPicker options={['Used and free', 'Storage ring', 'Category breakdown']} value={selected.style} onSelect={(value) => setSelected((current) => ({ ...current, style: value }))} /></View>}
              {selected.type === 'Text' && <View style={styles.customCard}><Text style={styles.controlTitle}>Your text</Text><Text style={styles.controlSub}>Set a title and a short line for your widget.</Text><TextInput value={selected.title} onChangeText={(title) => setSelected((current) => ({ ...current, title }))} placeholder="Title" placeholderTextColor="#77786F" style={styles.scratchInput} /><TextInput value={selected.label} onChangeText={(label) => setSelected((current) => ({ ...current, label }))} placeholder="Your text" placeholderTextColor="#77786F" style={styles.scratchInput} /></View>}
              {selected.type !== 'Custom' && <Pressable onPress={addToHomeScreen} style={styles.addHomeButton}>
                <Text style={styles.addHomeIcon}>＋</Text>
                <View style={{ flex: 1 }}><Text style={styles.addHomeTitle}>Add to home screen</Text><Text style={styles.addHomeSub}>Your design will be ready in Widgets</Text></View>
                <Text style={styles.addHomeArrow}>↗</Text>
              </Pressable>}
              <View style={styles.note}><Text style={styles.noteIcon}>✦</Text><Text style={styles.noteText}>The launcher controls the final widget bounds after it is added.</Text></View>
        </View>}
>>>>>>> origin/master
      </Animated.ScrollView>
      <View pointerEvents="box-none" style={styles.bottomDock}>
        <View style={styles.bottomNav}>
          <Animated.View pointerEvents="none" style={[styles.navActiveCircle, { transform: [{ translateX: activePosition }] }]} />
          {tabs.map((item) => <Pressable key={item.name} onPress={() => changeTab(item.name)} style={styles.navItem} android_ripple={{ color: '#303127', borderless: true, radius: 24 }} accessibilityRole="tab" accessibilityLabel={item.name} accessibilityState={{ selected: tab === item.name }}>
            <View style={styles.navIconWrap}><Text style={[styles.navIcon, tab === item.name && styles.navIconActive]}>{item.icon}</Text></View>
          </Pressable>)}
        </View>
      </View>
      <Modal visible={widgetSheetVisible} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setWidgetSheetVisible(false)}>
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetScrim} onPress={() => setWidgetSheetVisible(false)} accessibilityLabel="Close widget preview" />
          <View style={styles.widgetSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}><View><Text style={styles.sheetEyebrow}>WIDGET PREVIEW</Text><Text style={styles.sheetTitle}>{previewTitle}</Text></View><Pressable onPress={() => setWidgetSheetVisible(false)} style={styles.sheetClose}><Text style={styles.sheetCloseText}>×</Text></Pressable></View>
            <View style={[styles.sheetWidgetPreview, { borderColor: theme === 'Liquid Glass' ? 'rgba(255,255,255,0.48)' : colors.border, borderRadius: shapeRadius, backgroundColor: theme === 'Liquid Glass' ? 'rgba(255,255,255,0.12)' : colors.background }]}>
<<<<<<< HEAD
              {selected.id === 'calendar' ? <View style={styles.sheetCalendarFace}>
                <Text style={[styles.calendarMonth, { color: colors.title }]}>{monthTitle}</Text>
                <Text style={[styles.calendarWeekdays, { color: colors.meta }]}>Su  Mo  Tu  We  Th  Fr  Sa</Text>
                {monthRows.map((row, index) => <Text key={index} style={[styles.sheetCalendarDays, { color: colors.value }]}>{row}</Text>)}
                <Text numberOfLines={1} style={[styles.sheetCalendarEvent, { color: colors.subtitle }]}>{calendarEvent ? `${calendarEvent.title} · ${formatEventDate(calendarEvent.startDate)}` : 'Choose one event'}</Text>
              </View> : <>
                <View style={styles.sheetPreviewMeta}><View style={[styles.miniIcon, { backgroundColor: `${colors.icon}20` }]}><Text style={{ color: colors.icon, fontSize: 19 }}>{selected.icon}</Text></View><Text style={[styles.previewType, { color: colors.meta }]}>{selected.type.toUpperCase()} · {sizeLabel.toUpperCase()}</Text></View>
                <Text style={[styles.sheetValue, { color: colors.value }]}>{selected.id === 'weather' ? '☀  ' : ''}{selected.label}</Text>
                <Text style={[styles.sheetSubtitle, { color: colors.subtitle }]}>{previewSubtitle}</Text>
              </>}
=======
              <WidgetSample widget={selected} large accent={theme === 'Liquid Glass' ? '#FFFFFF' : colors.value} clockMode={clockMode} analogClockStyle={analogClockStyle} digitalClockStyle={digitalClockStyle} clockHandColors={activeClockHandColors} timeFormat={timeFormat} showSeconds={showSeconds} showPeriod={showPeriod} clockZone={clockZone} secondClockZone={secondClockZone} showSecondClock={showSecondClock} now={clockNow} stepGoal={stepGoal} stepStyle={stepStyle} />
>>>>>>> origin/master
            </View>
            <View style={styles.sheetActions}>
              <Pressable onPress={() => { setWidgetSheetVisible(false); changeTab('Customize'); }} style={styles.customizeButton}><Text style={styles.customizeButtonText}>Customize</Text></Pressable>
              <Pressable onPress={addSelectedFromSheet} style={styles.addScreenButton}><Text style={styles.addScreenButtonText}>Add to screen</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={updatesVisible} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setUpdatesVisible(false)}>
        <View style={styles.sheetOverlay}><Pressable style={styles.sheetScrim} onPress={() => setUpdatesVisible(false)} /><View style={styles.widgetSheet}>
          <View style={styles.sheetHandle} /><Text style={styles.sheetEyebrow}>WIDGET STUDIO</Text><Text style={styles.sheetTitle}>App updates</Text>
          <Text style={styles.controlSub}>{updateStatus === 'checking' ? 'Checking for updates…' : updateStatus === 'available' ? `Version ${updateVersion} is ready to download.` : updateStatus === 'current' ? 'You’re up to date.' : updateStatus === 'downloading' ? 'Downloading update… Android will ask you to install it when ready.' : updateStatus === 'error' ? 'Could not check for updates. Try again.' : 'Check GitHub Releases for the newest version.'}</Text>
          <View style={styles.sheetActions}>{updateStatus === 'available' ? <Pressable onPress={downloadAndInstallUpdate} style={styles.addScreenButton}><Text style={styles.addScreenButtonText}>Download & install</Text></Pressable> : <Pressable disabled={updateStatus === 'checking' || updateStatus === 'downloading'} onPress={() => void checkForUpdates()} style={styles.addScreenButton}><Text style={styles.addScreenButtonText}>{updateStatus === 'checking' || updateStatus === 'downloading' ? 'Please wait…' : updateStatus === 'current' ? 'Check again' : 'Check for updates'}</Text></Pressable>}</View>
        </View></View>
      </Modal>
      <Modal visible={eventPickerVisible} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setEventPickerVisible(false)}>
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetScrim} onPress={() => setEventPickerVisible(false)} accessibilityLabel="Close event picker" />
          <View style={styles.eventPickerSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sectionTitle}>Choose one event</Text>
            <Text style={styles.sectionSub}>Upcoming events from your calendars.</Text>
            <ScrollView style={styles.eventList}>
              {calendarEvents.length === 0 ? <Text style={styles.helperText}>No upcoming events were found in the next 30 days.</Text> : calendarEvents.map((event) => <Pressable key={event.id} onPress={() => { setCalendarEvent(event); setEventPickerVisible(false); }} style={styles.eventOption}>
                <View style={styles.eventOptionCopy}><Text style={styles.controlTitle}>{event.title || 'Untitled event'}</Text><Text style={styles.controlSub}>{formatEventDate(event.startDate)}</Text></View>
                {calendarEvent?.id === event.id && <Text style={styles.calendarCheck}>✓</Text>}
              </Pressable>)}
            </ScrollView>
            <Pressable onPress={() => setEventPickerVisible(false)} style={styles.closeSheetButton}><Text style={styles.closeSheetText}>Done</Text></Pressable>
          </View>
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

<<<<<<< HEAD
function ColorControl({ label, value, onChange, onFinish }: {
  label: string; value: string; onChange: (value: string) => void; onFinish: () => void;
}) {
  const validColor = /^#[0-9A-Fa-f]{6}$/.test(value);
  return (
=======
const colorPickerStyles = StyleSheet.create({
  handCard: { borderTopWidth: 1, borderTopColor: '#2B2C25', marginTop: 16, paddingTop: 15 },
  button: { height: 40, flexDirection: 'row', alignItems: 'center', backgroundColor: '#23241F', borderRadius: 10, borderWidth: 1, borderColor: '#37382F', paddingHorizontal: 9 },
  buttonText: { color: '#E8E7DE', fontSize: 10, fontWeight: '600', flex: 1 },
  chevron: { color: '#A6A79A', fontSize: 19, marginLeft: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 9, marginTop: 20, marginBottom: 8 },
  option: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  optionSelected: { borderColor: '#D7F36A', borderWidth: 3 },
  check: { fontSize: 15, fontWeight: '900' },
  customToggle: { alignSelf: 'center', paddingVertical: 11, paddingHorizontal: 14 },
  customToggleText: { color: '#A6A79A', fontSize: 10, textDecorationLine: 'underline' },
  customRow: { flexDirection: 'row', gap: 9, marginTop: 3 },
  customInput: { flex: 1, height: 42, backgroundColor: '#23241F', borderRadius: 9, borderWidth: 1, borderColor: '#37382F', paddingHorizontal: 11, color: '#E8E7DE', fontSize: 12 },
  customApply: { minWidth: 78, height: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: '#D7F36A', borderRadius: 10 },
  customApplyDisabled: { opacity: 0.4 },
  customApplyText: { color: '#171812', fontSize: 11, fontWeight: '800' },
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
>>>>>>> origin/master
    <View style={styles.colorControl}>
      <Text style={styles.colorLabel}>{label}</Text>
      <View style={styles.colorInputRow}>
        <View style={[styles.colorSwatch, { backgroundColor: validColor ? value : '#383931' }]} />
<<<<<<< HEAD
        <TextInput
          value={value}
          onChangeText={onChange}
          onEndEditing={onFinish}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={7}
          placeholder="#RRGGBB"
          placeholderTextColor="#77786F"
          selectionColor="#D7F36A"
          style={styles.colorInput}
        />
      </View>
    </View>
  );
=======
        <TextInput value={value} onChangeText={onChange} onEndEditing={onFinish} autoCapitalize="characters" autoCorrect={false} maxLength={7} placeholder="#RRGGBB" placeholderTextColor="#77786F" selectionColor="#D7F36A" style={styles.colorInput} />
      </View>
    </View>
  );
  return (
    <View style={styles.colorControl}>
      <Text style={styles.colorLabel}>{label}</Text>
      <Pressable onPress={() => { setCustomHex(value); setVisible(true); }} style={colorPickerStyles.button} accessibilityRole="button" accessibilityLabel={`Choose ${label} color`}>
        <View style={[styles.colorSwatch, { backgroundColor: validColor ? value : '#383931' }]} />
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
                {value.toUpperCase() === color && <Text style={[colorPickerStyles.check, { color: ['#FFFFFF', '#D9D9D9', '#FFABAB', '#FFD3B6', '#FFE8A3', '#ECF5A0', '#B9E5C4', '#A7E8E8', '#B6DCFA', '#C6C5FA', '#E4C3FA', '#FAB8D0'].includes(color) ? '#171812' : '#FFFFFF' }]}>✓</Text>}
              </Pressable>
            ))}</View>
            <Pressable onPress={() => setCustomEntry((current) => !current)} style={colorPickerStyles.customToggle}><Text style={colorPickerStyles.customToggleText}>{customEntry ? 'Hide custom color' : 'Enter a custom color'}</Text></Pressable>
            {customEntry && <View style={colorPickerStyles.customRow}>
              <TextInput value={customHex} onChangeText={setCustomHex} autoCapitalize="characters" autoCorrect={false} maxLength={7} placeholder="#RRGGBB" placeholderTextColor="#77786F" selectionColor="#D7F36A" style={colorPickerStyles.customInput} />
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
        ? <Text key={index} style={[styles.clockTick, markerStyle, { color: '#F1EFE7', fontSize: large ? 9 : 7 }]}>♥</Text>
        : <View key={index} style={[styles.clockTick, markerStyle, { width: dot ? 4 : majorMark ? 2 : 1, height: dot ? 4 : majorMark ? (style === 'Railway markers' ? 10 : 9) : 4, backgroundColor: style === 'Sector dial' ? '#F1EFE7' : tint }]} />;
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
    {['California dial', 'Pilot Type A'].includes(style) && <Text style={{ position: 'absolute', top: large ? 17 : 10, left: center - 4, color: '#D7F36A', fontSize: large ? 9 : 6 }}>▲</Text>}
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
  const displayColor = widget.style === 'Matrix' ? '#63FF9A' : widget.style === 'Railway display' ? '#F1EFE7' : tint;
  return <View style={[styles.digitalFace, large && styles.digitalFaceLarge, framed && styles.flipClockFace, widget.style === 'Soft glow' && { backgroundColor: `${tint}18` }, widget.style === 'LED segments' && { backgroundColor: '#101A13', borderColor: '#356D45', borderWidth: 1, borderRadius: 8, padding: 7 }, widget.style === 'Matrix' && { backgroundColor: '#07150F', borderColor: '#2A6545', borderWidth: 1, borderRadius: 8, padding: 7 }, widget.style === 'Railway display' && { backgroundColor: '#18221F', borderColor: '#D14545', borderWidth: 1, borderRadius: 6, padding: 7 }]}>
    <Text style={[styles.digitalTime, large && styles.digitalTimeLarge, widget.style === 'Bold display' && { fontSize: large ? 46 : 18, fontWeight: '900' }, widget.style === 'Compact' && { fontSize: large ? 24 : 12 }, widget.style === 'Large display' && { fontSize: large ? 52 : 23, letterSpacing: -1 }, widget.style === 'LED segments' && { fontFamily: 'monospace', letterSpacing: 1 }, widget.style === 'Matrix' && { fontFamily: 'monospace', letterSpacing: 1, fontSize: large ? 31 : 17 }, { color: displayColor }]}>{formattedTime}</Text>
    <Text style={[styles.digitalDate, { fontSize: large ? 8 : 6 }]}>{zoneLabel(zone)}</Text>
    {widget.style === 'Stacked date' && <Text style={[styles.digitalDate, { color: '#F1EFE7' }]}>TODAY</Text>}
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
>>>>>>> origin/master
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#10110F' }, topbar: { height: 70, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#242520' },
  brandMark: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#D7F36A', alignItems: 'center', justifyContent: 'center' }, brandMarkText: { fontSize: 22, fontWeight: '800', color: '#10110F', letterSpacing: -2 }, brandCopy: { marginLeft: 11, flex: 1 }, brand: { color: '#F4F1E8', fontSize: 11, letterSpacing: 2.1, fontWeight: '800' }, brandSub: { color: '#85867D', fontSize: 11, marginTop: 3 }, avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#272922', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#393B31' }, avatarText: { color: '#D7F36A', fontWeight: '700' },
  content: { paddingHorizontal: 22, paddingBottom: 112 }, headingRow: { marginTop: 26, marginBottom: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, eyebrow: { color: '#A1A296', letterSpacing: 2, fontWeight: '700', fontSize: 9 }, heading: { color: '#F1EFE7', fontSize: 37, lineHeight: 40, fontWeight: '700', letterSpacing: -1.6, marginTop: 8 }, sparkle: { width: 55, height: 55, borderRadius: 20, borderWidth: 1, borderColor: '#393D2A', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '8deg' }] },
  previewShell: { backgroundColor: '#191A17', borderRadius: 23, padding: 14, borderWidth: 1, borderColor: '#282923' }, previewTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingHorizontal: 3 }, previewEyebrow: { color: '#AAA99D', fontSize: 9, letterSpacing: 1.7, fontWeight: '700', flex: 1 }, liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#D7F36A', marginRight: 5 }, liveText: { color: '#D7F36A', fontSize: 8, letterSpacing: 1.3, fontWeight: '800' }, widgetPreview: { overflow: 'hidden', position: 'relative', borderWidth: 1, padding: 0, justifyContent: 'flex-start' }, previewBackground: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }, previewIconPosition: { position: 'absolute' }, previewTextPosition: { position: 'absolute', width: '78%' }, miniIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, previewType: { color: '#919287', fontSize: 8, letterSpacing: 1.4, marginLeft: 9, flex: 1, fontWeight: '700' }, more: { color: '#8B8D81', letterSpacing: 2, fontSize: 12 }, previewValue: { fontSize: 36, fontWeight: '600', letterSpacing: -1.3, marginTop: 7 }, previewBottom: {}, previewTitle: { color: '#F1EFE7', fontSize: 13, fontWeight: '700' }, previewSubtitle: { color: '#929389', fontSize: 10, marginTop: 3 }, calendarFace: { paddingHorizontal: 17, paddingVertical: 9 }, calendarMonth: { fontSize: 16, fontWeight: '800', marginBottom: 5 }, calendarWeekdays: { fontSize: 8, letterSpacing: 0.1, fontWeight: '700' }, calendarDays: { fontSize: 9, lineHeight: 12, fontVariant: ['tabular-nums'] }, calendarEvent: { fontSize: 8, marginTop: 2 }, previewFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12 }, previewHint: { color: '#85867C', fontSize: 9, flex: 1 }, saveButton: { backgroundColor: '#D7F36A', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, marginLeft: 8 }, saveButtonDone: { backgroundColor: '#D7F36A' }, saveButtonText: { color: '#171812', fontWeight: '800', fontSize: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 27, marginBottom: 13 }, sectionTitle: { color: '#F1EFE7', fontSize: 17, fontWeight: '700', letterSpacing: -0.35 }, sectionSub: { color: '#8F9086', fontSize: 11, marginTop: 4 }, count: { color: '#7E8075', fontSize: 8, letterSpacing: 1.4, fontWeight: '700', marginBottom: 2 }, chips: { paddingTop: 12, paddingBottom: 13, gap: 7 }, chip: { borderRadius: 20, paddingHorizontal: 13, paddingVertical: 8, borderWidth: 1, borderColor: '#303129', backgroundColor: '#191A17' }, chipActive: { backgroundColor: '#D7F36A', borderColor: '#D7F36A' }, chipText: { color: '#B0B1A5', fontSize: 10, fontWeight: '600' }, chipTextActive: { color: '#191A14', fontWeight: '800' }, grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 11 }, templateCard: { borderRadius: 17, backgroundColor: '#191A17', padding: 8, borderWidth: 1, borderColor: '#292A24' }, templateSelected: { borderColor: '#D7F36A', backgroundColor: '#1E2018' }, templateArt: { height: 105, borderRadius: 11, overflow: 'hidden', padding: 10, justifyContent: 'space-between' }, artOrb: { position: 'absolute', width: 100, height: 100, borderRadius: 50, opacity: 0.1, top: -30, right: -20 }, artSymbol: { fontSize: 21, position: 'absolute', top: 9, right: 11 }, artLabel: { fontWeight: '700', fontSize: 22, letterSpacing: -0.7, marginTop: 21 }, artTime: { color: '#AAA99D', fontSize: 8, letterSpacing: 1.1 }, artLine: { position: 'absolute', height: 2, width: 25, backgroundColor: '#F1EFE7', opacity: 0.35, bottom: 15, right: 12, borderRadius: 2 }, templateInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 3, paddingTop: 9, paddingBottom: 2 }, templateTitle: { color: '#EDEBE3', fontSize: 11, fontWeight: '700' }, templateType: { color: '#8B8C81', fontSize: 9, marginTop: 3 }, selectDot: { width: 17, height: 17, borderRadius: 9, borderWidth: 1, borderColor: '#55564C', alignItems: 'center', justifyContent: 'center' }, check: { fontSize: 10, color: '#171812', fontWeight: '900' }, editIcon: { color: '#D7F36A', fontSize: 20, marginBottom: -1 },
  customCard: { backgroundColor: '#191A17', borderRadius: 17, borderWidth: 1, borderColor: '#292A24', paddingHorizontal: 15, paddingVertical: 16, marginTop: 16 }, customRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, controlTitle: { color: '#EDEBE3', fontSize: 12, fontWeight: '700' }, controlSub: { color: '#8C8D82', fontSize: 9, marginTop: 4 }, palette: { flexDirection: 'row', gap: 7 }, swatch: { width: 23, height: 23, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, swatchSelected: { borderColor: '#F5F3E9', borderWidth: 2 }, swatchCheck: { color: '#171812', fontSize: 10, fontWeight: '900' }, divider: { height: 1, backgroundColor: '#2B2C25', marginVertical: 2 }, sizeGroup: { flexDirection: 'row', gap: 5, padding: 4, borderRadius: 10, backgroundColor: '#24251F' }, sizeOption: { width: 27, height: 27, borderRadius: 7, alignItems: 'center', justifyContent: 'center' }, sizeOptionActive: { backgroundColor: '#D7F36A' }, sizeText: { color: '#999A8F', fontSize: 11, fontWeight: '700' }, sizeTextActive: { color: '#171812' }, note: { flexDirection: 'row', marginTop: 17, marginBottom: 10, alignItems: 'center', paddingHorizontal: 4 }, noteIcon: { color: '#D7F36A', fontSize: 14, marginRight: 8 }, noteText: { color: '#84857A', fontSize: 10, lineHeight: 15, flex: 1 },
<<<<<<< HEAD
  modeSwitch: { flexDirection: 'row', backgroundColor: '#24251F', borderRadius: 12, padding: 4, marginTop: 14, marginBottom: 5 }, modeButton: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 9 }, modeButtonActive: { backgroundColor: '#D7F36A' }, modeText: { color: '#9A9B90', fontSize: 11, fontWeight: '700' }, modeTextActive: { color: '#171812' }, helperText: { color: '#96978B', fontSize: 10, lineHeight: 15, marginTop: 12 }, optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 13 }, optionButton: { flexGrow: 1, minWidth: '21%', minHeight: 64, borderRadius: 12, borderWidth: 1, borderColor: '#34352D', backgroundColor: '#20211D', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }, themeButton: { flexGrow: 1, minWidth: '29%', minHeight: 76, borderRadius: 12, borderWidth: 1, borderColor: '#34352D', backgroundColor: '#20211D', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7, gap: 6 }, optionButtonActive: { borderColor: '#D7F36A', backgroundColor: '#25291D' }, optionText: { color: '#A4A59A', fontSize: 9, fontWeight: '600' }, optionTextActive: { color: '#F0F0E8' }, shapeSample: { width: 27, height: 27, borderRadius: 5, borderWidth: 1, borderColor: '#85867B', marginBottom: 5 }, themeSample: { width: 36, height: 23, borderRadius: 7, backgroundColor: '#33352D', borderWidth: 1, borderColor: '#55564D' }, glassSample: { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.55)' }, gradientSample: { backgroundColor: '#66778D', borderColor: '#66778D' }, colorGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12, marginTop: 16 }, colorControl: { width: '48%', marginBottom: 2 }, colorLabel: { color: '#B9BAAF', fontSize: 9, fontWeight: '600', marginBottom: 6 }, colorInputRow: { height: 38, flexDirection: 'row', alignItems: 'center', backgroundColor: '#23241F', borderRadius: 9, borderWidth: 1, borderColor: '#37382F', paddingHorizontal: 7 }, colorSwatch: { width: 17, height: 17, borderRadius: 5, marginRight: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)' }, colorInput: { flex: 1, color: '#E8E7DE', fontSize: 10, paddingVertical: 0 }, glassNotice: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#20211D', borderRadius: 14, padding: 14, marginTop: 16, borderWidth: 1, borderColor: '#3B3D34' }, glassNoticeIcon: { color: '#E7F2FF', fontSize: 18, marginRight: 10 }, glassNoticeText: { flex: 1, color: '#AEB6BF', fontSize: 10, lineHeight: 15 }, stepperRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, stepperLabel: { color: '#D9D8CE', fontSize: 11, fontWeight: '600' }, stepperControls: { minWidth: 126, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#24251F', borderRadius: 10, padding: 4 }, stepperButton: { width: 31, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#303129' }, stepperButtonText: { color: '#D7F36A', fontSize: 15, fontWeight: '700' }, stepperValue: { color: '#F0EFE7', minWidth: 48, textAlign: 'center', fontSize: 10, fontWeight: '700' },
=======
  modeSwitch: { flexDirection: 'row', backgroundColor: '#24251F', borderRadius: 12, padding: 4, marginTop: 14, marginBottom: 5 }, modeButton: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 9 }, modeButtonActive: { backgroundColor: '#D7F36A' }, modeText: { color: '#9A9B90', fontSize: 11, fontWeight: '700' }, modeTextActive: { color: '#171812' }, helperText: { color: '#96978B', fontSize: 10, lineHeight: 15, marginTop: 12 }, fullPageButton: { minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#414238', marginTop: 9 }, fullPageText: { color: '#D7F36A', fontSize: 10, fontWeight: '700' }, optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 13 }, optionButton: { flexGrow: 1, minWidth: '21%', minHeight: 64, borderRadius: 12, borderWidth: 1, borderColor: '#34352D', backgroundColor: '#20211D', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }, themeButton: { flexGrow: 1, minWidth: '29%', minHeight: 76, borderRadius: 12, borderWidth: 1, borderColor: '#34352D', backgroundColor: '#20211D', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7, gap: 6 }, optionButtonActive: { borderColor: '#D7F36A', backgroundColor: '#25291D' }, optionText: { color: '#A4A59A', fontSize: 9, fontWeight: '600' }, optionTextActive: { color: '#F0F0E8' }, shapeSample: { width: 27, height: 27, borderRadius: 5, borderWidth: 1, borderColor: '#85867B', marginBottom: 5 }, themeSample: { width: 36, height: 23, borderRadius: 7, backgroundColor: '#33352D', borderWidth: 1, borderColor: '#55564D' }, glassSample: { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.55)' }, gradientSample: { backgroundColor: '#66778D', borderColor: '#66778D' }, colorGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12, marginTop: 16 }, colorControl: { width: '48%', marginBottom: 2 }, colorLabel: { color: '#B9BAAF', fontSize: 9, fontWeight: '600', marginBottom: 6 }, colorInputRow: { height: 38, flexDirection: 'row', alignItems: 'center', backgroundColor: '#23241F', borderRadius: 9, borderWidth: 1, borderColor: '#37382F', paddingHorizontal: 7 }, colorSwatch: { width: 17, height: 17, borderRadius: 5, marginRight: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)' }, colorInput: { flex: 1, color: '#E8E7DE', fontSize: 10, paddingVertical: 0 }, glassNotice: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#20211D', borderRadius: 14, padding: 14, marginTop: 16, borderWidth: 1, borderColor: '#3B3D34' }, glassNoticeIcon: { color: '#E7F2FF', fontSize: 18, marginRight: 10 }, glassNoticeText: { flex: 1, color: '#AEB6BF', fontSize: 10, lineHeight: 15 }, stepperRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, stepperLabel: { color: '#D9D8CE', fontSize: 11, fontWeight: '600' }, stepperControls: { minWidth: 126, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#24251F', borderRadius: 10, padding: 4 }, stepperButton: { width: 31, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#303129' }, stepperButtonText: { color: '#D7F36A', fontSize: 15, fontWeight: '700' }, stepperValue: { color: '#F0EFE7', minWidth: 48, textAlign: 'center', fontSize: 10, fontWeight: '700' },
>>>>>>> origin/master
  emptyState: { minHeight: 145, borderRadius: 17, backgroundColor: '#191A17', borderWidth: 1, borderColor: '#292A24', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }, emptyIcon: { color: '#D7F36A', fontSize: 25 }, emptyTitle: { color: '#EDEBE3', fontSize: 13, fontWeight: '700', marginTop: 9 }, emptySub: { color: '#8C8D82', fontSize: 10, marginTop: 5 },
  addHomeButton: { minHeight: 66, borderRadius: 15, backgroundColor: '#D7F36A', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginTop: 12 }, addHomeIcon: { fontSize: 23, color: '#171812', fontWeight: '600', marginRight: 12 }, addHomeTitle: { color: '#171812', fontSize: 12, fontWeight: '800' }, addHomeSub: { color: '#454A31', fontSize: 9, marginTop: 3 }, addHomeArrow: { color: '#171812', fontSize: 18, fontWeight: '700' },
  settingsCard: { backgroundColor: '#191A17', borderRadius: 20, borderWidth: 1, borderColor: '#292A24', paddingHorizontal: 16, marginTop: 4 }, settingsIntro: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18 }, settingsIntroIcon: { color: '#D7F36A', fontSize: 24, marginRight: 13 }, settingsRow: { minHeight: 65, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, settingsValue: { color: '#D7F36A', fontSize: 15, fontWeight: '700', marginRight: 4 }, settingsChevron: { color: '#85867D', fontSize: 23, marginRight: 4 },
  bottomDock: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', backgroundColor: 'transparent' }, bottomNav: { alignSelf: 'center', width: 202, height: 62, borderRadius: 31, borderWidth: 1, borderColor: '#37382F', backgroundColor: '#1A1B17', flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', marginTop: 8, marginBottom: 18, paddingHorizontal: 8, shadowColor: '#000000', shadowOpacity: 0.28, shadowRadius: 18, shadowOffset: { width: 0, height: 7 }, elevation: 9 }, navActiveCircle: { position: 'absolute', left: 19, top: 8, width: 44, height: 44, borderRadius: 22, backgroundColor: '#D7F36A' }, navItem: { width: 54, height: 50, borderRadius: 27, alignItems: 'center', justifyContent: 'center' }, navIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, navIcon: { color: '#929388', fontSize: 20, fontWeight: '600' }, navIconActive: { color: '#171812' },
  sheetOverlay: { flex: 1, justifyContent: 'flex-end' }, sheetScrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.58)' }, widgetSheet: { backgroundColor: '#191A17', borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, borderColor: '#34352D', paddingHorizontal: 22, paddingTop: 10, paddingBottom: 30 }, sheetHandle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: '#55564D', marginBottom: 18 }, sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }, sheetEyebrow: { color: '#A1A296', fontSize: 9, letterSpacing: 1.6, fontWeight: '700' }, sheetTitle: { color: '#F1EFE7', fontSize: 20, fontWeight: '700', marginTop: 4 }, sheetClose: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#292A24' }, sheetCloseText: { color: '#C8C8BB', fontSize: 22, lineHeight: 24 }, sheetWidgetPreview: { minHeight: 184, borderRadius: 18, borderWidth: 1, overflow: 'hidden', backgroundColor: '#24251F', padding: 16, justifyContent: 'space-between' }, sheetGlow: { position: 'absolute', width: 150, height: 150, borderRadius: 75, opacity: 0.08, right: -30, top: 15 }, sheetPreviewMeta: { flexDirection: 'row', alignItems: 'center' }, sheetValue: { fontSize: 38, fontWeight: '700', letterSpacing: -1.2 }, sheetSubtitle: { color: '#B1B2A7', fontSize: 11, marginTop: -8 }, sheetCalendarFace: { flex: 1, justifyContent: 'space-evenly' }, sheetCalendarDays: { fontSize: 9, lineHeight: 11, fontVariant: ['tabular-nums'] }, sheetCalendarEvent: { fontSize: 8, marginTop: 1 }, sheetActions: { flexDirection: 'row', gap: 10, marginTop: 16 }, customizeButton: { flex: 1, minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: '#55564C', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' }, customizeButtonText: { color: '#E8E6DE', fontSize: 12, fontWeight: '700' }, addScreenButton: { flex: 1.25, minHeight: 52, borderRadius: 14, backgroundColor: '#D7F36A', alignItems: 'center', justifyContent: 'center' }, addScreenButtonText: { color: '#171812', fontSize: 12, fontWeight: '800' },
  eventPickerSheet: { backgroundColor: '#191A17', borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, borderColor: '#34352D', paddingHorizontal: 22, paddingTop: 10, paddingBottom: 22, maxHeight: '76%' }, eventList: { marginTop: 14 }, eventOption: { minHeight: 62, borderBottomWidth: 1, borderBottomColor: '#2B2C25', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, eventOptionCopy: { flex: 1, paddingVertical: 11, paddingRight: 12 }, calendarCheck: { color: '#D7F36A', fontWeight: '800', fontSize: 16 }, calendarPickButton: { color: '#D7F36A', fontSize: 11, fontWeight: '700', marginTop: 12 }, closeSheetButton: { height: 46, marginTop: 14, backgroundColor: '#D7F36A', borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, closeSheetText: { color: '#171812', fontWeight: '800', fontSize: 12 },
<<<<<<< HEAD
=======
  createScratchButton: { minHeight: 69, flexDirection: 'row', alignItems: 'center', backgroundColor: '#191A17', borderRadius: 16, borderWidth: 1, borderColor: '#3B3D32', paddingHorizontal: 14, marginTop: 8, marginBottom: 8 }, createScratchIcon: { color: '#D7F36A', fontSize: 24, marginRight: 12 }, typeButton: { flexGrow: 1, minWidth: '30%', minHeight: 40, paddingHorizontal: 10, borderRadius: 11, borderWidth: 1, borderColor: '#34352D', alignItems: 'center', justifyContent: 'center', backgroundColor: '#20211D' }, scratchEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 }, scratchStar: { color: '#D7F36A', fontSize: 28 }, scratchInput: { height: 44, marginTop: 10, borderWidth: 1, borderColor: '#37382F', borderRadius: 11, backgroundColor: '#23241F', paddingHorizontal: 12, color: '#F1EFE7', fontSize: 12 }, toggleRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, toggleTrack: { width: 43, height: 25, borderRadius: 13, padding: 3, justifyContent: 'center', backgroundColor: '#42433B' }, toggleTrackActive: { backgroundColor: '#647A2B' }, toggleThumb: { width: 19, height: 19, borderRadius: 10, backgroundColor: '#F0EFE7' }, toggleThumbActive: { alignSelf: 'flex-end', backgroundColor: '#D7F36A' }, sampleContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 5 }, sampleLarge: { padding: 8 }, clockFace: { width: 96, height: 96, borderRadius: 15, borderWidth: 1, borderColor: '#717268', backgroundColor: '#191A17', alignItems: 'center', justifyContent: 'center', position: 'relative' }, clockFaceLarge: { width: 152, height: 152, borderRadius: 100 }, clockTick: { position: 'absolute', borderRadius: 3 }, clockNumber: { position: 'absolute', color: '#F1EFE7', fontSize: 11, fontWeight: '700' }, clockNumberLarge: { fontSize: 18 }, clockHandPivot: { position: 'absolute', width: 0, height: 0 }, clockHand: { position: 'absolute', borderRadius: 2 }, clockPin: { position: 'absolute', width: 7, height: 7, borderRadius: 4 }, analogWrap: { alignItems: 'center' }, clockPairRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' }, digitalFace: { alignItems: 'center', justifyContent: 'center' }, digitalFaceLarge: { gap: 7 }, flipClockFace: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#62645A', backgroundColor: '#1B1C19' }, digitalTime: { color: '#D7F36A', fontSize: 20, fontWeight: '700', letterSpacing: -0.5 }, digitalTimeLarge: { fontSize: 38, letterSpacing: -1.3 }, digitalDate: { color: '#96978B', fontSize: 8, letterSpacing: 1, textAlign: 'center', marginTop: 5 }, sampleIcon: { color: '#D7F36A', fontSize: 20, marginBottom: 4 }, sampleValue: { color: '#D7F36A', fontSize: 15, fontWeight: '700', textAlign: 'center' }, stepsValue: { fontSize: 21, fontWeight: '700' }, stepsTrack: { width: '85%', height: 5, backgroundColor: '#393A33', borderRadius: 3, overflow: 'hidden', marginTop: 8 }, stepsFill: { height: '100%', borderRadius: 3 }, stepsBars: { height: 78, flexDirection: 'row', alignItems: 'flex-end', gap: 5 }, stepsBar: { width: 8, borderRadius: 5 },
>>>>>>> origin/master
});
