import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, SafeAreaView, StatusBar, Linking, BackHandler, NativeModules } from 'react-native';
import { AdEventType, BannerAd, BannerAdSize, InterstitialAd, RewardedAdEventType, RewardedInterstitialAd, TestIds } from 'react-native-google-mobile-ads';

const diceImages = {
  1: require('./assets/images/dice1.png'),
  2: require('./assets/images/dice2.png'),
  3: require('./assets/images/dice3.png'),
  4: require('./assets/images/dice4.png'),
  5: require('./assets/images/dice5.png'),
  6: require('./assets/images/dice6.png'),
};

// const adUnitId = __DEV__ ? TestIds.ADAPTIVE_BANNER : 'ca-app-pub-6968109228755506/1775291689';
const interstitial = InterstitialAd.createForAdRequest('ca-app-pub-6968109228755506/8690217655', {
  requestNonPersonalizedAdsOnly: true
});

const rewardedInterstitial = RewardedInterstitialAd.createForAdRequest('ca-app-pub-6968109228755506/6258791161', {
  requestNonPersonalizedAdsOnly: true
});

export default function App() {
  const [diceNumbers, setDiceNumbers] = useState([1, 1, 1]);
  const spinValue = new Animated.Value(0);
  const [total, setTotal] = useState(1);
  const [interstitialLoaded, setInterstitialLoaded] = useState(false);
  const [rewardedInterstitialLoaded, setRewardedInterstitialLoaded] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [lastRollTime, setLastRollTime] = useState(Date.now());

  const LoadInterstitial = () => {
    const unsubscribeLoaded = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => {
        setInterstitialLoaded(true);
      }
    );

    const unsubscribeClosed = interstitial.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        setInterstitialLoaded(false);
        interstitial.load();
      }
    );

    interstitial.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
    };
  };

  const loadRewardedInterstitial = () => {
    const unsubscribeLoaded = rewardedInterstitial.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        setRewardedInterstitialLoaded(true);
      }
    );

    const unsubscribeEarned = rewardedInterstitial.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      reward => {
        console.log(`User earned reward of ${reward.amount} ${reward.type}`);
      }
    );

    const unsubscribeClosed = rewardedInterstitial.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        setRewardedInterstitialLoaded(false);
        rewardedInterstitial.load();
      }
    );

    rewardedInterstitial.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeEarned();
    };
  };

  useEffect(() => {
    // console.log("🔄 Đang tải quảng cáo...");
    const unsubscribeInterstitialEvents = LoadInterstitial();
    const unsubscribeRewardedInterstitialEvent = loadRewardedInterstitial();
  
    return () => {
      unsubscribeInterstitialEvents();
      unsubscribeRewardedInterstitialEvent();
    };
  }, []);

  const rollDice = () => {
    if (isRolling) return;
  
    if (interstitialLoaded) {
      // console.log("🎬 Hiển thị quảng cáo Interstitial trước khi tung xúc xắc");
      interstitial.show();
    } else if (rewardedInterstitialLoaded) {
      // console.log("🎬 Hiển thị quảng cáo Rewarded trước khi tung xúc xắc");
      rewardedInterstitial.show();
    } else {
      // console.log("⚠️ Không có quảng cáo nào sẵn sàng!");
    }
  
    setIsRolling(true);
    setLastRollTime(Date.now());
  
    const newNumbers = Array.from({ length: 3 }, () => Math.floor(Math.random() * 6) + 1);
  
    Animated.sequence([
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(spinValue, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDiceNumbers(newNumbers);
      setTotal(newNumbers.reduce((acc, num) => acc + num, 0));
      setIsRolling(false);
    });
  };

  useEffect(() => {
    let timeout:any;
  
    const scheduleAd = () => {
      const randomTime = Math.floor(Math.random() * (60000 - 15000 + 1)) + 15000;
      // console.log(`📢 Quảng cáo sẽ hiển thị sau: ${randomTime / 1000} giây`);
  
      timeout = setTimeout(() => {
        if (!isRolling) { 
          if (interstitialLoaded) {
            // console.log("🎬 Hiển thị quảng cáo Interstitial");
            interstitial.show();
          } else if (rewardedInterstitialLoaded) {
            // console.log("🎬 Hiển thị quảng cáo Rewarded");
            rewardedInterstitial.show();
          } else {
            // console.log("⚠️ Không có quảng cáo nào sẵn sàng!");
          }
        }
        scheduleAd(); // Lặp lại chu kỳ kiểm tra
      }, randomTime);
    };
  
    scheduleAd();
  
    return () => clearTimeout(timeout);
  }, [isRolling, interstitialLoaded, rewardedInterstitialLoaded]);
  

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.top}>
        {/* <BannerAd
          unitId={adUnitId}
          size={BannerAdSize.LARGE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true
          }}
        /> */}
      </View>

      <View style={styles.middle}>
        <View style={styles.diceContainer}>
          {diceNumbers.map((num, index) => (
            <Animated.Image key={index} source={diceImages[num]} style={[styles.diceImage, { transform: [{ rotate: spin }] }]} />
          ))}
        </View>

        <View style={styles.resultContainer}>
          <View style={styles.confettiCircle}>
            <Text style={styles.resultText}>{total}</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.button, isRolling && { opacity: 0.5 }]} onPress={rollDice} disabled={isRolling}>
          <Text style={styles.buttonText}>ROLL</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottom}>
        {/* <BannerAd
          unitId={adUnitId}
          size={BannerAdSize.LARGE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true
          }}
        /> */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingTop: StatusBar.currentHeight,
  },
  diceContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  diceImage: {
    width: 80,
    height: 80,
    margin: 5,
  },
  resultContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  confettiCircle: {
    width: 70,
    height: 70,
    backgroundColor: '#ffa07a',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  resultText: {
    fontSize: 28,
    color: '#000',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 30,
    alignSelf: 'center',
    paddingHorizontal: 40,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  top: {
    flex: 2,
    alignItems: 'center',
  },
  middle: {
    flex: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottom: {
    flex: 2,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
});
