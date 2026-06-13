import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import { images } from '../src/images';
import { useStore } from '../src/store/AppStore';
import { colors } from '../src/theme';

// 启动入口：根据是否已完成引导决定去向
export default function Index() {
  const { ready, data } = useStore();

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }}>
        <Image source={images.logo} style={{ width: 88, height: 88 }} resizeMode="contain" />
        <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 8 }}>零卡</Text>
        <ActivityIndicator color="#fff" style={{ marginTop: 18 }} />
      </View>
    );
  }

  return <Redirect href={data.onboarded ? '/(tabs)' : '/onboarding'} />;
}
