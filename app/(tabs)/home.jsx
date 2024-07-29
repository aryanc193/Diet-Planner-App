import {
  FlatList,
  Text,
  View,
  Image,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
} from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { images } from "../../constants";
import EmptyState from "../../components/EmptyState";
import useAppwrite from "../../lib/useAppwrite";
import { getAllPosts, getMealPlans, updateMealPlan } from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";
import { format, addDays } from "date-fns";
import CustomButton from "../../components/CustomButton";

const Home = () => {
  const { user } = useGlobalContext();
  const { data: posts, refetch } = useAppwrite(getAllPosts);

  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [mealDetails, setMealDetails] = useState({ food: "", calories: "" });
  const [mealPlans, setMealPlans] = useState([]);

  useEffect(() => {
    fetchMealPlans();
  }, []);

  const fetchMealPlans = async () => {
    try {
      const plans = await getMealPlans(user.$id);
      setMealPlans(plans);
      // console.log(plans); // Log the fetched meal plans
    } catch (error) {
      console.error("Failed to fetch meal plans:", error);
    }
  };

  const generateDates = (days) => {
    const dates = [];
    for (let i = 0; i < days; i++) {
      dates.push(addDays(new Date(), i));
    }
    return dates.map((date) => format(date, "yyyy-MM-dd"));
  };

  const mealPlanData = generateDates(30).map((date) => {
    const existingPlan = mealPlans.find((plan) => plan.date.startsWith(date));
    return {
      date,
      meals: existingPlan
        ? {
            breakfast: existingPlan.breakfast[0] || null,
            lunch: existingPlan.lunch[0] || null,
            dinner: existingPlan.dinner[0] || null,
            snacks: existingPlan.snacks[0] || null,
          }
        : { breakfast: null, lunch: null, dinner: null, snacks: null },
    };
  });

  const renderMealPlan = ({ item }) => (
    <View className="bg-gray-50 p-4 my-2 rounded-lg">
      <Text className="font-semibold text-lg mb-2 bg-red-500 rounded-lg p-2 text-white">
        {format(new Date(item.date), "dd MMM, EEE")}
      </Text>
      <View className="space-y-2">
        {["breakfast", "lunch", "dinner", "snacks"].map((meal) => {
          const mealInfo = item.meals[meal]
            ? `${item.meals[meal].split(" - ")[0]}, ${
                item.meals[meal].split(" - ")[1]
              }`
            : "Add";
          return (
            <View key={meal} className="flex-row items-center justify-between">
              <Text className="font-medium text-gray-700 capitalize">
                {meal.charAt(0).toUpperCase() + meal.slice(1)}:
              </Text>
              <TouchableOpacity
                className="bg-gray-200 px-3 py-1 rounded-full ml-2"
                style={{ flexShrink: 1 }}
                onPress={() => {
                  setSelectedMeal({ date: item.date, meal });
                  setModalVisible(true);
                }}
              >
                <Text className="text-gray-600">{mealInfo}</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMealPlans();
    setRefreshing(false);
  };

  const handleSaveMeal = async () => {
    // console.log("Save button clicked");
    // console.log("Selected Meal:", selectedMeal);
    // console.log("Meal Details:", mealDetails);

    if (!selectedMeal || !mealDetails.food || !mealDetails.calories) {
      Alert.alert("Error", "Please fill in all meal details.");
      return;
    }

    try {
      const formattedDate = selectedMeal.date;
      const mealData = {
        [selectedMeal.meal]: [
          `${mealDetails.food} - ${mealDetails.calories} kcal`,
        ],
      };

      await updateMealPlan(user.$id, formattedDate, mealData);

      // Update local meal plan state
      setMealPlans((prevPlans) => {
        const updatedPlans = [...prevPlans];
        const existingPlan = updatedPlans.find((plan) =>
          plan.date.startsWith(formattedDate)
        );

        if (existingPlan) {
          existingPlan[selectedMeal.meal] = [
            `${mealDetails.food} - ${mealDetails.calories} kcal`,
          ];
        } else {
          updatedPlans.push({
            date: formattedDate,
            breakfast:
              selectedMeal.meal === "breakfast"
                ? [`${mealDetails.food} - ${mealDetails.calories} kcal`]
                : [],
            lunch:
              selectedMeal.meal === "lunch"
                ? [`${mealDetails.food} - ${mealDetails.calories} kcal`]
                : [],
            dinner:
              selectedMeal.meal === "dinner"
                ? [`${mealDetails.food} - ${mealDetails.calories} kcal`]
                : [],
            snacks:
              selectedMeal.meal === "snacks"
                ? [`${mealDetails.food} - ${mealDetails.calories} kcal`]
                : [],
          });
        }
        return updatedPlans;
      });

      setModalVisible(false);
      setMealDetails({ food: "", calories: "" });
    } catch (error) {
      console.error("Failed to update meal plan:", error);
      Alert.alert("Error", "Failed to update meal plan. Please try again.");
    }
  };

  return (
    <SafeAreaView className="bg-white h-full">
      <FlatList
        data={mealPlanData}
        keyExtractor={(item) => item.date}
        renderItem={renderMealPlan}
        ListHeaderComponent={() => (
          <View className="my-6 px-4 space-y-6 -mb-16">
            <View className="justify-between items-start flex-row mb-6">
              <View>
                <Text className="font-pmedium text-sm text-gray-800">
                  Welcome Back,
                </Text>
                <Text className="text-2xl font-psemibold text-green-400">
                  {user?.username}
                </Text>
              </View>
              <View className="mt-1.5">
                <Image
                  source={images.logoSmall}
                  className="w-[150px] -top-8"
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <EmptyState
            title="No records yet"
            subtitle="Let's plan meals together!"
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      <Modal
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        transparent
        animationType="slide"
      >
        <View
          className="flex-1 justify-center items-center"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.8)",
          }}
        >
          <View
            className="bg-white p-6 rounded-lg w-80"
            style={{
              shadowColor: "#000", // Shadow color
              shadowOffset: { width: 20, height: 20 }, // Shadow offset
              shadowOpacity: 0.8, // Shadow opacity
              shadowRadius: 10, // Shadow radius
              elevation: 9, // Android shadow
            }}
          >
            <Text className="text-lg font-semibold mb-4">Add Meal Details</Text>
            <TextInput
              placeholder="Food"
              value={mealDetails.food}
              onChangeText={(text) =>
                setMealDetails((prev) => ({ ...prev, food: text }))
              }
              className="border border-gray-300 rounded-md p-2 mb-4"
            />
            <TextInput
              placeholder="Calories"
              value={mealDetails.calories}
              onChangeText={(text) =>
                setMealDetails((prev) => ({ ...prev, calories: text }))
              }
              className="border border-gray-300 rounded-md p-2 mb-4"
              keyboardType="numeric"
            />
            <CustomButton handlePress={handleSaveMeal} title="Save" />
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              className="mt-4"
            >
              <Text className="text-center text-gray-600">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Home;
