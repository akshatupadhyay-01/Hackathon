import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

export type Language = 'en' | 'hi';

export interface Translations {
  [key: string]: string | Translations;
}

export const translations: Record<Language, Translations> = {
  en: {
    brand: {
      name: 'Johar Jharkhand',
      tagline: 'Eco & Cultural Tourism Platform',
      badge: 'Eco & Cultural Tourism Platform',
      deptBadge: 'Dept. of Tourism, Govt. of Jharkhand',
    },
    nav: {
      explore: 'Explore',
      ecoMap: 'Eco Map',
      artisansGuides: 'Artisans & Guides',
      tripPlanner: 'Trip Planner',
      hostPortal: 'Host Portal',
      govDashboard: 'Gov Dashboard',
      sos: 'SOS',
      installApp: 'Install App',
      installMobileApp: 'Install Jharkhand Eco App',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      createAccount: 'Create Account',
      profile: 'Profile & Settings',
      myTrips: 'My Saved Trips',
      myPasses: 'My Reservations & Passes',
      signOut: 'Sign Out',
      appearance: 'Appearance',
      lightMode: 'Light Mode',
      darkMode: 'Dark Mode',
      language: 'Language',
      english: 'English',
      hindi: 'हिंदी (Hindi)',
    },
    mobileNav: {
      explore: 'Explore',
      ecoMap: 'Eco Map',
      aiPlanner: 'AI Planner',
      artisans: 'Artisans',
      account: 'Account',
      ecoPasses: 'Eco Passes',
    },
    quickActions: {
      forestSos: '24x7 Forest SOS (112)',
      offlineMap: 'Offline GPS Map',
      aiTrip: 'AI Trip in 10s',
      myPasses: 'My Eco Passes',
    },
    home: {
      heroTitle1: 'Discover Untamed',
      heroTitle2: 'Jharkhand',
      heroSubtitle: 'Sacred Hills, Cascades & Living Tribal Art',
      heroDescription:
        'Experience community-driven, carbon-conscious travel across 8 eco-rich districts. Connect with certified indigenous guides, book tribal homestays, and celebrate Dokra and Sohrai artisans.',
      searchPlaceholder: 'Search Betla, Hundru, Netarhat, Dokra art...',
      exploreNow: 'Explore Now',
      quickFilters: 'Quick Filters:',
      featuredTitle: 'Explore Jharkhand Destinations',
      featuredSubtitle: 'Handcrafted itineraries across pristine waterfalls, sacred peaks, and wildlife sanctuaries.',
      viewAllDestinations: 'View All Destinations',
      curatedCircuits: 'Curated Eco-Circuits',
      viewAllCircuits: 'View All Circuits',
      verifiedGuides: 'Certified Indigenous Guides',
      guidesSubtitle: 'Travel with native tribal guides who know every sacred grove and hidden trail.',
      artisanTitle: 'Living Tribal Art & Handloom',
      artisanSubtitle: 'Directly support authentic Dokra lost-wax bronze smiths and Sohrai-Kohbar muralists.',
      ctaTitle: 'Plan Your Carbon-Neutral Adventure',
      ctaSubtitle: 'Generate a personalized eco-itinerary in 10 seconds with zero plastic recommendations.',
      startPlanning: 'Start AI Trip Planner',
    },
    badges: {
      ecoCertified: 'Eco Certified',
      lowCrowd: 'Low Crowd',
      moderateCrowd: 'Moderate Crowd',
      highCrowd: 'High Crowd',
      verified: 'Verified',
      safeTravel: 'Safe Travel',
      instantPass: 'Instant Digital Pass',
      carbonOffset: 'Carbon Offset',
    },
    categories: {
      all: 'All Categories',
      waterfalls: 'Waterfalls & Cascades',
      wildlife: 'Wildlife & National Parks',
      spiritual: 'Sacred & Spiritual Hills',
      heritage: 'Tribal Heritage & Art',
      hills: 'Hill Stations & Valleys',
      homestays: 'Tribal Homestays',
      adventure: 'Trekking & Adventure',
    },
    destination: {
      entryFee: 'Entry Fee',
      free: 'Free Entry',
      bestTime: 'Best Time',
      crowdStatus: 'Real-Time Crowd',
      overview: 'Overview',
      highlights: 'Highlights & Attractions',
      ecoGuidelines: 'Eco-Tourism Guidelines',
      bookEcoPass: 'Book Digital Eco-Pass',
      directions: 'Get GPS Directions',
      contactHelp: 'Local Forest Helpline',
      reviews: 'Tourist Reviews',
      writeReview: 'Write a Review',
      localGuides: 'Certified Guides for this Zone',
      nearbyHomestays: 'Nearby Tribal Homestays',
    },
    tripPlanner: {
      title: 'AI Smart Eco-Trip Planner',
      subtitle: 'Build a customized carbon-conscious itinerary for Jharkhand in seconds.',
      duration: 'Trip Duration (Days)',
      budget: 'Total Estimated Budget (₹)',
      guests: 'Number of Travelers',
      startingPoint: 'Starting Location',
      travelStyle: 'Travel Group Style',
      interests: 'Interests & Activities',
      generateButton: 'Generate AI Itinerary',
      generating: 'Crafting Personalized Eco-Itinerary...',
      carbonSaved: 'Estimated CO₂ Avoided',
    },
    sos: {
      title: 'Emergency Assistance & Forest Helplines',
      subtitle: '24x7 verified emergency numbers for Jharkhand tourists with GPS broadcast.',
      police: 'Police Control Room',
      ambulance: 'Medical & Ambulance',
      fire: 'Fire Emergency',
      forestDept: 'Forest & Wildlife Rescue',
      touristHelpline: 'Jharkhand Tourism Helpline',
      currentLocation: 'Your Live GPS Coordinates',
      locating: 'Acquiring GPS Satellite Fix...',
      shareGps: 'Copy GPS for Emergency Responders',
      callNow: 'Call Now',
    },
    footer: {
      tagline: 'Dedicated to promoting sustainable eco-tourism, indigenous tribal heritage, and authentic rural livelihoods across Jharkhand.',
      exploreTitle: 'Explore Jharkhand',
      communityTitle: 'Community & Culture',
      charterTitle: 'Green Tourism Charter',
      charterText: '100% of guide and homestay bookings directly empower local indigenous Gram Panchayats and self-help cooperatives.',
      rights: '© 2026 Johar Jharkhand Tourism Platform — SIH25032 Hackathon Prototype.',
      builtWith: 'Built for Jharkhand with love',
    },
  },
  hi: {
    brand: {
      name: 'जोहार झारखंड',
      tagline: 'इको एवं सांस्कृतिक पर्यटन मंच',
      badge: 'इको एवं सांस्कृतिक पर्यटन मंच',
      deptBadge: 'पर्यटन विभाग, झारखंड सरकार',
    },
    nav: {
      explore: 'खोजें',
      ecoMap: 'इको मैप',
      artisansGuides: 'शिल्पकार व गाइड',
      tripPlanner: 'ट्रिप प्लानर',
      hostPortal: 'होस्ट पोर्टल',
      govDashboard: 'सरकारी डैशबोर्ड',
      sos: 'आपातकालीन सहायता',
      installApp: 'ऐप इंस्टॉल करें',
      installMobileApp: 'झारखंड इको ऐप इंस्टॉल करें',
      signIn: 'लॉग इन करें',
      signUp: 'साइन अप करें',
      createAccount: 'खाता बनाएं',
      profile: 'प्रोफाइल व सेटिंग्स',
      myTrips: 'मेरी सुरक्षित यात्राएं',
      myPasses: 'मेरे आरक्षण व पास',
      signOut: 'लॉग आउट',
      appearance: 'दिखावट',
      lightMode: 'लाइट मोड',
      darkMode: 'डार्क मोड',
      language: 'भाषा',
      english: 'English',
      hindi: 'हिंदी (Hindi)',
    },
    mobileNav: {
      explore: 'खोजें',
      ecoMap: 'इको मैप',
      aiPlanner: 'AI प्लानर',
      artisans: 'शिल्पकार',
      account: 'खाता',
      ecoPasses: 'इको पास',
    },
    quickActions: {
      forestSos: '24x7 वन आपातकालीन (112)',
      offlineMap: 'ऑफलाइन जीपीएस मैप',
      aiTrip: '10 सेकंड में AI ट्रिप',
      myPasses: 'मेरे इको पास',
    },
    home: {
      heroTitle1: 'अछूते और सुंदर',
      heroTitle2: 'झारखंड को जानें',
      heroSubtitle: 'पवित्र पर्वत, मनमोहक जलप्रपात और जीवंत जनजातीय कला',
      heroDescription:
        '8 पर्यावरण-समृद्ध जिलों में समुदाय-संचालित, कार्बन-सचेत यात्रा का अनुभव करें। प्रमाणित स्थानीय गाइडों से जुड़ें, जनजातीय होमस्टे बुक करें और ढोकरा व सोहराई शिल्पकारों का सम्मान करें।',
      searchPlaceholder: 'बेतला, हुंडरू, नेतरहाट, ढोकरा कला खोजें...',
      exploreNow: 'अभी खोजें',
      quickFilters: 'त्वरित फ़िल्टर:',
      featuredTitle: 'झारखंड के प्रमुख पर्यटन स्थल',
      featuredSubtitle: 'प्राकृतिक झरनों, पवित्र चोटियों और वन्यजीव अभयारण्यों के लिए विशेष यात्रा मार्ग।',
      viewAllDestinations: 'सभी गंतव्य देखें',
      curatedCircuits: 'विशेष इको-सर्किट',
      viewAllCircuits: 'सभी सर्किट देखें',
      verifiedGuides: 'प्रमाणित स्थानीय जनजातीय गाइड',
      guidesSubtitle: 'स्थानीय गाइडों के साथ घूमें जो हर पवित्र वन और गुप्त पगडंडियों को जानते हैं।',
      artisanTitle: 'जीवंत जनजातीय कला एवं हथकरघा',
      artisanSubtitle: 'प्रामाणिक ढोकरा धातु शिल्पकारों और सोहराई-कोहबर भित्ति चित्रकारों को सीधे समर्थन दें।',
      ctaTitle: 'अपनी पर्यावरण-अनुकूल यात्रा की योजना बनाएं',
      ctaSubtitle: 'शून्य-प्लास्टिक अनुशंसाओं के साथ 10 सेकंड में अपना व्यक्तिगत इको-यात्रा कार्यक्रम तैयार करें।',
      startPlanning: 'AI ट्रिप प्लानर शुरू करें',
    },
    badges: {
      ecoCertified: 'इको प्रमाणित',
      lowCrowd: 'कम भीड़',
      moderateCrowd: 'मध्यम भीड़',
      highCrowd: 'अधिक भीड़',
      verified: 'सत्यापित',
      safeTravel: 'सुरक्षित यात्रा',
      instantPass: 'त्वरित डिजिटल पास',
      carbonOffset: 'कार्बन भरपाई',
    },
    categories: {
      all: 'सभी श्रेणियां',
      waterfalls: 'जलप्रपात एवं झरने',
      wildlife: 'वन्यजीव एवं राष्ट्रीय उद्यान',
      spiritual: 'पवित्र एवं धार्मिक स्थल',
      heritage: 'जनजातीय धरोहर एवं कला',
      hills: 'हिल स्टेशन एवं वादियां',
      homestays: 'जनजातीय होमस्टे',
      adventure: 'ट्रेकिंग एवं साहसिक पर्यटन',
    },
    destination: {
      entryFee: 'प्रवेश शुल्क',
      free: 'निःशुल्क प्रवेश',
      bestTime: 'सर्वोत्तम समय',
      crowdStatus: 'ताजा भीड़ की स्थिति',
      overview: 'अवलोकन',
      highlights: 'प्रमुख आकर्षण',
      ecoGuidelines: 'इको-पर्यटन दिशा-निर्देश',
      bookEcoPass: 'डिजिटल इको-पास बुक करें',
      directions: 'जीपीएस दिशा-निर्देश प्राप्त करें',
      contactHelp: 'स्थानीय वन हेल्पलाइन',
      reviews: 'पर्यटकों की समीक्षाएं',
      writeReview: 'समीक्षा लिखें',
      localGuides: 'इस क्षेत्र के प्रमाणित गाइड',
      nearbyHomestays: 'आस-पास के जनजातीय होमस्टे',
    },
    tripPlanner: {
      title: 'AI स्मार्ट इको-ट्रिप प्लानर',
      subtitle: 'झारखंड के लिए सेकंडों में एक अनुकूलित कार्बन-सचेत यात्रा कार्यक्रम बनाएं।',
      duration: 'यात्रा अवधि (दिन)',
      budget: 'अनुमानित कुल बजट (₹)',
      guests: 'यात्रियों की संख्या',
      startingPoint: 'प्रस्थान स्थल',
      travelStyle: 'यात्रा समूह प्रकार',
      interests: 'रुचियां एवं गतिविधियां',
      generateButton: 'AI यात्रा कार्यक्रम बनाएं',
      generating: 'व्यक्तिगत इको-यात्रा कार्यक्रम तैयार किया जा रहा है...',
      carbonSaved: 'अनुमानित CO₂ बचत',
    },
    sos: {
      title: 'आपातकालीन सहायता एवं वन हेल्पलाइन',
      subtitle: 'जीपीएस प्रसारण के साथ झारखंड पर्यटकों के लिए 24x7 सत्यापित आपातकालीन नंबर।',
      police: 'पुलिस नियंत्रण कक्ष',
      ambulance: 'चिकित्सा एवं एम्बुलेंस',
      fire: 'अग्निशमन दल',
      forestDept: 'वन एवं वन्यजीव बचाव',
      touristHelpline: 'झारखंड पर्यटन हेल्पलाइन',
      currentLocation: 'आपका लाइव जीपीएस स्थान',
      locating: 'जीपीएस सैटेलाइट से संपर्क हो रहा है...',
      shareGps: 'आपातकालीन सहायता के लिए जीपीएस कॉपी करें',
      callNow: 'कॉल करें',
    },
    footer: {
      tagline: 'झारखंड में सतत पर्यावरण पर्यटन, जनजातीय धरोहर और प्रामाणिक ग्रामीण आजीविका को बढ़ावा देने हेतु समर्पित।',
      exploreTitle: 'झारखंड देखें',
      communityTitle: 'समुदाय एवं संस्कृति',
      charterTitle: 'हरित पर्यटन चार्टर',
      charterText: 'गाइड और होमस्टे बुकिंग का 100% हिस्सा सीधे स्थानीय ग्राम पंचायतों और महिला स्व-सहायता समूहों को सशक्त बनाता है।',
      rights: '© 2026 जोहार झारखंड पर्यटन मंच — SIH25032 प्रोटोटाइप।',
      builtWith: 'झारखंड के लिए अपार स्नेह के साथ निर्मित',
    },
  },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (path: string, fallback?: string) => string;
  isHindi: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('jj_language');
      if (saved === 'hi' || saved === 'en') return saved;
    } catch {
      // Fallback
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('jj_language', lang);
      document.documentElement.lang = lang;
    } catch {
      // Storage unavailable
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useMemo(() => {
    return (path: string, fallback?: string): string => {
      const keys = path.split('.');
      let current: any = translations[language];

      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          // Fallback to English dictionary if key not found in current language
          let enCurrent: any = translations.en;
          for (const enKey of keys) {
            if (enCurrent && typeof enCurrent === 'object' && enKey in enCurrent) {
              enCurrent = enCurrent[enKey];
            } else {
              enCurrent = undefined;
              break;
            }
          }
          if (typeof enCurrent === 'string') return enCurrent;
          return fallback || path;
        }
      }

      if (typeof current === 'string') return current;
      return fallback || path;
    };
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t,
      isHindi: language === 'hi',
    }),
    [language, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
