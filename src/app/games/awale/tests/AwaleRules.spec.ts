import { AwaleNode, AwaleRules } from '../AwaleRules';
import { AwaleMove } from '../AwaleMove';
import { AwalePartSlice } from '../AwalePartSlice';
import { AwaleLegalityStatus } from '../AwaleLegalityStatus';
import { expectToBeDraw, expectToBeVictoryFor } from 'src/app/jscaip/tests/RulesUtils.spec';
import { Player } from 'src/app/jscaip/Player';
import { AwaleMinimax } from '../AwaleMinimax';
import { MGPNode } from 'src/app/jscaip/MGPNode';
import { AwaleFailure } from '../AwaleFailure';

describe('AwaleRules', () => {
    let rules: AwaleRules;
    let minimaxes: AwaleMinimax[];

    beforeEach(() => {
        rules = new AwaleRules(AwalePartSlice);
        minimaxes = [
            new AwaleMinimax(rules, 'AwaleMinimax'),
        ];
    });
    it('should capture', () => {
        const board: number[][] = [
            [0, 0, 0, 0, 1, 1],
            [0, 0, 0, 0, 1, 1],
        ];
        const expectedBoard: number[][] = [
            [0, 0, 0, 0, 1, 0],
            [0, 0, 0, 0, 1, 0],
        ];
        const slice: AwalePartSlice = new AwalePartSlice(board, 0, [1, 2]);
        const move: AwaleMove = AwaleMove.FIVE;
        const status: AwaleLegalityStatus = rules.isLegal(move, slice);
        expect(status.legal.isSuccess()).toBeTrue();
        const resultingSlice: AwalePartSlice = rules.applyLegalMove(move, slice, status);
        const expectedSlice: AwalePartSlice =
            new AwalePartSlice(expectedBoard, 1, [3, 2]);
        expect(resultingSlice).toEqual(expectedSlice);
    });
    it('should do mansoon when impossible distribution', () => {
        // given a board where a player is about to give his last stone to opponent
        const board: number[][] = [
            [0, 0, 0, 0, 0, 1],
            [0, 1, 2, 3, 4, 4],
        ];
        const state: AwalePartSlice = new AwalePartSlice(board, 0, [23, 10]);

        // when player give his last stone
        const move: AwaleMove = AwaleMove.FIVE;
        const status: AwaleLegalityStatus = rules.isLegal(move, state);
        const resultingState: AwalePartSlice = rules.applyLegalMove(move, state, status);

        // then, since other player can't distribute, he mansoon all his pieces
        const expectedBoard: number[][] = [
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
        ];
        const expectedState: AwalePartSlice = new AwalePartSlice(expectedBoard, 1, [23, 25]);
        expect(status.legal.isSuccess()).toBeTrue();
        expect(resultingState).toEqual(expectedState);
        const node: AwaleNode = new MGPNode(null, move, resultingState);
        expectToBeVictoryFor(rules, node, Player.ONE, minimaxes);
    });
    it('should forbid non-feeding move', () => {
        // given a board in which the player could and should feed his opponent
        const board: number[][] = [
            [1, 0, 0, 0, 0, 1],
            [0, 0, 0, 0, 0, 0],
        ];
        const state: AwalePartSlice = new AwalePartSlice(board, 0, [23, 23]);

        // when he does not
        const move: AwaleMove = AwaleMove.ZERO;
        const status: AwaleLegalityStatus = rules.isLegal(move, state);

        // then the move is illegal
        expect(status.legal.reason).toBe(AwaleFailure.SHOULD_DISTRIBUTE);
    });
    it('shoud distribute but not capture in case of would-starve move', () => {
        // given a board in which the player could capture all opponents seeds
        const board: number[][] = [
            [1, 0, 0, 0, 0, 2],
            [0, 0, 0, 0, 1, 1],
        ];
        const state: AwalePartSlice = new AwalePartSlice(board, 0, [0, 0]);

        // when player does a would-starve move
        const move: AwaleMove = AwaleMove.FIVE;
        const status: AwaleLegalityStatus = rules.isLegal(move, state);
        const resultingState: AwalePartSlice = rules.applyLegalMove(move, state, status);

        // then, the distribution should be done but not the capture
        const expectedBoard: number[][] = [
            [1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 2, 2],
        ];
        const expectedState: AwalePartSlice = new AwalePartSlice(expectedBoard, 1, [0, 0]);
        expect(status.legal.isSuccess()).toBeTrue();
        expect(resultingState).toEqual(expectedState);
    });
    describe('getGameStatus', () => {
        it('should identify victory for player 0', () => {
            const board: number[][] = [
                [0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0],
            ];
            const state: AwalePartSlice = new AwalePartSlice(board, 5, [26, 22]);
            const node: AwaleNode = new AwaleNode(null, null, state);
            expectToBeVictoryFor(rules, node, Player.ZERO, minimaxes);
        });
        it('should identify victory for player 1', () => {
            const board: number[][] = [
                [0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0],
            ];
            const state: AwalePartSlice = new AwalePartSlice(board, 5, [22, 26]);
            const node: AwaleNode = new AwaleNode(null, null, state);
            expectToBeVictoryFor(rules, node, Player.ONE, minimaxes);
        });
        it('should identify draw', () => {
            const board: number[][] = [
                [0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0],
            ];
            const state: AwalePartSlice = new AwalePartSlice(board, 5, [24, 24]);
            const node: AwaleNode = new AwaleNode(null, null, state);
            expectToBeDraw(rules, node, minimaxes);
        });
    });
});
