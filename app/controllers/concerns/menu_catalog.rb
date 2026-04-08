module MenuCatalog
  extend ActiveSupport::Concern

  DEFAULT_SIZES = [
    { id: "regular", label: "Regular", extra: 0 },
    { id: "large",   label: "Large",   extra: 100 },
    { id: "set",     label: "Set Meal (Fries + Drink)", extra: 250 }
  ].freeze

  BURGER_ADDONS = [
    { id: "cheese", label: "Extra Cheese", extra: 50 },
    { id: "patty",  label: "Extra Patty",  extra: 200 },
    { id: "bacon",  label: "Bacon",        extra: 100 },
    { id: "egg",    label: "Egg",          extra: 80 }
  ].freeze

  DRINK_SIZES = [
    { id: "regular", label: "Medium", extra: 0 },
    { id: "large",   label: "Large",  extra: 80 }
  ].freeze

  MENU_ITEMS = [
    {
      id: 1,
      category: "burgers",
      name: "Classic Burger",
      description: "Our signature beef patty with melted cheddar, fresh lettuce, ripe tomato, pickles, and our special house sauce on a toasted sesame bun.",
      base_price: 580,
      calories: 620,
      image: "https://images.unsplash.com/photo-1639339468012-528c6bc0361f?w=800&fit=crop",
      recommended: true,
      sizes: DEFAULT_SIZES,
      addons: BURGER_ADDONS
    },
    {
      id: 2,
      category: "burgers",
      name: "Double Cheese",
      description: "Two juicy beef patties stacked with double cheddar, caramelized onions, and our smoky BBQ sauce.",
      base_price: 780,
      calories: 880,
      image: "https://images.unsplash.com/photo-1618538768832-fbd192fe94fc?w=800&fit=crop",
      recommended: false,
      sizes: DEFAULT_SIZES,
      addons: BURGER_ADDONS
    },
    {
      id: 3,
      category: "burgers",
      name: "Teriyaki Burger",
      description: "Grilled beef patty glazed with house teriyaki sauce, crisp lettuce, and creamy mayo.",
      base_price: 680,
      calories: 720,
      image: "https://images.unsplash.com/photo-1580821074864-8653bab910be?w=800&fit=crop",
      recommended: false,
      sizes: DEFAULT_SIZES,
      addons: BURGER_ADDONS
    },
    {
      id: 4,
      category: "burgers",
      name: "Chicken Burger",
      description: "Crispy fried chicken thigh with shredded lettuce, tomato, and chipotle mayo.",
      base_price: 620,
      calories: 690,
      image: "https://images.unsplash.com/photo-1637926779845-af0fe888291f?w=800&fit=crop",
      recommended: false,
      sizes: DEFAULT_SIZES,
      addons: BURGER_ADDONS
    },
    {
      id: 5,
      category: "burgers",
      name: "Spicy Burger",
      description: "Beef patty with jalapeños, pepper jack cheese, and house hot sauce for a fiery kick.",
      base_price: 650,
      calories: 710,
      image: "https://images.unsplash.com/photo-1603064752734-4c48eff53d05?w=800&fit=crop",
      recommended: false,
      sizes: DEFAULT_SIZES,
      addons: BURGER_ADDONS
    },
    {
      id: 6,
      category: "burgers",
      name: "Fish Burger",
      description: "Crispy battered white fish with tartar sauce, lettuce, and pickles on a soft bun.",
      base_price: 600,
      calories: 580,
      image: "https://images.unsplash.com/photo-1645619247001-a43761cd6307?w=800&fit=crop",
      recommended: false,
      sizes: DEFAULT_SIZES,
      addons: BURGER_ADDONS
    },
    {
      id: 7,
      category: "sides",
      name: "Crispy Fries",
      description: "Golden fries lightly salted with sea salt.",
      base_price: 320,
      calories: 380,
      image: "https://images.unsplash.com/photo-1626869300065-3bfc3a8b2e42?w=800&fit=crop",
      recommended: false,
      sizes: [
        { id: "regular", label: "Regular", extra: 0 },
        { id: "large",   label: "Large",   extra: 80 }
      ],
      addons: [
        { id: "cheese-sauce", label: "Cheese Sauce", extra: 60 },
        { id: "truffle-salt", label: "Truffle Salt", extra: 80 }
      ]
    },
    {
      id: 8,
      category: "sides",
      name: "Cheese Fries",
      description: "Crispy fries smothered in melted cheddar and a sprinkle of bacon bits.",
      base_price: 380,
      calories: 460,
      image: "https://images.unsplash.com/photo-1639024471283-03518883512d?w=800&fit=crop",
      recommended: true,
      sizes: [
        { id: "regular", label: "Regular", extra: 0 },
        { id: "large",   label: "Large",   extra: 100 }
      ],
      addons: []
    },
    {
      id: 9,
      category: "drinks",
      name: "Iced Lemon Tea",
      description: "Refreshing house-brewed black tea with fresh lemon and a touch of honey.",
      base_price: 250,
      calories: 90,
      image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&fit=crop",
      recommended: false,
      sizes: DRINK_SIZES,
      addons: []
    },
    {
      id: 10,
      category: "drinks",
      name: "Cola",
      description: "Classic ice-cold cola served in a frosted glass.",
      base_price: 220,
      calories: 140,
      image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&fit=crop",
      recommended: false,
      sizes: DRINK_SIZES,
      addons: []
    },
    {
      id: 11,
      category: "kids",
      name: "Kids Meal",
      description: "Mini burger, small fries, and a juice box. Comes with a surprise toy.",
      base_price: 490,
      calories: 540,
      image: "https://images.unsplash.com/photo-1704708799871-8a738dbe5cbd?w=800&fit=crop",
      recommended: true,
      sizes: [
        { id: "regular", label: "Regular", extra: 0 }
      ],
      addons: [
        { id: "extra-juice", label: "Extra Juice", extra: 80 }
      ]
    }
  ].freeze

  def menu_items
    MENU_ITEMS
  end

  def find_menu_item(id)
    MENU_ITEMS.find { |item| item[:id] == id.to_i }
  end
end
