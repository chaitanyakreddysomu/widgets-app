import { Box, Column, Row, Text } from '@expo/ui/jetpack-compose';
import { createWidget } from 'expo-widgets';
import { background, border, clip, fillMaxSize, height, paddingAll, rotate, Shapes, size, width } from '@expo/ui/jetpack-compose/modifiers';
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
  const widgetShape = props.shape === 'Circle' ? Shapes.Circle
    : props.shape === 'Pill' ? Shapes.Material.Pill
      : props.shape === 'Square' ? Shapes.Rectangle
        : props.shape === 'Cut corner' ? Shapes.CutCorner(20)
          : props.shape === 'Diamond' ? Shapes.Material.Diamond
            : props.shape === 'Heart' ? Shapes.Material.Heart
              : props.shape === 'Arch' ? Shapes.Material.Arch
                : props.shape === 'Hexagon' ? Shapes.Material.Cookie6Sided
                  : props.shape === 'Squircle' ? Shapes.RoundedCorner(32) : Shapes.RoundedCorner(22);
  const glass = props.theme === 'Liquid Glass';
  const fill = glass ? '#38FFFFFF' : props.colors.background;
  const border = glass ? '#72FFFFFF' : props.colors.border;
  const gradientTint = `#55${props.gradientEnd.replace('#', '')}`;

  return (
    <Box modifiers={[fillMaxSize(), clip(widgetShape), background(border), paddingAll(1)]}>
      <Box modifiers={[fillMaxSize(), clip(widgetShape), background(fill), paddingAll(12)]}>
        {props.theme === 'Gradient' && <Box contentAlignment="bottomEnd" modifiers={[fillMaxSize(0.72), clip(widgetShape), background(gradientTint)]} />}
        {props.widgetKind.startsWith('clock-') ? <ClockSample props={props} glass={glass} />
          : props.widgetKind === 'calendar' ? <Column>
          <Text color={glass ? '#FFFFFF' : props.colors.title} style={{ fontSize: 16, fontWeight: '700' }}>{props.monthTitle}</Text>
          <Text color={glass ? '#E8EDF4' : props.colors.meta} style={{ fontSize: 8, fontWeight: '700' }}>Su  Mo  Tu  We  Th  Fr  Sa</Text>
          {props.monthRows.map((row, index) => <Text key={index} color={glass ? '#FFFFFF' : props.colors.value} style={{ fontSize: 9 }}>{row}</Text>)}
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

function ClockSample({ props, glass }: { props: StudioWidgetProps; glass: boolean }) {
  const accent = glass ? '#FFFFFF' : props.colors.icon;
  const analog = props.widgetKind === 'clock-analog' || props.clockMode === 'Analog' || props.clockMode === 'Both';
  const digital = props.widgetKind === 'clock-digital' || props.clockMode === 'Digital' || props.clockMode === 'Both';
  const time = widgetTime(props.clockZone, props.timeFormat, props.showSeconds, props.showPeriod);
  const secondTime = widgetTime(props.secondClockZone, props.timeFormat, props.showSeconds, props.showPeriod);
  if (props.showSecondClock) return <Column>
    <Box contentAlignment="center" modifiers={[fillMaxSize()]}>
      <Box contentAlignment="centerStart" modifiers={[fillMaxSize(0.48)]}>{analog ? <AnalogFace props={props} glass={glass} zone={props.clockZone} /> : <DigitalFace props={props} glass={glass} zone={props.clockZone} time={time} />}</Box>
      <Box contentAlignment="centerEnd" modifiers={[fillMaxSize(0.48)]}>{analog ? <AnalogFace props={props} glass={glass} zone={props.secondClockZone} /> : <DigitalFace props={props} glass={glass} zone={props.secondClockZone} time={secondTime} />}</Box>
    </Box>
    {props.clockMode === 'Both' && <Text color={glass ? '#FFFFFF' : props.colors.value} style={{ fontSize: 12, fontWeight: '700' }}>{time}    {secondTime}</Text>}
    <Text color={glass ? '#E8EDF4' : props.colors.meta} style={{ fontSize: 8 }}>{zoneShortLabel(props.clockZone)}                {zoneShortLabel(props.secondClockZone)}</Text>
  </Column>;
  if (props.clockMode === 'Both') return <Column>
    {analog && <AnalogFace props={props} glass={glass} zone={props.clockZone} />}
    {digital && <DigitalFace props={props} glass={glass} zone={props.clockZone} time={time} />}
  </Column>;
  return analog ? <AnalogFace props={props} glass={glass} zone={props.clockZone} /> : <DigitalFace props={props} glass={glass} zone={props.clockZone} time={time} />;
}

function widgetTime(zone: string, format: string, seconds: boolean, period: boolean) {
  const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hourCycle: format === '12-hour' ? 'h12' : 'h23' };
  if (zone !== 'local') options.timeZone = zone;
  if (seconds) options.second = '2-digit';
  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '00';
  const time = `${value('hour')}:${value('minute')}${seconds ? `:${value('second')}` : ''}`;
  return format === '12-hour' && period ? `${time} ${value('dayPeriod')}` : time;
}

function zoneShortLabel(zone: string) { return zone === 'local' ? 'LOCAL' : zone.split('/').pop()?.replaceAll('_', ' ').toUpperCase() ?? zone; }

function AnalogFace({ props, glass, zone }: { props: StudioWidgetProps; glass: boolean; zone: string }) {
  const ink = glass ? '#FFFFFF' : props.colors.title;
  const faceShape = ['Full numerals', 'Dot markers', 'Roman numerals', 'Railway markers', '24-hour numerals', 'Sector dial', 'Bauhaus'].includes(props.analogClockStyle) ? Shapes.Circle
    : props.analogClockStyle === 'Heart markers' ? Shapes.Material.Heart
      : props.analogClockStyle === 'Skeleton' ? Shapes.RoundedCorner(4) : Shapes.RoundedCorner(18);
  const handColors = glass ? { hour: '#FFFFFF', minute: '#FFFFFF', second: '#FFFFFF' } : props.clockHandColors;
  const now = new Date();
  const hands = ['hour', 'minute', 'second'] as const;
  return <Box contentAlignment="center" modifiers={[size(126, 126), clip(faceShape), border(1, glass ? '#88FFFFFF' : props.colors.border)]}>
    {['Classic numerals', 'Full numerals', 'Roman numerals', 'Railway markers', '24-hour numerals', 'Sector dial', 'Bauhaus'].includes(props.analogClockStyle) && <Box modifiers={[fillMaxSize()]}>
      <Box contentAlignment="topCenter" modifiers={[fillMaxSize()]}><Text color={ink} style={{ fontSize: props.analogClockStyle === 'Roman numerals' ? 12 : 16, fontWeight: '700' }}>{props.analogClockStyle === 'Roman numerals' ? 'XII' : props.analogClockStyle === '24-hour numerals' ? '00' : '12'}</Text></Box>
      <Box contentAlignment="centerEnd" modifiers={[fillMaxSize()]}><Text color={ink} style={{ fontSize: props.analogClockStyle === 'Roman numerals' ? 12 : 16, fontWeight: '700' }}>{props.analogClockStyle === 'Roman numerals' ? 'III' : props.analogClockStyle === '24-hour numerals' ? '06' : '3'}</Text></Box>
      <Box contentAlignment="bottomCenter" modifiers={[fillMaxSize()]}><Text color={ink} style={{ fontSize: props.analogClockStyle === 'Roman numerals' ? 12 : 16, fontWeight: '700' }}>{props.analogClockStyle === 'Roman numerals' ? 'VI' : props.analogClockStyle === '24-hour numerals' ? '12' : '6'}</Text></Box>
      <Box contentAlignment="centerStart" modifiers={[fillMaxSize()]}><Text color={ink} style={{ fontSize: props.analogClockStyle === 'Roman numerals' ? 12 : 16, fontWeight: '700' }}>{props.analogClockStyle === 'Roman numerals' ? 'IX' : props.analogClockStyle === '24-hour numerals' ? '18' : '9'}</Text></Box>
    </Box>}
    {hands.map((hand) => {
      const handLength = hand === 'hour' ? 35 : hand === 'minute' ? 55 : 60;
      return <Box key={hand} contentAlignment="center" modifiers={[fillMaxSize(), rotate(clockHandAngle(zone, hand, now))]}>
        <Box contentAlignment="topCenter" modifiers={[fillMaxSize(), paddingAll(63 - handLength)]}>
          <Box modifiers={[width(hand === 'hour' ? 3 : hand === 'minute' ? 2 : 1), height(handLength), background(handColors[hand])]} />
        </Box>
      </Box>
    })}
    <Box contentAlignment="center" modifiers={[fillMaxSize()]}><Box modifiers={[size(8, 8), clip(Shapes.Circle), background(handColors.hour)]} /></Box>
  </Box>;
}

function clockHandAngle(zone: string, hand: 'hour' | 'minute' | 'second', now: Date) {
  const options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' };
  if (zone !== 'local') options.timeZone = zone;
  const parts = new Intl.DateTimeFormat('en-GB', options).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);
  const second = Number(parts.find((part) => part.type === 'second')?.value ?? 0);
  return hand === 'hour' ? (hour % 12) * 30 + minute * 0.5 + second / 120
    : hand === 'minute' ? minute * 6 + second * 0.1 : second * 6;
}

function DigitalFace({ props, glass, zone, time }: { props: StudioWidgetProps; glass: boolean; zone: string; time: string }) {
  const framed = ['Flip style', 'Split-flap', 'LED segments', 'Matrix', 'Railway display'].includes(props.digitalClockStyle);
  const tint = glass ? '#FFFFFF' : props.colors.value;
  const displayColor = glass ? '#FFFFFF' : props.digitalClockStyle === 'Matrix' ? '#63FF9A' : props.digitalClockStyle === 'Railway display' ? '#F1EFE7' : tint;
  const clockFontSize = props.digitalClockStyle === 'Compact' ? 17 : props.digitalClockStyle === 'Bold display' ? 27 : props.digitalClockStyle === 'Large display' ? 31 : 23;
  const digitStyle = { fontSize: clockFontSize, fontWeight: props.digitalClockStyle === 'Bold display' || props.digitalClockStyle === 'Large display' ? ('900' as const) : ('700' as const), letterSpacing: props.digitalClockStyle === 'Compact' ? -1 : ['LED segments', 'Matrix'].includes(props.digitalClockStyle) ? 1 : 0, fontFamily: ['LED segments', 'Matrix'].includes(props.digitalClockStyle) ? ('monospace' as const) : ('default' as const) };
  const clockColors = glass ? { ...props.clockHandColors, hour: '#FFFFFF', minute: '#FFFFFF', second: '#FFFFFF', separator: '#FFFFFF' } : props.clockHandColors;
  const timeParts = time.match(/^(\d{1,2})(:)(\d{2})(?::(\d{2}))?(.*)$/);
  const now = new Date();
  const date = new Intl.DateTimeFormat(undefined, { timeZone: zone === 'local' ? undefined : zone, weekday: 'short', month: 'short', day: 'numeric' }).format(now).toUpperCase();
  const frameBackground = glass ? '#24FFFFFF' : props.digitalClockStyle === 'Matrix' ? '#07150F' : props.digitalClockStyle === 'LED segments' ? '#101A13' : props.digitalClockStyle === 'Railway display' ? '#18221F' : '#303129';
  const frameBorder = glass ? '#88FFFFFF' : props.digitalClockStyle === 'Matrix' ? '#2A6545' : props.digitalClockStyle === 'LED segments' ? '#356D45' : props.digitalClockStyle === 'Railway display' ? '#D14545' : props.colors.border;
  return <Box contentAlignment="center" modifiers={framed ? [clip(Shapes.RoundedCorner(12)), background(frameBackground), border(1, frameBorder), paddingAll(8)] : []}>
    <Column>
      <Text color={glass ? '#E8EDF4' : props.colors.meta} style={{ fontSize: 8 }}>{props.digitalClockStyle}</Text>
      {timeParts ? <Row>
        <Text color={clockColors.hour} style={digitStyle}>{timeParts[1]}</Text>
        <Text color={clockColors.separator} style={digitStyle}>{timeParts[2]}</Text>
        <Text color={clockColors.minute} style={digitStyle}>{timeParts[3]}</Text>
        {timeParts[4] && <Text color={clockColors.separator} style={digitStyle}>:</Text>}
        {timeParts[4] && <Text color={clockColors.second} style={digitStyle}>{timeParts[4]}</Text>}
        {!!timeParts[5] && <Text color={displayColor} style={{ fontSize: 9, fontWeight: '700' }}>{timeParts[5]}</Text>}
      </Row> : <Text color={displayColor} style={digitStyle}>{time}</Text>}
      {props.digitalClockStyle === 'Stacked date' && <Text color={glass ? '#FFFFFF' : props.colors.title} style={{ fontSize: 9, fontWeight: '700' }}>{date}</Text>}
      <Text color={glass ? '#E8EDF4' : props.colors.subtitle} style={{ fontSize: 8 }}>{zoneShortLabel(zone)}</Text>
    </Column>
  </Box>;
}

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
