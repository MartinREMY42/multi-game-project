import { assert } from 'src/app/utils/assert';
import { MGPOptional } from 'src/app/utils/MGPOptional';
import { Utils } from 'src/app/utils/utils';


export class MartianChessPiece {

    public static EMPTY: MartianChessPiece = new MartianChessPiece(0);
    public static PAWN: MartianChessPiece = new MartianChessPiece(1);
    public static DRONE: MartianChessPiece = new MartianChessPiece(2);
    public static QUEEN: MartianChessPiece = new MartianChessPiece(3);

    public static tryMerge(left: MartianChessPiece, right: MartianChessPiece): MGPOptional<MartianChessPiece> {
        const noEmptyPieces: boolean = left !== MartianChessPiece.EMPTY && right !== MartianChessPiece.EMPTY;
        assert(noEmptyPieces, 'tryMerge cannot be called with empty pieces');
        const totalValue: number = left.value + right.value;
        if (totalValue === 2 || totalValue === 3) {
            return MGPOptional.of(MartianChessPiece.from(totalValue));
        } else {
            return MGPOptional.empty();
        }
    }
    private static from(value: 0 | 1 | 2 | 3): MartianChessPiece {
        switch (value) {
            case MartianChessPiece.DRONE.value: return MartianChessPiece.DRONE;
            default:
                Utils.expectToBe(value, MartianChessPiece.QUEEN.value);
                return MartianChessPiece.QUEEN;
        }
    }
    private constructor(private readonly value: number) { }

    public getValue(): number {
        return this.value;
    }
    public equals(other: MartianChessPiece): boolean {
        return this.getValue() === other.getValue();
    }
}