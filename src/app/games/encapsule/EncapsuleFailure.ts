export class EncapsuleFailure {

    public static readonly WRONG_COLOR: string = $localize`You must pick a piece of your own color.`;

    public static readonly NOT_REMAINING_PIECE: string = $localize`You must pick one of the remaining pieces.`;

    public static readonly INVALID_PLACEMENT: string = $localize`You must put your piece on an empty case or on a smaller piece.`;

    public static readonly NOT_DROPPABLE: string = $localize`You must pick your piece among the remaining ones.`;

    public static readonly INVALID_PIECE_SELECTED: string = $localize`You must pick one of your piece or one case where you have the largest piece.`;

    public static readonly SAME_DEST_AS_ORIGIN: string = $localize`You must select a different landing case than the case where the move originates from.`;

    public static readonly END_YOUR_MOVE: string = $localize`You are performing a move, you must select a landing case.`;
}
