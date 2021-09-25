import { MGPNode } from 'src/app/jscaip/MGPNode';
import { Player } from 'src/app/jscaip/Player';
import { PylosCoord } from '../PylosCoord';
import { PylosMove } from '../PylosMove';
import { PylosState } from '../PylosState';
import { PylosNode, PylosRules } from '../PylosRules';
import { PylosMinimax } from '../PylosMinimax';

describe('PylosMinimax:', () => {

    let rules: PylosRules;
    let minimax: PylosMinimax;

    const _: number = Player.NONE.value;

    const X: number = Player.ONE.value;

    const O: number = Player.ZERO.value;

    beforeEach(() => {
        rules = new PylosRules(PylosState);
        minimax = new PylosMinimax(rules, 'PylosMinimax');
    });

    it('Should provide 16 drops at first turn', () => {
        expect(minimax.getListMoves(rules.node).length).toBe(16);
    });

    it('Should provide 7 drops without capture, 6 drops with one capture, 15 drops with two capture, 3 climbing', () => {
        const board: number[][][] = [
            [
                [X, O, O, _],
                [X, O, _, X],
                [X, _, O, O],
                [_, _, _, _],
            ], [
                [_, _, _],
                [_, _, _],
                [_, _, _],
            ], [
                [_, _],
                [_, _],
            ], [
                [_],
            ],
        ];

        const state: PylosState = new PylosState(board, 0);
        const node: PylosNode = new MGPNode(null, null, state);
        expect(minimax.getListMoves(node).length).toBe(31);
    });

    it('should calculate board value according to number of pawn of each player', () => {
        const board: number[][][] = [
            [
                [O, X, O, X],
                [O, X, O, X],
                [O, X, O, X],
                [O, X, O, X],
            ], [
                [X, _, _],
                [_, 0, _],
                [_, _, _],
            ], [
                [_, _],
                [_, _],
            ], [
                [_],
            ],
        ];

        const state: PylosState = new PylosState(board, 0);
        const move: PylosMove = PylosMove.fromDrop(new PylosCoord(2, 2, 1), []);
        expect(minimax.getBoardValue(new MGPNode(null, move, state)).value).toBe(0);
    });
});
