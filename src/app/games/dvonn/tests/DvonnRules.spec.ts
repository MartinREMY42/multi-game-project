import { DvonnPieceStack } from '../DvonnPieceStack';
import { DvonnGameState } from '../DvonnGameState';
import { Coord } from 'src/app/jscaip/Coord';
import { DvonnMove } from '../DvonnMove';
import { Player } from 'src/app/jscaip/Player';
import { DvonnBoard } from '../DvonnBoard';
import { LegalityStatus } from 'src/app/jscaip/LegalityStatus';
import { MGPValidation } from 'src/app/utils/MGPValidation';
import { DvonnRules } from '../DvonnRules';
import { DvonnFailure } from '../DvonnFailure';
import { DvonnMinimax } from '../DvonnMinimax';
import { GameStatus } from 'src/app/jscaip/Rules';
import { MGPNode } from 'src/app/jscaip/MGPNode';

describe('DvonnRules:', () => {

    let rules: DvonnRules;

    let minimax: DvonnMinimax;

    const _: DvonnPieceStack = DvonnPieceStack.EMPTY;
    const D: DvonnPieceStack = DvonnPieceStack.SOURCE;
    const W: DvonnPieceStack = DvonnPieceStack.PLAYER_ZERO;
    const WB: DvonnPieceStack = new DvonnPieceStack(Player.ZERO, 2, false);
    const WW: DvonnPieceStack = new DvonnPieceStack(Player.ZERO, 2, false);
    const WD: DvonnPieceStack = new DvonnPieceStack(Player.ZERO, 2, true);
    const WWW: DvonnPieceStack = new DvonnPieceStack(Player.ZERO, 3, false);
    const B: DvonnPieceStack = DvonnPieceStack.PLAYER_ONE;
    const BD: DvonnPieceStack = new DvonnPieceStack(Player.ONE, 2, true);
    const BB: DvonnPieceStack = new DvonnPieceStack(Player.ONE, 2, false);
    const BDB: DvonnPieceStack = new DvonnPieceStack(Player.ONE, 3, true);
    const B5: DvonnPieceStack = new DvonnPieceStack(Player.ONE, 5, false);
    const B6: DvonnPieceStack = new DvonnPieceStack(Player.ONE, 6, false);
    const BD6: DvonnPieceStack = new DvonnPieceStack(Player.ONE, 6, true);
    const W6: DvonnPieceStack = new DvonnPieceStack(Player.ZERO, 6, false);
    const WD6: DvonnPieceStack = new DvonnPieceStack(Player.ZERO, 6, true);

    beforeEach(() => {
        rules = new DvonnRules(DvonnGameState);
        minimax = new DvonnMinimax(rules, 'DvonnMinimax');
    });
    it('should be created', () => {
        expect(rules).toBeTruthy();
        expect(rules.node.gamePartSlice.turn).toBe(0, 'Game should start at turn 0');
    });
    it('initial stacks should be of size 1', () => {
        const slice: DvonnGameState = rules.node.gamePartSlice;
        for (let y: number = 0; y < DvonnBoard.HEIGHT; y++) {
            for (let x: number = 0; x < DvonnBoard.WIDTH; x++) {
                const coord: Coord = new Coord(x, y);
                if (slice.hexaBoard.isOnBoard(coord)) {
                    const stack: DvonnPieceStack = slice.hexaBoard.getAt(coord);
                    expect(stack.getSize()).toEqual(1);
                    expect(stack.isEmpty()).toBeFalse();
                }
            }
        }
    });
    it('should allow 11 pieces to move in the first turn', () => {
        // 6. Important: a piece or stack that is surrounded on all 6 sides may
        // not be moved. So, at the beginning of the game only the pieces at
        // the edge of the board may move. The pieces that are not positioned at
        // the edge remain blocked for as long as they remain completely
        // surrounded (see diagram below).
        const slice: DvonnGameState = rules.node.gamePartSlice;
        const firstTurnMovablePieces: Coord[] = DvonnRules.getMovablePieces(slice);
        expect(firstTurnMovablePieces.length).toEqual(11);
    });
    it('should provide 41 moves in the first turn on the balanced board', () => {
        const firstTurnMoves: DvonnMove[] = minimax.getListMoves(rules.node);
        expect(firstTurnMoves.length).toEqual(41);
    });
    it('should only allow moves from the current player color', () => {
        const slice: DvonnGameState = rules.node.gamePartSlice;
        const movablePieces: Coord[] = DvonnRules.getMovablePieces(slice);
        for (const coord of movablePieces) {
            expect(slice.hexaBoard.getAt(coord).belongsTo(Player.ZERO));
        }
        const moves: DvonnMove[] = minimax.getListMoves(rules.node);
        const slice2: DvonnGameState = rules.applyLegalMove(moves[0], slice, { legal: MGPValidation.SUCCESS });
        const movablePieces2: Coord[] = DvonnRules.getMovablePieces(slice2);
        for (const coord of movablePieces2) {
            expect(slice2.hexaBoard.getAt(coord).belongsTo(Player.ONE)).toBeTrue();
        }
        const move: DvonnMove = DvonnMove.of(new Coord(1, 1), new Coord(1, 2));
        const status: LegalityStatus = rules.isLegal(move, slice);
        expect(status.legal.reason).toBe(DvonnFailure.NOT_PLAYER_PIECE);
    });
    it('should forbid moves for pieces with more than 6 neighbors', () => {
        const slice: DvonnGameState = rules.node.gamePartSlice;
        const move: DvonnMove = DvonnMove.of(new Coord(1, 3), new Coord(1, 2));
        const status: LegalityStatus = rules.isLegal(move, slice);
        expect(status.legal.reason).toBe(DvonnFailure.TOO_MANY_NEIGHBORS);
    });
    it('should forbid moves from an empty stack', () => {
        const board: DvonnBoard = new DvonnBoard([
            [_, _, _, B, B, B, W, W, B, D, B],
            [_, B, B, W, W, W, B, B, W, B, B],
            [WB, B, B, B, W, D, B, W, W, W, W],
            [_, W, B, W, W, B, B, B, W, W, _],
            [W, D, W, B, B, W, W, W, B, _, _],
        ]);
        const slice: DvonnGameState = new DvonnGameState(board, 0, false);
        const move: DvonnMove = DvonnMove.of(new Coord(2, 0), new Coord(2, 1));
        const legality: MGPValidation = rules.isLegal(move, slice).legal;
        expect(legality).toEqual(MGPValidation.failure(DvonnFailure.EMPTY_STACK));
    });
    it('should forbid moves with pieces that cannot reach any target', () => {
        const board: DvonnBoard = new DvonnBoard([
            [_, _, WW, D, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, W, B, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
        ]);
        const slice: DvonnGameState = new DvonnGameState(board, 0, false);
        const move: DvonnMove = DvonnMove.of(new Coord(2, 0), new Coord(4, 0));
        const legality: MGPValidation = rules.isLegal(move, slice).legal;
        expect(legality).toEqual(MGPValidation.failure(DvonnFailure.CANT_REACH_TARGET));
    });
    it('should forbid moves with a different length than the stack size', () => {
        const board: DvonnBoard = new DvonnBoard([
            [_, _, WW, B, _, _, _, _, _, _, _],
            [_, WWW, BD, W, W, _, _, D, _, _, _],
            [BB, B, B, _, W, _, _, BB, _, _, _],
            [W, _, B, WWW, W, _, _, _, _, _, _],
            [W, D, W, B, B, W, _, _, _, _, _],
        ]);
        const slice: DvonnGameState = new DvonnGameState(board, 0, false);
        const move: DvonnMove = DvonnMove.of(new Coord(2, 0), new Coord(3, 0));
        const legality: MGPValidation = rules.isLegal(move, slice).legal;
        expect(legality).toEqual(MGPValidation.failure(DvonnFailure.INVALID_MOVE_LENGTH));
    });
    it('should have the target stack owned by the owner of the source stack after the move', () => {
        const expectedBoard: DvonnBoard = new DvonnBoard([
            [_, _, W, B, B, B, W, W, B, D, B],
            [_, B, B, W, W, W, B, B, W, B, B],
            [WB, B, B, B, W, D, B, W, W, W, W],
            [_, W, B, W, W, B, B, B, W, W, _],
            [W, D, W, B, B, W, W, W, B, _, _],
        ]);
        const slice: DvonnGameState = rules.node.gamePartSlice;
        const move: DvonnMove = DvonnMove.of(new Coord(0, 3), new Coord(0, 2));
        const legality: LegalityStatus = rules.isLegal(move, slice);
        expect(legality.legal.isSuccess()).toBeTrue();
        const resultingSlice: DvonnGameState = rules.applyLegalMove(move, slice, legality);
        expect(resultingSlice.hexaBoard).toEqual(expectedBoard);
        const stack: DvonnPieceStack = resultingSlice.hexaBoard.getAt(new Coord(0, 2));
        expect(stack.belongsTo(Player.ZERO)).toBeTrue();
    });
    it('should allow moves only to occupied spaces', () => {
        const board: DvonnBoard = new DvonnBoard([
            [_, _, W, B, _, B, W, _, B, D, B],
            [_, B, B, W, W, W, B, B, W, B, B],
            [B, B, B, _, W, D, _, W, W, W, W],
            [W, _, B, W, W, _, B, B, W, W, _],
            [W, D, W, B, B, W, W, W, B, _, _],
        ]);
        const slice: DvonnGameState = new DvonnGameState(board, 0, false);
        const moves: DvonnMove[] = minimax.getListMoves(new MGPNode(null, null, slice));
        for (const move of moves) {
            expect(board.getAt(move.end).isEmpty()).toBeFalse();
        }
        const move: DvonnMove = DvonnMove.of(new Coord(3, 1), new Coord(3, 2));
        expect(rules.isLegal(move, slice).legal.reason).toBe(DvonnFailure.EMPTY_TARGET_STACK);
    });
    it('should move stacks as a whole, by as many spaces as there are pieces in the stack', () => {
        const board: DvonnBoard = new DvonnBoard([
            [_, _, WW, B, _, _, _, _, _, _, _],
            [_, WWW, BD, W, W, _, _, D, _, _, _],
            [BB, B, B, _, W, _, _, BB, _, _, _],
            [W, _, B, WWW, W, _, _, _, _, _, _],
            [W, D, W, B, B, W, _, _, _, _, _],
        ]);
        const slice: DvonnGameState = new DvonnGameState(board, 0, false);
        const moves: DvonnMove[] = minimax.getListMoves(new MGPNode(null, null, slice));
        for (const move of moves) {
            expect(move.length()).toEqual(board.getAt(move.coord).getSize());
        }
        const move: DvonnMove = DvonnMove.of(new Coord(2, 0), new Coord(3, 0));
        const status: LegalityStatus = rules.isLegal(move, slice);
        expect(status.legal.reason).toBe(DvonnFailure.INVALID_MOVE_LENGTH);
    });
    it('should not allow moves that end on an empty space', () => {
        const board: DvonnBoard = new DvonnBoard([
            [_, _, WW, B, _, _, _, _, _, _, _],
            [_, WWW, BD, W, W, _, _, D, _, _, _],
            [BB, B, B, _, W, _, _, BB, _, _, _],
            [W, _, B, WWW, W, _, _, _, _, _, _],
            [W, D, W, B, B, W, _, _, _, _, _],
        ]);
        const slice: DvonnGameState = new DvonnGameState(board, 0, false);
        const moves: DvonnMove[] = minimax.getListMoves(new MGPNode(null, null, slice));
        for (const move of moves) {
            expect(board.getAt(move.end).isEmpty()).toBeFalse();
        }
    });
    it('should not allow to move a single red piece, but allows stacks with red pieces within it to move', () => {
        const board: DvonnBoard = new DvonnBoard([
            [_, _, WW, B, _, _, _, _, _, _, _],
            [_, WWW, BD, W, W, _, _, D, _, _, _],
            [BB, B, B, _, W, _, _, BB, _, _, _],
            [W, _, BDB, WWW, W, _, _, _, _, _, _],
            [W, D, W, B, B, W, _, _, _, _, _],
        ]);
        const slice: DvonnGameState = new DvonnGameState(board, 0, false);
        const moves: DvonnMove[] = minimax.getListMoves(new MGPNode(null, null, slice));
        for (const move of moves) {
            const stack: DvonnPieceStack = board.getAt(move.coord);
            // every movable piece should belong to the current player
            expect(stack.belongsTo(slice.getCurrentPlayer())).toBeTrue();
        }
        const move: DvonnMove = DvonnMove.of(new Coord(2, 0), new Coord(2, 4));
        expect(rules.isLegal(move, slice).legal.reason).toBe(DvonnFailure.INVALID_MOVE_LENGTH);
    });
    it('should not allow to pass turns if moves are possible', () => {
        const slice: DvonnGameState = rules.node.gamePartSlice;
        expect(rules.isLegal(DvonnMove.PASS, slice).legal.reason).toBe(DvonnFailure.INVALID_COORD);
        // TODO: le message devrait correspondre à la raison de son apparition
        // (l'user ne peut pas passer car il doit jouer, pas à cause de la coord)
    });
    it('should allow to pass turn if no moves are possible', () => {
        const board: DvonnBoard = new DvonnBoard([
            [_, _, WW, _, _, _, _, _, _, _, _],
            [_, _, D, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
        ]);
        const slice: DvonnGameState = new DvonnGameState(board, 0, false);
        const moves: DvonnMove[] = minimax.getListMoves(new MGPNode(null, null, slice));
        expect(moves.length).toEqual(1);
        expect(moves[0]).toEqual(DvonnMove.PASS);
        expect(rules.isLegal(DvonnMove.PASS, slice).legal.isSuccess()).toBeTrue();
        const move: DvonnMove = DvonnMove.of(new Coord(2, 0), new Coord(2, 1));
        expect(rules.isLegal(move, slice).legal.reason).toBe(DvonnFailure.CAN_ONLY_PASS);
    });
    it('should remove of the board any portion disconnected from a source', () => {
        const board: DvonnBoard = new DvonnBoard([
            [_, _, WW, _, _, B, _, _, _, _, _],
            [_, _, D, W, W, W, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
        ]);
        const expectedBoard: DvonnBoard = new DvonnBoard([
            [_, _, WW, _, _, _, _, _, _, _, _],
            [_, _, WD, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
        ]);
        const slice: DvonnGameState = new DvonnGameState(board, 0, false);
        const move: DvonnMove = DvonnMove.of(new Coord(3, 1), new Coord(2, 1));
        const legality: LegalityStatus = rules.isLegal(move, slice);
        expect(legality.legal.isSuccess()).toBeTrue();
        const resultingSlice: DvonnGameState = rules.applyLegalMove(move, slice, legality);
        expect(resultingSlice.hexaBoard).toEqual(expectedBoard);
    });
    it('should end the game when no move can be done', () => {
        const board: DvonnBoard = new DvonnBoard([
            [_, _, WW, _, _, _, _, _, _, _, _],
            [_, _, D, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
        ]);
        const slice: DvonnGameState = new DvonnGameState(board, 10, true);
        expect(minimax.getListMoves(new MGPNode(null, DvonnMove.PASS, slice)).length).toEqual(0);
    });
    it('should not end if moves can be done', () => {
        const board: DvonnBoard = new DvonnBoard([
            [_, _, _, _, _, _, _, _, _, BD6, _],
            [_, _, _, B6, WW, _, B5, _, _, _, _],
            [_, _, _, _, W, BD6, W6, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
            [_, WD6, _, _, _, _, _, _, _, _, _],
        ]);
        const slice: DvonnGameState = new DvonnGameState(board, 11, true);
        expect(minimax.getListMoves(new MGPNode(null, DvonnMove.of(new Coord(1, 3), new Coord(1, 4)), slice)).length)
            .toEqual(1);
    });
    it('should assign the right score to winning boards', () => {
        const boardW: DvonnBoard = new DvonnBoard([
            [_, _, WW, _, _, _, _, _, _, _, _],
            [_, _, D, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
        ]);
        const boardB: DvonnBoard = new DvonnBoard([
            [_, _, _, _, _, _, _, _, _, _, _],
            [_, _, D, BB, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
        ]);
        const boardDraw: DvonnBoard = new DvonnBoard([
            [_, _, _, WW, _, _, _, _, _, _, _],
            [_, _, D, BB, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _],
        ]);
        const slice1: DvonnGameState = new DvonnGameState(boardW, 0, false);
        const slice2: DvonnGameState = new DvonnGameState(boardB, 0, false);
        const slice3: DvonnGameState = new DvonnGameState(boardDraw, 0, false);

        expect(rules.getGameStatus(new MGPNode(null, null, slice1))).toEqual(GameStatus.ZERO_WON);
        expect(rules.getGameStatus(new MGPNode(null, null, slice2))).toEqual(GameStatus.ONE_WON);
        expect(rules.getGameStatus(new MGPNode(null, null, slice3))).toEqual(GameStatus.DRAW);
        expect(minimax.getBoardValue(new MGPNode(null, null, slice1)).value).toEqual(Player.ZERO.getVictoryValue());
        expect(minimax.getBoardValue(new MGPNode(null, null, slice2)).value).toEqual(Player.ONE.getVictoryValue());
        expect(minimax.getBoardValue(new MGPNode(null, null, slice3)).value).toEqual(0);
    });
});
