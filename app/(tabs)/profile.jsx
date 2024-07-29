import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Image,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Text,
  Modal,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { icons } from "../../constants";
import {
  getUserProfile,
  updateUserProfile,
  signOut,
  getMealPlans,
} from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";
import EmptyState from "../../components/EmptyState";
import { Ionicons } from "@expo/vector-icons";
import InfoBox from "../../components/InfoBox";
import CustomButton from "../../components/CustomButton";
import { format, subDays, parseISO, compareAsc } from "date-fns";
import useAppwrite from "../../lib/useAppwrite";

const Profile = () => {
  const { user, setUser, setIsLogged } = useGlobalContext();
  const [profile, setProfile] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [goal, setGoal] = useState("");
  const {
    data: mealPlans,
    loading,
    refetch,
  } = useAppwrite(() => getMealPlans(user.$id));
  const [todayCalories, setTodayCalories] = useState(0);
  const [weeklyAvgCalories, setWeeklyAvgCalories] = useState(0);
  const [monthlyAvgCalories, setMonthlyAvgCalories] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (user?.$id) {
          const profileData = await getUserProfile(user.$id);
          setProfile(profileData);
          setHeight(profileData.height || "");
          setWeight(profileData.weight || "");
          setGoal(profileData.goal || "");
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };

    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (mealPlans.length > 0) {
      const today = format(new Date(), "yyyy-MM-dd");
      const weekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
      const monthAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");

      let todayCalories = 0;
      let weeklyCalories = 0;
      let monthlyCalories = 0;
      let weeklyCount = 0;
      let monthlyCount = 0;

      mealPlans.forEach((plan) => {
        const planDate = format(parseISO(plan.date), "yyyy-MM-dd");

        if (planDate === today) {
          todayCalories += plan.totalCalories || 0;
        }
        if (planDate > weekAgo && planDate <= today) {
          weeklyCalories += plan.totalCalories || 0;
          weeklyCount++;
        }
        if (planDate > monthAgo && planDate <= today) {
          monthlyCalories += plan.totalCalories || 0;
          monthlyCount++;
        }
      });

      setTodayCalories(todayCalories);
      setWeeklyAvgCalories(weeklyCount ? weeklyCalories / weeklyCount : 0);
      setMonthlyAvgCalories(monthlyCount ? monthlyCalories / monthlyCount : 0);
    }
  }, [mealPlans]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error("Failed to refresh meal plans:", error);
    }
    setRefreshing(false);
  };

  const handleSave = async () => {
    try {
      const heightFloat = parseFloat(height);
      const weightFloat = parseFloat(weight);
      const goalFloat = parseFloat(goal);

      if (isNaN(heightFloat) || isNaN(weightFloat) || isNaN(goalFloat)) {
        alert("Please enter valid numbers for height, weight, and goal.");
        return;
      }

      const updatedData = {
        height: heightFloat,
        weight: weightFloat,
        goal: goalFloat,
      };

      await updateUserProfile(user.$id, updatedData);
      setProfile({
        ...profile,
        height: heightFloat,
        weight: weightFloat,
        goal: goalFloat,
      });
      setModalVisible(false);
    } catch (error) {
      console.error("Failed to update profile:", error.message || error);
      alert("Failed to update profile. Please try again.");
    }
  };

  const logout = async () => {
    await signOut();
    setUser(null);
    setIsLogged(false);
    router.replace("/sign-in");
  };

  const renderContent = () => {
    if (!profile && mealPlans.length === 0) {
      return (
        <EmptyState
          title="No records yet"
          subtitle="Let's plan meals together"
        />
      );
    }

    return (
      <View className="w-full flex flex-col items-start mt-6 mb-12 px-4">
        <TouchableOpacity
          onPress={logout}
          className="flex w-full items-end mb-5"
        >
          <Image
            source={icons.logout}
            resizeMode="contain"
            className="w-6 h-6"
          />
        </TouchableOpacity>

        <View className="w-full flex flex-row items-center">
          <View className="w-16 h-16 border border-green-400 rounded-full flex justify-center items-center">
            <Image
              source={{ uri: profile?.avatar || user?.avatar }}
              className="w-[90%] h-[90%] rounded-full"
              resizeMode="cover"
            />
          </View>
          <View className="ml-4 flex-1">
            <InfoBox
              title={profile?.username || user?.username}
              containerStyles="flex-row items-center"
              titleStyles="text-lg"
            />
          </View>
        </View>

        <View className="mt-4 p-4 w-full bg-gray-50 rounded-md flex-row">
          <View>
            <Text className="text-gray-700 text-lg mb-2 font-bold">
              Height: {profile?.height || "--"} cm
            </Text>
            <Text className="text-gray-700 text-lg mb-2 font-bold">
              Weight: {profile?.weight || "--"} kg
            </Text>
            <Text className="text-gray-700 text-2xl font-pbold">
              Goal: {profile?.goal || "--"} kg
            </Text>
          </View>
          <View className="ml-48 -mt-2">
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              className="mt-2 border border-blue-400 rounded-md p-1 bg-white"
            >
              <Ionicons name="pencil" color="#3b82f6" size={18} />
            </TouchableOpacity>
          </View>
        </View>
        {mealPlans.length > 0 && (
          <View className="w-full mt-8 px-0 justify-center items-center">
            <View className="w-full bg-red-500 p-4 rounded-lg items-center mb-5">
              <Text className="text-gray-700 text-xl text-center font-bold">
                Total Calories consumed today
              </Text>
              <Text className="text-6xl py-3 mt-4 mb-0 font-extrabold text-white">
                {todayCalories} kcal
              </Text>
            </View>
            <View className="w-full bg-red-500 p-4 rounded-lg items-center mb-5">
              <Text className="text-gray-700 text-xl text-center font-bold">
                Avg calories consumed in the last week
              </Text>
              <Text className="text-6xl py-3 mt-4 mb-0 font-extrabold text-white">
                {weeklyAvgCalories.toFixed(0)} kcal
              </Text>
            </View>
            <View className="w-full bg-red-500 p-4 rounded-lg items-center mb-5">
              <Text className="text-gray-700 text-xl text-center font-bold">
                Avg calories consumed in the last month
              </Text>
              <Text className="text-6xl py-3 mt-4 mb-0 font-extrabold text-white">
                {monthlyAvgCalories.toFixed(0)} kcal
              </Text>
            </View>
            <Text className="text-2xl mt-10 -mb-10 text-black">
              Total calories history
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="bg-white h-full">
      <FlatList
        data={mealPlans}
        renderItem={({ item }) => (
          <View className="p-4 border-b border-gray-200">
            <Text className="font-semibold text-lg mb-2 bg-red-400 rounded-lg p-2 text-white">
              {format(parseISO(item.date), "d MMMM yyyy")}
            </Text>
            <Text className="text-black text-xl">
              {item.totalCalories} kcal
            </Text>
          </View>
        )}
        keyExtractor={(item) => item.$id}
        ListHeaderComponent={renderContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: "rgba(0,0,0, 0.7)" }}
        >
          <View className="bg-white w-[90%] rounded-lg p-6">
            <Text className="text-2xl font-bold mb-4">Edit Profile</Text>
            <TextInput
              value={height}
              onChangeText={setHeight}
              placeholder="Height (cm)"
              keyboardType="numeric"
              className="border border-gray-300 rounded-lg p-2 mb-4"
            />
            <TextInput
              value={weight}
              onChangeText={setWeight}
              placeholder="Weight (kg)"
              keyboardType="numeric"
              className="border border-gray-300 rounded-lg p-2 mb-4"
            />
            <TextInput
              value={goal}
              onChangeText={setGoal}
              placeholder="Goal (kg)"
              keyboardType="numeric"
              className="border border-gray-300 rounded-lg p-2 mb-4"
            />
            <CustomButton
              title="Save"
              handlePress={handleSave}
              containerStyles="bg-green-500 p-4 rounded-lg mb-4"
              textStyles="text-white text-lg font-bold text-center"
            />
            <CustomButton
              title="Cancel"
              handlePress={() => setModalVisible(false)}
              containerStyles="bg-red-500 p-4 rounded-lg"
              textStyles="text-white text-lg font-bold text-center"
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Profile;
