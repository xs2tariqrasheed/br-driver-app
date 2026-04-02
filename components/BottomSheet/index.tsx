import { textColors } from '@/constants/colors';
import { useOverlayInsets } from '@/context/OverlayInsetsContext';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetScrollView,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import React, { useEffect, useMemo, useRef } from 'react';
import {
  BackHandler,
  Image,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewProps,
} from 'react-native';
import { Portal } from 'react-native-portalize';
import { IconButton } from '../Button';
import Typography from '../Typography';

/**
 * A strongly-typed wrapper around `@gorhom/bottom-sheet` that provides
 * a consistent backdrop, optional scrollable content, and smart handling of
 * keyboard visibility on iOS by switching snap points when the keyboard opens.
 */
export type SnapPoint = string | number;

/**
 * Common properties shared by both scrollable and non-scrollable variants.
 */
interface CommonBottomSheetProps {
  /**
   * Content to render inside the sheet.
   */
  children: React.ReactNode;
  /**
   * Snap points for the sheet height. Can be percentages (e.g. "50%")
   * or absolute numbers (device pixels).
   * @default ["25%", "50%", "83%"]
   */
  snapPoints?: SnapPoint[];
  /**
   * Initial snap index to open the sheet at.
   * Use -1 to start closed, 0 for first snap point, 1 for second, etc.
   * @default -1
   */
  initialSnapIndex?: number;
  /**
   * Called when the sheet fully closes (index becomes -1) or when the
   * component receives the close callback from the underlying sheet.
   */
  onClose?: () => void;
  /**
   * If true, wraps children with `BottomSheetScrollView` enabling nested
   * scrolling. If false, renders a plain `View`.
   * @default false
   */
  scrollable?: boolean;
  /**
   * Controls the backdrop. If a boolean is provided, `true` uses a sensible
   * default backdrop and `false` disables it. You can also provide a custom
   * render function which receives `BottomSheetBackdropProps`.
   * @default true
   */
  backdrop?:
    | boolean
    | ((props: BottomSheetBackdropProps) => React.ReactElement);
  /**
   * Enables pan gestures that close the sheet by swiping down.
   * @default true
   */
  swipeToClose?: boolean;
  /**
   * Legacy prop (kept for backwards compatibility).
   * Keyboard-aware positioning is now handled by `@gorhom/bottom-sheet`
   * via `keyboardBehavior` (no manual listeners in this component).
   */
  snapPointsWhenKeyboardVisible?: SnapPoint[];
  /**
   * Controls how the sheet responds when the keyboard is shown:
   * - `true`  => `keyboardBehavior="extend"`
   * - `false` => `keyboardBehavior="interactive"`
   */
  expandToContentWhenKeyboardHidden?: boolean;
  /**
   * Legacy prop (kept for backwards compatibility). Ignored in this version.
   */
  keyboardSnapPoints?: SnapPoint[];
  /**
   * Max sheet height as a fraction of window height when using dynamic sizing.
   * @default 0.88
   */
  maxDynamicContentSizeFraction?: number;
  /**
   * Controls whether the sheet is open or closed.
   */
  open?: boolean;
  /**
   * Controls whether the header is shown or not.
   */
  showHeader?: boolean;
  /**
   * Title to display in the header.
   */
  headerTitle?: string;
  /**
   * If true, disables the close button in the header.
   * @default false
   */
  disabledClose?: boolean;
  /**
   * Custom background color for the sheet.
   */
  customBackgroundColor?: string;
}

/** Props for scrollable variant (wraps content in BottomSheetScrollView). */
export type ScrollableBottomSheetProps = CommonBottomSheetProps & {
  scrollable: true;
} & React.ComponentProps<typeof BottomSheetScrollView>;

/** Props for non-scrollable variant (wraps content in View). */
export type NonScrollableBottomSheetProps = CommonBottomSheetProps & {
  scrollable?: false;
} & ViewProps;

/** Discriminated union of possible component props. */
export type CustomBottomSheetProps =
  | ScrollableBottomSheetProps
  | NonScrollableBottomSheetProps;

const defaultSnapPoints: SnapPoint[] = ['25%', '50%', '83%'];

/**
 * CustomBottomSheet
 *
 * @example
 * ```tsx
 * return (
 *   <CustomBottomSheet
 *     snapPoints={["25%", "60%"]}
 *     onSnapToIndex={(index) => console.log('snap to', index)}
 *   >
 *     <YourContent />
 *   </CustomBottomSheet>
 * );
 * ```
 */
const CustomBottomSheet: React.FC<CustomBottomSheetProps> = ({
  children,
  snapPoints = defaultSnapPoints,
  initialSnapIndex = 0,
  onClose,
  scrollable = false,
  backdrop = true,
  swipeToClose = false,
  snapPointsWhenKeyboardVisible: _snapPointsWhenKeyboardVisible = defaultSnapPoints,
  expandToContentWhenKeyboardHidden = false,
  keyboardSnapPoints: _keyboardSnapPoints = ['95%'],
  maxDynamicContentSizeFraction = 0.88,
  open = false,
  showHeader = true,
  headerTitle,
  disabledClose = false,
  customBackgroundColor,
  ...props
}) => {
  const { overlayBottomInset } = useOverlayInsets();
  const { height: windowHeight } = useWindowDimensions();

  const bottomSheetRef = useRef<React.ElementRef<typeof BottomSheet>>(null);

  const maxDynamicContentSize = useMemo(
    () => Math.round(windowHeight * maxDynamicContentSizeFraction),
    [windowHeight, maxDynamicContentSizeFraction]
  );

  // Handle Android back button: close sheet when open instead of navigating.
  // Must run unconditionally (before any early return) to satisfy Rules of Hooks.
  useEffect(() => {
    if (Platform.OS !== 'android' || !open) return;

    const onBackPress = () => {
      if (open && !disabledClose) {
        bottomSheetRef.current?.close();
        return true; // Prevent default (navigation)
      }
      return false;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );
    return () => subscription.remove();
  }, [open, disabledClose]);

  // Define backdrop component
  const renderBackdrop = (backdropProps: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop
      {...backdropProps}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      opacity={0.7}
      enableTouchThrough={true}
      pressBehavior="close"
    />
  );

  // Conditionally render based on open prop
  if (!open) {
    return null;
  }

  const close = () => {
    bottomSheetRef.current?.close();
  };

  const renderHeader = (title?: string, paddinHorizontal = false) => {
    return (
      <View
        style={[
          styles.sheetHeader,
          paddinHorizontal && { paddingHorizontal: 14 },
          customBackgroundColor && {
            backgroundColor: customBackgroundColor || textColors.white,
          },
        ]}
      >
        <Typography
          type="headingLarge"
          weight="semibold"
          style={styles.sheetTitle}
        >
          {title || 'Title'}
        </Typography>
        <IconButton
          style={styles.iconButton}
          size={1}
          rounded
          disabled={disabledClose}
          icon={
            <Image
              source={require('@/assets/images/black-cross.png')}
              style={[styles.icon28, disabledClose && styles.icon28Disabled]}
            />
          }
          onPress={disabledClose ? undefined : close}
        />
      </View>
    );
  };

  const handleComponent = () => (
    <View
      style={[
        styles.handleComponent,
        customBackgroundColor && { backgroundColor: customBackgroundColor },
      ]}
    />
  );

  return (
    <Portal>
      <BottomSheet
        ref={bottomSheetRef}
        index={initialSnapIndex}
        enableDynamicSizing={true}
        maxDynamicContentSize={maxDynamicContentSize}
        // snapPoints={snapPoints} // NOTE: Adjust the sheet height by the component itself based on the content and paddingBottom
        enablePanDownToClose={swipeToClose}
        enableContentPanningGesture={swipeToClose}
        enableHandlePanningGesture={swipeToClose}
        android_keyboardInputMode="adjustResize"
        keyboardBehavior={
          expandToContentWhenKeyboardHidden ? 'extend' : 'interactive'
        }
        keyboardBlurBehavior="restore"
        bottomInset={overlayBottomInset ?? 0}
        backdropComponent={
          typeof backdrop === 'function'
            ? backdrop
            : backdrop
            ? renderBackdrop
            : undefined
        }
        onClose={onClose}
        handleComponent={customBackgroundColor ? handleComponent : undefined}
      >
        {scrollable ? (
          <>
            {showHeader && renderHeader(headerTitle, true)}
            <BottomSheetScrollView
              style={[
                styles.scrollableContent,
                customBackgroundColor && {
                  backgroundColor: customBackgroundColor,
                },
              ]}
              contentContainerStyle={[
                styles.scrollableContentContainer,
                // { paddingBottom: 80 + (overlayBottomInset ?? 0) },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              {...(props as React.ComponentProps<typeof BottomSheetScrollView>)}
            >
              {children}
            </BottomSheetScrollView>
          </>
        ) : (
          <BottomSheetView
            style={[
              styles.sheetRoot,
              customBackgroundColor && {
                backgroundColor: customBackgroundColor || textColors.white,
              },
            ]}
          >
            <View
              style={[
                styles.contentContainer,
                // { paddingBottom: overlayBottomInset + 10 },
                customBackgroundColor && {
                  backgroundColor: customBackgroundColor || textColors.white,
                },
              ]}
              {...(props as ViewProps)}
            >
              {showHeader && renderHeader(headerTitle)}
              {children}
            </View>
          </BottomSheetView>
        )}
      </BottomSheet>
    </Portal>
  );
};

CustomBottomSheet.displayName = 'CustomBottomSheet';

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  scrollableContent: {
    flex: 1,
    backgroundColor: textColors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  scrollableContentContainer: {
    paddingBottom: 60,
    paddingHorizontal: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 8,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  icon28: { width: 28, height: 28, resizeMode: 'contain' },
  sheetTitle: { fontSize: 21, color: textColors.black },
  sheetRoot: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  icon28Disabled: {
    opacity: 0.3,
  },
  iconButton: {
    backgroundColor: textColors.white,
    borderWidth: 2,
    borderColor: textColors.black,
    width: 40,
    height: 40,
  },
  handleComponent: {
    height: 12,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
});

export default CustomBottomSheet;
