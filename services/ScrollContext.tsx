import React, { createContext, useContext, useRef } from "react";
import { Animated } from "react-native";

interface ScrollContextType {
  scrollY: Animated.Value;
}

// Create a context with a default Animated.Value.
const ScrollContext = createContext<ScrollContextType>({
  scrollY: new Animated.Value(0),
});

// Custom hook to easily access the scroll context.
export const useScroll = () => useContext(ScrollContext);

// Provider component that will wrap our app layout.
export const ScrollProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const scrollY = useRef(new Animated.Value(0)).current;
  return (
    <ScrollContext.Provider value={{ scrollY }}>
      {children}
    </ScrollContext.Provider>
  );
};
