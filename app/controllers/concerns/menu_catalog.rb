module MenuCatalog
  extend ActiveSupport::Concern

  DEFAULT_SIZES = [
    { id: "regular", label: "レギュラー", extra: 0 },
    { id: "large",   label: "ラージ",     extra: 100 },
    { id: "set",     label: "セット (フライドポテト + ドリンク)", extra: 250 }
  ].freeze

  BURGER_ADDONS = [
    { id: "cheese", label: "チーズ追加", extra: 50 },
    { id: "patty",  label: "パティ追加", extra: 200 },
    { id: "bacon",  label: "ベーコン",   extra: 100 },
    { id: "egg",    label: "エッグ",     extra: 80 }
  ].freeze

  DRINK_SIZES = [
    { id: "regular", label: "ミディアム", extra: 0 },
    { id: "large",   label: "ラージ",     extra: 80 }
  ].freeze

  MENU_ITEMS = [
    {
      id: 1,
      category: "burgers",
      name: "クラシックバーガー",
      description: "当店自慢のビーフパティに、とろけるチェダーチーズ、新鮮なレタス、完熟トマト、ピクルス、特製ハウスソースを合わせ、香ばしくトーストしたゴマ付きバンズでサンドしました。",
      base_price: 580,
      calories: 620,
      image: "https://images.unsplash.com/photo-1639339468012-528c6bc0361f?w=800&fit=crop",
      recommended: true,
      max_quantity: 10,
      sizes: DEFAULT_SIZES,
      addons: BURGER_ADDONS
    },
    {
      id: 2,
      category: "burgers",
      name: "ダブルチーズ",
      description: "ジューシーなビーフパティを2枚重ね、ダブルチェダーチーズ、キャラメリゼした玉ねぎ、スモーキーな自家製BBQソースを合わせました。",
      base_price: 780,
      calories: 880,
      image: "https://images.unsplash.com/photo-1618538768832-fbd192fe94fc?w=800&fit=crop",
      recommended: false,
      max_quantity: 8,
      sizes: DEFAULT_SIZES,
      addons: BURGER_ADDONS
    },
    {
      id: 3,
      category: "burgers",
      name: "テリヤキバーガー",
      description: "自家製テリヤキソースを絡めたグリルビーフパティに、シャキッとしたレタスとクリーミーなマヨネーズを合わせました。",
      base_price: 680,
      calories: 720,
      image: "https://images.unsplash.com/photo-1580821074864-8653bab910be?w=800&fit=crop",
      recommended: false,
      max_quantity: 10,
      sizes: DEFAULT_SIZES,
      addons: BURGER_ADDONS
    },
    {
      id: 4,
      category: "burgers",
      name: "チキンバーガー",
      description: "サクサクに揚げた鶏もも肉に、千切りレタス、トマト、チポトレマヨネーズを合わせました。",
      base_price: 620,
      calories: 690,
      image: "https://images.unsplash.com/photo-1637926779845-af0fe888291f?w=800&fit=crop",
      recommended: false,
      max_quantity: 10,
      sizes: DEFAULT_SIZES,
      addons: BURGER_ADDONS
    },
    {
      id: 5,
      category: "burgers",
      name: "スパイシーバーガー",
      description: "ハラペーニョ、ペッパージャックチーズ、自家製ホットソースを合わせた、刺激的な辛さのビーフバーガー。",
      base_price: 650,
      calories: 710,
      image: "https://images.unsplash.com/photo-1603064752734-4c48eff53d05?w=800&fit=crop",
      recommended: false,
      max_quantity: 8,
      sizes: DEFAULT_SIZES,
      addons: BURGER_ADDONS
    },
    {
      id: 6,
      category: "burgers",
      name: "フィッシュバーガー",
      description: "衣がサクサクの白身魚フライに、タルタルソース、レタス、ピクルスを合わせ、ふんわりバンズでサンドしました。",
      base_price: 600,
      calories: 580,
      image: "https://images.unsplash.com/photo-1645619247001-a43761cd6307?w=800&fit=crop",
      recommended: false,
      max_quantity: 6,
      sizes: DEFAULT_SIZES,
      addons: BURGER_ADDONS
    },
    {
      id: 7,
      category: "sides",
      name: "クリスピーフライ",
      description: "黄金色に揚げたフライドポテトに、海塩を軽く振りました。",
      base_price: 320,
      calories: 380,
      image: "https://images.unsplash.com/photo-1626869300065-3bfc3a8b2e42?w=800&fit=crop",
      recommended: false,
      max_quantity: 15,
      sizes: [
        { id: "regular", label: "レギュラー", extra: 0 },
        { id: "large",   label: "ラージ",     extra: 80 }
      ],
      addons: [
        { id: "cheese-sauce", label: "チーズソース", extra: 60 },
        { id: "truffle-salt", label: "トリュフ塩",   extra: 80 }
      ]
    },
    {
      id: 8,
      category: "sides",
      name: "チーズフライ",
      description: "サクサクのフライドポテトに、とろけるチェダーチーズとベーコンビッツをたっぷりかけました。",
      base_price: 380,
      calories: 460,
      image: "https://images.unsplash.com/photo-1639024471283-03518883512d?w=800&fit=crop",
      recommended: true,
      max_quantity: 10,
      sizes: [
        { id: "regular", label: "レギュラー", extra: 0 },
        { id: "large",   label: "ラージ",     extra: 100 }
      ],
      addons: []
    },
    {
      id: 9,
      category: "drinks",
      name: "アイスレモンティー",
      description: "自家製の紅茶に、フレッシュレモンとほのかなハチミツを加えた爽やかなドリンクです。",
      base_price: 250,
      calories: 90,
      image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&fit=crop",
      recommended: false,
      max_quantity: 20,
      sizes: DRINK_SIZES,
      addons: []
    },
    {
      id: 10,
      category: "drinks",
      name: "コーラ",
      description: "キンキンに冷えたクラシックコーラを、霜付きグラスでお出しします。",
      base_price: 220,
      calories: 140,
      image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&fit=crop",
      recommended: false,
      max_quantity: 20,
      sizes: DRINK_SIZES,
      addons: []
    },
    {
      id: 11,
      category: "kids",
      name: "キッズミール",
      description: "ミニバーガー、ミニフライドポテト、ジュースのセット。おまけのおもちゃ付きです。",
      base_price: 490,
      calories: 540,
      image: "https://images.unsplash.com/photo-1704708799871-8a738dbe5cbd?w=800&fit=crop",
      recommended: true,
      max_quantity: 5,
      sizes: [
        { id: "regular", label: "レギュラー", extra: 0 }
      ],
      addons: [
        { id: "extra-juice", label: "ジュース追加", extra: 80 }
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
