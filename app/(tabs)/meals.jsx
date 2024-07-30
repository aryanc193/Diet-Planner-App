import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ScrollView,
  Text,
  View,
  Alert,
  Image,
  TouchableOpacity,
} from "react-native";
import { useGlobalContext } from "../../context/GlobalProvider";
import { getMeals } from "../../lib/appwrite"; // Import the actual function for fetching study meals
import EmptyState from "../../components/EmptyState";

const Meals = () => {
  const { user } = useGlobalContext();
  const [meals, setMeals] = useState([]);
  const [expandedMeal, setExpandedMeal] = useState(null);

  useEffect(() => {
    const fetchMeals = async () => {
      try {
        const meals = await getMeals();
        setMeals(meals);
      } catch (error) {
        console.error("Error fetching meals:", error);
        Alert.alert("Error", "Failed to fetch meals.");
      }
    };
    fetchMeals();
  }, []);

  const toggleExpand = (index) => {
    setExpandedMeal(expandedMeal === index ? null : index);
  };

  return (
    <SafeAreaView className="bg-white h-full">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View className="my-6 px-4 space-y-6">
          <View className="justify-between items-start flex-row">
            <View>
              <Text className="font-pmedium text-2xl text-gray-900">
                Meals to get your diet started
              </Text>
              <Text className="text-xl font-psemibold text-green-500">
                Some healthy and nutritious options to explore from!
              </Text>
            </View>
          </View>

          {meals.length > 0 ? (
            meals.map((meal, index) => (
              <TouchableOpacity
                key={index}
                className="px-4 py-2 bg-gray-50 rounded-lg shadow-md mb-2"
                onPress={() => toggleExpand(index)}
              >
                <View className="flex-row justify-between items-center">
                  <Text className="text-2xl font-semibold text-gray-900">
                    {meal.name}
                  </Text>
                </View>
                <Image
                  source={{ uri: meal.thumbnail }}
                  style={{
                    width: "100%",
                    height: 200,
                    padding: 2,
                    borderRadius: 8,
                  }}
                />
                <Text className="mt-2 text-gray-600 text-base">
                  {expandedMeal === index
                    ? meal.short_description
                    : `${meal.short_description.slice(0, 272)}...`}
                </Text>
                <Text className="text-green-500 mt-2">
                  {expandedMeal === index ? "Show less" : "Read more"}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <EmptyState
              title="No Meals Found"
              subtitle="Check back later! We'll cook something up for you!"
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Meals;
