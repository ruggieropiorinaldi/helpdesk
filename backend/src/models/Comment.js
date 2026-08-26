import mongoose from 'mongoose';
const commentSchema = new mongoose.Schema(
  {
    //un commento è composto da:
    //ticket che voglio commentare (quindi è un oggetto)
    //user che commenta (quindi un oggetto)
    //testo del commento(quindi un dato stringa)
    ticket: {
      type: mongoose.Schema.Types.ObjectId, //dico che fa riferimento a un oggetto, non un dato normale
      ref: 'Ticket', //indico a quale collezione appartiene
      required: true,
    },
    autore: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    testo: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);
export default mongoose.model('Comment', commentSchema);
