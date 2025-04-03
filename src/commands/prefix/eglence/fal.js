import { EmbedBuilder } from 'discord.js';

export default {
  name: 'fal',
  description: 'Bot sana kahve falı bakar',
  usage: '',
  aliases: ['kahvefali', 'falım', 'fortune'],
  cooldown: 15,
  category: 'eglence',
  
  async execute(message, args, client) {
    // İlk mesaj - Falına bakılıyor animasyonu
    const loadingEmbed = new EmbedBuilder()
      .setColor('#8B4513') // Kahverengi
      .setTitle('☕ Kahve Falı Bakılıyor...')
      .setDescription('Fincanını çeviriyorum ve falına bakıyorum...')
      .setFooter({ text: 'Lütfen bekleyin...' })
      .setTimestamp();
    
    const sentMessage = await message.reply({ embeds: [loadingEmbed] });
    
    // Birkaç saniye bekle (animasyon etkisi)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Aşk durumu falları
    const loveFortunes = [
      'Yakın zamanda aşk hayatında güzel gelişmeler olacak. Beklemediğin bir anda karşına özel biri çıkabilir.',
      'Şu an hayatında olan kişiyle ilişkini derinleştirmek için fırsatlar doğacak.',
      'Aşk kapını çalmak üzere, gözlerini dört aç ve fırsatları kaçırma.',
      'Eski bir aşkın hayatına geri dönebilir, ancak bu sefer farklı bir sonuç olabilir.',
      'Aşk hayatında sabırlı olman gereken bir döneme giriyorsun.',
      'Yakında aşk hayatında büyük bir sürpriz yaşayabilirsin.',
      'Fincanda gördüğüm kadarıyla, aşk hayatında bazı kararlar alman gerekecek.',
      'Aşk hayatında küçük bir fırtına görünüyor, ancak sonunda güneş açacak.',
      'Birini seviyorsun ama belli etmiyorsun, duygularını açığa çıkarmanın zamanı geldi.',
      'Aşk hayatında bir üçgen ilişkiye dikkat et, seçim yapman gerekebilir.'
    ];
    
    // Kariyer falları
    const careerFortunes = [
      'Kariyerinde yükseliş gösteriyorsun. Emeklerin çok yakında karşılığını bulacak.',
      'İş hayatında bir değişiklik yapman gerekiyor, rutin dışına çıkmalısın.',
      'Yeni bir iş teklifi alabilirsin, teklifi dikkatle değerlendir.',
      'İş arkadaşlarınla daha yakın ilişkiler kurman, kariyerini olumlu etkileyecek.',
      'Kariyerinde bir engel görünüyor, ancak bu engeli aşmak için gerekli güce sahipsin.',
      'Fincanında bir seyahat görüyorum, bu iş ile ilgili olabilir.',
      'Kariyer konusunda risk alman gereken bir dönemdesin, cesaret göstermelisin.',
      'İş hayatında başarılı olacaksın, ancak sabırlı olmalısın.',
      'Yeni bir beceri öğrenmen kariyerinde ilerleme sağlayacak.',
      'İş hayatında önemli bir kişi seninle iletişime geçebilir, dikkatli ol.'
    ];
    
    // Sağlık falları
    const healthFortunes = [
      'Sağlığın genelde iyi, ancak strese dikkat etmelisin.',
      'Daha fazla su içmeli ve beslenme düzenine dikkat etmelisin.',
      'Fiziksel aktiviteyi artırman sağlığını olumlu etkileyecek.',
      'Fincanında dinlenme ihtiyacı görüyorum, kendine biraz zaman ayırmalısın.',
      'Sağlık konusunda küçük bir sorun yaşayabilirsin, ancak çabuk iyileşeceksin.',
      'Eski bir sağlık sorunu tekrar gündeme gelebilir, önlem almalısın.',
      'Mental sağlığına özen göstermelisin, meditasyon veya yoga deneyebilirsin.',
      'Sağlık açısından dikkat etmen gereken bir dönemdesin, düzenli kontrollerini ihmal etme.',
      'Bağışıklık sistemini güçlendirmek için daha fazla vitamin almalısın.',
      'Uyku düzenine dikkat etmelisin, yeterli ve kaliteli uyku sağlığını olumlu etkileyecek.'
    ];
    
    // Para durumu falları
    const moneyFortunes = [
      'Yakın zamanda beklenmedik bir yerden para kazanabilirsin.',
      'Finansal durumunda iyileşme görünüyor, ancak tasarruf yapmayı unutma.',
      'Yeni bir yatırım fırsatı doğabilir, iyi değerlendir.',
      'Para konusunda dikkatli olman gereken bir dönemdesin, gereksiz harcamalardan kaçın.',
      'Fincanında para akışı görüyorum, iş hayatında başarı ve kazanç artışı olabilir.',
      'Bir borç konusu gündemde olabilir, bu konuda planlı hareket etmelisin.',
      'Parasal konularda şansın açık, ancak kumara yönelmemelisin.',
      'Beklenmedik bir masraf çıkabilir, bütçeni buna göre ayarlamalısın.',
      'Maddi konularda aile desteği alabilirsin.',
      'Uzun vadeli yatırımlar için uygun bir dönemdesin, fırsatları değerlendir.'
    ];
    
    // Genel fallar
    const generalFortunes = [
      'Yakında hayatında büyük bir değişim olacak, bu değişime hazırlıklı ol.',
      'Uzun zamandır beklediğin bir haber alacaksın.',
      'Hayatına yeni insanlar girecek ve sana farklı bakış açıları kazandıracak.',
      'Bir seyahat planın varsa, bu seyahatte beklenmedik güzellikler yaşayabilirsin.',
      'Fincanında bir hediye görüyorum, yakında güzel bir sürpriz alabilirsin.',
      'Geçmişte kalan bir konu yeniden gündeme gelebilir.',
      'Hayatındaki negatif insanlardan uzaklaşman gerekiyor.',
      'İçinde bulunduğun durumu farklı bir açıdan değerlendirmelisin.',
      'Hayatta bazı kararlar alman gerekiyor, bu kararlar geleceğini şekillendirecek.',
      'Yakın zamanda bir aile toplantısı veya buluşması olabilir.'
    ];
    
    // Rastgele fallar seç
    const randomLoveFortune = loveFortunes[Math.floor(Math.random() * loveFortunes.length)];
    const randomCareerFortune = careerFortunes[Math.floor(Math.random() * careerFortunes.length)];
    const randomHealthFortune = healthFortunes[Math.floor(Math.random() * healthFortunes.length)];
    const randomMoneyFortune = moneyFortunes[Math.floor(Math.random() * moneyFortunes.length)];
    const randomGeneralFortune = generalFortunes[Math.floor(Math.random() * generalFortunes.length)];
    
    // Rastgele semboller (her bakışta farklı semboller görsün)
    const symbols = ['🌟', '🌙', '☕', '🍀', '🔮', '💫', '🌈', '🦋', '🕊️', '🌺', '🌻', '🐢', '🐘', '🦉', '🦄'];
    const randomSymbols = [];
    
    // 3 rastgele sembol seç
    for (let i = 0; i < 3; i++) {
      const randomIndex = Math.floor(Math.random() * symbols.length);
      randomSymbols.push(symbols[randomIndex]);
    }
    
    // Fal sonucu embed
    const fortuneEmbed = new EmbedBuilder()
      .setColor('#8B4513') // Kahverengi
      .setTitle(`☕ ${message.author.username}'in Kahve Falı`)
      .setDescription(`Fincanında ${randomSymbols.join(', ')} sembolleri görünüyor. İşte falın:`)
      .addFields(
        { name: '❤️ Aşk Durumu', value: randomLoveFortune, inline: false },
        { name: '💼 Kariyer', value: randomCareerFortune, inline: false },
        { name: '🩺 Sağlık', value: randomHealthFortune, inline: false },
        { name: '💰 Para Durumu', value: randomMoneyFortune, inline: false },
        { name: '✨ Genel', value: randomGeneralFortune, inline: false }
      )
      .setFooter({ text: 'Not: Bu sadece eğlence amaçlıdır ve gerçek bir fal değildir.' })
      .setTimestamp();
    
    // Sonuç mesajını gönder
    await sentMessage.edit({ embeds: [fortuneEmbed] });
  },
}; 