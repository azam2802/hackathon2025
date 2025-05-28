// Translation mappings for regions and cities
// Maps Russian names to translation keys

export const REGION_MAPPINGS = {
  "Бишкек": "bishkek",
  "Ош": "osh", 
  "Чуйская область": "chuyOblast",
  "Ошская область": "oshOblast",
  "Джалал-Абадская область": "jalabadOblast",
  "Баткенская область": "batkenOblast",
  "Нарынская область": "narynOblast",
  "Иссык-Кульская область": "issykkulOblast",
  "Таласская область": "talasOblast"
};

export const CITY_MAPPINGS = {
  "Бишкек": "bishkek",
  "Ош": "osh",
  "Токмок": "tokmok",
  "Кант": "kant",
  "Кара-Балта": "karabalta",
  "Шопоков": "shopokov",
  "Беловодское": "belovodskoe",
  "Сокулук": "sokuluk",
  "Жайыл": "zhayyl",
  "Кемин": "kemin",
  "Панфилов": "panfilov",
  "Московский": "moskovskiy",
  "Узген": "uzgen",
  "Кара-Суу": "karasuu",
  "Ноокат": "nookat",
  "Кара-Кульджа": "karakuldzha",
  "Араван": "aravan",
  "Чон-Алай": "chonalai",
  "Алай": "alai",
  "Кызыл-Кия": "kyzylkiya",
  "Джалал-Абад": "jalalabad",
  "Кербен": "kerben",
  "Майлуу-Суу": "mailuusuu",
  "Таш-Кумыр": "tashkumyr",
  "Кок-Жангак": "kokzhangak",
  "Казарман": "kazarman",
  "Чаткал": "chatkal",
  "Токтогул": "toktogul",
  "Баткен": "batken",
  "Сулюкта": "sulyukta",
  "Кызыл-Кия": "kyzylkiya",
  "Кадамжай": "kadamzhay",
  "Лейлек": "leilek",
  "Нарын": "naryn",
  "Ат-Башы": "atbashy",
  "Жумгал": "zhumgal",
  "Кочкор": "kochkor",
  "Ак-Талаа": "aktalaa",
  "Каракол": "karakol",
  "Балыкчы": "balykchy",
  "Чолпон-Ата": "cholponata",
  "Кызыл-Суу": "kyzylsuu",
  "Тюп": "tyup",
  "Ак-Суу": "aksuu",
  "Жети-Огуз": "zhetioguz",
  "Тон": "ton",
  "Талас": "talas",
  "Кара-Буура": "karabuura",
  "Бакай-Ата": "bakayata",
  "Манас": "manas",
  "Кызыл-Адыр": "kyzyladyr"
};

// Helper functions to get translated names
export const getTranslatedRegionName = (russianName, t) => {
  const key = REGION_MAPPINGS[russianName];
  return key ? t(`regions.${key}`) : russianName;
};

export const getTranslatedCityName = (russianName, t) => {
  const key = CITY_MAPPINGS[russianName];
  return key ? t(`cities.${key}`) : russianName;
};

// Function to get translated regions and cities structure for dropdowns
export const getTranslatedRegionsCities = (t) => {
  const regionsData = {
    "Бишкек": ["Бишкек"],
    "Ош": ["Ош"],
    "Чуйская область": [
      "Токмок", "Кант", "Кара-Балта", "Шопоков", "Беловодское", 
      "Сокулук", "Жайыл", "Кемин", "Панфилов", "Московский"
    ],
    "Ошская область": [
      "Узген", "Кара-Суу", "Ноокат", "Кара-Кульджа", "Араван", 
      "Чон-Алай", "Алай", "Кызыл-Кия"
    ],
    "Джалал-Абадская область": [
      "Джалал-Абад", "Кербен", "Майлуу-Суу", "Таш-Кумыр", 
      "Кок-Жангак", "Казарман", "Чаткал", "Токтогул"
    ],
    "Баткенская область": [
      "Баткен", "Сулюкта", "Кызыл-Кия", "Кадамжай", 
      "Лейлек", "Кадамжай"
    ],
    "Нарынская область": [
      "Нарын", "Ат-Башы", "Жумгал", "Кочкор", "Ак-Талаа"
    ],
    "Иссык-Кульская область": [
      "Каракол", "Балыкчы", "Чолпон-Ата", "Кызыл-Суу", 
      "Тюп", "Ак-Суу", "Жети-Огуз", "Тон"
    ],
    "Таласская область": [
      "Талас", "Кара-Буура", "Бакай-Ата", "Манас", "Кызыл-Адыр"
    ]
  };

  // Create translated structure
  const translatedData = {};
  
  Object.keys(regionsData).forEach(russianRegion => {
    const translatedRegion = getTranslatedRegionName(russianRegion, t);
    translatedData[translatedRegion] = regionsData[russianRegion].map(russianCity => 
      getTranslatedCityName(russianCity, t)
    );
  });

  return translatedData;
};

// Function to get region list with translated names
export const getTranslatedRegions = (t) => {
  const regions = [
    "Бишкек", "Ош", "Чуйская область", "Ошская область", 
    "Джалал-Абадская область", "Баткенская область", 
    "Нарынская область", "Иссык-Кульская область", "Таласская область"
  ];
  
  return regions.map(region => ({
    value: region,
    label: getTranslatedRegionName(region, t)
  }));
};
