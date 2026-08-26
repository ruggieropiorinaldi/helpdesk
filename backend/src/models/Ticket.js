// mongoose ci serve per definire lo schema e creare il model
//mongoose non richiede necessariamente uno schema, ma definirlo  mette le regole prima che i dati sporchi
//entrino nel database.
import mongoose from 'mongoose';
// Uno Schema descrive la forma dei dati: quali campi esistono, di che tipo sono, e quali regole devono rispettare.
const ticketSchema = new mongoose.Schema(
  {
    titolo: {
      type: String, //deve essere testo
      required: true, //senza, il salvataggio fallisce
      trim: true, //toglie gli spazi all'inizio e alla fine
    },
    descrizione: {
      type: String,
      required: true,
    },
    categoria: {
      type: String,
      enum: ['hardware', 'software', 'rete', 'account', 'altro'], //sono ammessi solo questi valori
      default: 'altro', //valore di default se il campo non viene passato
    },
    priorita: {
      type: String,
      enum: ['bassa', 'media', 'alta', 'urgente'],
      default: 'media',
    },
    stato: {
      type: String,
      enum: ['aperto', 'assegnato', 'in_lavorazione', 'risolto', 'chiuso'], //ciclo di vita di un ticket...
      default: 'aperto', //aperto perchè appena lo creamo è aperto
    },

    creatoDa: {
      //serve per indicare l'autore che ha creato il ticket
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', //quindi fa riferimento a un oggetto (User, con ruolo "utente")
      required: true,
    },

    assegnatoA: {
      //serve per indicare il tecnico a cui è stato affidato
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', //quindi fa sempre riferimento a un oggetto (User, con ruolo "tecnico")
      default: null,
    },
  },

  { timestamps: true }, //aggiunge due campi ad ogni documento
  //createdAt e updatedAt, e li tiene aggiornati da solo
);
// mongoose.model() prende lo schema e costruisce il model, cioè l'oggetto con cui interroghiamo il database.
// 'Ticket' e' il nome del model
const Ticket = mongoose.model('Ticket', ticketSchema);
// export default rende Ticket importabile dagli altri file.
export default Ticket;
