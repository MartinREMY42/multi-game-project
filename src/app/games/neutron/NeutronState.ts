import { GamePartSlice } from 'src/app/jscaip/GamePartSlice';
import { NeutronPiece } from "./NeutronPiece";
import { NeutronMove } from "./NeutronMove";
import { NumberTable } from 'src/app/utils/ArrayUtils';

export class NeutronState extends GamePartSlice {

    public static getInitialSlice(): NeutronState {
        const _: number = NeutronPiece.EMPTY.value;
        const X: number = NeutronPiece.ZERO.value;
        const O: number = NeutronPiece.ONE.value;
        const N: number = NeutronPiece.NEUTRON.value;
        const board: NumberTable = [
            [X, X, X, X, X],
            [_, _, _, _, _],
            [_, _, N, _, _],
            [_, _, _, _, _],
            [O, O, O, O, O],
        ];
        return new NeutronState(board, 0);
    }

    public constructor(board: NumberTable, turn: number) {
        super(board, turn);
    }

    public applyLegalMove(move: NeutronMove): NeutronState {
        const newBoard: number[][] = this.getCopiedBoard();
        
        return new NeutronState(newBoard, this.turn + 1);
    }
}
