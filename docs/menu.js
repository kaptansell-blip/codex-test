/* Çevrimdışı menü çevirisi: Rusça yemek sözlüğü (kelime kökleri → Türkçe).
   Rusça çekim ekleri yüzünden eşleşme kelimenin başındaki köke göre yapılır; en uzun kök kazanır.
   f: 'pork' = domuz içerir, 'alc' = alkol içerir. */
window.MENU = {
  // Tam kelime eşleşmeleri (kısa bağlaçlar ve edatlar)
  words: {
    'с': 'ile', 'со': 'ile', 'и': 've', 'без': '-sız', 'из': '-den', 'на': '(üzerinde / -da)', 'в': 'içinde', 'во': 'içinde', 'по': 'usulü',
    'или': 'veya', 'для': 'için', 'от': '-den', 'к': '-e', 'под': 'altında', 'а': 've', 'не': 'değil', 'гр': 'gram', 'г': 'gram', 'мл': 'ml', 'л': 'litre',
    'шт': 'adet', 'по-киевски': 'Kiev usulü (tavuk)', 'кг': 'kg', 'ккал': 'kcal', 'чай': 'çay', 'суп': 'çorba', 'сок': 'meyve suyu', 'рис': 'pirinç', 'лук': 'soğan',
    'сыр': 'peynir', 'мёд': 'bal', 'мед': 'bal', 'лёд': 'buz', 'лед': 'buz', 'соль': 'tuz', 'яйцо': 'yumurta', 'яйца': 'yumurta', 'яиц': 'yumurta', 'уха': 'balık çorbası',
    'щи': 'lahana çorbası', 'эль': 'ale bira', 'ром': 'rom', 'джин': 'cin', 'сет': 'set / tabak', 'тар-тар': 'tartar', 'фри': 'kızartma', 'дня': 'günün'
  },
  flags: { 'эль': 'alc', 'ром': 'alc', 'джин': 'alc' },
  // [kök, Türkçe, işaret]
  stems: [
    // Menü bölümleri
    ['закуск', 'meze / başlangıç'], ['салат', 'salata'], ['супы', 'çorbalar'], ['суп', 'çorba'], ['горяч', 'sıcak'], ['холодн', 'soğuk'], ['блюд', 'yemek'],
    ['втор', 'ana yemek'], ['перв', 'çorba (ilk yemek)'], ['гарнир', 'garnitür'], ['десерт', 'tatlı'], ['напит', 'içecek'], ['выпечк', 'hamur işi'], ['завтрак', 'kahvaltı'],
    ['обед', 'öğle yemeği'], ['ужин', 'akşam yemeği'], ['бизнес-ланч', 'öğle menüsü'], ['ланч', 'öğle menüsü'], ['меню', 'menü'], ['детск', 'çocuk'], ['постн', 'etsiz / oruç'],
    ['вегетариан', 'vejetaryen'], ['веган', 'vegan'], ['халял', 'helal'], ['фирменн', 'şefin spesiyali'], ['домашн', 'ev yapımı'], ['свеж', 'taze'], ['порци', 'porsiyon'],
    ['соус', 'sos'], ['хлеб', 'ekmek'], ['цена', 'fiyat'], ['стоимост', 'fiyat'], ['комплекс', 'set menü'], ['ассорти', 'karışık tabak'], ['добавк', 'ekstra'],
    // Etler
    ['свин', 'DOMUZ', 'pork'], ['бекон', 'DOMUZ pastırması (bacon)', 'pork'], ['ветчин', 'jambon (DOMUZ)', 'pork'], ['сало', 'DOMUZ yağı', 'pork'], ['сала', 'DOMUZ yağı', 'pork'],
    ['грудинк', 'göğüs eti (genelde DOMUZ)', 'pork'], ['корейк', 'DOMUZ pirzola', 'pork'], ['буженин', 'fırın DOMUZ eti', 'pork'], ['шпик', 'DOMUZ yağı', 'pork'],
    ['рульк', 'DOMUZ incik', 'pork'], ['карбонад', 'DOMUZ fileto', 'pork'], ['прошутто', 'prosciutto (DOMUZ)', 'pork'], ['хамон', 'jamón (DOMUZ)', 'pork'],
    ['пепперони', 'pepperoni (genelde DOMUZ)', 'pork'], ['салями', 'salam (genelde DOMUZ)', 'pork'], ['колбас', 'sucuk / salam (DOMUZ olabilir)', 'pork'],
    ['сосиск', 'sosis (DOMUZ olabilir)', 'pork'], ['сардельк', 'kalın sosis (DOMUZ olabilir)', 'pork'], ['шейк', 'gerdan (genelde DOMUZ)', 'pork'], ['ребр', 'kaburga (DOMUZ olabilir)', 'pork'],
    ['холодец', 'et jölesi (DOMUZ olabilir)', 'pork'], ['студень', 'et jölesi (DOMUZ olabilir)', 'pork'], ['пельмен', 'pelmeni mantı (DOMUZ olabilir)', 'pork'],
    ['котлет', 'köfte (kıymayı sorun)', 'pork'], ['фарш', 'kıyma (karışık olabilir)', 'pork'], ['голубц', 'lahana sarması (kıymayı sorun)', 'pork'], ['тефтел', 'köfte (kıymayı sorun)', 'pork'],
    ['говяд', 'dana / sığır eti'], ['говяж', 'dana'], ['телят', 'süt danası'], ['теляч', 'süt danası'], ['баран', 'kuzu / koyun'], ['ягнен', 'kuzu'], ['ягнят', 'kuzu'],
    ['куриц', 'tavuk'], ['курин', 'tavuk'], ['цыпл', 'piliç'], ['индейк', 'hindi'], ['индюш', 'hindi'], ['утк', 'ördek'], ['утин', 'ördek'], ['гус', 'kaz'], ['кролик', 'tavşan'],
    ['оленин', 'geyik eti'], ['мяс', 'et'], ['стейк', 'biftek'], ['бифштекс', 'biftek'], ['бефстроганов', 'beef stroganoff (dana)'], ['строганов', 'stroganoff'],
    ['шашлык', 'şiş kebap'], ['люля', 'Adana usulü kebap'], ['кебаб', 'kebap'], ['шаурм', 'döner dürüm'], ['шаверм', 'döner dürüm'], ['бургер', 'burger'], ['печен', 'ciğer'],
    ['язык', 'dil'], ['сердц', 'yürek'], ['крыл', 'kanat'], ['грудк', 'göğüs'], ['бедр', 'but'], ['филе', 'fileto'], ['вырезк', 'bonfile'], ['отбивн', 'şnitzel / dövme et'],
    ['шницел', 'şnitzel'], ['гуляш', 'gulaş'], ['жарко', 'güveç / kavurma'], ['плов', 'pilav (etli)'], ['манты', 'mantı'], ['хинкали', 'hinkali (Gürcü mantısı)'],
    ['чебурек', 'çiğ börek'], ['самс', 'samsa'], ['долм', 'dolma'], ['паштет', 'ciğer ezmesi'], ['тушен', 'haşlama / yahni'],
    // Balık ve deniz ürünleri
    ['рыб', 'balık'], ['лосос', 'somon'], ['семг', 'somon'], ['форел', 'alabalık'], ['сельд', 'ringa'], ['селед', 'ringa'], ['судак', 'sudak (levrek türü)'], ['треск', 'morina'],
    ['осетр', 'mersin balığı'], ['стерляд', 'çuka balığı'], ['щук', 'turna'], ['карп', 'sazan'], ['сом', 'yayın balığı'], ['тунец', 'ton balığı'], ['тунц', 'ton balığı'],
    ['скумбри', 'uskumru'], ['дорад', 'çipura'], ['сибас', 'levrek'], ['окун', 'levrek'], ['палтус', 'kalkan'], ['корюшк', 'koryuşka (St. Petersburg balığı)'], ['кильк', 'çaça'], ['шпрот', 'tütsülenmiş çaça'],
    ['икр', 'havyar'], ['кревет', 'karides'], ['краб', 'yengeç'], ['кальмар', 'kalamar'], ['миди', 'midye'], ['осьминог', 'ahtapot'], ['морепродукт', 'deniz ürünleri'],
    ['устриц', 'istiridye'], ['гребеш', 'deniz tarağı'], ['раки', 'kerevit'], ['раков', 'kerevit'], ['суши', 'suşi'], ['ролл', 'roll (suşi)'],
    // Rus mutfağı klasikleri
    ['борщ', 'borş (pancar çorbası)'], ['солянк', 'solyanka (ekşili et çorbası; sosis olabilir)', 'pork'], ['окрошк', 'okroşka (soğuk çorba)'], ['рассольник', 'turşulu çorba'],
    ['харчо', 'harço (Gürcü et çorbası)'], ['бульон', 'et suyu'], ['лапш', 'erişte'], ['блин', 'blini (krep)'], ['оладь', 'kalın krep'], ['сырник', 'peynirli tava tatlısı'],
    ['вареник', 'varenik (etsiz mantı)'], ['пирож', 'poğaça / börek'], ['пирог', 'börek / turta'], ['кулебяк', 'kulebyaka (balıklı börek)'], ['хачапури', 'haçapuri (peynirli pide)'],
    ['оливье', 'Rus salatası'], ['винегрет', 'pancar salatası'], ['шуб', 'kürk mantolu ringa salatası'], ['цезар', 'Sezar salata'], ['греческ', 'Yunan (salatası)'],
    ['драник', 'patates mücveri'], ['пюре', 'püre'], ['каш', 'lapa'], ['греч', 'karabuğday'], ['овсян', 'yulaf'], ['манн', 'irmik'], ['омлет', 'omlet'], ['яичниц', 'sahanda yumurta'],
    ['запеканк', 'fırın sufle'], ['творо', 'lor peyniri'], ['сметан', 'smetana (ekşi krema)'], ['кефир', 'kefir'], ['ряженк', 'fırınlanmış süt yoğurdu'], ['квас', 'kvas (ekmek içeceği)'],
    ['морс', 'mors (kırmızı meyve şerbeti)'], ['компот', 'komposto'], ['кисел', 'kisel (meyve peltesi)'], ['сбитен', 'sbiten (ballı sıcak içecek)'], ['пышк', 'pişki (halka tatlı)'],
    ['медовик', 'ballı kek'], ['наполеон', 'Napolyon pasta (milföy)'], ['пряник', 'zencefilli kurabiye'], ['сушк', 'simit kurabiye'], ['варень', 'reçel'], ['сгущен', 'tatlı yoğun süt'],
    // Sebze, meyve, yan ürünler
    ['картоф', 'patates'], ['картошк', 'patates'], ['капуст', 'lahana'], ['свекл', 'pancar'], ['морков', 'havuç'], ['огур', 'salatalık'], ['помидор', 'domates'], ['томат', 'domates'],
    ['гриб', 'mantar'], ['шампиньон', 'kültür mantarı'], ['лисич', 'tilki mantarı'], ['перец', 'biber'], ['перц', 'biber'], ['баклажан', 'patlıcan'],
    ['кабач', 'kabak'], ['тыкв', 'bal kabağı'], ['горох', 'bezelye'], ['горош', 'bezelye'], ['фасол', 'fasulye'], ['чечевиц', 'mercimek'], ['нут', 'nohut'], ['кукуруз', 'mısır'],
    ['чеснок', 'sarımsak'], ['чесноч', 'sarımsaklı'], ['лук', 'soğan'], ['зелен', 'yeşillik'], ['укроп', 'dereotu'], ['петрушк', 'maydanoz'], ['кинз', 'kişniş'], ['шпинат', 'ıspanak'],
    ['овощ', 'sebze'], ['фрукт', 'meyve'], ['ягод', 'orman meyvesi'], ['яблок', 'elma'], ['яблоч', 'elmalı'], ['груш', 'armut'], ['вишн', 'vişne'], ['черешн', 'kiraz'],
    ['клубник', 'çilek'], ['малин', 'ahududu'], ['черник', 'yaban mersini'], ['клюкв', 'kızılcık (cranberry)'], ['брусник', 'kırmızı yaban mersini'], ['смородин', 'frenk üzümü'],
    ['облепих', 'yalancı iğde (sea buckthorn)'], ['лимон', 'limon'], ['апельсин', 'portakal'], ['банан', 'muz'], ['виноград', 'üzüm'], ['орех', 'ceviz / fındık'], ['миндал', 'badem'],
    ['рис', 'pirinç'], ['макарон', 'makarna'], ['паст', 'makarna'], ['спагетти', 'spagetti'], ['пицц', 'pizza'], ['сыр', 'peynir'], ['брынз', 'beyaz peynir'], ['масл', 'tereyağı / yağ'],
    ['молок', 'süt'], ['молоч', 'sütlü'], ['сливк', 'krema'], ['сливоч', 'kremalı'], ['йогурт', 'yoğurt'], ['яйц', 'yumurta'], ['яич', 'yumurtalı'], ['майонез', 'mayonez'],
    ['горчиц', 'hardal'], ['хрен', 'yaban turpu'], ['уксус', 'sirke'], ['сахар', 'şeker'], ['специ', 'baharat'], ['остр', 'acı'], ['сладк', 'tatlı'],
    ['солен', 'tuzlu / turşu'], ['маринов', 'marine / turşu'], ['квашен', 'lahana turşusu usulü'], ['копчен', 'tütsülenmiş'], ['вялен', 'kurutulmuş'],
    // Pişirme yöntemleri
    ['углях', 'kömürde'], ['пару', 'buharda'], ['жарен', 'kızarmış'], ['варен', 'haşlanmış'], ['отварн', 'haşlanmış'], ['запечен', 'fırınlanmış'], ['гриль', 'ızgara'], 
    ['мангал', 'mangalda'], ['фритюр', 'derin yağda'], ['слабосолен', 'az tuzlanmış'], ['фаршированн', 'dolma / içi doldurulmuş'], ['панировк', 'pane'],
    // İçecekler
    ['вод', 'su'], ['газ', 'gazlı'], ['минерал', 'maden suyu'], ['кофе', 'kahve'], ['американо', 'americano'], ['капучино', 'cappuccino'], ['латте', 'latte'], ['эспрессо', 'espresso'],
    ['чай', 'çay'], ['черн', 'siyah'], ['зелён', 'yeşil'], ['какао', 'kakao'], ['шоколад', 'çikolata'], ['лимонад', 'limonata'], ['сок', 'meyve suyu'], 
    ['пив', 'bira', 'alc'], ['вин', 'şarap', 'alc'], ['водк', 'votka', 'alc'], ['коньяк', 'konyak', 'alc'], ['коньяч', 'konyaklı', 'alc'], ['виски', 'viski', 'alc'], ['шампанск', 'şampanya', 'alc'],
    ['игрист', 'köpüklü şarap', 'alc'], ['настойк', 'likör / meyveli votka', 'alc'], ['наливк', 'meyve likörü', 'alc'], ['ликер', 'likör', 'alc'], ['коктейл', 'kokteyl (alkollü olabilir)', 'alc'],
    ['медовух', 'bal şarabı', 'alc'], ['самогон', 'ev yapımı votka', 'alc'], ['текил', 'tekila', 'alc'], ['глинтвейн', 'sıcak şarap', 'alc'], ['алкогол', 'alkol', 'alc'], ['безалкогольн', 'alkolsüz'],
    ['сидр', 'elma şarabı', 'alc'], ['бренди', 'brendi', 'alc'], ['вермут', 'vermut', 'alc'], ['портвейн', 'porto şarabı', 'alc'],
    // Tatlılar
    ['морожен', 'dondurma'], ['торт', 'pasta'], ['пирожн', 'küçük pasta'], ['чизкейк', 'cheesecake'], ['штрудел', 'strudel'], ['печень', 'kurabiye'], ['вафл', 'waffle'],
    ['круассан', 'kruvasan'], ['булочк', 'çörek'], ['пончик', 'donut'], ['конфет', 'şekerleme'], ['зефир', 'marşmelov'], ['халв', 'helva'], ['пахлав', 'baklava'],
    // Sıfatlar ve diğer
    ['больш', 'büyük'], ['маленьк', 'küçük'], ['средн', 'orta'], ['двойн', 'duble'], ['нов', 'yeni'], ['классическ', 'klasik'], ['русск', 'Rus usulü'], ['украинск', 'Ukrayna usulü'],
    ['грузинск', 'Gürcü usulü'], ['узбекск', 'Özbek usulü'], ['сибирск', 'Sibirya usulü'], ['киевск', 'Kiev usulü (tavuk)'], ['московск', 'Moskova usulü'], ['деревенск', 'köy usulü'],
    ['царск', 'çar usulü'], ['белый', 'beyaz'], ['бел', 'beyaz'], ['красн', 'kırmızı'], ['сух', 'sek / kuru'], ['полусладк', 'yarı tatlı'], ['светл', 'açık (bira)'], ['темн', 'koyu (bira)'],
    ['разливн', 'fıçı'], ['бутылочн', 'şişe'], ['стакан', 'bardak'], ['чашк', 'fincan'], ['бокал', 'kadeh'], ['бутылк', 'şişe'], ['кусок', 'dilim'], ['кусоч', 'dilim'],
    ['начинк', 'iç harç'], ['тест', 'hamur'], ['мук', 'un'], ['сэндвич', 'sandviç'], ['бутерброд', 'açık sandviç'], ['тост', 'tost'], ['чипс', 'cips'], ['сухарик', 'kıtır ekmek'],
    ['наггетс', 'nugget'], ['хот-дог', 'sosisli (DOMUZ olabilir)', 'pork'], ['шоколадн', 'çikolatalı'], ['ванил', 'vanilya'], ['карамел', 'karamel'], ['корица', 'tarçın'], ['кориц', 'tarçın'],
    ['имбир', 'zencefil'], ['мят', 'nane'], ['мёд', 'bal'], ['медов', 'ballı'], ['сыворот', 'peynir altı suyu'], ['обслуживан', 'servis ücreti'], ['чаевые', 'bahşiş'], ['счет', 'hesap'], ['счёт', 'hesap']
  ]
};
