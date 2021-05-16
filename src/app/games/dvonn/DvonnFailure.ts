
export class DvonnFailure {
    public static INVALID_COORD: string = `Coordonnée invalide, veuillez sélectionner un pièce sur le plateau.`;
    public static NOT_PLAYER_PIECE: string = `Veuillez choisir une des piles vous appartenant.`;
    public static EMPTY_STACK: string = `Veuillez choisir une pile qui n'est pas vide.`;
    public static TOO_MANY_NEIGHBORS: string = `Cette pile ne peut pas se déplacer car les 6 cases voisines sont occupées.
         Veuillez choisir une pièce avec strictement moins de 6 pièces voisines.`;
    public static CANT_REACH_TARGET: string = `Cette pièce ne peut pas se déplacer car il est impossible qu'elle termine
         son déplacement sur une autre pièce.`;
    public static CAN_ONLY_PASS: string = `Vous êtes obligés de passer, il n'y a aucun déplacement possible.`;
    public static INVALID_MOVE_LENGTH: string = `La distance effectuée par le mouvement doit correspondre à la taille de la pile de pièces.`;
    public static EMPTY_TARGET_STACK: string = `Le déplacement doit se terminée sur une case occupée.`;
}