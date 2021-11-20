import { Table } from 'src/app/utils/ArrayUtils';
import { GameStateWithTable } from 'src/app/jscaip/GameStateWithTable';
import { Player } from 'src/app/jscaip/Player';

export class DraughtsState extends GameStateWithTable<Player> {

    public static getInitialState(): DraughtsState {
        const _: Player = Player.NONE;
        const X: Player = Player.ONE;
        const O: Player = Player.ZERO;
        const board: Table<Player> = [
            [X, _, X, _, X, _, X, _, X, _],
            [_, X, _, X, _, X, _, X, _, X],
            [X, _, X, _, X, _, X, _, X, _],
            [_, X, _, X, _, X, _, X, _, X],
            [_, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _],
            [O, _, O, _, O, _, O, _, O, _],
            [_, O, _, O, _, O, _, O, _, O],
            [O, _, O, _, O, _, O, _, O, _],
            [_, O, _, O, _, O, _, O, _, O],
        ];
        return new DraughtsState(board, 0);
    }
    public count(piece: Player, row: number): number {
        let result: number = 0;
        for (let x: number = 0; x < 14; x++) {
            if (this.board[row][x] === piece) {
                result++;
            }
        }
        return result;
    }
    public doesOwnPiece(player: Player): boolean {
        for (let y: number = 0; y < 12; y++) {
            for (let x: number = 0; x < 14; x++) {
                if (this.board[y][x] === player) {
                    return true;
                }
            }
        }
        return false;
    }
}
