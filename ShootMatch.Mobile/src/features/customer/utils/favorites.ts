import AsyncStorage from '@react-native-async-storage/async-storage';
import { Photographer } from '../api';

const FAVORITES_KEY = 'sm_customer_favorites';

export async function getFavorites(): Promise<Photographer[]> {
  try {
    const data = await AsyncStorage.getItem(FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load favorites:', error);
    return [];
  }
}

export async function addFavorite(photographer: Photographer): Promise<void> {
  try {
    const list = await getFavorites();
    if (!list.some(p => p.id === photographer.id)) {
      list.push(photographer);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
    }
  } catch (error) {
    console.error('Failed to add favorite:', error);
  }
}

export async function removeFavorite(id: string): Promise<void> {
  try {
    let list = await getFavorites();
    list = list.filter(p => p.id !== id);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
  } catch (error) {
    console.error('Failed to remove favorite:', error);
  }
}

export async function isFavorite(id: string): Promise<boolean> {
  try {
    const list = await getFavorites();
    return list.some(p => p.id === id);
  } catch {
    return false;
  }
}
