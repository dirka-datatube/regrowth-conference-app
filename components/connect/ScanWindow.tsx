import { ReactNode } from 'react';
import { View } from 'react-native';

const RADIUS = 28;
/** How far the overlay reaches past the window: beyond any screen edge. */
const REACH = 1600;

const CORNERS = [
  'left-0 top-0 rounded-tl-[28px] border-l-[3px] border-t-[3px]',
  'right-0 top-0 rounded-tr-[28px] border-r-[3px] border-t-[3px]',
  'bottom-0 left-0 rounded-bl-[28px] border-b-[3px] border-l-[3px]',
  'bottom-0 right-0 rounded-br-[28px] border-b-[3px] border-r-[3px]',
];

/**
 * The scanner window (237:888): the camera shows through a rounded window cut
 * out of a dark overlay (the comp's "Subtract" of Overlay and Scanner), with
 * corner marks. The overlay is one view with a very wide border whose inner
 * edge is rounded, so nothing needs measuring and it follows layout; the
 * screen clips it. Controls above and below sit on a higher z-index.
 *
 * 318 × 407 in the comp; the height gives way on shorter screens.
 */
export function ScanWindow({ children, filled }: { children?: ReactNode; filled?: boolean }) {
  return (
    <View
      className={`min-h-[220px] w-[318px] max-w-full flex-1 items-center justify-center rounded-[28px] ${
        filled ? 'bg-snow/5' : ''
      }`}
      style={{ maxHeight: 407 }}
    >
      <View
        className="absolute border-scrim"
        style={{
          top: -REACH,
          left: -REACH,
          right: -REACH,
          bottom: -REACH,
          borderWidth: REACH,
          borderRadius: REACH + RADIUS,
        }}
      />
      {CORNERS.map((corner) => (
        <View key={corner} className={`absolute h-10 w-10 border-snow ${corner}`} />
      ))}
      {children}
    </View>
  );
}
