import { YinshBoard } from '../YinshBoard';
import { YinshGameState } from '../YinshGameState';
import { YinshPiece } from '../YinshPiece';

describe('YinshGameState', () => {
    describe('equals', () => {
        const _: YinshPiece = YinshPiece.EMPTY;
        const N: YinshPiece = YinshPiece.EMPTY;
        const A: YinshPiece = YinshPiece.RING_ZERO;

        const board: YinshBoard = YinshBoard.of([
            [N, N, N, N, N, N, _, _, _, _, N],
            [N, N, N, N, _, _, _, _, _, _, _],
            [N, N, N, A, _, _, _, _, _, _, _],
            [N, N, _, _, _, _, _, _, _, _, _],
            [N, _, _, _, _, _, _, _, _, _, _],
            [N, _, _, _, _, _, _, _, _, _, N],
            [_, _, _, _, _, _, _, _, _, _, N],
            [_, _, _, _, _, _, _, _, _, N, N],
            [_, _, _, _, _, _, _, _, N, N, N],
            [_, _, _, _, _, _, _, N, N, N, N],
            [N, _, _, _, _, N, N, N, N, N, N],
        ]);

        it('should detect that a slice is equal to itself', () => {
            const state: YinshGameState = YinshGameState.getInitialSlice();
            expect(state.equals(state)).toBeTrue();
        });
        it('should detect when two states differ due to their turn', () => {
            const state1: YinshGameState = new YinshGameState(board, [0, 0], 0);
            const state2: YinshGameState = new YinshGameState(board, [0, 0], 1);
            expect(state1.equals(state2)).toBeFalse();
        });
        it('should detect when two states differ due to their side rings', () => {
            const state1: YinshGameState = new YinshGameState(board, [0, 0], 0);
            const state2: YinshGameState = new YinshGameState(board, [0, 1], 0);
            const state3: YinshGameState = new YinshGameState(board, [1, 0], 0);
            expect(state1.equals(state2)).toBeFalse();
            expect(state1.equals(state3)).toBeFalse();
        });
        it('should detect when two states differ due to their board', () => {
            const board2: YinshBoard = YinshBoard.of([
                [N, N, N, N, N, N, _, _, _, _, N],
                [N, N, N, N, _, _, _, _, _, _, _],
                [N, N, N, _, _, _, _, _, _, _, _],
                [N, N, _, _, _, _, _, _, _, _, _],
                [N, _, _, _, _, _, _, _, _, _, _],
                [N, _, _, _, _, _, _, _, _, _, N],
                [_, _, _, _, _, _, _, _, _, _, N],
                [_, _, _, _, _, _, _, _, _, N, N],
                [_, _, _, _, _, _, _, _, N, N, N],
                [_, _, _, _, _, _, _, N, N, N, N],
                [N, _, _, _, _, N, N, N, N, N, N],
            ]);
            const state1: YinshGameState = new YinshGameState(board, [0, 0], 0);
            const state2: YinshGameState = new YinshGameState(board2, [0, 0], 0);
            expect(state1.equals(state2)).toBeFalse();
        });
    });
});