import { EncapsuleNode, EncapsuleRules } from '../EncapsuleRules';
import { EncapsuleMinimax } from '../EncapsuleMinimax';
import { EncapsuleMove } from '../EncapsuleMove';
import { Coord } from 'src/app/jscaip/Coord';
import { EncapsuleCase, EncapsulePartSlice } from '../EncapsulePartSlice';
import { Player } from 'src/app/jscaip/Player';
import { EncapsulePiece } from '../EncapsulePiece';
import { EncapsuleLegalityStatus } from '../EncapsuleLegalityStatus';
import { expectToBeVictoryFor } from 'src/app/jscaip/tests/Rules.spec';
import { MGPNode } from 'src/app/jscaip/MGPNode';

describe('EncapsuleRules', () => {

    let rules: EncapsuleRules;

    let minimax: EncapsuleMinimax;

    const drop: (piece: EncapsulePiece, coord: Coord) => boolean = (piece: EncapsulePiece, coord: Coord) => {
        const move: EncapsuleMove = EncapsuleMove.fromDrop(piece, coord);
        return rules.choose(move);
    };
    const move: (start: Coord, end: Coord) => boolean = (start: Coord, end: Coord) => {
        const move: EncapsuleMove = EncapsuleMove.fromMove(start, end);
        return rules.choose(move);
    };
    const ___: number = new EncapsuleCase(Player.NONE, Player.NONE, Player.NONE).encode();
    const X__: number = new EncapsuleCase(Player.ONE, Player.NONE, Player.NONE).encode();
    const _X_: number = new EncapsuleCase(Player.NONE, Player.ONE, Player.NONE).encode();
    const __X: number = new EncapsuleCase(Player.NONE, Player.NONE, Player.ONE).encode();
    const O__: number = new EncapsuleCase(Player.ZERO, Player.NONE, Player.NONE).encode();
    const _O_: number = new EncapsuleCase(Player.NONE, Player.ZERO, Player.NONE).encode();
    const __O: number = new EncapsuleCase(Player.NONE, Player.NONE, Player.ZERO).encode();
    const XO_: number = new EncapsuleCase(Player.ONE, Player.ZERO, Player.NONE).encode();
    const O0: EncapsulePiece = EncapsulePiece.SMALL_BLACK;
    const O1: EncapsulePiece = EncapsulePiece.MEDIUM_BLACK;
    const O2: EncapsulePiece = EncapsulePiece.BIG_BLACK;
    const X0: EncapsulePiece = EncapsulePiece.SMALL_WHITE;
    const X1: EncapsulePiece = EncapsulePiece.MEDIUM_WHITE;
    const X2: EncapsulePiece = EncapsulePiece.BIG_WHITE;

    beforeEach(() => {
        rules = new EncapsuleRules(EncapsulePartSlice);
        minimax = new EncapsuleMinimax(rules, 'EncapsuleMinimax');
    });
    it('should be created', () => {
        expect(rules).toBeTruthy();
    });
    describe('isVictory', () => {
        it('should detect victory', () => {
            const board: number[][] = [
                [O__, ___, ___],
                [___, _O_, ___],
                [___, ___, __O],
            ];
            const slice: EncapsulePartSlice = new EncapsulePartSlice(board, 2, [
                X0, X0, X1, X1, X2, X2,
                O0, O1, O2,
            ]);
            expect(EncapsuleRules.isVictory(slice).isPresent()).toBeTrue();
        });
        it('should not consider a non-victory as a victory', () => {
            const board: number[][] = [
                [O__, ___, ___],
                [___, _X_, ___],
                [___, ___, __X],
            ];
            const state: EncapsulePartSlice = new EncapsulePartSlice(board, 2, [
                O0, O1, O1, O2, O2,
                X0, X0, X1, X2,
            ]);
            expect(EncapsuleRules.isVictory(state).isPresent()).toBeFalse();
            const node: EncapsuleNode = new MGPNode(null, null, state);
            expect(minimax.getBoardValue(node).value).toBe(0);
        });
    });
    it('should know winner even when he was not playing', () => {
        // Given a board on which active player could loose by acting
        const board: number[][] = [
            [XO_, ___, ___],
            [___, _X_, ___],
            [___, ___, __X],
        ];
        const state: EncapsulePartSlice = new EncapsulePartSlice(board, 2, [
            O0, O0, O1, O2, O2,
            X0, X1, X2,
        ]);

        // when doing that "actively loosing move"
        const move: EncapsuleMove = EncapsuleMove.fromMove(new Coord(0, 0), new Coord(1, 0));
        const status: EncapsuleLegalityStatus = rules.isLegal(move, state);
        const resultingState: EncapsulePartSlice = rules.applyLegalMove(move, state, status);

        // then the active player should have lost
        const expectedBoard: number[][] = [
            [X__, _O_, ___],
            [___, _X_, ___],
            [___, ___, __X],
        ];
        const expectedState: EncapsulePartSlice = new EncapsulePartSlice(expectedBoard, 3, [
            O0, O0, O1, O2, O2,
            X0, X1, X2,
        ]);
        expect(status.legal.isSuccess()).toBeTrue();
        expect(resultingState).toEqual(expectedState);
        const node: EncapsuleNode = new MGPNode(null, move, expectedState);
        expectToBeVictoryFor(rules, node, Player.ONE, [minimax]);
    });
    it('should allow simplest victory for player zero', () => {
        expect(drop(EncapsulePiece.SMALL_BLACK, new Coord(0, 0))).toBeTrue();
        expect(drop(EncapsulePiece.MEDIUM_WHITE, new Coord(1, 0))).toBeTrue();
        expect(drop(EncapsulePiece.SMALL_BLACK, new Coord(1, 1))).toBeTrue();
        expect(drop(EncapsulePiece.SMALL_WHITE, new Coord(0, 1))).toBeTrue();
        expect(drop(EncapsulePiece.MEDIUM_BLACK, new Coord(2, 2))).toBeTrue();
        expect(rules.node.getOwnValue(minimax).value).toBe(Number.MIN_SAFE_INTEGER);
    });
    it('should allow simplest victory for player zero', () => {
        expect(drop(EncapsulePiece.SMALL_BLACK, new Coord(2, 0))).toBeTrue();
        expect(drop(EncapsulePiece.SMALL_WHITE, new Coord(0, 0))).toBeTrue();
        expect(drop(EncapsulePiece.MEDIUM_BLACK, new Coord(1, 0))).toBeTrue();
        expect(drop(EncapsulePiece.SMALL_WHITE, new Coord(1, 1))).toBeTrue();
        expect(drop(EncapsulePiece.SMALL_BLACK, new Coord(0, 1))).toBeTrue();
        expect(drop(EncapsulePiece.MEDIUM_WHITE, new Coord(2, 2))).toBeTrue();
        expect(rules.node.getOwnValue(minimax).value).toBe(Number.MAX_SAFE_INTEGER);
    });
    it('should allow moving pieces on empty coord', () => {
        // Given a board with piece on it
        const board: number[][] = [
            [O__, ___, ___],
            [___, X__, ___],
            [___, ___, ___],
        ];
        const remainingPieces: EncapsulePiece[] = [
            X0, X1, X1, X2, X2,
            O0, O1, O1, O2, O2,
        ];
        const state: EncapsulePartSlice = new EncapsulePartSlice(board, 2, remainingPieces);

        // when moving a single piece elsewhere
        const move: EncapsuleMove = EncapsuleMove.fromMove(new Coord(0, 0), new Coord(2, 2));
        const status: EncapsuleLegalityStatus = rules.isLegal(move, state);
        const resultingState: EncapsulePartSlice = rules.applyLegalMove(move, state, status);

        // then the piece should have been moved
        const expectedBoard: number[][] = [
            [___, ___, ___],
            [___, X__, ___],
            [___, ___, O__],
        ];
        const expectedState: EncapsulePartSlice = new EncapsulePartSlice(expectedBoard, 3, remainingPieces);
        expect(status.legal.isSuccess()).toBeTrue();
        expect(resultingState).toEqual(expectedState);
    });
    it('should allow moving piece on a smaller piece', () => {
        // Given a board with small and bigger piece on it
        const board: number[][] = [
            [_O_, ___, ___],
            [___, ___, ___],
            [___, ___, X__],
        ];
        const remainingPieces: EncapsulePiece[] = [X0, X1, X1, X2, X2, O0, O0, O1, O1, O2, O2];
        const state: EncapsulePartSlice = new EncapsulePartSlice(board, 2, remainingPieces);

        // when moving a single piece elsewhere
        const move: EncapsuleMove = EncapsuleMove.fromMove(new Coord(0, 0), new Coord(2, 2));
        const status: EncapsuleLegalityStatus = rules.isLegal(move, state);
        const resultingState: EncapsulePartSlice = rules.applyLegalMove(move, state, status);

        // then the piece should have been moved over the smaller one
        const expectedBoard: number[][] = [
            [___, ___, ___],
            [___, ___, ___],
            [___, ___, XO_],
        ];
        const expectedState: EncapsulePartSlice = new EncapsulePartSlice(expectedBoard, 3, remainingPieces);
        expect(status.legal.isSuccess()).toBeTrue();
        expect(resultingState).toEqual(expectedState);
    });
    it('should forbid moving pieces on a piece with the same size', () => {
        expect(drop(EncapsulePiece.SMALL_BLACK, new Coord(2, 0))).toBeTrue();
        expect(drop(EncapsulePiece.SMALL_WHITE, new Coord(2, 1))).toBeTrue();
        expect(move(new Coord(2, 0), new Coord(2, 1))).toBeFalse();
    });
    it('should forbid dropping a piece on a bigger piece', () => {
        const board: number[][] = [
            [__X, ___, ___],
            [___, ___, ___],
            [___, ___, ___],
        ];
        const slice: EncapsulePartSlice = new EncapsulePartSlice(board, 2, [
            EncapsulePiece.SMALL_WHITE, EncapsulePiece.SMALL_WHITE,
            EncapsulePiece.MEDIUM_WHITE, EncapsulePiece.MEDIUM_WHITE,
            EncapsulePiece.BIG_WHITE, EncapsulePiece.BIG_WHITE,
            EncapsulePiece.SMALL_BLACK, EncapsulePiece.MEDIUM_BLACK,
            EncapsulePiece.BIG_BLACK,
        ]);
        const move: EncapsuleMove = EncapsuleMove.fromDrop(EncapsulePiece.SMALL_BLACK, new Coord(0, 0));
        expect(rules.isLegal(move, slice).legal.isFailure()).toBeTrue();
    });
    it('should refuse to put three identical piece on the board', () => {
        expect(drop(EncapsulePiece.SMALL_BLACK, new Coord(0, 0))).toBeTrue();
        expect(drop(EncapsulePiece.MEDIUM_WHITE, new Coord(1, 0))).toBeTrue();
        expect(drop(EncapsulePiece.SMALL_BLACK, new Coord(1, 1))).toBeTrue();
        expect(drop(EncapsulePiece.SMALL_WHITE, new Coord(0, 1))).toBeTrue();
        expect(drop(EncapsulePiece.SMALL_BLACK, new Coord(2, 2))).toBeFalse();
    });
    it('should refuse to move small piece on bigger piece', () => {
        expect(drop(EncapsulePiece.SMALL_BLACK, new Coord(0, 0))).toBeTrue();
        expect(drop(EncapsulePiece.MEDIUM_WHITE, new Coord(1, 0))).toBeTrue();
        expect(move(new Coord(0, 0), new Coord(1, 0))).toBeFalse();
    });
    it('should refuse to move ennemy piece on the board', () => {
        expect(drop(EncapsulePiece.SMALL_BLACK, new Coord(0, 0))).toBeTrue();
        expect(move(new Coord(0, 0), new Coord(1, 0))).toBeFalse();
    });
    it('should refuse to move or drop void', () => {
        expect(drop(EncapsulePiece.NONE, new Coord(0, 0))).toBeFalse();
        expect(move(new Coord(0, 0), new Coord(1, 0))).toBeFalse();
    });
    describe('getListMoves', () => {
        it('should have 27 moves on first turn', () => {
            // 3 pieces x 9 coords = 27 moves
            expect(minimax.getListMoves(rules.node).length).toBe(27);
        });
        it('should have XX moves on a specific third turn', () => {
            drop(EncapsulePiece.SMALL_BLACK, new Coord(0, 0));
            drop(EncapsulePiece.SMALL_WHITE, new Coord(1, 0));
            // Drops medium = 9, drops big = 9, drops small = 7
            // Moving the piece on board = 7 possible landing cases
            // Total: 32
            expect(minimax.getListMoves(rules.node).length).toBe(32);
        });
    });
});
