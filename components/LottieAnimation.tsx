// import LottieView from "lottie-react-native";
// import React from "react";
// import { StyleSheet, View, ViewStyle } from "react-native";

// interface LottieAnimationProps {
//   source: any; // JSON file from require() or asset URL
//   autoPlay?: boolean;
//   loop?: boolean;
//   style?: ViewStyle;
//   speed?: number;
//   onAnimationFinish?: () => void;
//   width?: number;
//   height?: number;
// }

// const LottieAnimation: React.FC<LottieAnimationProps> = ({
//   source,
//   autoPlay = true,
//   loop = true,
//   style,
//   speed = 1,
//   onAnimationFinish,
//   width,
//   height,
// }) => {
//   return (
//     <View style={[styles.container, style]}>
//       <LottieView
//         source={source}
//         autoPlay={autoPlay}
//         loop={loop}
//         speed={speed}
//         style={{ width: width || "100%", height: height || "100%" }}
//         onAnimationFinish={onAnimationFinish}
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     justifyContent: "center",
//     alignItems: "center",
//   },
// });

// export default LottieAnimation;
