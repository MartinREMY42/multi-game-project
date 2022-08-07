import { MGPNode } from 'src/app/jscaip/MGPNode';
import { Player } from 'src/app/jscaip/Player';
import { GameStatus, Rules } from 'src/app/jscaip/Rules';
import { RulesFailure } from 'src/app/jscaip/RulesFailure';
import { assert } from 'src/app/utils/assert';
import { MGPFallible } from 'src/app/utils/MGPFallible';
import { MGPMap } from 'src/app/utils/MGPMap';
import { MGPOptional } from 'src/app/utils/MGPOptional';
import { MartianChessMove, MartianChessMoveFailure } from './MartianChessMove';
import { MartianChessCapture, MartianChessState } from './MartianChessState';
import { MartianChessPiece } from './MartianChessPiece';
import { Localized } from 'src/app/utils/LocaleUtils';

export class MartianChessRulesFailure {

    public static readonly MUST_CHOOSE_PIECE_FROM_YOUR_TERRITORY: Localized = () => $localize`You must pick a piece from your side of the board in order to move it.`;

    public static readonly CANNOT_CAPTURE_YOUR_OWN_PIECE_NOR_PROMOTE_IT: Localized = () => $localize`This is not a valid promotion nor a valid capture.`;

    public static readonly CANNOT_UNDO_LAST_MOVE: Localized = () => $localize`You cannot perform a move that is the reverse of the previous one.`;
}

export interface MartianChessMoveResult {

    score: MGPMap<Player, MartianChessCapture>;

    finalPiece: MartianChessPiece;
}

export class MartianChessNode extends MGPNode<MartianChessRules,
                                              MartianChessMove,
                                              MartianChessState,
                                              MartianChessMoveResult> {}

export class MartianChessRules extends Rules<MartianChessMove, MartianChessState, MartianChessMoveResult> {

    public static readonly STARTING_COUNT_DOWN: MGPOptional<number> = MGPOptional.of(7);

    public applyLegalMove(move: MartianChessMove,
                          state: MartianChessState,
                          info: MartianChessMoveResult)
    : MartianChessState
    {
        const newBoard: MartianChessPiece[][] = state.getCopiedBoard();
        newBoard[move.coord.y][move.coord.x] = MartianChessPiece.EMPTY;
        const landingPiece: MartianChessPiece = info.finalPiece;
        newBoard[move.end.y][move.end.x] = landingPiece;
        const captured: MGPMap<Player, MartianChessCapture> = info.score;
        let countDown: MGPOptional<number> = state.countDown;
        if (countDown.isPresent()) {
            const isCapture: boolean = this.isCapture(move, state);
            if (isCapture) {
                countDown = MartianChessRules.STARTING_COUNT_DOWN;
            } else {
                const previousRemainingTurn: number = state.countDown.get();
                countDown = MGPOptional.of(previousRemainingTurn - 1);
            }
        }
        if (move.calledTheClock) {
            countDown = MartianChessRules.STARTING_COUNT_DOWN;
        }
        return new MartianChessState(newBoard, state.turn + 1, MGPOptional.of(move), countDown, captured);
    }
    public isLegal(move: MartianChessMove, state: MartianChessState): MGPFallible<MartianChessMoveResult> {
        this.assertNonDoubleClockCall(move, state);
        const moveLegality: MGPFallible<void> = this.isLegalMove(move, state);
        if (moveLegality.isFailure()) {
            return MGPFallible.failure(moveLegality.getReason());
        }
        if (move.isUndoneBy(state.lastMove)) {
            return MGPFallible.failure(MartianChessRulesFailure.CANNOT_UNDO_LAST_MOVE());
        }
        if (this.isFieldPromotion(move, state)) {
            return this.isLegalFieldPromotion(move, state);
        }
        const landingPiece: MartianChessPiece = state.getPieceAt(move.coord);
        const captured: MGPMap<Player, MartianChessCapture> = state.captured.getCopy();
        if (this.isCapture(move, state)) {
            const currentPlayer: Player = state.getCurrentPlayer();
            let playerScore: MartianChessCapture = captured.get(currentPlayer).get();
            const capturedPiece: MartianChessPiece = state.getPieceAt(move.end);
            playerScore = playerScore.add(capturedPiece);
            captured.replace(currentPlayer, playerScore);
            captured.makeImmutable();
        }
        const moveResult: MartianChessMoveResult = { finalPiece: landingPiece, score: captured };
        return MGPFallible.success(moveResult);
    }
    private assertNonDoubleClockCall(move: MartianChessMove, state: MartianChessState) {
        const clockHadAlreadyBeenCalled: boolean = state.countDown.isPresent();
        const clockCalledThisTurn: boolean = move.calledTheClock;
        const doubleClockCall: boolean = clockHadAlreadyBeenCalled && clockCalledThisTurn;
        assert(doubleClockCall === false, 'Should not call the clock twice');
    }
    private isCapture(move: MartianChessMove, state: MartianChessState): boolean {
        const moveEndsInOpponentTerritory: boolean = state.isInOpponentTerritory(move.end);
        const moveEndsOnPiece: boolean = state.getPieceAt(move.end) !== MartianChessPiece.EMPTY;
        return moveEndsInOpponentTerritory && moveEndsOnPiece;
    }
    private isFieldPromotion(move: MartianChessMove, state: MartianChessState): boolean {
        const moveEndsInPlayerTerritory: boolean = state.isInPlayerTerritory(move.end);
        const moveEndsOnPiece: boolean = state.getPieceAt(move.end) !== MartianChessPiece.EMPTY;
        return moveEndsInPlayerTerritory && moveEndsOnPiece;
    }
    private isLegalFieldPromotion(move: MartianChessMove,
                                  state: MartianChessState)
    : MGPFallible<MartianChessMoveResult>
    {
        const optCreatedPiece: MGPOptional<MartianChessPiece> = this.getPromotedPiece(move, state);
        if (optCreatedPiece.isAbsent()) {
            return MGPFallible.failure(MartianChessRulesFailure.CANNOT_CAPTURE_YOUR_OWN_PIECE_NOR_PROMOTE_IT());
        }
        const createdPiece: MartianChessPiece = optCreatedPiece.get();
        if (state.isTherePieceOnPlayerSide(createdPiece)) {
            return MGPFallible.failure(MartianChessRulesFailure.CANNOT_CAPTURE_YOUR_OWN_PIECE_NOR_PROMOTE_IT());
        } else {
            const moveResult: MartianChessMoveResult = {
                finalPiece: createdPiece,
                score: state.captured.getCopy(),
            };
            return MGPFallible.success(moveResult);
        }
    }
    private isLegalMove(move: MartianChessMove, state: MartianChessState): MGPFallible<void> {
        const moveStartsInPlayerTerritory: boolean = state.isInPlayerTerritory(move.coord);
        if (moveStartsInPlayerTerritory === false) {
            return MGPFallible.failure(MartianChessRulesFailure.MUST_CHOOSE_PIECE_FROM_YOUR_TERRITORY());
        }
        const movedPiece: MartianChessPiece = state.getPieceAt(move.coord);
        if (movedPiece === MartianChessPiece.EMPTY) {
            return MGPFallible.failure(RulesFailure.MUST_CHOOSE_OWN_PIECE_NOT_EMPTY());
        } else if (movedPiece === MartianChessPiece.PAWN) {
            if (move.isValidForPawn()) {
                return MGPFallible.success(undefined);
            } else {
                return MGPFallible.failure(MartianChessMoveFailure.PAWN_MUST_MOVE_ONE_DIAGONAL_STEP());
            }
        } else if (movedPiece === MartianChessPiece.DRONE) {
            if (move.isValidForDrone() === false) {
                return MGPFallible.failure(MartianChessMoveFailure.DRONE_MUST_DO_TWO_ORTHOGONAL_STEPS());
            }
        }
        for (const coord of move.coord.getUntil(move.end)) {
            if (state.getPieceAt(coord) !== MartianChessPiece.EMPTY) {
                return MGPFallible.failure(RulesFailure.SOMETHING_IN_THE_WAY());
            }
        }
        return MGPFallible.success(undefined);
    }
    public getPromotedPiece(move: MartianChessMove, state: MartianChessState): MGPOptional<MartianChessPiece> {
        const startPiece: MartianChessPiece = state.getPieceAt(move.coord);
        const endPiece: MartianChessPiece = state.getPieceAt(move.end);
        return MartianChessPiece.tryMerge(startPiece, endPiece);
    }
    public getGameStatus(node: MartianChessNode): GameStatus {
        const state: MartianChessState = node.gameState;
        if (state.countDown.equalsValue(0)) {
            return this.getGameStatusScoreVictoryOr(state, GameStatus.DRAW);
        }
        const emptyTerritory: MGPOptional<Player> = state.getEmptyTerritory();
        if (emptyTerritory.isPresent()) {
            const lastPlayer: Player = state.getCurrentOpponent();
            const lastPlayerVictoryStatus: GameStatus = GameStatus.getVictory(lastPlayer);
            return this.getGameStatusScoreVictoryOr(state, lastPlayerVictoryStatus);
        }
        return GameStatus.ONGOING;
    }
    public getGameStatusScoreVictoryOr(state: MartianChessState, defaultStatus: GameStatus): GameStatus {
        const scoreZero: number = state.getScoreOf(Player.ZERO);
        const scoreOne: number = state.getScoreOf(Player.ONE);
        if (scoreZero > scoreOne) return GameStatus.ZERO_WON;
        else if (scoreOne > scoreZero) return GameStatus.ONE_WON;
        else return defaultStatus;
    }
}