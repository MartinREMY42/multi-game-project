import { MGPOptional } from '../utils/MGPOptional';
import { Coord } from './Coord';
import { GamePartSlice } from './GamePartSlice';
import { LegalityStatus } from './LegalityStatus';
import { Minimax } from './Minimax';
import { Move } from './Move';
import { NodeUnheritance } from './NodeUnheritance';
import { SCORE } from './SCORE';

export interface BoardInfo {
    status: SCORE,
    victory: Coord[],
    preVictory: MGPOptional<Coord>,
    sum: number
}
export abstract class AlignementMinimax<M extends Move,
                                        S extends GamePartSlice,
                                        L extends LegalityStatus,
                                        V,
                                        U extends NodeUnheritance = NodeUnheritance>
    extends Minimax<M, S, L, U>
{

    public calculateBoardValue(move: M, state: S): BoardInfo {
        this.startSearchingVictorySources();
        let boardInfo: BoardInfo = {
            status: SCORE.DEFAULT,
            victory: null,
            preVictory: MGPOptional.empty(),
            sum: 0,
        };
        while (this.hasNextVictorySource()) {
            const victorySource: V = this.getNextVictorySource();
            let newBoardInfo: BoardInfo;
            if (boardInfo.status === SCORE.PRE_VICTORY) {
                newBoardInfo = this.searchVictoryOnly(victorySource, move, state);
            } else {
                newBoardInfo = this.getBoardInfo(victorySource, move, state, boardInfo);
            }
            if (newBoardInfo.status === SCORE.VICTORY) {
                return newBoardInfo;
            }
            boardInfo = {
                status: newBoardInfo.status,
                victory: null,
                preVictory: newBoardInfo.preVictory,
                sum: boardInfo.sum + newBoardInfo.sum,
            };
        }
        return boardInfo;
    }
    public abstract startSearchingVictorySources(): void;

    public abstract hasNextVictorySource(): boolean;

    public abstract getNextVictorySource(): V;

    public abstract searchVictoryOnly(victorySource: V, move: M, state: S): BoardInfo;

    public abstract getBoardInfo(victorySource: V, move: M, state: S, boardInfo: BoardInfo): BoardInfo;
}
