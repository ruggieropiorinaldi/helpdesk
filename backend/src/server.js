//contiene il database e accende il server
import 'dotenv/config'; //le variabili d'ambiente devono essere caricate prima che qualunque altro file provi a leggerle
import mongoose from 'mongoose';
import app from './app.js';
const PORT = process.env.PORT || 4000;
async function avvia() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connesso');
    app.listen(PORT, () => {
      console.log(`
✅
 Server in ascolto su http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Impossibile connettersi a MongoDB:', err.message);
    process.exit(1);
  }
}
avvia();
