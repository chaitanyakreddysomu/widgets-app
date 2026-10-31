import { HStack, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import { createWidget } from 'expo-widgets';
import { background, clipShape, font, foregroundStyle, frame, padding, type ShapeStyle, type FrameAlignment } from '@expo/ui/swift-ui/modifiers';

type WidgetColors = {
  background: string; border: string; icon: string; value: string; title: string; subtitle: string; meta: string;
};
type StudioWidgetProps = {
  title: string; subtitle: string; value: string; accent: string; icon: string; size: string;
  widgetKind: string; monthTitle: string; monthRows: string[];
  layoutMode: 'Fixed' | 'Adaptive'; widthCells: number; heightCells: number; shape: string; theme: string;
  colors: WidgetColors; positions: { iconX: number; iconY: number; textX: number; textY: number }; gradientEnd: string;
  clockMode: string; timeFormat: string; showSeconds: boolean; showPeriod: boolean; clockStyle: string; stepStyle: string; stepGoal: number;
  clockZone: string; secondClockZone: string; showSecondClock: boolean;
};

const StudioWidget = (props: StudioWidgetProps) => {
  'widget';
  const fillStyle: ShapeStyle = props.theme === 'Transparent' ? '#00000000' : props.theme === 'Liquid Glass'
    ? { type: 'material', material: 'ultraThin' }
    : props.theme === 'Gradient'
      ? { type: 'linearGradient', colors: [props.colors.background, props.gradientEnd], startPoint: { x: 0, y: 0 }, endPoint: { x: 1, y: 1 } }
      : props.colors.background;
  const shapeStyle = props.shape === 'Circle' ? 'circle'
    : props.shape === 'Pill' ? 'capsule'
      : props.shape === 'Square' ? 'rectangle' : 'roundedRectangle';
  const glass = props.theme === 'Liquid Glass';
  const makeTime = (zone: string) => {
    const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: props.timeFormat === '12-hour' };
    if (props.showSeconds) options.second = '2-digit';
    if (zone !== 'local') options.timeZone = zone;
    let value = new Intl.DateTimeFormat(undefined, options).format(new Date());
    if (!props.showPeriod && props.timeFormat === '12-hour') value = value.replace(/\s?(AM|PM)/i, '');
    return value;
  };
  const currentTime = makeTime(props.clockZone);
  const alignmentFor = (x: number, y: number): FrameAlignment => {
    const horizontal = x < 34 ? 'leading' : x > 66 ? 'trailing' : '';
    const vertical = y < 34 ? 'top' : y > 66 ? 'bottom' : '';
    if (vertical && horizontal) return `${vertical}${horizontal[0].toUpperCase()}${horizontal.slice(1)}` as FrameAlignment;
    return (vertical || horizontal || 'center') as FrameAlignment;
  };

  if (props.widgetKind.startsWith('clock-') && props.showSecondClock) return <HStack spacing={8}>
    <VStack alignment="leading" spacing={4}><Text modifiers={[font({ size: 20, weight: 'bold' }), foregroundStyle(glass ? '#FFFFFF' : props.colors.value)]}>{currentTime}</Text><Text modifiers={[font({ size: 8 }), foregroundStyle(glass ? '#E8EDF4' : props.colors.meta)]}>{props.clockZone === 'local' ? 'LOCAL' : props.clockZone.split('/').pop()?.replace(/_/g, ' ')}</Text></VStack>
    <VStack alignment="leading" spacing={4}><Text modifiers={[font({ size: 20, weight: 'bold' }), foregroundStyle(glass ? '#FFFFFF' : props.colors.value)]}>{makeTime(props.secondClockZone)}</Text><Text modifiers={[font({ size: 8 }), foregroundStyle(glass ? '#E8EDF4' : props.colors.meta)]}>{props.secondClockZone.split('/').pop()?.replace(/_/g, ' ')}</Text></VStack>
  </HStack>;
  return (
    <ZStack modifiers={[padding({ all: 14 }), background(fillStyle), clipShape(shapeStyle, 22)]}>
      {props.widgetKind === 'calendar' ? <VStack alignment="leading" spacing={2} modifiers={[frame({ maxWidth: Number.POSITIVE_INFINITY, maxHeight: Number.POSITIVE_INFINITY, alignment: 'leading' })]}>
        <Text modifiers={[font({ size: 15, weight: 'bold' }), foregroundStyle(glass ? '#FFFFFF' : props.colors.title)]}>{props.monthTitle}</Text>
        <Text modifiers={[font({ size: 8, weight: 'bold' }), foregroundStyle(glass ? '#E8EDF4' : props.colors.meta)]}>Su  Mo  Tu  We  Th  Fr  Sa</Text>
        {props.monthRows.map((row, index) => <Text key={index} modifiers={[font({ size: 9 }), foregroundStyle(glass ? '#FFFFFF' : props.colors.value)]}>{row}</Text>)}
        <Text modifiers={[font({ size: 10, weight: 'bold' }), foregroundStyle(glass ? '#FFFFFF' : props.colors.title)]}>{props.title}</Text>
        <Text modifiers={[font({ size: 8 }), foregroundStyle(glass ? '#E8EDF4' : props.colors.subtitle)]}>{props.subtitle}</Text>
      </VStack> : <>
        <VStack alignment="leading" spacing={5} modifiers={[frame({ maxWidth: Number.POSITIVE_INFINITY, maxHeight: Number.POSITIVE_INFINITY, alignment: alignmentFor(props.positions.textX, props.positions.textY) })]}>
          <Text modifiers={[font({ size: 10, weight: 'bold' }), foregroundStyle(glass ? '#E8EDF4' : props.colors.meta)]}>{props.size.toUpperCase()}</Text>
          <Text modifiers={[font({ size: 30, weight: 'bold' }), foregroundStyle(glass ? '#FFFFFF' : props.colors.value)]}>{props.widgetKind.startsWith('clock-') ? currentTime : props.value}</Text>
          <Text modifiers={[font({ size: 15, weight: 'bold' }), foregroundStyle(glass ? '#FFFFFF' : props.colors.title)]}>{props.title}</Text>
          <Text modifiers={[font({ size: 11 }), foregroundStyle(glass ? '#E8EDF4' : props.colors.subtitle)]}>{props.subtitle}</Text>
        </VStack>
        <Text modifiers={[font({ size: 22, weight: 'bold' }), foregroundStyle(glass ? '#FFFFFF' : props.colors.icon), frame({ maxWidth: Number.POSITIVE_INFINITY, maxHeight: Number.POSITIVE_INFINITY, alignment: alignmentFor(props.positions.iconX, props.positions.iconY) })]}>
          {props.icon}
        </Text>
      </>}
    </ZStack>
  );
};

const defaultWidgetProps: StudioWidgetProps = {
  title: 'Soft Hours', subtitle: 'A calmer way to check the time', value: '09:41', accent: '#D7F36A', icon: '◷', size: 'ADAPTIVE',
  widgetKind: 'clock-digital', monthTitle: 'January 2026', monthRows: [' 1  2  3  4  5  6  7'],
  clockMode: 'Digital', timeFormat: '12-hour', showSeconds: false, showPeriod: true, clockStyle: 'Clean digital', stepStyle: 'Step ring', stepGoal: 10000,
  clockZone: 'local', secondClockZone: 'Asia/Tokyo', showSecondClock: false,
  layoutMode: 'Adaptive', widthCells: 3, heightCells: 2, shape: 'Rounded', theme: 'Solid Color',
  colors: { background: '#24251F', border: '#3C4030', icon: '#D7F36A', value: '#D7F36A', title: '#F1EFE7', subtitle: '#A6A79A', meta: '#A6A79A' },
  positions: { iconX: 8, iconY: 10, textX: 10, textY: 42 }, gradientEnd: '#536B84',
};
const primaryWidget = createWidget('StudioWidget', StudioWidget, defaultWidgetProps);
export default primaryWidget;
export const widgetSlots = {
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
