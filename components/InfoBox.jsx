import { Text, View } from "react-native";
import React from "react";

const InfoBox = ({ title, subtitle, containerStyles, titleStyles }) => {
  return (
    <View className={containerStyles}>
      <Text className={`text-black text-center font-psemibold ${titleStyles}`}>
        {title}
      </Text>
      <Text className="text-sm text-center text-gray-800 font-pregular">
        {subtitle}
      </Text>
    </View>
  );
};

export default InfoBox;
