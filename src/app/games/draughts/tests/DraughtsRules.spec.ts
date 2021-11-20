import { Table } from 'src/app/utils/ArrayUtils';
import { Direction } from 'src/app/jscaip/Direction';
import { Player } from 'src/app/jscaip/Player';
import { DraughtsLegalityStatus } from '../DraughtsLegalityStatus';
import { DraughtsMove } from '../DraughtsMove';
import { EpaminondasState } from '../DraughtsState';
import { DraughtsNode, DraughtsRules } from '../DraughtsRules';
import { DraughtsMinimax } from '../DraughtsMinimax';
import { RulesFailure } from 'src/app/jscaip/RulesFailure';
import { MGPNode } from 'src/app/jscaip/MGPNode';
import { DraughtsFailure } from '../DraughtsFailure';
import { expectToBeOngoing, expectToBeVictoryFor } from 'src/app/jscaip/tests/RulesUtils.spec';
import { Minimax } from 'src/app/jscaip/Minimax';
import { AttackDraughtsMinimax } from '../AttackDraughtsMinimax';
import { PositionalDraughtsMinimax } from '../PositionalDraughtsMinimax';

describe('DraughtsRules:', () => {

    let rules: DraughtsRules;
    let minimaxes: Minimax<DraughtsMove, EpaminondasState>[];
    const _: Player = Player.NONE;
    const X: Player = Player.ONE;
    const O: Player = Player.ZERO;

    beforeEach(() => {
        rules = new DraughtsRules(EpaminondasState);
        minimaxes = [
            new AttackDraughtsMinimax(rules, 'Attack'),
            new DraughtsMinimax(rules, 'Epaminondas'),
            new PositionalDraughtsMinimax(rules, 'Positional'),
        ];
    });
    it('Should forbid phalanx to go outside the board (body)', () => {
        const board: Table<Player> = [
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
        ];
        const state: EpaminondasState = new EpaminondasState(board, 0);
        const move: DraughtsMove = new DraughtsMove(0, 11, 1, 1, Direction.DOWN);
        const status: DraughtsLegalityStatus = rules.isLegal(move, state);
        expect(status.legal.getReason())
            .toBe(DraughtsFailure.PHALANX_IS_LEAVING_BOARD());
    });
    it('Should forbid phalanx to go outside the board (head)', () => {
        const board: Table<Player> = [
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
        ];
        const state: EpaminondasState = new EpaminondasState(board, 0);
        const move: DraughtsMove = new DraughtsMove(1, 11, 2, 2, Direction.UP_LEFT);
        const status: DraughtsLegalityStatus = rules.isLegal(move, state);
        expect(status.legal.getReason())
            .toBe(DraughtsFailure.PHALANX_IS_LEAVING_BOARD());
    });
    it('Should forbid invalid phalanx (phalanx containing coord outside the board)', () => {
        const board: Table<Player> = [
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
        ];
        const state: EpaminondasState = new EpaminondasState(board, 0);
        const move: DraughtsMove = new DraughtsMove(0, 11, 2, 1, Direction.DOWN);
        const status: DraughtsLegalityStatus = rules.isLegal(move, state);
        expect(status.legal.getReason()).toBe(DraughtsFailure.PHALANX_CANNOT_CONTAIN_PIECES_OUTSIDE_BOARD());
    });
    it('Should forbid phalanx to pass through other pieces', () => {
        const board: Table<Player> = [
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [_, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [X, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
        ];
        const state: EpaminondasState = new EpaminondasState(board, 0);
        const move: DraughtsMove = new DraughtsMove(0, 11, 3, 3, Direction.UP);
        const status: DraughtsLegalityStatus = rules.isLegal(move, state);
        expect(status.legal.getReason()).toBe(DraughtsFailure.SOMETHING_IN_PHALANX_WAY());
    });
    it('Should forbid to capture greater phalanx', () => {
        const board: Table<Player> = [
            [_, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [_, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [X, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [X, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
            [_, O, O, O, O, O, O, O, O, O, O, O, O, O],
        ];
        const state: EpaminondasState = new EpaminondasState(board, 0);
        const move: DraughtsMove = new DraughtsMove(0, 10, 1, 1, Direction.UP);
        const status: DraughtsLegalityStatus = rules.isLegal(move, state);
        expect(status.legal.getReason()).toBe(DraughtsFailure.PHALANX_SHOULD_BE_GREATER_TO_CAPTURE());
    });
    it('Should forbid to capture same sized phalanx', () => {
        const board: Table<Player> = [
            [_, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [_, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [X, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [X, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
        ];
        const state: EpaminondasState = new EpaminondasState(board, 0);
        const move: DraughtsMove = new DraughtsMove(0, 11, 2, 2, Direction.UP);
        const status: DraughtsLegalityStatus = rules.isLegal(move, state);
        expect(status.legal.getReason()).toBe(DraughtsFailure.PHALANX_SHOULD_BE_GREATER_TO_CAPTURE());
    });
    it('Should forbid to capture your own pieces phalanx', () => {
        const board: Table<Player> = [
            [_, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [_, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
        ];
        const state: EpaminondasState = new EpaminondasState(board, 0);
        const move: DraughtsMove = new DraughtsMove(0, 11, 2, 2, Direction.UP);
        const status: DraughtsLegalityStatus = rules.isLegal(move, state);
        expect(status.legal.getReason()).toBe(RulesFailure.CANNOT_SELF_CAPTURE());
    });
    it('Should forbid moving opponent pieces', () => {
        const board: Table<Player> = [
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
        ];
        const state: EpaminondasState = new EpaminondasState(board, 1);
        const move: DraughtsMove = new DraughtsMove(0, 10, 1, 1, Direction.UP);
        const status: DraughtsLegalityStatus = rules.isLegal(move, state);
        expect(status.legal.getReason()).toBe(DraughtsFailure.PHALANX_CANNOT_CONTAIN_OPPONENT_PIECE());
    });
    it('Should allow legal move', () => {
        const board: Table<Player> = [
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [X, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
        ];
        const expectedBoard: Table<Player> = [
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [X, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, O, O, O, O, O, O, O, O, O, O, O, O, O],
            [_, O, O, O, O, O, O, O, O, O, O, O, O, O],
        ];
        const state: EpaminondasState = new EpaminondasState(board, 0);
        const move: DraughtsMove = new DraughtsMove(0, 11, 2, 2, Direction.UP);
        const status: DraughtsLegalityStatus = rules.isLegal(move, state);
        expect(status.legal.isSuccess()).toBeTrue();
        const resultingState: EpaminondasState = rules.applyLegalMove(move, state, status);
        const expectedState: EpaminondasState = new EpaminondasState(expectedBoard, 1);
        expect(resultingState).toEqual(expectedState);
    });
    it('Should allow legal capture', () => {
        const board: Table<Player> = [
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [X, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [X, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
        ];
        const expectedBoard: Table<Player> = [
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, O, O, O, O, O, O, O, O, O, O, O, O, O],
            [_, O, O, O, O, O, O, O, O, O, O, O, O, O],
        ];
        const state: EpaminondasState = new EpaminondasState(board, 0);
        const move: DraughtsMove = new DraughtsMove(0, 11, 3, 1, Direction.UP);
        const status: DraughtsLegalityStatus = rules.isLegal(move, state);
        expect(status.legal.isSuccess()).toBeTrue();
        const resultingState: EpaminondasState = rules.applyLegalMove(move, state, status);
        const expectedState: EpaminondasState = new EpaminondasState(expectedBoard, 1);
        expect(resultingState).toEqual(expectedState);
    });
    describe('Victories', () => {
        it('Should declare first player winner if his pawn survive one turn on last line', () => {
            const board: Table<Player> = [
                [O, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [X, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            ];
            const expectedBoard: Table<Player> = [
                [O, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [X, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            ];
            const state: EpaminondasState = new EpaminondasState(board, 1);
            const move: DraughtsMove = new DraughtsMove(0, 9, 1, 1, Direction.DOWN);
            const status: DraughtsLegalityStatus = rules.isLegal(move, state);
            expect(status.legal.isSuccess()).toBeTrue();
            const resultingState: EpaminondasState = rules.applyLegalMove(move, state, status);
            const expectedState: EpaminondasState = new EpaminondasState(expectedBoard, 2);
            expect(resultingState).toEqual(expectedState);
            const node: DraughtsNode = new MGPNode(null, move, expectedState);
            expectToBeVictoryFor(rules, node, Player.ZERO, minimaxes);
        });
        it('Should declare second player winner if his pawn survive one turn on first line', () => {
            const board: Table<Player> = [
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [O, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [X, _, _, _, _, _, _, _, _, _, _, _, _, _],
            ];
            const expectedBoard: Table<Player> = [
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [O, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [X, _, _, _, _, _, _, _, _, _, _, _, _, _],
            ];
            const state: EpaminondasState = new EpaminondasState(board, 0);
            const move: DraughtsMove = new DraughtsMove(0, 2, 1, 1, Direction.UP);
            const status: DraughtsLegalityStatus = rules.isLegal(move, state);
            expect(status.legal.isSuccess()).toBeTrue();
            const resultingState: EpaminondasState = rules.applyLegalMove(move, state, status);
            const expectedState: EpaminondasState = new EpaminondasState(expectedBoard, 1);
            expect(resultingState).toEqual(expectedState);
            const node: DraughtsNode = new MGPNode(null, move, expectedState);
            expectToBeVictoryFor(rules, node, Player.ONE, minimaxes);
        });
        it('Should not consider first player winner if both player have one piece on their landing line', () => {
            const board: Table<Player> = [
                [O, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [X, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            ];
            const expectedBoard: Table<Player> = [
                [O, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [X, _, _, _, _, _, _, _, _, _, _, _, _, _],
            ];
            const state: EpaminondasState = new EpaminondasState(board, 1);
            const move: DraughtsMove = new DraughtsMove(0, 10, 1, 1, Direction.DOWN);
            const status: DraughtsLegalityStatus = rules.isLegal(move, state);
            expect(status.legal.isSuccess()).toBeTrue();
            const resultingState: EpaminondasState = rules.applyLegalMove(move, state, status);
            const expectedState: EpaminondasState = new EpaminondasState(expectedBoard, 2);
            expect(resultingState).toEqual(expectedState);
            const node: DraughtsNode = new MGPNode(null, move, expectedState);
            expectToBeOngoing(rules, node, minimaxes);
        });
        it('Should declare player zero winner when last soldier of opponent has been captured', () => {
            const board: Table<Player> = [
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [X, O, O, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            ];
            const expectedBoard: Table<Player> = [
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [O, O, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            ];
            const state: EpaminondasState = new EpaminondasState(board, 0);
            const move: DraughtsMove = new DraughtsMove(2, 9, 2, 1, Direction.LEFT);
            const status: DraughtsLegalityStatus = rules.isLegal(move, state);
            expect(status.legal.reason).toBeNull();
            const resultingState: EpaminondasState = rules.applyLegalMove(move, state, status);
            const expectedState: EpaminondasState = new EpaminondasState(expectedBoard, 1);
            expect(resultingState).toEqual(expectedState);
            const node: DraughtsNode = new MGPNode(null, move, expectedState);
            expectToBeVictoryFor(rules, node, Player.ZERO, minimaxes);
        });
        it('Should declare player one winner when last soldier of opponent has been captured', () => {
            const board: Table<Player> = [
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [O, X, X, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            ];
            const expectedBoard: Table<Player> = [
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [X, X, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
                [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            ];
            const state: EpaminondasState = new EpaminondasState(board, 1);
            const move: DraughtsMove = new DraughtsMove(2, 9, 2, 1, Direction.LEFT);
            const status: DraughtsLegalityStatus = rules.isLegal(move, state);
            expect(status.legal.reason).toBeNull();
            const resultingState: EpaminondasState = rules.applyLegalMove(move, state, status);
            const expectedState: EpaminondasState = new EpaminondasState(expectedBoard, 2);
            expect(resultingState).toEqual(expectedState);
            const node: DraughtsNode = new MGPNode(null, move, expectedState);
            expectToBeVictoryFor(rules, node, Player.ONE, minimaxes);
        });
    });
});
