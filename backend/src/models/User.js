import mongoose from 'mongoose';
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

    ruolo: {
      type: String,
      enum: ['utente', 'tecnico', 'admin'], //ho 3 attori nel progetto, chi si registra è l'utente mentre tecnico e admin sono assegnati dal gestore del progetto
      default: 'utente',
    },
  },
  { timestamps: true },
);
const User = mongoose.model('User', userSchema);
export default User;
