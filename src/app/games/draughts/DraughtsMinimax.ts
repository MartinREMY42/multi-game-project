import { Coord } from 'src/app/jscaip/Coord';
import { Direction } from 'src/app/jscaip/Direction';
import { Player } from 'src/app/jscaip/Player';
import { DraughtsLegalityStatus } from './DraughtsLegalityStatus';
import { DraughtsMove } from './DraughtsMove';
import { DraughtsState } from './DraughtsState';
import { NodeUnheritance } from 'src/app/jscaip/NodeUnheritance';
import { Minimax } from 'src/app/jscaip/Minimax';
import { DraughtsNode, DraughtsRules } from './DraughtsRules';
import { ArrayUtils } from 'src/app/utils/ArrayUtils';
import { GameStatus } from 'src/app/jscaip/Rules';

export class DraughtsMinimax extends Minimax<DraughtsMove, DraughtsState, DraughtsLegalityStatus> {

    public static getListMoves(node: DraughtsNode): DraughtsMove[] {
        const PLAYER: Player = node.gameState.getCurrentPlayer();
        const OPPONENT: Player = node.gameState.getCurrentOpponent();
        const EMPTY: Player = Player.NONE;

        let moves: DraughtsMove[] = [];
        const state: DraughtsState = node.gameState;
        let move: DraughtsMove;
        for (let y: number = 0; y < 12; y++) {
            for (let x: number = 0; x < 14; x++) {
                const firstCoord: Coord = new Coord(x, y);
                if (state.getPieceAt(firstCoord) === PLAYER) {
                    for (const direction of Direction.DIRECTIONS) {
                        let movedPieces: number = 1;
                        let nextCoord: Coord = firstCoord.getNext(direction, 1);
                        while (nextCoord.isInRange(14, 12) &&
                            state.getPieceAt(nextCoord) === PLAYER) {
                            movedPieces += 1;
                            nextCoord = nextCoord.getNext(direction, 1);
                        }
                        let stepSize: number = 1;
                        while (nextCoord.isInRange(14, 12) &&
                            stepSize <= movedPieces &&
                            state.getPieceAt(nextCoord) === EMPTY) {
                            move = new DraughtsMove(x, y, movedPieces, stepSize, direction);
                            moves = this.addMove(moves, move, state);

                            stepSize++;
                            nextCoord = nextCoord.getNext(direction, 1);
                        }
                        if (nextCoord.isInRange(14, 12) &&
                            stepSize <= movedPieces &&
                            state.getPieceAt(nextCoord) === OPPONENT) {
                            move = new DraughtsMove(x, y, movedPieces, stepSize, direction);
                            moves = this.addMove(moves, move, state);
                        }
                    }
                }
            }
        }
        return moves;
    }
    public static addMove(moves: DraughtsMove[],
                          move: DraughtsMove,
                          state: DraughtsState)
    : DraughtsMove[]
    {
        const legality: DraughtsLegalityStatus = DraughtsRules.isLegal(move, state);
        if (legality.legal.isSuccess()) {
            moves.push(move);
        }
        return moves;
    }
    public getListMoves(node: DraughtsNode): DraughtsMove[] {
        const moves: DraughtsMove[] = DraughtsMinimax.getListMoves(node);
        ArrayUtils.sortByDescending(moves, (move: DraughtsMove): number => {
            return move.stepSize; // Best for normal, might not be best for others!
        });
        return moves;
    }
    public getBoardValue(node: DraughtsNode): NodeUnheritance {
        const gameStatus: GameStatus = this.ruler.getGameStatus(node);
        if (gameStatus.isEndGame) {
            return new NodeUnheritance(gameStatus.toBoardValue());
        }
        return new NodeUnheritance(this.getPieceCountPlusRowDomination(node.gameState));
    }
    public getPieceCountPlusRowDomination(state: DraughtsState): number {
        const SCORE_BY_PIECE: number = 14*13*11;
        const SCORE_BY_ROW_DOMINATION: number = 2;
        const SCORE_BY_PRESENCE: number = 1;
        const SCORE_BY_ALIGNEMENT: number = 1;
        let total: number = 0;
        for (let y: number = 0; y < 12; y++) {
            let row: number = 0;
            const wasPresent: number[] = [0, 0];
            for (let x: number = 0; x < 14; x++) {
                const coord: Coord = new Coord(x, y);
                const player: Player = state.getPieceAt(coord);
                if (player !== Player.NONE) {
                    const mod: number = player.getScoreModifier();
                    total += SCORE_BY_PIECE * mod;
                    wasPresent[player.value] = mod;
                    row += mod;
                    for (const dir of [Direction.UP_LEFT, Direction.UP, Direction.UP_RIGHT]) {
                        let neighboor: Coord = coord.getNext(dir, 1);
                        while (neighboor.isInRange(14, 12) &&
                               state.getPieceAt(neighboor) === player)
                        {
                            total += mod * SCORE_BY_ALIGNEMENT;
                            neighboor = neighboor.getNext(dir, 1);
                        }
                    }
                }
            }
            if (row !== 0) {
                total += (Math.abs(row) / row) * SCORE_BY_ROW_DOMINATION;
            }
            total += wasPresent.reduce((sum: number, newElement: number) => sum + newElement) * SCORE_BY_PRESENCE;
        }
        return total;
    }
}
