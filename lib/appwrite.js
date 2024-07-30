import {
  Account,
  Client,
  ID,
  Avatars,
  Databases,
  Query,
  Storage,
} from "react-native-appwrite";

export const appwriteConfig = {
  endpoint: "https://cloud.appwrite.io/v1",
  platform: "com.daddycoders.diet_planner",
  projectId: "669b5ad2000502320db4",
  storageId: "669b5bca00382f4ad9a4",
  databaseId: "669b5b9a0000578e99e0",
  userCollectionId: "669b5ba50007cac8e803",
  meal_plansCollectionId: "66a4f59f003c255a46d1",
  mealsCollectionId: "66a61bdf002c5343259c",
};

const client = new Client();

client
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId)
  .setPlatform(appwriteConfig.platform);

const account = new Account(client);
const avatars = new Avatars(client);
const databases = new Databases(client);
const storage = new Storage(client);

export const createUser = async (email, password, username) => {
  try {
    const newAccount = await account.create(
      ID.unique(),
      email,
      password,
      username
    );

    if (!newAccount) throw Error;

    const avatarUrl = avatars.getInitials(username);

    await signIn(email, password);

    const newUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      {
        accountId: newAccount.$id,
        email,
        username,
        avatar: avatarUrl,
      }
    );

    return newUser;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

export const signIn = async (email, password) => {
  try {
    const session = await account.createEmailPasswordSession(email, password);

    return session;
  } catch (error) {
    throw new Error(error);
  }
};

export const getCurrentUser = async () => {
  try {
    const currentAccount = await account.get();

    if (!currentAccount) throw Error;

    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );

    if (!currentUser) throw Error;

    return currentUser.documents[0];
  } catch (error) {
    console.log(error);
  }
};

export const signOut = async () => {
  try {
    const session = await account.deleteSession("current");

    return session;
  } catch (error) {
    throw new Error(error);
  }
};

export const updateUserProfile = async (userId, updatedData) => {
  try {
    const response = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      userId,
      updatedData
    );
    return response;
  } catch (error) {
    console.error("Failed to update profile:", error);
    throw error;
  }
};

export const getUserProfile = async (documentId) => {
  try {
    const profile = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      documentId
    );

    return profile;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw new Error("Profile not found");
  }
};

export const getMealPlans = async (userId) => {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.meal_plansCollectionId,
      [Query.equal("userId", userId)]
    );
    return response.documents;
  } catch (error) {
    console.error("Failed to fetch meal plans:", error);
    throw error;
  }
};

const calculateTotalCalories = (mealPlan) => {
  let totalCalories = 0;

  // Function to extract and sum up calories from meal items
  const sumCalories = (meal) => {
    if (Array.isArray(meal)) {
      meal.forEach((item) => {
        const parts = item.split(" - ");
        if (parts.length === 2) {
          const calories = parseInt(parts[1].split(" ")[0]);
          if (!isNaN(calories)) {
            totalCalories += calories;
          }
        }
      });
    }
  };

  // Sum calories from all meals
  ["breakfast", "lunch", "dinner", "snacks"].forEach((mealType) => {
    sumCalories(mealPlan[mealType]);
  });
  // console.log(totalCalories);
  return totalCalories;
};

export const updateMealPlan = async (userId, date, mealDetails) => {
  try {
    const mealPlan = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.meal_plansCollectionId,
      [Query.equal("userId", userId), Query.equal("date", date)]
    );

    if (mealPlan.total > 0) {
      // Update existing meal plan
      const existingPlan = mealPlan.documents[0];
      const updatedPlan = {
        ...existingPlan,
        ...mealDetails,
        totalCalories: calculateTotalCalories({
          ...existingPlan,
          ...mealDetails,
        }),
      };

      delete updatedPlan.$databaseId;
      delete updatedPlan.$collectionId;

      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.meal_plansCollectionId,
        existingPlan.$id,
        updatedPlan
      );
    } else {
      // Create a new meal plan
      const newPlan = {
        userId,
        date,
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: [],
        ...mealDetails,
        totalCalories: calculateTotalCalories(mealDetails),
      };

      await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.meal_plansCollectionId,
        ID.unique(),
        newPlan
      );
    }
  } catch (error) {
    console.error("Failed to update meal plan:", error);
    throw error;
  }
};

// Fetch meals from Appwrite
export const getMeals = async () => {
  try {
    const meals = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.mealsCollectionId
    );
    return meals.documents;
  } catch (error) {
    console.error("Error fetching Meals:", error);
    throw new Error(error);
  }
};
