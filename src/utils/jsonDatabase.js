// JSON veritabanı işlemleri için yardımcı modül
import fs from 'fs';
import path from 'path';

class JsonDatabase {
  constructor(dbName) {
    this.dbPath = path.resolve(process.cwd(), `${dbName}.json`);
    this.initializeDatabase();
  }

  // Veritabanını başlat, yoksa oluştur
  initializeDatabase() {
    if (!fs.existsSync(this.dbPath)) {
      fs.writeFileSync(this.dbPath, JSON.stringify({}, null, 2), 'utf8');
    }
  }

  // Tüm veritabanını oku
  read() {
    try {
      const data = fs.readFileSync(this.dbPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Veritabanı okuma hatası: ${error.message}`);
      return {};
    }
  }

  // Veritabanına yaz
  write(data) {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error(`Veritabanı yazma hatası: ${error.message}`);
      return false;
    }
  }

  // Belirli bir anahtarın değerini al
  get(key) {
    const data = this.read();
    return data[key];
  }

  // Belirli bir anahtarı belirtilen değerle güncelle
  set(key, value) {
    const data = this.read();
    data[key] = value;
    return this.write(data);
  }

  // Belirli bir anahtarı sil
  delete(key) {
    const data = this.read();
    if (data[key]) {
      delete data[key];
      return this.write(data);
    }
    return false;
  }

  // Tüm veritabanını temizle
  clear() {
    return this.write({});
  }

  // Belirli bir anahtarın var olup olmadığını kontrol et
  has(key) {
    const data = this.read();
    return data.hasOwnProperty(key);
  }

  // Koleksiyon işlemleri için yardımcı fonksiyonlar
  // Bir koleksiyona yeni bir öğe ekle
  push(collectionKey, item) {
    const collection = this.get(collectionKey) || [];
    collection.push(item);
    return this.set(collectionKey, collection);
  }

  // Koleksiyondan bir öğeyi sil
  removeFromCollection(collectionKey, filterFn) {
    const collection = this.get(collectionKey) || [];
    const newCollection = collection.filter(item => !filterFn(item));
    return this.set(collectionKey, newCollection);
  }

  // Koleksiyonda bir öğeyi güncelle
  updateInCollection(collectionKey, filterFn, updater) {
    const collection = this.get(collectionKey) || [];
    const newCollection = collection.map(item => filterFn(item) ? updater(item) : item);
    return this.set(collectionKey, newCollection);
  }

  // Koleksiyonda bir öğeyi bul
  findInCollection(collectionKey, filterFn) {
    const collection = this.get(collectionKey) || [];
    return collection.find(filterFn);
  }

  // Koleksiyonda belirli kriterlere uyan tüm öğeleri al
  findAllInCollection(collectionKey, filterFn) {
    const collection = this.get(collectionKey) || [];
    return collection.filter(filterFn);
  }
}

export default JsonDatabase; 