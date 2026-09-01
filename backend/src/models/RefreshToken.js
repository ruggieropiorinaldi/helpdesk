import mongoose from 'mongoose';
const refreshTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true, //unique perche' due sessioni non possono avere lo stesso token
    },
    utente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    scadeIl: {
      type: Date,
      required: true,
    },
    revocatoIl: {
      type: Date, //data di quando è stata chiusa la sessione
      default: null, //di default la sessione è ancora attiva
    },
  },
  { timestamps: true },
);
// INDICE TTL (Time To Live).
// expireAfterSeconds: 0 dice a MongoDB: "quando la data nel campo scadeIl e' passata, cancella il documento da solo".
// Senza questo la collezione crescerebbe all'infinito con token morti. Con questo, si pulisce da sola.
refreshTokenSchema.index({ scadeIl: 1 }, { expireAfterSeconds: 0 });
export default mongoose.model('RefreshToken', refreshTokenSchema);
