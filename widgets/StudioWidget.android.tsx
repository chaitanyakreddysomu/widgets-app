import { Box, Column, Text } from '@expo/ui/jetpack-compose';
import { createWidget } from 'expo-widgets';
import { background, clip, fillMaxSize, paddingAll, Shapes } from '@expo/ui/jetpack-compose/modifiers';
type ContentAlignment = 'topStart' | 'topCenter' | 'topEnd' | 'centerStart' | 'center' | 'centerEnd' | 'bottomStart' | 'bottomCenter' | 'bottomEnd';

type WidgetColors = {
  background: string; border: string; icon: string; value: string; title: string; subtitle: string; meta: string;
};
type WidgetPositions = { iconX: number; iconY: number; textX: number; textY: number };
type StudioWidgetProps = {
  title: string; subtitle: string; value: string; accent: string; icon: string; size: string;
  widgetKind: string; monthTitle: string; monthRows: string[];
  layoutMode: 'Fixed' | 'Adaptive'; widthCells: number; heightCells: number; shape: string; theme: string;
  colors: WidgetColors; positions: WidgetPositions; gradientEnd: string;
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
      : props.shape === 'Square' ? Shapes.Rectangle : Shapes.RoundedCorner(22);
  const glass = props.theme === 'Liquid Glass';
  const fill = glass ? '#38FFFFFF' : props.colors.background;
  const border = glass ? '#72FFFFFF' : props.colors.border;
  const gradientTint = `#55${props.gradientEnd.replace('#', '')}`;

  return (
    <Box modifiers={[fillMaxSize(), clip(widgetShape), background(border), paddingAll(1)]}>
      <Box modifiers={[fillMaxSize(), clip(widgetShape), background(fill), paddingAll(12)]}>
        {props.theme === 'Gradient' && <Box contentAlignment="bottomEnd" modifiers={[fillMaxSize(0.72), clip(widgetShape), background(gradientTint)]} />}
        {props.widgetKind === 'calendar' ? <Column>
          <Text color={glass ? '#FFFFFF' : props.colors.title} style={{ fontSize: 16, fontWeight: '700' }}>{props.monthTitle}</Text>
          <Text color={glass ? '#E8EDF4' : props.colors.meta} style={{ fontSize: 8, fontWeight: '700' }}>Su  Mo  Tu  We  Th  Fr  Sa</Text>
          {props.monthRows.map((row, index) => <Text key={index} color={glass ? '#FFFFFF' : props.colors.value} style={{ fontSize: 9 }}>{row}</Text>)}
          <Text color={glass ? '#FFFFFF' : props.colors.title} style={{ fontSize: 10, fontWeight: '700' }}>{props.title}</Text>
          <Text color={glass ? '#E8EDF4' : props.colors.subtitle} style={{ fontSize: 8 }}>{props.subtitle}</Text>
        </Column> : <>
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
        </>}
      </Box>
    </Box>
  );
};

export default createWidget('StudioWidget', StudioWidget, {
  title: 'Soft Hours',
  subtitle: 'A calmer way to check the time',
  value: '09:41',
  accent: '#D7F36A',
  icon: '◷',
  size: 'ADAPTIVE',
  widgetKind: 'clock-digital',
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
});
