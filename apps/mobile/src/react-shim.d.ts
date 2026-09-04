declare namespace React {
  type FC<P = {}> = (props: P) => any;
  type ReactNode = any;
  interface ChangeEvent<T = any> { target: T; }
}

declare namespace JSX {
  interface Element extends any {}
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare module 'react' {
  export const useState: <T = any>(initial: T | (() => T)) => [T, (val: T | ((prev: T) => T)) => void];
  export const useEffect: (effect: () => void | (() => void), deps?: any[]) => void;
  export type FC<P = {}> = React.FC<P>;
  export const createElement: any;
  const React: any;
  export default React;
}

declare module 'react-native' {
  export const View: any;
  export const Text: any;
  export const TextInput: any;
  export const TouchableOpacity: any;
  export const ScrollView: any;
  export const StyleSheet: any;
  export const SafeAreaView: any;
  export const StatusBar: any;
}
