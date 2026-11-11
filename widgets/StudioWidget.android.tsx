import { Box, Column, Row, Text } from '@expo/ui/jetpack-compose';
import { createWidget } from 'expo-widgets';
import { background, cornerRadius, fillMaxSize, paddingAll } from '@expo/ui/jetpack-compose/modifiers';
type ContentAlignment = 'topStart' | 'topCenter' | 'topEnd' | 'centerStart' | 'center' | 'centerEnd' | 'bottomStart' | 'bottomCenter' | 'bottomEnd';

type WidgetColors = {
  background: string; border: string; icon: string; value: string; title: string; subtitle: string; meta: string;
};
type WidgetPositions = { iconX: number; iconY: number; textX: number; textY: number };
type ClockHandColors = { hour: string; minute: string; second: string; separator: string };
type StudioWidgetProps = {
  title: string; subtitle: string; value: string; accent: string; icon: string; size: string;
  widgetKind: string; monthTitle: string; monthRows: string[];
  layoutMode: 'Fixed' | 'Adaptive'; widthCells: number; heightCells: number; shape: string; theme: string;
  colors: WidgetColors; positions: WidgetPositions; gradientEnd: string;
  clockMode: string; timeFormat: string; showSeconds: boolean; showPeriod: boolean; clockStyle: string; stepStyle: string; stepGoal: number;
  clockZone: string; secondClockZone: string; showSecondClock: boolean;
  clockHandColors: ClockHandColors; analogClockStyle: string; digitalClockStyle: string;
};

const StudioWidget = (props: StudioWidgetProps) => {
  'widget';
  const alignmentFor = (x: number, y: number): ContentAlignment => {
    const horizontal = x < 34 ? 'Start' : x > 66 ? 'End' : 'Center';
    const vertical = y < 34 ? 'top' : y > 66 ? 'bottom' : 'center';
    if (vertical === 'center' && horizontal === 'Center') return 'center';
    return `${vertical}${horizontal}` as ContentAlignment;
  };
  // Glance (the Android home-screen widget renderer) only supports a fixed
  // modifier set: padding, size, fillMax, background, and cornerRadius.
  // clip(Shapes...), border(), and rotate() are app-UI-only modifiers that are
  // silently ignored in the widget runtime, so widget shapes use cornerRadius
  // and analog clocks fall back to a digital time readout (no rotating hands
  // is possible on a real home-screen widget).
  const shapeCornerRadius = (shape: string): number => {
    switch (shape) {
      case 'Circle':
      case 'Pill': return 999;
      case 'Square':
      case 'Cut corner': return 4;
      case 'Squircle': return 32;
      case 'Diamond':
      case 'Heart':
      case 'Arch':
      case 'Hexagon': return 20;
      default: return 22;
    }
  };
  const widgetCornerRadius = shapeCornerRadius(props.shape);
  const glass = props.theme === 'Liquid Glass';
  const transparent = props.theme === 'Transparent';
  const fill = transparent ? '#00000000' : glass ? '#38FFFFFF' : props.colors.background;
  const borderColor = transparent ? '#00000000' : glass ? '#72FFFFFF' : props.colors.border;
  const gradientTint = `#55${props.gradientEnd.replace('#', '')}`;
  // Widget layouts run in an isolated runtime. Keep every helper used by this
  // component in its function body so it is included in the generated widget
  // bundle (including the launcher/gallery preview bundle).
  const widgetTime = (zone: string, format: string, seconds: boolean, period: boolean) => {
    const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hourCycle: format === '12-hour' ? 'h12' : 'h23' };
    if (zone !== 'local') options.timeZone = zone;
    if (seconds) options.second = '2-digit';
    const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(new Date());
    const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '00';
    const time = `${value('hour')}:${value('minute')}${seconds ? `:${value('second')}` : ''}`;
    return format === '12-hour' && period ? `${time} ${value('dayPeriod')}` : time;
  };

  const zoneShortLabel = (zone: string) => zone === 'local' ? 'LOCAL' : zone.split('/').pop()?.replaceAll('_', ' ').toUpperCase() ?? zone;

  const DigitalFace = ({ props: faceProps, glass: faceGlass, zone, time }: { props: StudioWidgetProps; glass: boolean; zone: string; time: string }) => {
    const framed = ['Flip style', 'Split-flap', 'LED segments', 'Matrix', 'Railway display'].includes(faceProps.digitalClockStyle);
    const tint = faceGlass ? '#FFFFFF' : faceProps.colors.value;
    const displayColor = faceGlass ? '#FFFFFF' : faceProps.digitalClockStyle === 'Matrix' ? '#63FF9A' : faceProps.digitalClockStyle === 'Railway display' ? '#F1EFE7' : tint;
    const clockFontSize = faceProps.digitalClockStyle === 'Compact' ? 17 : faceProps.digitalClockStyle === 'Bold display' ? 27 : faceProps.digitalClockStyle === 'Large display' ? 31 : 23;
    const digitStyle = { fontSize: clockFontSize, fontWeight: faceProps.digitalClockStyle === 'Bold display' || faceProps.digitalClockStyle === 'Large display' ? ('900' as const) : ('700' as const), letterSpacing: faceProps.digitalClockStyle === 'Compact' ? -1 : ['LED segments', 'Matrix'].includes(faceProps.digitalClockStyle) ? 1 : 0, fontFamily: ['LED segments', 'Matrix'].includes(faceProps.digitalClockStyle) ? ('monospace' as const) : ('default' as const) };
    const clockColors = faceGlass ? { ...faceProps.clockHandColors, hour: '#FFFFFF', minute: '#FFFFFF', second: '#FFFFFF', separator: '#FFFFFF' } : faceProps.clockHandColors;
    const timeParts = time.match(/^(\d{1,2})(:)(\d{2})(?::(\d{2}))?(.*)$/);
    const now = new Date();
    const date = new Intl.DateTimeFormat(undefined, { timeZone: zone === 'local' ? undefined : zone, weekday: 'short', month: 'short', day: 'numeric' }).format(now).toUpperCase();
    const frameBackground = faceGlass ? '#24FFFFFF' : faceProps.digitalClockStyle === 'Matrix' ? '#07150F' : faceProps.digitalClockStyle === 'LED segments' ? '#101A13' : faceProps.digitalClockStyle === 'Railway display' ? '#18221F' : '#303129';
    return <Box contentAlignment="center" modifiers={framed ? [cornerRadius(12), background(frameBackground), paddingAll(8)] : []}>
      <Column>
        <Text color={faceGlass ? '#E8EDF4' : faceProps.colors.meta} style={{ fontSize: 8 }}>{faceProps.digitalClockStyle}</Text>
        {timeParts ? <Row>
          <Text color={clockColors.hour} style={digitStyle}>{timeParts[1]}</Text>
          <Text color={clockColors.separator} style={digitStyle}>{timeParts[2]}</Text>
          <Text color={clockColors.minute} style={digitStyle}>{timeParts[3]}</Text>
          {timeParts[4] && <Text color={clockColors.separator} style={digitStyle}>:</Text>}
          {timeParts[4] && <Text color={clockColors.second} style={digitStyle}>{timeParts[4]}</Text>}
          {!!timeParts[5] && <Text color={displayColor} style={{ fontSize: 9, fontWeight: '700' }}>{timeParts[5]}</Text>}
        </Row> : <Text color={displayColor} style={digitStyle}>{time}</Text>}
        {faceProps.digitalClockStyle === 'Stacked date' && <Text color={faceGlass ? '#FFFFFF' : faceProps.colors.title} style={{ fontSize: 9, fontWeight: '700' }}>{date}</Text>}
        <Text color={faceGlass ? '#E8EDF4' : faceProps.colors.subtitle} style={{ fontSize: 8 }}>{zoneShortLabel(zone)}</Text>
      </Column>
    </Box>;
  };

  const ClockSample = ({ props: clockProps, glass: clockGlass }: { props: StudioWidgetProps; glass: boolean }) => {
    const time = widgetTime(clockProps.clockZone, clockProps.timeFormat, clockProps.showSeconds, clockProps.showPeriod);
    const secondTime = widgetTime(clockProps.secondClockZone, clockProps.timeFormat, clockProps.showSeconds, clockProps.showPeriod);
    if (clockProps.showSecondClock) return <Column>
      <Box contentAlignment="center" modifiers={[fillMaxSize()]}>
        <Box contentAlignment="centerStart" modifiers={[fillMaxSize(0.48)]}><DigitalFace props={clockProps} glass={clockGlass} zone={clockProps.clockZone} time={time} /></Box>
        <Box contentAlignment="centerEnd" modifiers={[fillMaxSize(0.48)]}><DigitalFace props={clockProps} glass={clockGlass} zone={clockProps.secondClockZone} time={secondTime} /></Box>
      </Box>
      <Text color={clockGlass ? '#E8EDF4' : clockProps.colors.meta} style={{ fontSize: 8 }}>{zoneShortLabel(clockProps.clockZone)}                {zoneShortLabel(clockProps.secondClockZone)}</Text>
    </Column>;
    return <DigitalFace props={clockProps} glass={clockGlass} zone={clockProps.clockZone} time={time} />;
  };

  return (
    <Box modifiers={[fillMaxSize(), cornerRadius(widgetCornerRadius), background(borderColor), paddingAll(1)]}>
      <Box modifiers={[fillMaxSize(), cornerRadius(widgetCornerRadius), background(fill), paddingAll(12)]}>
        {props.theme === 'Gradient' && <Box contentAlignment="bottomEnd" modifiers={[fillMaxSize(0.72), cornerRadius(widgetCornerRadius), background(gradientTint)]} />}
        {props.widgetKind.startsWith('clock-') ? <ClockSample props={props} glass={glass} />
          : props.widgetKind === 'calendar' ? <Column>
          <Text color={glass ? '#FFFFFF' : props.colors.title} style={{ fontSize: 16, fontWeight: '700' }}>{props.monthTitle}</Text>
          <Text color={glass ? '#E8EDF4' : props.colors.meta} style={{ fontSize: 8, fontWeight: '700', fontFamily: 'monospace' }}>Su Mo Tu We Th Fr Sa</Text>
          {props.monthRows.map((row, index) => <Text key={index} color={glass ? '#FFFFFF' : props.colors.value} style={{ fontSize: 9, fontFamily: 'monospace' }}>{row}</Text>)}
          <Text color={glass ? '#FFFFFF' : props.colors.title} style={{ fontSize: 10, fontWeight: '700' }}>{props.title}</Text>
          <Text color={glass ? '#E8EDF4' : props.colors.subtitle} style={{ fontSize: 8 }}>{props.subtitle}</Text>
        </Column> : props.widgetKind.includes('steps') ? <Column>
          <Text color={glass ? '#FFFFFF' : props.colors.value} style={{ fontSize: 28, fontWeight: '700' }}>{props.value}</Text>
          <Text color={glass ? '#E8EDF4' : props.colors.subtitle} style={{ fontSize: 10 }}>of {props.stepGoal.toLocaleString()} steps</Text>
          <Text color={glass ? '#FFFFFF' : props.colors.icon} style={{ fontSize: 13, letterSpacing: 1 }}>● ● ● ● ● ● ● ● ○ ○</Text>
          <Text color={glass ? '#E8EDF4' : props.colors.meta} style={{ fontSize: 9 }}>{props.stepStyle}</Text>
        </Column> : <Box modifiers={[fillMaxSize()]}>
          <Box contentAlignment={alignmentFor(props.positions.iconX, props.positions.iconY)} modifiers={[fillMaxSize()]}>
            <Text color={glass ? '#FFFFFF' : props.colors.icon} style={{ fontSize: 22, fontWeight: '700' }}>{props.icon}</Text>
          </Box>
          <Box contentAlignment={alignmentFor(props.positions.textX, props.positions.textY)} modifiers={[fillMaxSize()]}>
            <Column>
              <Text color={glass ? '#E8EDF4' : props.colors.meta} style={{ fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>{props.size.toUpperCase()}</Text>
              <Text color={glass ? '#FFFFFF' : props.colors.value} style={{ fontSize: 28, fontWeight: '700' }}>{props.value}</Text>
              <Text color={glass ? '#FFFFFF' : props.colors.title} style={{ fontSize: 14, fontWeight: '700' }}>{props.title}</Text>
              <Text color={glass ? '#E8EDF4' : props.colors.subtitle} style={{ fontSize: 10 }}>{props.subtitle}</Text>
            </Column>
          </Box>
        </Box>}
      </Box>
    </Box>
  );
};

const defaultWidgetProps: StudioWidgetProps = {
  title: 'Soft Hours',
  subtitle: 'A calmer way to check the time',
  value: '09:41',
  accent: '#D7F36A',
  icon: '◷',
  size: 'ADAPTIVE',
  widgetKind: 'clock-digital',
  clockMode: 'Digital', timeFormat: '12-hour', showSeconds: true, showPeriod: true, clockStyle: 'Clean digital', analogClockStyle: 'Classic numerals', digitalClockStyle: 'Clean digital', clockHandColors: { hour: '#D7F36A', minute: '#F1EFE7', second: '#FF796D', separator: '#F1EFE7' }, stepStyle: 'Step ring', stepGoal: 10000,
  clockZone: 'local', secondClockZone: 'Asia/Tokyo', showSecondClock: false,
  monthTitle: 'January 2026',
  monthRows: [' 1  2  3  4  5  6  7'],
  layoutMode: 'Adaptive',
  widthCells: 3,
  heightCells: 2,
  shape: 'Rounded',
  theme: 'Solid Color',
  colors: { background: '#24251F', border: '#3C4030', icon: '#D7F36A', value: '#D7F36A', title: '#F1EFE7', subtitle: '#A6A79A', meta: '#A6A79A' },
  positions: { iconX: 8, iconY: 10, textX: 10, textY: 42 },
  gradientEnd: '#536B84',
};

const primaryWidget = createWidget('StudioWidget', StudioWidget, defaultWidgetProps);
export default primaryWidget;
export const widgetSlots: Record<string, typeof primaryWidget> = {
  StudioWidget: primaryWidget,
  StudioWidget2: createWidget('StudioWidget2', StudioWidget, defaultWidgetProps),
  StudioWidget3: createWidget('StudioWidget3', StudioWidget, defaultWidgetProps),
  StudioWidget4: createWidget('StudioWidget4', StudioWidget, defaultWidgetProps),
  StudioWidget5: createWidget('StudioWidget5', StudioWidget, defaultWidgetProps),
  StudioWidget6: createWidget('StudioWidget6', StudioWidget, defaultWidgetProps),
  StudioWidget7: createWidget('StudioWidget7', StudioWidget, defaultWidgetProps),
  StudioWidget8: createWidget('StudioWidget8', StudioWidget, defaultWidgetProps),
  StudioWidget9: createWidget('StudioWidget9', StudioWidget, defaultWidgetProps),
  StudioWidget10: createWidget('StudioWidget10', StudioWidget, defaultWidgetProps),
  StudioWidget11: createWidget('StudioWidget11', StudioWidget, defaultWidgetProps),
  StudioWidget12: createWidget('StudioWidget12', StudioWidget, defaultWidgetProps),
};
