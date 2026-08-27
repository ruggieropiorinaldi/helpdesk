import mongoose from 'mongoose';
import bcrypt from 'bcryptjs'; //libreria che si occupa di generare hash+caratteri speciali, mescolarli,e mandare hash e caratteri speciali in un'unica stringa
const userSchema = new mongoose.Schema( //creo uno schema per gli User per stabilire regole
  {
    nome: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true, //impedisce di avere due utenti con lo stesso indirizzo email
      lowercase: true, //converto tutto in minuscolo prima di salvare cosi RuGgiEro@gmail.com e ruggiero@gmail.com non vengono viste e salvate come due email diverse
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, //significa che quando interrogo un User, questo campo non devo considerarlo/leggerlo
    },

    ruolo: {
      type: String,
      enum: ['utente', 'tecnico', 'admin'], //ho 3 attori nel progetto, chi si registra è l'utente mentre tecnico e admin sono assegnati dal gestore del progetto
      default: 'utente',
    },
  },
  { timestamps: true },
);

// pre('save') e' un middleware di Mongoose che si attiva prima di qualsiasi salvataggio di un user
userSchema.pre('save', async function () {
  // isModified controlla se la password e' cambiata in questo salvataggio.
  // Senza questo controllo, ogni volta che salvi un utente per un motivo qualsiasi (cambio ruolo, cambio nome)
  // rifaresti l'hash dell'hash, e il login smetterebbe di funzionare
  if (!this.isModified('password')) {
    return;
  }

  //10 è il costo perchè viene eseguito 2^10 volte
  //il this mi serve ed è importante perchè fa riferimento a questo user di cui sto salvando/modificando dati
  this.password = await bcrypt.hash(this.password, 10);
});

//serve per verificare la password
userSchema.methods.verificaPassword = async function (passwordInChiaro) {
  // compare esegue di nuovo l'hash della "password in chiaro" usando lo stesso "sale" (che e' dentro this.password) e confronta i risultati.
  // quindi mi darà true o false
  return bcrypt.compare(passwordInChiaro, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
