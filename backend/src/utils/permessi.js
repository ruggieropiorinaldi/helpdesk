// Confronta due identificatori. Il primo puo' essere un ObjectId
// oppure un documento gia' popolato: in quel caso l'id sta dentro
// la sua proprieta' _id. Gestiamo tutti e due i casi.
function stessoId(campo, id) {
  if (!campo) return false; //cioe se non è espresso lo user assocciato al ticket da visualizzare
  //se quel ticket nel campo ha gia incluso l'id dello user lo prendo
  //altrimenti il parametro campo è gia un id quindi prendiloc osi com'è
  const idCampo = campo._id ? campo._id : campo;
  return idCampo.toString() === id.toString();
}
//contiene la logica per controllare se l'utente può vedere quel ticket
export function puoVedereIlTicket(utente, ticket) {
  if (utente.ruolo === 'admin') {
    //se è admin puo vedere tutto
    return true;
  }
  //se è tecnico, devo controllare che il tecnico a cui è stato assegnato il ticket abbia
  //  lo stesso idTecnico del tecnico che sta provando a visualizzare quel ticket
  if (utente.ruolo === 'tecnico') {
    return stessoId(ticket.assegnatoA, utente._id);
  }
  return stessoId(ticket.creatoDa, utente._id);
}
