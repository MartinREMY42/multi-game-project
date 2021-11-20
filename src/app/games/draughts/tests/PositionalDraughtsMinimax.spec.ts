import { Table } from 'src/app/utils/ArrayUtils';
import { Direction } from 'src/app/jscaip/Direction';
import { MGPNode } from 'src/app/jscaip/MGPNode';
import { Player } from 'src/app/jscaip/Player';
import { DraughtsMove } from '../DraughtsMove';
import { EpaminondasState } from '../DraughtsState';
import { DraughtsRules } from '../DraughtsRules';
import { PositionalDraughtsMinimax } from '../PositionalDraughtsMinimax';
import { expectSecondStateToBeBetterThanFirst } from 'src/app/utils/tests/TestUtils.spec';

describe('PositionalDraughtsMinimax:', () => {

    let rules: DraughtsRules;
    let minimax: PositionalDraughtsMinimax;
    const _: Player = Player.NONE;
    const X: Player = Player.ONE;
    const O: Player = Player.ZERO;

    beforeEach(() => {
        rules = new DraughtsRules(EpaminondasState);
        minimax = new PositionalDraughtsMinimax(rules, 'EpaminondasMinimax');
    });
    it('Should filter number of choices', () => {
        expect(minimax.getListMoves(rules.node).length).toBeLessThan(114);
    });
    it('Should consider possible capture the best move', () => {
        const board: Table<Player> = [
            [X, X, X, X, X, X, X, X, _, _, _, _, _, _],
            [_, O, O, _, _, _, X, X, X, X, _, _, _, _],
            [_, _, O, _, _, _, _, _, _, _, _, _, _, _],
            [O, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, O, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [X, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [X, _, _, _, X, _, _, _, _, _, _, _, _, _],
            [O, _, _, _, O, _, _, _, _, _, _, _, _, _],
            [O, _, _, _, O, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, O, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
        ];
        const state: EpaminondasState = new EpaminondasState(board, 1);
        rules.node = new MGPNode(null, null, state);
        const expectedMove: DraughtsMove = new DraughtsMove(9, 1, 4, 4, Direction.LEFT);
        const bestMove: DraughtsMove = rules.node.findBestMove(1, minimax);

        expect(bestMove).toEqual(expectedMove);
    });
    it('Should prefer to get near the opponent line', () => {
        const greaterBoard: Table<Player> = [
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
            [O, O, O, O, O, O, O, O, O, O, O, O, _, O],
            [O, O, O, O, O, O, O, O, O, O, O, O, _, O],
        ];
        const greaterState: EpaminondasState = new EpaminondasState(greaterBoard, 0);
        const lesserBoard: Table<Player> = [
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [X, X, X, X, X, X, X, X, X, X, X, X, X, X],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, O],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, O],
            [O, O, O, O, O, O, O, O, O, O, O, O, _, _],
            [O, O, O, O, O, O, O, O, O, O, O, O, _, _],
        ];
        const lesserState: EpaminondasState = new EpaminondasState(lesserBoard, 0);
        expectSecondStateToBeBetterThanFirst(lesserState, null, greaterState, null, minimax);
    });
    it('Should prefer to have aligned piece than higher piece', () => {
        const greaterBoard: Table<Player> = [
            [X, X, X, X, X, X, X, X, X, X, X, X, _, X],
            [X, X, X, X, X, X, X, X, X, X, X, X, _, X],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [O, O, O, O, O, O, O, _, O, O, O, O, O, O],
            [O, O, O, O, O, O, O, _, O, O, O, O, O, O],
        ];
        const greaterState: EpaminondasState = new EpaminondasState(greaterBoard, 0);
        const lesserBoard: Table<Player> = [
            [X, X, X, X, X, X, X, _, X, X, X, X, _, X],
            [X, X, X, X, X, X, X, _, X, X, X, X, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, _],
            [_, _, _, _, _, _, _, _, _, _, _, _, _, X],
            [O, O, O, O, O, O, O, _, O, O, O, O, O, O],
            [O, O, O, O, O, O, O, _, O, O, O, O, O, O],
        ];
        const lesserState: EpaminondasState = new EpaminondasState(lesserBoard, 0);
        expectSecondStateToBeBetterThanFirst(lesserState, null, greaterState, null, minimax);
    });
});
