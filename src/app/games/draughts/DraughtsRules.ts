import { MGPValidation } from 'src/app/utils/MGPValidation';
import { Coord } from 'src/app/jscaip/Coord';
import { MGPNode } from 'src/app/jscaip/MGPNode';
import { Player } from 'src/app/jscaip/Player';
import { GameStatus, Rules } from 'src/app/jscaip/Rules';
import { DraughtsLegalityStatus } from './DraughtsLegalityStatus';
import { DraughtsMove } from './DraughtsMove';
import { EpaminondasState } from './DraughtsState';
import { DraughtsFailure } from './DraughtsFailure';
import { RulesFailure } from 'src/app/jscaip/RulesFailure';

export class DraughtsNode extends MGPNode<DraughtsRules,
                                             DraughtsMove,
                                             EpaminondasState,
                                             DraughtsLegalityStatus> {}

export class DraughtsRules extends Rules<DraughtsMove, EpaminondasState, DraughtsLegalityStatus> {

    public static isLegal(move: DraughtsMove, state: EpaminondasState): DraughtsLegalityStatus {
        const phalanxValidity: MGPValidation = this.getPhalanxValidity(state, move);
        if (phalanxValidity.isFailure()) {
            return DraughtsLegalityStatus.failure(phalanxValidity.reason);
        }
        const landingStatus: DraughtsLegalityStatus = this.getLandingStatus(state, move);
        if (landingStatus.legal.isFailure()) {
            return landingStatus;
        }
        const newBoard: Player[][] = landingStatus.newBoard;
        const OPPONENT: Player = state.getCurrentOpponent();
        const captureValidity: DraughtsLegalityStatus =
            DraughtsRules.getCaptureValidity(state, newBoard, move, OPPONENT);
        if (captureValidity.legal.isFailure()) {
            return DraughtsLegalityStatus.failure(captureValidity.legal.reason);
        }
        return { newBoard, legal: MGPValidation.SUCCESS };
    }
    public static getPhalanxValidity(state: EpaminondasState, move: DraughtsMove): MGPValidation {
        let coord: Coord = move.coord;
        let soldierIndex: number = 0;
        let caseContent: Player;
        const OPPONENT: Player = state.getCurrentOpponent();
        while (soldierIndex < move.movedPieces) {
            if (coord.isNotInRange(14, 12)) {
                return MGPValidation.failure(DraughtsFailure.PHALANX_CANNOT_CONTAIN_PIECES_OUTSIDE_BOARD());
            }
            caseContent = state.getPieceAt(coord);
            if (caseContent === Player.NONE) {
                return MGPValidation.failure(DraughtsFailure.PHALANX_CANNOT_CONTAIN_EMPTY_CASE());
            }
            if (caseContent === OPPONENT) {
                return MGPValidation.failure(DraughtsFailure.PHALANX_CANNOT_CONTAIN_OPPONENT_PIECE());
            }
            coord = coord.getNext(move.direction, 1);
            soldierIndex++;
        }
        return MGPValidation.SUCCESS;
    }
    public static getLandingStatus(state: EpaminondasState, move: DraughtsMove): DraughtsLegalityStatus {
        const newBoard: Player[][] = state.getCopiedBoard();
        const CURRENT_PLAYER: Player = state.getCurrentPlayer();
        let emptied: Coord = move.coord;
        let landingCoord: Coord = move.coord.getNext(move.direction, move.movedPieces);
        let landingIndex: number = 0;
        while (landingIndex + 1 < move.stepSize) {
            newBoard[emptied.y][emptied.x] = Player.NONE;
            newBoard[landingCoord.y][landingCoord.x] = CURRENT_PLAYER;
            if (landingCoord.isNotInRange(14, 12)) {
                return DraughtsLegalityStatus.failure(DraughtsFailure.PHALANX_IS_LEAVING_BOARD());
            }
            if (state.getPieceAt(landingCoord) !== Player.NONE) {
                return DraughtsLegalityStatus.failure(DraughtsFailure.SOMETHING_IN_PHALANX_WAY());
            }
            landingIndex++;
            landingCoord = landingCoord.getNext(move.direction, 1);
            emptied = emptied.getNext(move.direction, 1);
        }
        if (landingCoord.isNotInRange(14, 12)) {
            return DraughtsLegalityStatus.failure(DraughtsFailure.PHALANX_IS_LEAVING_BOARD());
        }
        if (state.getPieceAt(landingCoord) === CURRENT_PLAYER) {
            return DraughtsLegalityStatus.failure(RulesFailure.CANNOT_SELF_CAPTURE());
        }
        newBoard[emptied.y][emptied.x] = Player.NONE;
        newBoard[landingCoord.y][landingCoord.x] = CURRENT_PLAYER;
        return { newBoard, legal: MGPValidation.SUCCESS };
    }
    public static getCaptureValidity(oldState: EpaminondasState,
                                     board: Player[][],
                                     move: DraughtsMove,
                                     OPPONENT: Player)
    : DraughtsLegalityStatus
    {
        let capturedSoldier: Coord = move.coord.getNext(move.direction, move.movedPieces + move.stepSize - 1);
        const EMPTY: Player = Player.NONE;
        let captured: number = 0;
        while (capturedSoldier.isInRange(14, 12) &&
               oldState.getPieceAt(capturedSoldier) === OPPONENT
        ) {
            // Capture
            if (captured > 0) {
                board[capturedSoldier.y][capturedSoldier.x] = EMPTY;
            }
            captured++;
            if (captured >= move.movedPieces) {
                return DraughtsLegalityStatus.failure(DraughtsFailure.PHALANX_SHOULD_BE_GREATER_TO_CAPTURE());
            }
            capturedSoldier = capturedSoldier.getNext(move.direction, 1);
        }
        return { newBoard: board, legal: MGPValidation.SUCCESS };
    }
    public isLegal(move: DraughtsMove, state: EpaminondasState): DraughtsLegalityStatus {
        return DraughtsRules.isLegal(move, state);
    }
    public applyLegalMove(move: DraughtsMove,
                          state: EpaminondasState,
                          status: DraughtsLegalityStatus)
    : EpaminondasState
    {
        const resultingState: EpaminondasState = new EpaminondasState(status.newBoard, state.turn + 1);
        return resultingState;
    }
    public getGameStatus(node: DraughtsNode): GameStatus {
        const state: EpaminondasState = node.gameState;
        const zerosInFirstLine: number = state.count(Player.ZERO, 0);
        const onesInLastLine: number = state.count(Player.ONE, 11);
        if (state.turn % 2 === 0) {
            if (zerosInFirstLine > onesInLastLine) {
                return GameStatus.ZERO_WON;
            }
        } else {
            if (onesInLastLine > zerosInFirstLine) {
                return GameStatus.ONE_WON;
            }
        }
        const doesZeroOwnPieces: boolean = state.doesOwnPiece(Player.ZERO);
        if (doesZeroOwnPieces === false) {
            return GameStatus.ONE_WON;
        }
        const doesOneOwnPieces: boolean = state.doesOwnPiece(Player.ONE);
        if (doesOneOwnPieces === false) {
            return GameStatus.ZERO_WON;
        }
        return GameStatus.ONGOING;
    }
}
